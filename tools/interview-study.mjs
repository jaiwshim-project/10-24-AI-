import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomInt } from 'node:crypto';

const [mode, directory, scoreFile, secondFile] = process.argv.slice(2);
if (!directory || !['blind', 'score', 'progress'].includes(mode) || (mode === 'score' && !scoreFile)) {
  throw new Error('Usage: node tools/interview-study.mjs blind|progress <directory> | score <directory> <scores.json> [second-scores.json]');
}
const load = path => JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const read = prefix => readdirSync(directory)
  .filter(name => name.startsWith(prefix) && name.endsWith('.json'))
  .map(name => load(join(directory, name)));
const criteria = ['reasoning', 'action', 'outcome'];
const arms = ['star', 'followup', 'feedback', 'coaching'];
const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const difference = (a, b) => a == null || b == null ? null : a - b;

function scoreMap(path) {
  const result = new Map();
  for (const row of load(path)) {
    if (!row.answerId || result.has(row.answerId) || !criteria.every(key => [0, 1, 2].includes(row[key]))) {
      throw new Error('Each answer needs one score of 0, 1 or 2 per criterion: ' + row.answerId);
    }
    result.set(row.answerId, row);
  }
  return result;
}

function agreement(first, second) {
  return Object.fromEntries(criteria.map(key => {
    const pairs = [...first].map(([id, row]) => [row[key], second.get(id)[key]]);
    const n = pairs.length;
    const observed = mean(pairs.map(([a, b]) => (a - b) ** 2));
    let expected = 0;
    for (const a of [0, 1, 2]) for (const b of [0, 1, 2]) {
      expected += pairs.filter(pair => pair[0] === a).length *
        pairs.filter(pair => pair[1] === b).length * (a - b) ** 2 / n ** 2;
    }
    return [key, {
      answers: n,
      exactAgreement: mean(pairs.map(([a, b]) => Number(a === b))),
      quadraticWeightedKappa: expected ? 1 - observed / expected : null
    }];
  }));
}

function aggregateProgress() {
  const seen = new Set();
  const records = read('면접-진행-');
  for (const row of records) {
    if (!['main', 'factorial'].includes(row.phase) || !arms.includes(row.group) ||
        (row.phase === 'main' && !['star', 'coaching'].includes(row.group)) ||
        !['completed', 'stopped', 'interrupted', 'started'].includes(row.status) ||
        !row.participantId || seen.has(row.participantId)) {
      throw new Error('Invalid or duplicate progress entry: ' + row.participantId);
    }
    seen.add(row.participantId);
  }
  return Object.fromEntries(['main', 'factorial'].map(phase => [phase, Object.fromEntries(
    (phase === 'main' ? ['star', 'coaching'] : arms).map(group => {
      const rows = records.filter(row => row.phase === phase && row.group === group);
      const completed = rows.filter(row => row.status === 'completed');
      const requests = rows.flatMap(row => row.requests ?? []);
      const stopped = rows.filter(row => ['stopped', 'interrupted'].includes(row.status));
      return [group, {
        returnedRecords: rows.length,
        completed: completed.length,
        stopped: stopped.length,
        startedWithNoOutcome: rows.filter(row => row.status === 'started').length,
        lossReasons: Object.fromEntries([...new Set(stopped.map(row => row.reason))].map(reason =>
          [reason, stopped.filter(row => row.reason === reason).length])),
        completionRateAmongReturnedRecords: rows.length ? completed.length / rows.length : null,
        meanCompletionSeconds: mean(completed.map(row => (row.completedAt - row.startedAt) / 1000)),
        aiRequests: requests.length,
        failedRequests: requests.filter(request => !request.ok).length,
        retries: rows.reduce((sum, row) => sum + (row.requests?.length ?? 0) -
          new Set((row.requests ?? []).map(request => request.action)).size, 0),
        meanAIWaitMs: mean(requests.map(request => request.waitMs))
      }];
    })
  )]));
}

function describe(values) {
  const voice = values.filter(row => row.delayed != null);
  return {
    participants: values.length,
    meanBaseline: mean(values.map(row => row.baseline)),
    meanTransfer: mean(values.map(row => row.transfer)),
    meanGain: mean(values.map(row => row.gain)),
    delayedParticipants: voice.length,
    meanDelayed: mean(voice.map(row => row.delayed)),
    delayedReturnRate: values.length ? voice.length / values.length : null
  };
}

function summarize(rows, phase) {
  const groups = phase === 'factorial' ? arms : ['star', 'coaching'];
  const groupRows = (group, order) => rows.filter(row => row.group === group && (!order || row.order === order));
  const byGroup = Object.fromEntries(groups.map(group => [group, describe(groupRows(group))]));
  const byQuestionOrder = Object.fromEntries(['A', 'B'].map(order => {
    const result = Object.fromEntries(groups.map(group => [group, describe(groupRows(group, order))]));
    return [order, { ...result, gainDifference: difference(result.coaching.meanGain, result.star.meanGain) }];
  }));
  const orderBalanced = fn => {
    const values = Object.values(byQuestionOrder).map(fn);
    return values.includes(null) ? null : mean(values);
  };
  const baselineByQuestion = Object.fromEntries(['A', 'B'].map(order => {
    const scores = rows.filter(row => row.order === order).map(row => row.baseline);
    return [order, { participants: scores.length, meanScore: mean(scores) }];
  }));
  const factorial = fn => orderBalanced(result => {
    const values = arms.map(group => result[group].meanGain);
    return values.includes(null) ? null : fn(...values);
  });
  return {
    ...byGroup,
    baselineByQuestion,
    baselineDifficultyDifferenceAminusB: difference(baselineByQuestion.A.meanScore, baselineByQuestion.B.meanScore),
    byQuestionOrder,
    orderBalancedGainDifference: orderBalanced(result => result.gainDifference),
    delayedCoachingMinusSTAR: difference(byGroup.coaching.meanDelayed, byGroup.star.meanDelayed),
    ...(phase === 'factorial' && {
      followupMainEffect: factorial((star, followup, feedback, both) => ((followup - star) + (both - feedback)) / 2),
      feedbackMainEffect: factorial((star, followup, feedback, both) => ((feedback - star) + (both - followup)) / 2),
      interaction: factorial((star, followup, feedback, both) => both - followup - feedback + star)
    })
  };
}

let output;
if (mode === 'progress') {
  output = aggregateProgress();
} else if (mode === 'blind') {
  const rows = read('면접-블라인드-').flat();
  if (!rows.length || new Set(rows.map(row => row.answerId)).size !== rows.length) {
    throw new Error('No blind answers or duplicate answer IDs.');
  }
  for (let index = rows.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [rows[index], rows[other]] = [rows[other], rows[index]];
  }
  output = rows.map(({ answerId, question, answer }) => ({
    answerId, question, answer, reasoning: null, action: null, outcome: null
  }));
} else {
  const first = scoreMap(scoreFile);
  const second = secondFile ? scoreMap(secondFile) : null;
  if (second && (first.size !== second.size || [...first.keys()].some(id => !second.has(id)))) {
    throw new Error('Both reviewers must score the same answer IDs.');
  }
  const seen = new Set();
  const scoredIds = new Set();
  const total = row => {
    const score = value => criteria.reduce((sum, key) => sum + value[key], 0);
    return second ? mean([score(row), score(second.get(row.answerId))]) : score(row);
  };
  const rows = read('면접-배정표-').map(row => {
    const phase = row.phase ?? 'main';
    const before = first.get(row.baselineAnswerId);
    const after = first.get(row.transferAnswerId);
    const delayed = row.delayedAnswerId ? first.get(row.delayedAnswerId) : null;
    const ids = [row.baselineAnswerId, row.transferAnswerId, ...(row.delayedAnswerId ? [row.delayedAnswerId] : [])];
    if (!['main', 'factorial'].includes(phase) || !arms.includes(row.group) ||
        (phase === 'main' && !['star', 'coaching'].includes(row.group)) ||
        !['rolecoach-star-transfer-v1', 'rolecoach-star-transfer-v2'].includes(row.protocol) ||
        !['A', 'B'].includes(row.baselineQuestion) || !['A', 'B'].includes(row.transferQuestion) ||
        row.baselineQuestion === row.transferQuestion || seen.has(row.participantId) ||
        !before || !after || before === after || (row.delayedAnswerId && !delayed) ||
        new Set(ids).size !== ids.length || ids.some(id => scoredIds.has(id))) {
      throw new Error('Invalid allocation, duplicate participant/answer or missing score: ' + row.participantId);
    }
    seen.add(row.participantId);
    ids.forEach(id => scoredIds.add(id));
    const baseline = total(before);
    const transfer = total(after);
    return { phase, group: row.group, order: row.baselineQuestion, baseline, transfer,
      gain: transfer - baseline, delayed: delayed ? total(delayed) : null };
  });
  if (!rows.length || scoredIds.size !== first.size) throw new Error('Unmatched scores or missing allocation files.');
  output = {
    scale: '0–6 points',
    raters: second ? 2 : 1,
    interRaterAgreement: second ? agreement(first, second) : null,
    ...Object.fromEntries(['main', 'factorial'].filter(phase => rows.some(row => row.phase === phase))
      .map(phase => [phase, summarize(rows.filter(row => row.phase === phase), phase)]))
  };
}
console.log(JSON.stringify(output, null, 2));

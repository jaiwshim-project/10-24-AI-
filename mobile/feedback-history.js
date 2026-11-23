const feedbackHistoryPrefix = 'roleplay-feedback-v1:';

function storeInterviewFeedback(entry) {
  try {
    localStorage.setItem(feedbackHistoryPrefix + entry.id, JSON.stringify(entry));
    return true;
  } catch {
    return false;
  }
}

function readInterviewFeedback() {
  const records = [];
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (!key?.startsWith(feedbackHistoryPrefix)) continue;
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (!entry || key !== feedbackHistoryPrefix + entry.id || !Number.isFinite(entry.completedAt) || !Number.isFinite(new Date(entry.completedAt).getTime()) ||
            !['job', 'college', 'counseling'].includes(entry.type) || typeof entry.title !== 'string' ||
            !Number.isInteger(entry.report?.overall?.score) || !Array.isArray(entry.report.overall.components) ||
            !entry.report.rubric) continue;
        records.push(entry);
      } catch {
        // Other completed interviews remain available if one saved item cannot be read.
      }
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
  return records;
}

function groupInterviewFeedback(records) {
  const groups = new Map();
  for (const record of records) {
    const key = record.type + ':' + record.title;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return [...groups.values()];
}

function compareInterviewCriteria(first, latest) {
  return latest.overall.components.flatMap(item => {
    const before = first.overall.components.find(candidate =>
      candidate.letter === item.letter && candidate.keys.join() === item.keys.join());
    return before ? [{ letter: item.letter, keys: item.keys, first: before.percent, latest: item.percent }] : [];
  });
}

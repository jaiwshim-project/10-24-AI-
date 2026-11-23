import assert from 'node:assert/strict';
import { scoreInterview } from '../lib/interview-score.mjs';
const state = status => ({ status });
const fullRubric = {
  problem: state('present'), reasoning: state('partial'), action: state('present'),
  outcome: state('present'), verification: state('missing'), transfer: state('partial')
};
const full = scoreInterview(fullRubric);
assert.equal(full.score, 70);
assert.deepEqual(full.components.map(({letter,percent}) => [letter,percent]),
  [['P',100],['R',50],['O',100],['V',50],['E',50]]);
assert.equal(full.priority,'verification');
assert.equal(scoreInterview({...fullRubric,jobFit:state('missing')}).score,70);
assert.equal(scoreInterview({problem:state('present'),reasoning:state('partial'),transfer:state('missing')}).score,50);
assert.equal(scoreInterview({problem:state('present'),verification:state('present')}).score,100);
assert.equal(scoreInterview({problem:state('missing')}).score,0);
assert.equal(scoreInterview({}),null);
console.log('PASS: 100-point score, V grouping, applicable criteria, score reasons');

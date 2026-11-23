import assert from 'node:assert/strict';
import { coachingCriteria, selectCoachingQuestion } from '../lib/interview-coaching.mjs';

const rubric = Object.fromEntries(Object.keys(coachingCriteria).map(key => [key, { status:'present' }]));
const run = (changes, turns = []) => selectCoachingQuestion(
  { ...rubric, ...Object.fromEntries(Object.entries(changes).map(([key,status]) => [key,{status}])) }, turns
);
assert.equal(run({action:'missing', problem:'missing'}).target, 'action');
assert.equal(run({outcome:'partial', verification:'missing'}).target, 'outcome');
assert.equal(run({verification:'missing'}).target, 'verification');
const asked = run({reasoning:'missing', action:'missing'});
assert.equal(run({reasoning:'missing', action:'missing'}, [{question:asked.text}]).target, 'action');
assert.equal(run({reasoning:'missing'}, [{question:asked.text}]).readyToFinish,true);
assert.equal(run({}).readyToFinish,true);
console.log('PASS: core priority, result prerequisites, repeated question prevention and completion');

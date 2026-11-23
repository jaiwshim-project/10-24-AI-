alter table roleplay_metrics.interview_sessions
  drop constraint interview_sessions_interview_type_check,
  add constraint interview_sessions_interview_type_check
    check (interview_type in ('job', 'college') or
      (interview_type = 'counseling' and topic in ('school', 'career', 'nutrition') and baseline_id is null));
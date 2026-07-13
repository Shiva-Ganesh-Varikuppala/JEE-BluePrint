# Data model

## Existing tables

- `user`: personal account identity, email, and password hash.
- `chapter_progress`: a user's completion percentage for one syllabus chapter. `user_id + chapter_key` is unique.

## Planned tables

- `task`: title, details, subject, chapter, deadline, status, priority, estimated minutes, and owner.
- `study_session`: completed focus time and date.
- `revision`: a chapter/task revision date, interval, completion state, and owner.
- `weekly_plan`: scheduled study block, start/end time, type, and owner.
- `mock_test`: marks, accuracy, duration, analysis notes, and owner.
- `error_note`: incorrect question details, solution, revision status, and owner.

Every user-owned table must have an indexed `user_id` foreign key.

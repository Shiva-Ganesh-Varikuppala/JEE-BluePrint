# JEE Blueprint — MVP specification

## Product

JEE Blueprint is a dark-only personal study operating system for one JEE Main and Advanced aspirant. Its purpose is to make the daily plan, syllabus progress, revision needs, and preparation trend visible in one place.

## MVP modules

1. Account and personal data
2. Dashboard
3. Daily todo system
4. 92-chapter syllabus tracker
5. Weekly planner
6. Revision planner

## Product rules

- The interface is permanently dark; there is no light-mode setting.
- Every stored record belongs to the signed-in account.
- The provided 92-chapter syllabus is the source of truth for the chapter tracker.
- A feature is only called complete when its UI, API, persistence, and validation work together.

## Current status

- Account registration/login/logout: implemented.
- 92-chapter syllabus and per-account completion progress: implemented.
- Dashboard: implemented with sample study metrics.
- Personal todos, planner, revision, and analytics: next milestones.

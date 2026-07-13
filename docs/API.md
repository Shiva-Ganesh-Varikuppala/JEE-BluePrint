# API

Base URL during local development: `http://localhost:5050/api`

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create a personal account |
| POST | `/auth/login` | Sign in and receive an access token |
| GET | `/auth/me` | Retrieve the signed-in account |
| GET | `/syllabus` | Retrieve all 92 chapters with this account's progress |
| PATCH | `/syllabus/:chapterKey` | Save a chapter's completion percentage |

Protected endpoints require `Authorization: Bearer <token>`.

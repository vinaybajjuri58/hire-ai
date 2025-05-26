# Client-Side API Integration Guide

> **Note:** Resume PDF extraction is performed server-side using the forked package `pdf-parse-debugging-disabled` (not the official `pdf-parse`). This avoids debug code issues in production. When a resume is uploaded, the backend extracts text, generates an OpenAI embedding, and stores the vector in Qdrant for semantic search. See the backend documentation for architectural details and maintenance notes.

## Authentication

All API requests require authentication. The Supabase client handles authentication tokens automatically through cookies.

## Profile Management

- **Get Current User Profile:** Use the provided API utility to fetch the current user's profile.
- **Update User Profile:** Use the API utility to update profile fields (name, role, social links, etc.).
- **Update Social Links:** Use the API utility to update only the social links.

## Recruiter-Specific Functions

- **Get Candidate Profile:** Recruiters can fetch any candidate's profile by ID.
- **Search Candidates (Semantic Search):** Recruiters can search for candidates using a query string. The backend performs semantic search using Qdrant and returns ranked results.

## Candidate-Specific Functions

- **Upload Resume:**
  - Only PDF files up to 5MB are accepted.
  - Use a `FormData` POST request to `/profile/resume` with the file under the `resume` field.
  - The backend extracts text, generates an embedding, and stores the vector in Qdrant. If any step fails, a clear error message is returned.
- **Delete Resume:**
  - Send a DELETE request to `/profile/resume` to remove the resume and its vector from storage and Qdrant.

## React Hooks Pattern

- Use custom hooks (e.g., `useProfile`, `useResumeSearch`) to manage API state, loading, and error handling in your components.

## Error Handling

- All API utility functions extract and return error messages. Handle errors in your UI as needed.

## Role-Based UI

- Conditionally render UI elements based on the user's role (candidate or recruiter) using the profile data.

## API Response Types

- All API responses are strongly typed using TypeScript generics (e.g., `TApiResponse<T>` for success, `TApiError` for errors).

> **Maintenance Note:**
> If the resume upload or search logic changes (e.g., new embedding model, new PDF parser), update the backend logic in `src/utils/qdrant.ts` and the API documentation. Always test PDF extraction in production-like environments.

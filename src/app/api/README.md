# API Endpoints

This directory contains the API endpoints for the hiring platform.

## Documentation

For detailed documentation on these API endpoints:

- **Server-side Documentation:** See `src/API_DOCUMENTATION.md` for comprehensive documentation of all API endpoints, service layer integration, and security considerations.

- **Client-side Integration Guide:** See `src/API_CLIENT_GUIDE.md` for examples of how to consume these APIs from the frontend, including React component examples.

## API Structure

The API is organized into the following sections:

- `profile/`: Profile management endpoints
  - `[userId]/`: Get candidate profile by ID (for recruiters)
  - `search/`: Search for candidates using basic text search
  - `social/`: Update social media links
  - `resume/`: Resume upload and deletion
    - `search/`: Semantic search for candidates based on resume content

## Service Layer

These API endpoints interact with the service layer in `src/api/services/`:

- `profileService.ts`: Handles profile management and basic search
- `resumeService.ts`: Handles resume processing, storage, and semantic search

## Qdrant Integration

The semantic search functionality is powered by Qdrant vector database, which is integrated through `src/utils/qdrant.ts`.

## Security

All API endpoints enforce authentication and appropriate role-based authorization. Supabase Row Level Security (RLS) provides an additional layer of data access control at the database level.

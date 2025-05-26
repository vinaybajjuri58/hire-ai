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
  - `search/`: Semantic search for candidates (for recruiters)
  - `social/`: Update social media links
  - `resume/`: Resume upload and deletion

## Service Layer

These API endpoints interact with the service layer in `src/api/services/`:

- `profileService.ts`: Handles profile management and basic search
- `resumeService.ts`: Handles resume processing, storage, and semantic search

## Qdrant Integration

All search functionality is powered by Qdrant vector database, which provides semantic search capabilities. The integration is managed through `src/utils/qdrant.ts`.

When a candidate uploads a resume:

1. The text is extracted from the PDF
2. The text is converted to a vector embedding using OpenAI
3. The vector is stored in Qdrant with candidate metadata
4. The Qdrant point ID is stored in Supabase for reference

All search functionality is provided through the `/api/profile/search` endpoint.

## Security

All API endpoints enforce authentication and appropriate role-based authorization. Supabase Row Level Security (RLS) provides an additional layer of data access control at the database level.

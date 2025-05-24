# API Documentation: Hiring Platform

This document provides comprehensive documentation for the API endpoints implemented in the hiring platform. The platform connects recruiters with candidates, leveraging Supabase for data storage and Qdrant for semantic search capabilities.

## Authentication

All API endpoints require authentication. Requests without a valid Supabase session will receive a 401 Unauthorized response.

## User Roles

The platform has two user roles:

1. **Candidate**: Users who create profiles and upload resumes for recruiters to find
2. **Recruiter**: Users who search for and review candidate profiles

Each role has specific permissions:

- Candidates can only view and edit their own profiles
- Recruiters can view all candidate profiles and search for candidates
- Only candidates can upload resumes

## API Endpoints

### Profile Management

#### `GET /api/profile`

Retrieves the authenticated user's profile.

**Response:**

```json
{
  "data": {
    "id": "user-uuid",
    "name": "User Name",
    "email": "user@example.com",
    "createdAt": "2023-01-01T00:00:00Z",
    "role": "candidate", // or "recruiter"
    "github": "https://github.com/username",
    "linkedin": "https://linkedin.com/in/username",
    "twitter": "https://twitter.com/username",
    "resume_url": "https://storage-url/resume.pdf"
  },
  "status": "success"
}
```

#### `PUT /api/profile`

Updates the authenticated user's profile.

**Request Body:**

```json
{
  "name": "Updated Name",
  "role": "candidate", // or "recruiter"
  "github": "https://github.com/newusername",
  "linkedin": "https://linkedin.com/in/newusername",
  "twitter": "https://twitter.com/newusername"
}
```

**Response:**

```json
{
  "data": {
    // Updated profile data
  },
  "status": "success"
}
```

#### `PUT /api/profile/social`

Updates only the social links of the authenticated user.

**Request Body:**

```json
{
  "github": "https://github.com/username",
  "linkedin": "https://linkedin.com/in/username",
  "twitter": "https://twitter.com/username"
}
```

**Response:**

```json
{
  "data": {
    // Updated profile data
  },
  "status": "success"
}
```

#### `GET /api/profile/{userId}`

Retrieves a candidate's profile by ID. Only available to recruiters.

**Response:**

```json
{
  "data": {
    // Candidate profile data
  },
  "status": "success"
}
```

#### `GET /api/profile/search?query={searchQuery}&limit={limit}`

Searches for candidates using semantic search powered by Qdrant. Only available to recruiters.

**Query Parameters:**

- `query`: Search query (required)
- `limit`: Maximum number of results (default: 10)

**Response:**

```json
{
  "data": [
    {
      // Candidate profile data
    }
    // Additional candidates
  ],
  "status": "success"
}
```

### Resume Management

#### `POST /api/profile/resume`

Uploads a resume for the authenticated candidate.

**Request Format:**

- Content-Type: `multipart/form-data`
- Form field: `resume` (PDF file, max 5MB)

**Response:**

```json
{
  "data": {
    "resumeUrl": "https://storage-url/resume.pdf",
    "qdrantPointId": "vector-id"
  },
  "status": "success"
}
```

#### `DELETE /api/profile/resume`

Deletes the authenticated candidate's resume.

**Response:**

```json
{
  "message": "Resume deleted successfully",
  "status": "success"
}
```

## Service Layer Integration

The API endpoints are built on top of two main service modules:

### Profile Service

Located at `src/api/services/profileService.ts`, this service handles:

- User profile retrieval and management
- Role-based access control
- Social links management
- Routing search requests to the semantic search engine

Key functions:

- `getUserProfile`: Get a user's profile
- `updateUserProfile`: Update a user's profile (prevents direct resume_url updates)
- `updateSocialLinks`: Update a user's social media links
- `getCandidateProfile`: Get a candidate's profile (for recruiters)
- `searchCandidates`: Redirects to semantic search functionality

### Resume Service

Located at `src/api/services/resumeService.ts`, this service handles:

- Resume upload and processing
- PDF text extraction
- Vector embedding generation and storage in Qdrant
- Semantic search using vector similarity
- Resume deletion and cleanup

Key functions:

- `processResume`: Process and store a resume in both Supabase and Qdrant
- `searchCandidateResumes`: Search for candidates using semantic search
- `deleteResumeForUser`: Delete a resume and its vector representation

## Qdrant Integration

The platform uses Qdrant, a vector database, to enable semantic search capabilities. The integration is managed through `src/utils/qdrant.ts`, which provides:

- Vector collection management
- PDF text extraction
- Embedding generation with OpenAI
- Vector storage and retrieval
- Semantic similarity search

When a candidate uploads a resume:

1. The text is extracted from the PDF
2. The text is converted to a vector embedding using OpenAI
3. The vector is stored in Qdrant with candidate metadata
4. The Qdrant point ID is stored in Supabase for reference

When a recruiter searches for candidates:

1. The search query is converted to a vector embedding
2. Qdrant performs a similarity search to find matching resume vectors
3. The matching candidate profiles are retrieved from Supabase
4. Results are combined and ranked by similarity score

## Error Handling

All API endpoints follow a consistent error handling pattern:

- 400 Bad Request: For validation errors or invalid input
- 401 Unauthorized: When authentication is required
- 403 Forbidden: When the user doesn't have permission
- 404 Not Found: When a requested resource doesn't exist
- 500 Internal Server Error: For server-side errors

Error responses follow this format:

```json
{
  "error": "Error message",
  "status": "error",
  "details": [] // Optional validation error details
}
```

## Security Considerations

1. **Row Level Security (RLS)**: Supabase RLS policies ensure users can only access data they're authorized to view.
2. **Role-based Access**: API endpoints verify user roles before allowing access to restricted operations.
3. **Validation**: All inputs are validated using Zod schemas before processing.
4. **Resume Protection**: Resumes can only be uploaded and deleted through dedicated endpoints that perform proper validation and authorization.
5. **Storage Security**: Supabase storage is configured with RLS policies to ensure only authorized users can access files.

## Implementation Notes

- The `resume_url` field cannot be directly updated through the profile update endpoint.
- PDF files are limited to 5MB and are validated for format before processing.
- All search functionality is powered by semantic search using OpenAI embeddings and Qdrant vector database.

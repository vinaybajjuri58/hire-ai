# Supabase Setup Guide

This document outlines the Supabase setup for this project.

## 1. Create a Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.io/)
2. Click "New Project"
3. Enter project details:
   - Name: Your project name
   - Database Password: Create a strong password
   - Region: Choose closest to your target users
   - Pricing Plan: Free tier or appropriate paid plan
4. Click "Create new project"
5. Wait for the project to be created (~2 minutes)

## 2. Configure Environment Variables

1. In your Supabase dashboard, go to Project Settings > API
2. Create a `.env.local` file in your project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. For production, configure these environment variables in your hosting platform

## 3. Database Setup

### Create Auth Schema (Profiles Table)

1. Go to SQL Editor in your Supabase dashboard
2. Run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Create Chat Feature Tables

For the chat feature, create the following tables:

```sql
-- Create extension for UUID generation if not already available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create chats table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chats table
CREATE POLICY "Users can view their own chats"
  ON public.chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chats"
  ON public.chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
  ON public.chats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
  ON public.chats FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for chat_messages table
CREATE POLICY "Users can view messages from their own chats"
  ON public.chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = chat_messages.chat_id
    AND chats.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert messages to their own chats"
  ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = chat_messages.chat_id
    AND chats.user_id = auth.uid()
  ));

CREATE POLICY "Users can update messages in their own chats"
  ON public.chat_messages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = chat_messages.chat_id
    AND chats.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete messages from their own chats"
  ON public.chat_messages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.chats
    WHERE chats.id = chat_messages.chat_id
    AND chats.user_id = auth.uid()
  ));

-- Create an index on chat_id for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON public.chat_messages(chat_id);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON public.chats(user_id);
```

See the [chat.md](./chat.md) file for detailed information about the chat feature implementation.

## 4. Auth Configuration

1. Go to Authentication > Settings

### General Auth Settings

- Set Website URL to your production URL
- Configure Redirect URLs (add localhost for development)

### Email Templates

- Configure email templates for:
  - Invitation
  - Magic Link
  - Email Confirmation
  - Reset Password

### Enable Auth Providers

1. Go to Authentication > Providers
2. Configure email/password authentication (enabled by default)
3. Enable any third-party providers as needed (e.g., Google, GitHub)
4. For OAuth providers, set up redirect URLs and obtain client credentials

## 5. Client Integration

1. Verify Supabase client initialization in your code:

   - Server components use `createClient` from `/utils/supabase/server.ts`
   - Client components use `createClient` from `/utils/supabase/browser.ts`
   - Middleware uses `createMiddlewareClient` from `/utils/supabase/middleware-client.ts`

2. Ensure auth state synchronization is working in your application

## 6. Security Considerations

1. Review all Row Level Security (RLS) policies
2. Ensure service role key is only used for admin operations
3. Test database access with different user accounts
4. Keep the `SUPABASE_SERVICE_ROLE_KEY` secure and never expose it client-side

## 7. LLM Integration (OpenAI)

For the chat feature, you'll need to add an OpenAI API key to your environment variables:

```
OPENAI_API_KEY=your-openai-api-key
LLM_MODEL=gpt-3.5-turbo  # or another model of your choice
```

This will allow your application to make requests to the OpenAI API for generating responses in the chat feature.

## 8. Verifying Row Level Security (RLS)

After setting up your tables and RLS policies, it's important to verify they're working correctly:

### Check if RLS is Enabled

1. In SQL Editor, run:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename IN ('profiles', 'chats', 'chat_messages');
   ```
   This should show `true` in the `rowsecurity` column for all tables.

### View RLS Policies

1. In SQL Editor, run:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename IN ('profiles', 'chats', 'chat_messages');
   ```
   This shows all policies for your tables.

### Testing RLS Policies

1. **Using the Supabase Dashboard**:

   - Go to Authentication > Users
   - Create test users with different emails
   - In Table Editor, try viewing data as different users
   - Verify users can only see their own data

2. **Using API and Auth Testing**:
   - Use multiple browser sessions or incognito windows
   - Log in as different users
   - Verify each user can only access their own data

## 9. Understanding Table Relationships

The database schema includes the following key relationships:

### auth.users ⟶ profiles

- One-to-one relationship
- `profiles.id` references `auth.users.id`
- Contains additional user information beyond auth data

### auth.users ⟶ chats

- One-to-many relationship (one user can have many chats)
- `chats.user_id` references `auth.users.id`
- Chats link directly to auth.users (not to profiles)

### chats ⟶ chat_messages

- One-to-many relationship (one chat can have many messages)
- `chat_messages.chat_id` references `chats.id`

### Design Rationale

1. **Direct auth.users Connection**:

   - Chats link directly to auth.users instead of profiles
   - Ensures data integrity even if profile data changes
   - More efficient by avoiding an extra join through profiles

2. **Cascade Deletion**:

   - When a user is deleted, all their chats are deleted (`ON DELETE CASCADE`)
   - When a chat is deleted, all its messages are deleted

3. **Indexes**:
   - Indexes on foreign keys improve query performance
   - `idx_chats_user_id` speeds up user-based chat queries
   - `idx_chat_messages_chat_id` speeds up chat message retrieval

## 10. Hiring Platform Extensions

The database schema has been extended to support a hiring platform with candidate and recruiter roles.

### Extended Profiles Table

To support the hiring platform functionality, the profiles table has been extended with additional columns:

```sql
-- Add new columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN role TEXT DEFAULT 'candidate' CHECK (role IN ('candidate', 'recruiter')),
ADD COLUMN github TEXT,
ADD COLUMN linkedin TEXT,
ADD COLUMN twitter TEXT,
ADD COLUMN resume_url TEXT,
ADD COLUMN resume_text TEXT, -- Store extracted text from resume for searching
ADD COLUMN qdrant_point_id TEXT; -- Reference to the vector in Qdrant
```

### Role-Based Access Control

Additional RLS policies have been added to allow recruiters to view candidate profiles:

```sql
-- This policy allows recruiters to view all candidate profiles
CREATE POLICY "Recruiters can view all candidate profiles"
  ON public.profiles FOR SELECT
  USING (
    (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'recruiter')
     AND role = 'candidate')
    OR auth.uid() = id
  );
```

### Resume Storage Setup

1. Create a private bucket called "resumes" in Supabase Storage:

   - Go to Storage in the Supabase dashboard
   - Click "Create a new bucket"
   - Name it "resumes"
   - Set it to private (not public)

2. Add RLS policies for the storage bucket:

```sql
-- Allow candidates to upload their own resumes
CREATE POLICY "Users can upload their own resumes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow candidates to access their own resumes AND recruiters to access ALL resumes
CREATE POLICY "Resume access policy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resumes' AND
    (
      -- User can access their own files
      (auth.uid()::text = (storage.foldername(name))[1]) OR
      -- Recruiters can access all files
      (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'recruiter'))
    )
  );

-- Allow users to update their own resumes
CREATE POLICY "Users can update their own resumes"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resumes' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### File Upload Workflow

The general workflow for resume handling is:

1. User uploads a PDF file through the frontend
2. File is stored in the 'resumes' bucket with a path pattern of `{userId}/{filename}`
3. The URL to the file is stored in the `resume_url` field of the profiles table
4. For search functionality, text is extracted from the PDF and stored in `resume_text`
5. Recruiters can search for candidates based on the resume text and view/download resumes

### Vector Search Implementation

For more powerful semantic search capabilities, we'll implement vector search using OpenAI embeddings and Qdrant, a dedicated vector database, instead of using pgvector directly in Supabase:

```sql
-- In Supabase, we'll just store references to the Qdrant vectors
ALTER TABLE public.profiles
ADD COLUMN qdrant_point_id TEXT;
```

The implementation flow:

1. **PDF Text Extraction**:

   - When a candidate uploads a resume, extract the text content
   - This can be done client-side using libraries like `pdf-parse` or through a serverless function

2. **Generate Embeddings**:

   - Send the extracted text to OpenAI's embedding API
   - Use the `text-embedding-ada-002` model (1536 dimensions)

   ```typescript
   // Example code for generating embeddings
   const response = await openai.embeddings.create({
     model: "text-embedding-ada-002",
     input: resumeText,
   })
   const embedding = response.data[0].embedding
   ```

3. **Store in Qdrant**:

   - Create a point in Qdrant with the embedding and metadata
   - Store the Qdrant point ID in the Supabase profiles table

   ```typescript
   // Example code for storing in Qdrant
   const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL })

   // Create a point in Qdrant
   const pointId = uuidv4() // Generate a unique ID
   await qdrantClient.upsert("resumes", {
     points: [
       {
         id: pointId,
         vector: embedding,
         payload: {
           userId: userId,
           resumeText: resumeText,
           resumeUrl: resumeUrl,
         },
       },
     ],
   })

   // Store the Qdrant point ID in Supabase
   await supabase
     .from("profiles")
     .update({
       resume_text: resumeText,
       resume_url: resumeUrl,
       qdrant_point_id: pointId,
     })
     .eq("id", userId)
   ```

4. **Perform Vector Similarity Search**:

   - When a recruiter searches for candidates, convert their query to an embedding
   - Find the most similar resume embeddings using Qdrant

   ```typescript
   // Example code for searching in Qdrant
   const queryEmbedding = await getEmbedding(queryText)

   const searchResult = await qdrantClient.search("resumes", {
     vector: queryEmbedding,
     limit: 10,
   })

   // Get the user IDs from the search results
   const userIds = searchResult.map((result) => result.payload.userId)

   // Fetch the full profiles from Supabase
   const { data: candidates } = await supabase
     .from("profiles")
     .select("*")
     .in("id", userIds)
     .eq("role", "candidate")
   ```

5. **Join Results with Profiles**:
   - Use the user IDs from Qdrant to fetch complete profiles from Supabase
   - This provides all candidate information alongside the semantic search results

## Integration with Qdrant Vector Database

Instead of using pgvector in Supabase, we're implementing a hybrid approach using Qdrant for vector search operations. This provides several advantages:

### Setting Up Qdrant

1. **Deploy Qdrant**:

   - You can use Qdrant Cloud (managed service)
   - Alternatively, deploy with Docker: `docker run -p 6333:6333 qdrant/qdrant`

2. **Create a Collection**:

   ```typescript
   const qdrantClient = new QdrantClient({ url: process.env.QDRANT_URL })

   await qdrantClient.createCollection("resumes", {
     vectors: {
       size: 1536, // For OpenAI embeddings
       distance: "Cosine",
     },
   })
   ```

3. **Configure Environment Variables**:
   ```
   QDRANT_URL=your-qdrant-url
   OPENAI_API_KEY=your-openai-api-key
   ```

### Advantages of This Approach

1. **Specialized Performance**: Qdrant is purpose-built for vector search with superior performance
2. **Best of Both Worlds**: Transactional data in Supabase, vector search in Qdrant
3. **Scalability**: Qdrant can scale independently for large vector collections
4. **Advanced Features**: Filtering, faceted search, and hybrid search capabilities

### Syncing Between Supabase and Qdrant

To maintain consistency between Supabase and Qdrant:

1. **On Profile Creation/Update**:

   - When a candidate uploads a resume, process and store it in both systems
   - Save the Qdrant point ID in Supabase for reference

2. **On Profile Deletion**:

   - Delete the corresponding vector in Qdrant when a profile is removed
   - Use database triggers or application logic to ensure consistency

3. **Failure Handling**:
   - Implement retry mechanisms for failed operations
   - Use transaction-like patterns to ensure data consistency

### Using with LangChain

Qdrant integrates well with LangChain for advanced RAG (Retrieval Augmented Generation) scenarios:

```typescript
import { QdrantVectorStore } from "langchain/vectorstores/qdrant"
import { OpenAIEmbeddings } from "langchain/embeddings/openai"

// Initialize vector store
const vectorStore = new QdrantVectorStore(new OpenAIEmbeddings(), {
  url: process.env.QDRANT_URL,
  collectionName: "resumes",
})

// Search for similar resumes
const results = await vectorStore.similaritySearch(
  "experienced frontend developer with React",
  5
)
```

## Implementation Guide: Integrating Qdrant with Supabase

This section provides a high-level guide for implementing the Qdrant-Supabase integration for the resume search feature.

### 1. Set Up Qdrant

#### Option 1: Using Qdrant Cloud

1. Create an account at [Qdrant Cloud](https://cloud.qdrant.io/)
2. Create a new cluster
3. Save your cluster URL and API key

#### Option 2: Self-hosting with Docker

```bash
docker run -d -p 6333:6333 -p 6334:6334 \
    -v $(pwd)/qdrant_data:/qdrant/storage \
    qdrant/qdrant
```

### 2. Install Required Dependencies

Required packages:

- `@qdrant/js-client-rest` - Official Qdrant JavaScript client
- `openai` - OpenAI API client for generating embeddings
- `pdf-parse` - For extracting text from PDF resumes
- `uuid` - For generating unique IDs for Qdrant points

### 3. Create a Qdrant Service

Create a utility module in `src/utils/qdrant.ts` that should implement:

- Collection initialization and management
- PDF text extraction
- Embedding generation with OpenAI
- Resume storage in Qdrant
- Vector similarity search
- Cleanup of vectors when resumes are updated or deleted

### 4. Create Resume Upload API Endpoint

Implement an API route at `src/app/api/profile/resume/route.ts` that handles:

- File upload form processing
- Authentication and role verification
- PDF text extraction
- File storage in Supabase Storage
- Embedding generation and storage in Qdrant
- Updating profile metadata in Supabase with resume info and Qdrant point ID

### 5. Create Resume Search API Endpoint

Implement an API route at `src/app/api/profile/search/route.ts` that handles:

- Parsing search queries
- Authentication and role verification (only recruiters)
- Vector similarity search in Qdrant
- Fetching matching candidate profiles from Supabase
- Combining and ranking results

### 6. Add a Delete Resume Handler

When a profile is deleted or a resume is updated, implement handlers that:

- Retrieve existing Qdrant point ID from the profile
- Delete the corresponding vector from Qdrant
- Update profile with new information or remove it entirely

### 7. Environment Variables

Required environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key

# Qdrant Configuration
QDRANT_URL=your-qdrant-url
QDRANT_API_KEY=your-qdrant-api-key  # Only needed for Qdrant Cloud
```

## Implementation Status

The following components have been implemented for the Qdrant integration:

### Implemented: Qdrant Utility Module

A comprehensive utility module has been created in `src/utils/qdrant.ts` with the following functionality:

1. **Client Initialization**:

   - Configures Qdrant client using environment variables
   - Sets up OpenAI client for embedding generation

2. **Collection Management**:

   - `initializeCollection()`: Creates and configures the 'resumes' collection if it doesn't exist
   - Configured with appropriate vector dimensions (1536) for OpenAI embeddings
   - Uses cosine similarity for optimal semantic matching

3. **PDF Processing**:

   - `extractTextFromPdf(pdfBuffer)`: Extracts text content from uploaded PDF resumes
   - Handles PDF parsing with proper error handling

4. **Embedding Generation**:

   - `generateEmbedding(text)`: Creates vector embeddings from text using OpenAI
   - Uses the 'text-embedding-ada-002' model for optimal semantic representation

5. **Resume Storage**:

   - `storeResume(userId, resumeText, resumeUrl)`: Stores resume vectors in Qdrant
   - Generates a unique point ID that gets stored in Supabase for reference
   - Includes metadata in the payload for easier retrieval

6. **Semantic Search**:

   - `searchResumes(query, limit)`: Performs similarity search in Qdrant
   - Converts search queries to embeddings for semantic matching
   - Returns user IDs with similarity scores for integration with Supabase

7. **Cleanup**:

   - `deleteResume(pointId)`: Removes vectors from Qdrant when resumes are updated/deleted
   - Ensures consistency between Supabase and Qdrant

8. **LangChain Integration**:
   - Placeholder for potential LangChain integration for more advanced RAG functionality

### Dependencies Installed

The following packages have been installed to support the Qdrant integration:

```bash
@qdrant/js-client-rest  # Official Qdrant client
openai                  # OpenAI API client
pdf-parse               # PDF text extraction
uuid                    # Unique ID generation
@types/uuid             # TypeScript types for UUID
@types/pdf-parse        # TypeScript types for pdf-parse
@types/node             # Node.js type definitions
```

### Pending Implementation

The following components are pending implementation:

1. API Endpoints:

   - Resume upload endpoint
   - Candidate search endpoint

2. Frontend Components:

   - Resume upload form for candidates
   - Search interface for recruiters
   - Candidate profile display

3. Integration Testing:
   - End-to-end testing of the resume upload and search flow
   - Performance testing of semantic search capabilities

### Understanding the Role-Based System

The hiring platform has two types of users:

1. **Candidates**:

   - Have `role = 'candidate'` in their profile
   - Can upload resumes and add professional links
   - Can only see and edit their own profile

2. **Recruiters**:
   - Have `role = 'recruiter'` in their profile
   - Can view all candidate profiles
   - Can access all candidate resumes
   - Can search for candidates based on skills and experience

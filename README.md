# Ingenium

## Setup Instructions

1. Clone this repository
2. Install dependencies: `pnpm install`
3. Create a `.env.local` file with the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   OPENAI_MODEL=gpt-3.5-turbo
   OPENAI_SYSTEM_PROMPT="You are a helpful assistant."
   OPENAI_TEMPERATURE=0.7
   OPENAI_MAX_TOKENS=2000
   OPENAI_TIMEOUT=30000
   OPENAI_MAX_RETRIES=3
   ```

4. Get your Supabase credentials:

   - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your public anon key
   - SUPABASE_SERVICE_ROLE_KEY: Your service role key (required for admin operations)
   - NEXT_PUBLIC_SITE_URL: Your site URL (for email verification links)
   - OPENAI_TEMPERATURE: Controls randomness (0-1)
   - OPENAI_MAX_TOKENS: Maximum response length
   - OPENAI_TIMEOUT: Request timeout in milliseconds (default: 30000)
   - OPENAI_MAX_RETRIES: Number of retry attempts (default: 3)

   You can find these in your Supabase dashboard under Project Settings > API.

5. Get your OpenAI API key:

   - OPENAI_API_KEY: Your OpenAI API key
   - OPENAI_MODEL: The model to use (default: gpt-3.5-turbo)
   - OPENAI_SYSTEM_PROMPT: Custom system prompt for the AI
   - OPENAI_TEMPERATURE: Controls randomness (0-1)
   - OPENAI_MAX_TOKENS: Maximum response length
   - OPENAI_TIMEOUT: Request timeout in milliseconds (default: 30000)
   - OPENAI_MAX_RETRIES: Number of retry attempts (default: 3)

   You can find your API key in the [OpenAI dashboard](https://platform.openai.com/api-keys).

6. Run the development server: `pnpm dev`
7. Open [http://localhost:3000](http://localhost:3000) to see the app

## Using pnpm

This project uses [pnpm](https://pnpm.io/) as the package manager. Here are some common commands:

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint
```

If you don't have pnpm installed, you can install it using:

```bash
npm install -g pnpm
```

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

## Architecture: Resume Upload, PDF Parsing, and Vector Search

This project enables users to upload resumes (PDFs), extract their text, generate semantic embeddings (using OpenAI), and store them in Qdrant for fast, accurate candidate search. The backend uses Supabase for authentication, profile storage, and file storage.

### Key Components

- **Supabase Storage**: Stores uploaded PDF resumes in a private bucket, organized by user ID for security and scalability.
- **PDF Parsing**: Uses a forked package, `pdf-parse-debugging-disabled`, to extract text from PDFs server-side. This fork avoids debug code present in the official `pdf-parse` package, which caused runtime errors in production environments.
- **OpenAI Embeddings**: Extracted text is sent to OpenAI's embedding API (using the `text-embedding-ada-002` model) to generate a 1536-dimensional vector for each resume.
- **Qdrant**: Stores resume vectors and metadata, enabling fast semantic search for recruiters.
- **Supabase Profiles Table**: Stores the resume URL, extracted text, and Qdrant point ID for each user.

### Why This Approach?

- **Supabase Storage**: S3-compatible, secure, and integrates with Supabase Auth for per-user access control.
- **Forked PDF Parser**: The official `pdf-parse` package (v1.1.1) includes debug code that breaks serverless/production environments. The forked `pdf-parse-debugging-disabled` is a drop-in replacement with debug code removed, ensuring reliable server-side PDF extraction.
- **Qdrant for Vector Search**: Qdrant is purpose-built for vector search, offering better performance and scalability than using pgvector in Postgres. This hybrid approach keeps transactional data in Supabase and vector data in Qdrant.
- **TypeScript Compatibility**: Type safety is maintained by using `@types/pdf-parse` and a custom type declaration for the forked package.

### Maintenance Notes

- If updating PDF parsing, always test in production-like environments. Avoid using `pdf-parse@1.1.1` until the debug code is removed upstream.
- The file path in Supabase Storage determines folder structure. By default, resumes are stored as `resumes/{userId}/{filename}` for organization and access control.
- All vector search logic is in `src/utils/qdrant.ts`. Update this module to change embedding models, vector DBs, or PDF extraction logic.

---

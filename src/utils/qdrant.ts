import { QdrantClient } from "@qdrant/js-client-rest"
import { OpenAI } from "openai"
import axios from "axios"
import pdfParse from "pdf-parse-debugging-disabled"

// Initialize clients
const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY, // Optional, for Qdrant Cloud
  timeout: 5000, // 5 second timeout
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize the collection if it doesn't exist
export async function initializeCollection() {
  try {
    // Check if collection exists
    const collections = await qdrantClient.getCollections()
    const exists = collections.collections.some((c) => c.name === "resumes")

    if (!exists) {
      await qdrantClient.createCollection("resumes", {
        vectors: {
          size: 1536, // OpenAI embedding dimensions
          distance: "Cosine",
        },
      })
      console.log("Resumes collection created")
    }
  } catch (error) {
    console.error("Failed to initialize Qdrant collection:", error)
    throw error
  }
}

// Extract text from a PDF buffer using pdf-parse
export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(pdfBuffer)
    return data.text
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error extracting text from PDF: ${errorMessage}`)
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`)
  }
}

// Extract text from a PDF at a given URL using pdf-parse
export async function extractTextFromPdfUrl(pdfUrl: string): Promise<string> {
  try {
    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" })
    const buffer = Buffer.from(response.data)
    return await extractTextFromPdf(buffer)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error extracting text from PDF URL: ${errorMessage}`)
    throw new Error(`Failed to extract text from PDF URL: ${errorMessage}`)
  }
}

// Generate embeddings using OpenAI
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    })

    return response.data[0].embedding
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error generating embedding: ${errorMessage}`)
    throw new Error(`Failed to generate text embedding: ${errorMessage}`)
  }
}

// Store a resume in Qdrant and return the point ID
export async function storeResume(
  userId: string,
  resumeText: string,
  resumeUrl: string
): Promise<string> {
  try {
    await initializeCollection()

    // Generate embedding for the resume text
    const embedding = await generateEmbedding(resumeText)

    // Use userId as the point ID
    const pointId = userId

    // Insert the point into Qdrant
    await qdrantClient.upsert("resumes", {
      points: [
        {
          id: pointId,
          vector: embedding,
          payload: {
            userId,
            resumeText,
            resumeUrl,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    })

    return pointId
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error storing resume in Qdrant: ${errorMessage}`)
    throw new Error(
      `Failed to store resume in vector database: ${errorMessage}`
    )
  }
}

const CONTROLLER_TIMEOUT_MS = 7000 // Max 7s timeout for the entire operation

export async function searchResumes(
  query: string,
  limit: number = 10
): Promise<{ userId: string; similarity: number }[]> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), CONTROLLER_TIMEOUT_MS)

  try {
    if (!query.trim()) return []

    // Ensure collection is ready (consider memoizing this elsewhere)
    await initializeCollection()

    // Generate embedding
    const queryEmbedding = await generateEmbedding(query)

    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      console.warn("Empty embedding generated.")
      return []
    }

    // Vector search with timeout controller
    const searchResults = await qdrantClient.search("resumes", {
      vector: queryEmbedding,
      limit,
      with_payload: false,
      timeout: CONTROLLER_TIMEOUT_MS,
    })

    return searchResults.map((result) => ({
      userId: String(result.id),
      similarity: result.score ?? 0,
    }))
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as { name?: unknown }).name === "AbortError"
    ) {
      console.error("searchResumes timed out.")
    } else {
      console.error("Qdrant searchResumes error:", error)
    }
    return []
  } finally {
    clearTimeout(timeout)
  }
}

// Delete a resume from Qdrant
export async function deleteResume(pointId: string): Promise<void> {
  try {
    await qdrantClient.delete("resumes", {
      points: [pointId],
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Error deleting resume from Qdrant: ${errorMessage}`)
    throw new Error(
      `Failed to delete resume from vector database: ${errorMessage}`
    )
  }
}

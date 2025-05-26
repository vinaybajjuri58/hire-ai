import { createClient } from "@/utils/supabase/server"
import {
  TApiResponse,
  TChat,
  TChatListItem,
  TMessage,
  TMessageRole,
} from "@/types"
import OpenAI from "openai"

// Initialize OpenAI client with proper error handling
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return null
  }

  return new OpenAI({
    apiKey,
    timeout: parseInt(process.env.OPENAI_TIMEOUT || "30000", 10), // Default 30s timeout
    maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || "3", 10), // Default 3 retries
  })
}

// Define a fallback model in case environment variable isn't set
const DEFAULT_MODEL = "gpt-3.5-turbo"

// Add prompt template for OpenAI shortlisting with few-shot example
const PROMPT_TEMPLATE = `You are a helpful assistant for recruiter candidate search. You will be given a recruiter query and a list of candidate profiles. You must ONLY select candidates from the provided list. Do not use any information from previous messages or invent any candidates. If you cannot find 5, return as many as are present, but do not add any others.

Example:
Recruiter query: "Looking for a React developer with 3+ years experience."
Candidate profiles:
[]

Output:
There are no candidates that match you requirements on this platform.

Example:
Recruiter query: "Looking for a React developer with 3+ years experience."
Candidate profiles:
[
  {"name": "Alice Smith", "profile_link": "https://example.com/alice"},
  {"name": "Bob Jones", "profile_link": "https://example.com/bob"}
]

Output:
These are the top relevant candidates according to your requirements
- [Alice Smith](https://example.com/alice)
- [Bob Jones](https://example.com/bob)


---

Now, given the following recruiter query: "{query}"
And the following list of candidate profiles:
{candidates}
Shortlist the top 5 most relevant candidates ONLY from the provided list. DO NOT add, invent, or include any candidates not present in the list. Return ONLY the names and profile links of the selected candidates in a markdown list. If you cannot find 5, return as many as are present, but do not add any others.`

/**
 * Creates a new chat with the given title
 */
export async function createChat(title: string): Promise<TApiResponse<TChat>> {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: "Authentication required",
        status: 401,
      }
    }

    // Create a new chat - using snake_case for column names
    const { data, error } = await supabase
      .from("chats")
      .insert({
        title,
        user_id: user.id,
      })
      .select("*")
      .single()

    if (error) {
      return {
        error: error.message,
        status: 500,
      }
    }

    if (!data) {
      return {
        error: "Failed to create chat",
        status: 500,
      }
    }

    // Map snake_case DB columns to camelCase for our app
    return {
      data: {
        id: data.id,
        title: data.title,
        userId: data.user_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
      status: 201,
    }
  } catch {
    return {
      error: "Failed to create chat",
      status: 500,
    }
  }
}

/**
 * Gets a list of all chats for the current user
 */
export async function getChatList(): Promise<TApiResponse<TChatListItem[]>> {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: "Authentication required",
        status: 401,
      }
    }

    // Get all chats for this user - using snake_case for column names
    const { data, error } = await supabase
      .from("chats")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      return {
        error: error.message,
        status: 500,
      }
    }

    // Map snake_case DB columns to camelCase for our app
    const formattedData =
      data?.map((chat) => ({
        id: chat.id,
        title: chat.title,
        createdAt: chat.created_at,
        updatedAt: chat.updated_at,
      })) || []

    return {
      data: formattedData,
      status: 200,
    }
  } catch {
    return {
      error: "Failed to retrieve chats",
      status: 500,
    }
  }
}

/**
 * Gets a specific chat by ID
 */
export async function getChatById(
  chatId: string
): Promise<TApiResponse<TChat>> {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: "Authentication required",
        status: 401,
      }
    }

    // Get the specific chat - using snake_case
    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError) {
      if (chatError.code === "PGRST116") {
        return {
          error: "Chat not found",
          status: 404,
        }
      }
      return {
        error: chatError.message,
        status: 500,
      }
    }

    if (!chatData) {
      return {
        error: "Chat not found",
        status: 404,
      }
    }

    // Fetch messages separately
    const { data: messagesData } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    const messages = Array.isArray(messagesData)
      ? messagesData.map((message) => ({
          id: message.id as string,
          content: message.content as string,
          role: message.role as TMessageRole,
          createdAt: message.created_at as string,
          chatId: message.chat_id as string,
        }))
      : []

    // Map snake_case DB columns to camelCase for our app
    return {
      data: {
        id: chatData.id,
        title: chatData.title,
        userId: chatData.user_id,
        createdAt: chatData.created_at,
        updatedAt: chatData.updated_at,
        messages,
      },
      status: 200,
    }
  } catch {
    return {
      error: "Failed to retrieve chat",
      status: 500,
    }
  }
}

/**
 * Sends a user message to a specific chat and generates AI response
 */
export async function sendMessage(
  chatId: string,
  message: string
): Promise<TApiResponse<TMessage>> {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: "Authentication required",
        status: 401,
      }
    }

    // Verify the chat exists and belongs to the user - using snake_case
    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError || !chatData) {
      return {
        error: "Chat not found or access denied",
        status: 404,
      }
    }

    // Save the user message
    const now = new Date().toISOString()
    const { data: userMessageData, error: messageError } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        content: message,
        role: TMessageRole.User,
        created_at: now,
      })
      .select("*")
      .single()
    if (messageError || !userMessageData) {
      return {
        error: messageError?.message || "Failed to send message",
        status: 500,
      }
    }

    // --- Recruiter candidate search and shortlisting logic ---
    // 1. Qdrant similarity search for top 20 candidates
    // 2. Fetch candidate profiles
    // 3. Build OpenAI prompt and get shortlist
    // 4. Save AI response as assistant message
    try {
      // Import searchResumes and createClient from qdrant/resumeService
      const { searchResumes } = await import("@/utils/qdrant")
      const { createClient: createSupabaseClient } = await import(
        "@/utils/supabase/server"
      )
      const supabaseAdmin = await createSupabaseClient()

      // 1. Qdrant search
      const searchResults = await searchResumes(message, 20)
      const userIds = searchResults.map((r) => r.userId)

      if (!userIds.length) {
        // No candidates found
        const aiContent =
          "No relevant candidates found for your query. Please try a different search."
        await supabase.from("chat_messages").insert({
          chat_id: chatId,
          content: aiContent,
          role: TMessageRole.Assistant,
          created_at: new Date().toISOString(),
        })
        return {
          data: {
            id: userMessageData.id,
            content: message,
            role: userMessageData.role,
            createdAt: userMessageData.created_at,
            chatId: userMessageData.chat_id,
          },
          status: 201,
        }
      }

      // 2. Fetch candidate profiles
      // Change query to directly use id field instead of qdrant_point_id
      const { data: candidateProfiles, error: candidatesError } =
        await supabaseAdmin
          .from("profiles")
          .select("id, name, email, github, linkedin, twitter, resume_url")
          .in("id", userIds)
      // Remove role filter temporarily for debugging
      // .eq("role", "candidate")

      if (candidatesError) {
        const aiContent =
          "Error fetching candidate profiles: " + candidatesError.message
        await supabase.from("chat_messages").insert({
          chat_id: chatId,
          content: aiContent,
          role: TMessageRole.Assistant,
          created_at: new Date().toISOString(),
        })
        return {
          data: {
            id: userMessageData.id,
            content: message,
            role: userMessageData.role,
            createdAt: userMessageData.created_at,
            chatId: userMessageData.chat_id,
          },
          status: 201,
        }
      }

      if (!candidateProfiles || candidateProfiles.length === 0) {
        // Found userIds but no matching profiles
        const aiContent =
          "No candidate profiles were found matching your search criteria. Please check that candidate profiles exist and have resumes uploaded."
        await supabase.from("chat_messages").insert({
          chat_id: chatId,
          content: aiContent,
          role: TMessageRole.Assistant,
          created_at: new Date().toISOString(),
        })
        return {
          data: {
            id: userMessageData.id,
            content: message,
            role: userMessageData.role,
            createdAt: userMessageData.created_at,
            chatId: userMessageData.chat_id,
          },
          status: 201,
        }
      }

      // 3. Build OpenAI prompt
      // Format candidate profiles as JSON array for the prompt
      const candidatesForPrompt = candidateProfiles.map((profile) => ({
        name: profile.name,
        email: profile.email,
        github: profile.github,
        linkedin: profile.linkedin,
        twitter: profile.twitter,
        profile_link: profile.resume_url || null,
      }))
      const prompt = PROMPT_TEMPLATE.replace("{query}", message).replace(
        "{candidates}",
        JSON.stringify(candidatesForPrompt, null, 2)
      )

      // 4. Call OpenAI to get shortlist
      const openai = getOpenAIClient()
      if (!openai) {
        const aiContent =
          "OpenAI API key is not configured. Please contact the administrator."
        await supabase.from("chat_messages").insert({
          chat_id: chatId,
          content: aiContent,
          role: TMessageRole.Assistant,
          created_at: new Date().toISOString(),
        })
        return {
          data: {
            id: userMessageData.id,
            content: message,
            role: userMessageData.role,
            createdAt: userMessageData.created_at,
            chatId: userMessageData.chat_id,
          },
          status: 201,
        }
      }
      const model = process.env.OPENAI_MODEL || DEFAULT_MODEL
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: prompt,
          },
        ],
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || "0.7"),
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS || "2000", 10),
      })
      const aiResponse = completion.choices[0]?.message?.content
      if (!aiResponse) {
        throw new Error("Empty response from AI model")
      }
      // 5. Save AI response as assistant message
      const { data: aiMessageData, error: aiMessageError } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: chatId,
          content: aiResponse,
          role: TMessageRole.Assistant,
          created_at: new Date().toISOString(),
        })
        .select("*")
        .single()
      if (aiMessageError || !aiMessageData) {
        throw new Error(aiMessageError?.message || "Failed to save AI response")
      }
    } catch {
      // Save error as assistant message
      const aiContent =
        "Sorry, there was an error processing your request. Please try again later."
      await supabase.from("chat_messages").insert({
        chat_id: chatId,
        content: aiContent,
        role: TMessageRole.Assistant,
        created_at: new Date().toISOString(),
      })
    }

    // Return the user message (the frontend will fetch the latest messages)
    return {
      data: {
        id: userMessageData.id,
        content: message,
        role: userMessageData.role,
        createdAt: userMessageData.created_at,
        chatId: userMessageData.chat_id,
      },
      status: 201,
    }
  } catch {
    return {
      error: "Failed to send message",
      status: 500,
    }
  }
}

/**
 * Gets all messages for a specific chat
 */
export async function getChatMessages(
  chatId: string
): Promise<TApiResponse<TMessage[]>> {
  const supabase = await createClient()

  try {
    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return {
        error: "Authentication required",
        status: 401,
      }
    }

    // Verify the chat exists and belongs to the user - using snake_case
    const { data: chatData, error: chatError } = await supabase
      .from("chats")
      .select("id")
      .eq("id", chatId)
      .eq("user_id", user.id)
      .single()

    if (chatError || !chatData) {
      return {
        error: "Chat not found or access denied",
        status: 404,
      }
    }

    // Get all messages for this chat - using snake_case
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      return {
        error: error.message,
        status: 500,
      }
    }

    // Map to camelCase for our app
    return {
      data:
        data.map((message) => ({
          id: message.id as string,
          content: message.content as string,
          role: message.role as TMessageRole,
          createdAt: message.created_at as string,
          chatId: message.chat_id as string,
        })) || [],
      status: 200,
    }
  } catch {
    return {
      error: "Failed to retrieve messages",
      status: 500,
    }
  }
}

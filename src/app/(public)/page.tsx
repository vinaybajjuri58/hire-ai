import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold mb-4">
          Ingenium: Chat-based Hiring Platform
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Revolutionize your hiring process with AI-powered chat, instant resume
          parsing, and smart candidate matching. Let Ingenium do the heavy
          lifting—so you can focus on people, not paperwork.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </header>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-semibold text-center mb-8">
          How It Works
        </h2>
        {/* Recruiter Flow */}
        <h3 className="text-2xl font-semibold mb-4 mt-8 text-center">
          For Recruiters
        </h3>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Let AI Review Resumes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                No more sifting through 100s of resumes manually. Our LLM
                analyzes and summarizes candidate profiles for you.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Find Candidates via Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Describe your ideal candidate in chat and instantly get a
                shortlist—no complex filters or keyword searches needed.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Focus on People, Not Paperwork</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Spend less time on admin tasks and more time engaging with top
                talent. Let the platform handle the busywork.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
        {/* Candidate Flow */}
        <h3 className="text-2xl font-semibold mb-4 mt-8 text-center">
          For Candidates
        </h3>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>No More Endless Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload your resume once—no need to fill out 100s of fields or
                re-enter your details for every job. We handle the rest.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>No More Applying Everywhere</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Just upload your resume. You don&apos;t need to apply to 100s of
                places—recruiters will find you based on your skills and
                experience.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Let Opportunities Come to You</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sit back and relax. Recruiters searching for talent will reach
                out to you directly if you&apos;re a match—no extra effort
                needed.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-semibold text-center mb-8">
          Platform Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>AI Chat for Hiring</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Chat with an AI assistant to describe your ideal candidate, ask
                for recommendations, and get instant responses.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Resume Parsing & Vector Search</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                We extract text from resumes and use semantic vector search to
                find the best matches for your job requirements.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Secure File Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                All resumes are stored securely with per-user access control,
                powered by Supabase Storage.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>OpenAI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Leverage the latest OpenAI models for candidate ranking, skill
                extraction, and more.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fast & Scalable</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built on Next.js, Supabase, and Qdrant for speed, reliability,
                and scalability.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Roadmap / Coming Soon */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-semibold text-center mb-8">
          What&apos;s Next?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Smarter Chat Results</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                We&apos;re working on even more accurate and context-aware chat
                responses for both recruiters and candidates.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Background Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Automated background checks and verification workflows to
                streamline hiring and reduce risk.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Candidate Knowledge Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Building a knowledge graph of candidates to enable deeper
                insights, relationship mapping, and smarter recommendations.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recruiter Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                A powerful dashboard for recruiters to manage candidates, track
                progress, and communicate—all from a single, intuitive
                interface. Coming soon!
              </CardDescription>
            </CardContent>
          </Card>
        </div>
        <p className="text-center text-muted-foreground mt-8">
          ...and much more coming soon!
        </p>
      </section>
    </div>
  )
}

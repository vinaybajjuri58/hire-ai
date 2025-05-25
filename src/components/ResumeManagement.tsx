import { useProfile } from "@/hooks/useProfile"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { File, ExternalLink } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export function ResumeManagement() {
  const { profile } = useProfile()

  // Extract upload timestamp from resume_url if available
  const getUploadTime = () => {
    if (!profile?.resume_url) return null
    try {
      // URL format is like: <timestamp>_filename.pdf
      const match = profile.resume_url.match(/\/([0-9]+)_[^/]+$/)
      if (match && match[1]) {
        const timestamp = parseInt(match[1])
        if (!isNaN(timestamp)) {
          return new Date(timestamp)
        }
      }
    } catch {
      // Silently fail and return null if parsing fails
    }
    return null
  }
  const uploadTime = getUploadTime()

  if (!profile?.resume_url) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume</CardTitle>
        <CardDescription>Your uploaded resume</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded-md bg-background">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-md">
              <File className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold">Current Resume</h3>
              {uploadTime && (
                <p className="text-sm text-muted-foreground">
                  Uploaded{" "}
                  {formatDistanceToNow(uploadTime, { addSuffix: true })}
                </p>
              )}
              <div className="mt-2">
                <a
                  href={profile.resume_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Resume
                </a>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

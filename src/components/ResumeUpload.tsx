"use client"

import { useState, useRef } from "react"
import { useProfile } from "@/hooks/useProfile"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { AlertCircle, Check, Loader2, Upload } from "lucide-react"
import { postToApi } from "@/utils/api"

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function ResumeUpload() {
  const { profile, refreshProfile } = useProfile()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Only render if no resume exists
  if (profile?.resume_url) return null

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    setError("")

    if (!selectedFile) {
      return
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(
        `File size exceeds 5MB limit (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB)`
      )
      return
    }

    // Validate file type
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are accepted")
      return
    }

    setFile(selectedFile)
  }

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  // Upload resume
  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    setError("")
    setSuccess(false)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("resume", file)

      // Use postToApi for upload with progress
      type UploadResponse = { resumeUrl: string; qdrantPointId: string }
      await postToApi<UploadResponse, FormData>("/profile/resume", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent: ProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            )
            setUploadProgress(progress)
          }
        },
      })

      setSuccess(true)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      await refreshProfile()
      setTimeout(() => {
        setSuccess(false)
      }, 3000)
      setIsUploading(false)
      setUploadProgress(0)
    } catch (err: unknown) {
      let errorMsg = "Failed to upload resume"
      if (err instanceof Error) errorMsg = err.message
      setError(errorMsg)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Upload</CardTitle>
        <CardDescription>
          Upload your resume to help recruiters find you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error message */}
        {error && (
          <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="p-3 text-sm bg-primary/10 text-primary rounded-md flex items-center gap-2">
            <Check className="h-4 w-4" />
            Resume uploaded successfully!
          </div>
        )}

        {/* File upload section */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />

          <div className="p-4 border border-dashed rounded-md bg-muted/40 text-center">
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {file ? file.name : "Select a PDF resume"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(2)}MB`
                    : "PDF files only, 5MB max"}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleButtonClick}
                disabled={isUploading}
                className="mt-2"
              >
                Select File
              </Button>
            </div>
          </div>

          {/* Upload progress */}
          {isUploading && uploadProgress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload button */}
          {file && !isUploading && (
            <Button
              onClick={handleUpload}
              className="w-full mt-4"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Resume
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

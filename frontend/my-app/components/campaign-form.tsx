"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles, ImageIcon, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CampaignData {
  campaign_type: string
  campaign_theme: string
  audience: string
  goal: string
  additional_context: string
}

export function CampaignForm() {
  const [formData, setFormData] = useState<CampaignData>({
    campaign_type: "",
    campaign_theme: "",
    audience: "",
    goal: "",
    additional_context: "",
  })
  const [refinedPrompt, setRefinedPrompt] = useState<string>("")
  const [generatedImage, setGeneratedImage] = useState<string>("")
  const [isRefining, setIsRefining] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [step, setStep] = useState<"form" | "prompt" | "image">("form")
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleRefinePrompt = async () => {
    setIsRefining(true)
    try {
      // Send the request to the server to refine the prompt
      const response = await fetch("http://localhost:8000/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Failed to refine prompt: ${response.statusText}`)
      }

      const data = await response.json()
      setRefinedPrompt(data.refined_prompt)
      setStep("prompt")
      toast({
        title: "Prompt refined successfully",
        description: "Review and edit the prompt before generating your image.",
      })
    } catch (error) {
      console.error("Error in refining prompt:", error) // Logs the error
      toast({
        title: "Error",
        description: "Failed to refine prompt. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefining(false)
    }
  }

  const handleGenerateImage = async () => {
    setIsGenerating(true)
    try {
      // Send the request to the server to generate the image
      const response = await fetch("http://localhost:8000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: refinedPrompt }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate image: ${response.statusText}`)
      }

      const data = await response.json()
      setGeneratedImage(data.image_b64)
      setStep("image")
      toast({
        title: "Image generated successfully",
        description: "Your campaign visual is ready!",
      })
    } catch (error) {
      console.error("Error in generating image:", error) // Logs the error
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadImage = () => {
    if (!generatedImage) return

    const link = document.createElement("a")
    link.href = `data:image/png;base64,${generatedImage}`
    link.download = "campaign-image.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setFormData({
      campaign_type: "",
      campaign_theme: "",
      audience: "",
      goal: "",
      additional_context: "",
    })
    setRefinedPrompt("")
    setGeneratedImage("")
    setStep("form")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column - Form/Prompt */}
      <div className="space-y-6">
        {step === "form" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Campaign Details</CardTitle>
              <CardDescription className="text-muted-foreground">
                Provide information about your healthcare campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign_type" className="text-card-foreground">
                  Campaign Type
                </Label>
                <Input
                  id="campaign_type"
                  name="campaign_type"
                  placeholder="e.g., Health Screening, Wellness Program"
                  value={formData.campaign_type}
                  onChange={handleInputChange}
                  className="bg-secondary text-secondary-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign_theme" className="text-card-foreground">
                  Campaign Theme
                </Label>
                <Input
                  id="campaign_theme"
                  name="campaign_theme"
                  placeholder="e.g., Preventive Care, Mental Health Awareness"
                  value={formData.campaign_theme}
                  onChange={handleInputChange}
                  className="bg-secondary text-secondary-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience" className="text-card-foreground">
                  Target Audience
                </Label>
                <Input
                  id="audience"
                  name="audience"
                  placeholder="e.g., Seniors, Young families, Working professionals"
                  value={formData.audience}
                  onChange={handleInputChange}
                  className="bg-secondary text-secondary-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal" className="text-card-foreground">
                  Campaign Goal
                </Label>
                <Input
                  id="goal"
                  name="goal"
                  placeholder="e.g., Increase screening participation by 30%"
                  value={formData.goal}
                  onChange={handleInputChange}
                  className="bg-secondary text-secondary-foreground"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_context" className="text-card-foreground">
                  Additional Context
                </Label>
                <Textarea
                  id="additional_context"
                  name="additional_context"
                  placeholder="Any specific requirements, cultural considerations, or visual preferences..."
                  value={formData.additional_context}
                  onChange={handleInputChange}
                  rows={4}
                  className="bg-secondary text-secondary-foreground"
                />
              </div>

              <Button
                onClick={handleRefinePrompt}
                disabled={isRefining || !formData.campaign_type}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isRefining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refining Prompt...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Refine Prompt with AI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {(step === "prompt" || step === "image") && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground">Refined Image Prompt</CardTitle>
              <CardDescription className="text-muted-foreground">
                Review and edit the AI-generated prompt before creating your image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={refinedPrompt}
                onChange={(e) => setRefinedPrompt(e.target.value)}
                rows={12}
                className="bg-secondary text-secondary-foreground font-mono text-sm"
              />

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || !refinedPrompt}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-border text-foreground hover:bg-secondary bg-transparent"
                >
                  Start Over
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - Preview */}
      <div className="space-y-6">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Preview</CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === "form" && "Your generated image will appear here"}
              {step === "prompt" && "Generate an image to see the preview"}
              {step === "image" && "Your campaign visual"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedImage ? (
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg border border-border bg-secondary">
                  <img
                    src={`data:image/png;base64,${generatedImage}`}
                    alt="Generated campaign visual"
                    className="h-auto w-full"
                  />
                </div>
                <Button
                  onClick={handleDownloadImage}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-border bg-secondary/50">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    {step === "form" && "Fill in the campaign details to get started"}
                    {step === "prompt" && "Click Generate Image to create your visual"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {step !== "form" && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm text-card-foreground">Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-card-foreground">Type:</span>{" "}
                <span className="text-muted-foreground">{formData.campaign_type}</span>
              </div>
              <div>
                <span className="font-medium text-card-foreground">Theme:</span>{" "}
                <span className="text-muted-foreground">{formData.campaign_theme}</span>
              </div>
              <div>
                <span className="font-medium text-card-foreground">Audience:</span>{" "}
                <span className="text-muted-foreground">{formData.audience}</span>
              </div>
              <div>
                <span className="font-medium text-card-foreground">Goal:</span>{" "}
                <span className="text-muted-foreground">{formData.goal}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

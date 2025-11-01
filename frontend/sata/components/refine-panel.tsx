"use client"

import { useState, ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"

interface RefinePanelProps {
  content: {
    layout_json: Record<string, unknown>
    captions: { headline: string; tagline: string; cta: string }
    visual_prompt: string
    images_b64: string[]
  }
  campaignContext: {
    core_idea: string
    audience?: string
    writing_style?: string
    collateral_type?: string
  }
  onRefined: (content: {
    layout_json: Record<string, unknown>
    captions: { headline: string; tagline: string; cta: string }
    visual_prompt: string
    images_b64: string[]
  }) => void
  onBack: () => void
  onNext?: () => void
}

export function RefinePanel({
  content,
  campaignContext,
  onRefined,
  onBack,
  onNext,
}: RefinePanelProps) {
  const [refinementPrompt, setRefinementPrompt] = useState("")
  const [elementType, setElementType] = useState<"layout" | "captions" | "images" | "all">("all")
  const [isRefining, setIsRefining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)

  const handleReferenceUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(",")[1]
      setReferenceImage(base64Data)
    }
    reader.readAsDataURL(file)
  }

  const handleRefine = async () => {
    if (!refinementPrompt.trim()) return
    setIsRefining(true)
    setError(null)

    try {
      const response = await fetch("/api/refine-collateral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refinement_prompt: refinementPrompt,
          element_type: elementType,
          core_idea: campaignContext.core_idea,
          audience: campaignContext.audience || "General public",
          writing_style: campaignContext.writing_style || "Informative",
          collateral_type: campaignContext.collateral_type || "A4",
          current_layout: content.layout_json,
          current_captions: content.captions,
          current_visual_prompt: content.visual_prompt,
          sample_image_b64:
            elementType === "images" || elementType === "all"
              ? content.images_b64?.[0] || null
              : null,
          reference_image_b64:
            elementType === "images" || elementType === "all" ? referenceImage : null,
        }),
      })

      if (!response.ok) {
        const errorRes = await response.json().catch(() => ({}))
        throw new Error(errorRes.detail || "Failed to refine collateral")
      }

      const data = await response.json()

      const mergedContent = {
        layout_json:
          elementType === "layout" || elementType === "all"
            ? data.layout_json
            : content.layout_json,
        captions:
          elementType === "captions" || elementType === "all"
            ? data.captions
            : content.captions,
        visual_prompt:
          elementType === "images" || elementType === "all"
            ? data.visual_prompt
            : content.visual_prompt,
        images_b64:
          elementType === "images" || elementType === "all"
            ? (data.images_b64?.length ? data.images_b64 : content.images_b64)
            : content.images_b64,
      }

      onRefined(mergedContent)
      setRefinementPrompt("")
      setReferenceImage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsRefining(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Panels grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-white font-bold text-lg mb-6">Refine Your Collateral</h2>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="element_type" className="text-white text-sm font-semibold">
                What would you like to refine?
              </Label>
              <Select value={elementType} onValueChange={(val: any) => setElementType(val)}>
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue placeholder="Select element" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-600">
                  <SelectItem value="all">All Elements</SelectItem>
                  <SelectItem value="captions">Captions & Text</SelectItem>
                  <SelectItem value="images">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="refinement" className="text-white text-sm font-semibold">
                Refinement Instructions
              </Label>
              <Textarea
                id="refinement"
                placeholder="e.g., Adjust colors, improve clarity, or rewrite headline..."
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 h-32"
              />
            </div>

            {(elementType === "images" || elementType === "all") && (
              <div className="space-y-3">
                <Label htmlFor="reference-upload" className="text-white text-sm font-semibold">
                  Optional Reference Image
                </Label>
                <input
                  id="reference-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleReferenceUpload}
                  className="block w-full text-slate-300 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
                {referenceImage && (
                  <div className="mt-3">
                    <p className="text-slate-400 text-xs mb-1">Reference Preview:</p>
                    <img
                      src={`data:image/png;base64,${referenceImage}`}
                      alt="Reference preview"
                      className="w-32 rounded border border-slate-700"
                    />
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={async () => {
                await handleRefine()
                // ✅ After successful refinement, go back to ResultsPreview
                onBack()
              }}
              disabled={!refinementPrompt.trim() || isRefining}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isRefining ? "Refining..." : "Apply Refinements"}
            </Button>
          </div>
        </Card>

        {/* RIGHT PANEL */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-white font-semibold mb-4">Current Content</h3>
          <div className="space-y-4">
            <div className="bg-slate-900 p-3 rounded">
              <p className="text-slate-400 text-sm mb-1">Headline:</p>
              <p className="text-white">{content.captions.headline}</p>
            </div>

            <div className="bg-slate-900 p-3 rounded">
              <p className="text-slate-400 text-sm mb-1">Tagline:</p>
              <p className="text-white">{content.captions.tagline}</p>
            </div>

            <div className="bg-slate-900 p-3 rounded">
              <p className="text-slate-400 text-sm mb-1">CTA:</p>
              <p className="text-white">{content.captions.cta}</p>
            </div>

            {content.images_b64?.[0] && (
              <div>
                <p className="text-slate-400 text-sm mb-2">Current Image:</p>
                <img
                  src={`data:image/png;base64,${content.images_b64[0]}`}
                  alt="Current campaign visual"
                  className="w-full rounded border border-slate-700 max-h-96 object-contain"
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ✅ Bottom Buttons */}
      <div className="flex justify-between mt-6">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

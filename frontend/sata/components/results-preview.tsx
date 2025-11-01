"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ResultsPreviewProps {
  content: {
    layout_json: Record<string, unknown>
    captions: { headline: string; tagline: string; cta: string }
    visual_prompt: string
    images_b64: string[]
  }
  onNext?: () => void
  onBack?: () => void
}

export function ResultsPreview({ content, onNext, onBack }: ResultsPreviewProps) {
  const hasImage = content.images_b64 && content.images_b64.length > 0
  const image = hasImage ? content.images_b64[0] : null

  return (
    <div className="flex flex-col gap-6 relative min-h-screen">
      {/* Main panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* LEFT PANEL — Captions */}
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h2 className="text-white font-bold text-lg mb-6">Captions</h2>
          <div className="space-y-4">
            <Card className="bg-slate-900 border-slate-700 p-4">
              <h4 className="text-white font-semibold mb-2 text-sm">Headline</h4>
              <p className="text-blue-400 text-lg">{content.captions?.headline || "—"}</p>
            </Card>
            <Card className="bg-slate-900 border-slate-700 p-4">
              <h4 className="text-white font-semibold mb-2 text-sm">Tagline</h4>
              <p className="text-slate-300">{content.captions?.tagline || "—"}</p>
            </Card>
            <Card className="bg-slate-900 border-slate-700 p-4">
              <h4 className="text-white font-semibold mb-2 text-sm">Call to Action</h4>
              <p className="text-slate-300">{content.captions?.cta || "—"}</p>
            </Card>
          </div>
        </Card>

        {/* RIGHT PANEL — Single Image */}
        <Card className="bg-slate-800/50 border-slate-700 p-6 flex flex-col justify-center items-center">
          <h2 className="text-white font-bold text-lg mb-6 self-start">Generated Image</h2>

          {image ? (
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
              <img
                src={`data:image/jpeg;base64,${image}`}
                alt="Generated visual"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <p className="text-slate-400 text-center">No image generated</p>
          )}
        </Card>
      </div>

      {/* ✅ Bottom Buttons (Non-sticky) */}
      <div className="flex justify-between ">
        <Button
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

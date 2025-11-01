"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CampaignForm } from "./campaign-form"
import { ResultsPreview } from "./results-preview"
import { RefinePanel } from "./refine-panel"
import { EditorPage } from "./editor-page"

interface GeneratedContent {
  layout_json: Record<string, unknown>
  captions: { headline: string; tagline: string; cta: string }
  visual_prompt: string
  images_b64: string[]
  core_idea?: string
  audience?: string
  writing_style?: string
  collateral_type?: string
}

type WizardStep = "form" | "results" | "refine" | "editor"

export function CampaignWizard() {
  const [step, setStep] = useState<WizardStep>("form")
  const [content, setContent] = useState<GeneratedContent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateCollateral = async (formData: {
    core_idea: string
    audience: string
    writing_style: string
    collateral_type: string
    num_images: number
    sample_image_b64?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/create-collateral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create collateral")

      const data = await response.json()

      setContent({
        ...data,
        core_idea: formData.core_idea,
        audience: formData.audience,
        writing_style: formData.writing_style,
        collateral_type: formData.collateral_type,
      })

      setStep("results")
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const steps: WizardStep[] = ["form", "results", "refine", "editor"]
  const stepLabels: Record<WizardStep, string> = {
    form: "Form",
    results: "Results",
    refine: "Refine",
    editor: "Editor",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Canva-AI Generator</h1>
          <p className="text-slate-400">Create healthcare campaign collateral powered by AI</p>
        </div>

        {/* Step Tracker */}
        <div className="mb-8 flex gap-4 overflow-x-auto pb-2">
          {steps.map((s, i) => {
            const currentIndex = steps.indexOf(step)
            const stepIndex = steps.indexOf(s)
            const isActive = step === s
            const isCompleted = stepIndex < currentIndex

            return (
              <div key={s} className="flex items-center gap-2 flex-shrink-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm
                    ${
                      isActive
                        ? "bg-blue-500 text-white"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-slate-700 text-slate-400"
                    }`}
                >
                  {i + 1}
                </div>
                <span
                  className={`text-sm capitalize hidden md:inline ${
                    isActive ? "text-white" : "text-slate-400"
                  }`}
                >
                  {stepLabels[s]}
                </span>
                {i < steps.length - 1 && (
                  <div
                    className={`h-px w-6 ml-2 ${
                      isCompleted ? "bg-green-600" : "bg-slate-700"
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Form */}
        {step === "form" && (
          <CampaignForm onSubmit={handleCreateCollateral} isLoading={isLoading} />
        )}

        {/* Step 2: Results */}
        {step === "results" && content && (
          <ResultsPreview
            content={content}
            onBack={() => setStep("form")}
            onNext={() => setStep("refine")}
          />
        )}

        {/* Step 3: Refine */}
        {step === "refine" && content && (
          <RefinePanel
            content={content}
            campaignContext={{
              core_idea: content.core_idea || "",
              audience: content.audience || "General public",
              writing_style: content.writing_style || "Informative",
              collateral_type: content.collateral_type || "A4",
            }}
            onRefined={(updated) => {
              setContent({ ...content, ...updated })
            }}
            onBack={() => setStep("results")}
            onNext={() => setStep("editor")} // ✅ Next button now leads to the editor
          />
        )}

        {/* Step 4: Editor */}
        {step === "editor" && content && (
          <EditorPage content={content} onBack={() => setStep("refine")} />
        )}
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CampaignFormProps {
  onSubmit: (formData: {
    core_idea: string
    audience: string
    writing_style: string
    sample_image_b64?: string
  }) => Promise<void>
  isLoading: boolean
}

export function CampaignForm({ onSubmit, isLoading }: CampaignFormProps) {
  const [formData, setFormData] = useState({
    core_idea: "",
    audience: "General public",
    writing_style: "Informative",
  })
  const [sampleImage, setSampleImage] = useState<string | undefined>()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          // Extract base64 string without the data URL prefix
          const base64String = (event.target.result as string).split(",")[1]
          setSampleImage(base64String)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      sample_image_b64: sampleImage,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Text Inputs */}
        <div className="lg:col-span-2 space-y-6 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-lg p-6">
          {/* Core Idea */}
          <div className="space-y-3">
            <Label htmlFor="core_idea" className="text-white text-sm font-semibold">
              Campaign Core Idea *
            </Label>
            <Textarea
              id="core_idea"
              placeholder="Describe the main message and goal of your healthcare campaign..."
              value={formData.core_idea}
              onChange={(e) => setFormData({ ...formData, core_idea: e.target.value })}
              required
              className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 h-24"
            />
          </div>

          {/* Audience & Writing Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="audience" className="text-white text-sm font-semibold">
                Target Audience
              </Label>
              <Input
                id="audience"
                placeholder="e.g., Young adults, Seniors, Parents"
                value={formData.audience}
                onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="writing_style" className="text-white text-sm font-semibold">
                Writing Style
              </Label>
              <Select
                value={formData.writing_style}
                onValueChange={(val) => setFormData({ ...formData, writing_style: val })}
              >
                <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-600">
                  <SelectItem value="Informative">Informative</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                  <SelectItem value="Empathetic">Empathetic</SelectItem>
                  <SelectItem value="Inspirational">Inspirational</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-white font-semibold">Reference Image (Optional)</h3>
          <label className="block cursor-pointer">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <div className="border-2 border-dashed border-blue-500/50 rounded-lg p-8 text-center hover:bg-blue-500/5 transition">
              {sampleImage ? (
                <div className="space-y-3">
                  <img
                    src={`data:image/jpeg;base64,${sampleImage}`}
                    alt="Sample"
                    className="w-full h-32 object-cover rounded"
                  />
                  <p className="text-sm text-blue-400">Image uploaded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-slate-300">Upload a reference image</p>
                  <p className="text-xs text-slate-500">to guide the visual style</p>
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!formData.core_idea.trim() || isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12"
      >
        {isLoading ? "Generating..." : "Generate Collateral"}
      </Button>
    </form>
  )
}

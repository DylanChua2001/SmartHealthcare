import { CampaignForm } from "@/components/campaign-form"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-8 md:mb-12">
          <div className="mb-2 text-sm font-medium text-accent">SATA CommHealth</div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            AI Campaign Image Generator
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Create compelling, culturally-relevant healthcare campaign visuals powered by AI. Generate photorealistic
            images tailored for Singapore audiences.
          </p>
        </div>

        <CampaignForm />
      </div>
    </main>
  )
}

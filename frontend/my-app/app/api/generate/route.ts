import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Replace with your actual backend API URL
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:8000"

    const response = await fetch(`${backendUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error("Backend API request failed")
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in /api/generate:", error)
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
  }
}

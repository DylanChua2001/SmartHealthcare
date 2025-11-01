export async function POST(request: Request) {
  try {
    const body = await request.json()

    const backendBaseUrl = process.env.BACKEND_URL ?? "http://localhost:8000"
    const targetUrl = new URL("/create-collateral", backendBaseUrl)

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(errorText || `Backend error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to create collateral" },
      { status: 500 },
    )
  }
}

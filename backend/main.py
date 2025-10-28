import base64
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from langchain_core.prompts import ChatPromptTemplate

try:  # Prefer typed helpers when exposed by the installed SDK.
    from google.genai.types import (  # type: ignore
        GenerateContentConfig,
        GenerateImageConfig,
    )
except ImportError:  # pragma: no cover - accommodate SDK variants without these helpers.
    GenerateContentConfig = None  # type: ignore
    GenerateImageConfig = None  # type: ignore

# -----------------------------
# ENV & constants
# -----------------------------
GOOGLE_GENAI_API_KEY = os.getenv("GOOGLE_GENAI_API_KEY")
if not GOOGLE_GENAI_API_KEY:
    raise RuntimeError("Set GOOGLE_GENAI_API_KEY in your environment.")

# Model choice: Gemini 2.5 Flash Image (aka Nano Banana)
GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"
GEMINI_TEXT_MODEL = "gemini-2.5-flash"

# -----------------------------
# LangChain Setup with Gemini
# -----------------------------
genai_client = genai.Client(api_key=GOOGLE_GENAI_API_KEY)

PROMPT_TEMPLATE = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert creative director generating realistic and compelling visual concepts for a healthcare charity in Singapore. "
            "Your goal is to create a detailed and realistic visual prompt for an image generation model. "
            "The visual concept should align with the charity's mission and target audience, focusing on health and wellness, while ensuring the visual elements are culturally relevant, appropriate for Singapore, and have a realistic aesthetic. "
            "The final output should focus on lifelike imagery and the message of the campaign.",
        ),
        (
            "user",
            "Campaign brief:\n{campaign_brief}\n\n"
            "Based on the details provided, generate a detailed prompt that describes a **realistic** and **lifelike** visual scene for the image generation model. "
            "The prompt should focus on natural and authentic imagery, highlighting the campaign's goal, the target audience, and the desired tone. "
            "Ensure the scene is realistic and culturally relevant to Singapore, with the following focus:\n"
            "- **Lifelike subjects:** Depicting people who are realistically portrayed, not overly stylized or idealized.\n"
            "- **Cultural relevance:** Ensure the setting, subjects, and mood resonate with Singaporean values and everyday life.\n"
            "- **Realism:** Avoid anything too abstract, staged, or unrealistic. The visual should evoke naturalness, warmth, and relatability.\n"
            "- **Visual consistency:** Ensure that the colors, lighting, and composition maintain a sense of authenticity and realism.\n"
            "\n"
            "Generate a **realistic image prompt** using the following structure, emphasizing natural, lifelike, and culturally resonant visuals:\n"
            "\n"
            "A photorealistic [shot type] of [subject], [action or expression], set in [environment]. The scene is illuminated by [lighting description], creating a [mood] atmosphere. "
            "Captured with a [camera/lens details], emphasizing [key textures and details]. The image should be in a [aspect ratio] format.\n"
        ),
    ]
)

# -----------------------------
# FastAPI Setup
# -----------------------------
app = FastAPI(title="SATA CommHealth Collateral Image Service")


class PromptRequest(BaseModel):
    campaign_type: Optional[str] = None
    campaign_theme: Optional[str] = None
    audience: Optional[str] = None
    goal: Optional[str] = None
    additional_context: Optional[str] = None


class ImageResponse(BaseModel):
    prompt: str
    image_b64: Optional[str] = None  # Base64 image (optional for image generation response)


class GenerateRequest(BaseModel):
    prompt: str


# -----------------------------
# LangChain Conversation Helpers
# -----------------------------
def _refine_prompt_with_gemini(payload: PromptRequest) -> str:
    """
    Use LangChain's message prompt template to build a structured request and ask
    Gemini to expand on the idea or ask follow-up questions before generating an image prompt.
    """

    # Directly use all fields from the payload to build the campaign brief
    campaign_brief = "\n".join(
        [
            f"Campaign type: {payload.campaign_type if payload.campaign_type else 'Not provided'}",
            f"Campaign theme: {payload.campaign_theme if payload.campaign_theme else 'Not provided'}",
            f"Target audience: {payload.audience if payload.audience else 'Not provided'}",
            f"Campaign goal: {payload.goal if payload.goal else 'Not provided'}",
            f"Additional context: {payload.additional_context if payload.additional_context else 'Not provided'}",
        ]
    )

    # Now, generate the refined prompt using the LangChain template
    prompt_value = PROMPT_TEMPLATE.invoke({"campaign_brief": campaign_brief})
    prompt_text = prompt_value.to_string()

    response = genai_client.models.generate_content(
        model=GEMINI_TEXT_MODEL,
        contents=[
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt_text,
                    }
                ],
            }
        ],
    )

    # Extract refined text from the response
    refined_text = getattr(response, "text", None)

    if not refined_text and getattr(response, "candidates", None):
        parts = []
        for candidate in response.candidates:
            content = getattr(candidate, "content", None)
            for part in getattr(content, "parts", []) or []:
                text_part = getattr(part, "text", None)
                if text_part:
                    parts.append(text_part)
        refined_text = "\n".join(parts)

    if not refined_text:
        raise RuntimeError("Prompt refinement failed.")

    return refined_text.strip()


@app.post("/prompt")
def create_prompt(payload: PromptRequest):
    refined_prompt = _refine_prompt_with_gemini(payload)
    return {"refined_prompt": refined_prompt}


# -----------------------------
# Image Generation from Refined Prompt
# -----------------------------
def generate_image_from_prompt(prompt: str) -> bytes:
    """
    Generate an image using Gemini via generate_content. Some SDK versions do not yet support
    request-side mime hints, so we rely on the default response payload that contains inline data.
    """
    response = genai_client.models.generate_content(
        model=GEMINI_IMAGE_MODEL,
        contents=[
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt,
                    }
                ],
            }
        ],
    )

    image_bytes = _extract_image_bytes(response)
    if image_bytes is None:
        raise RuntimeError("Image generation failed.")

    return image_bytes


def _extract_image_bytes(response) -> Optional[bytes]:
    """
    Best-effort extraction across different SDK response shapes.
    """
    if response is None:
        return None

    # Most SDK variants expose a direct image attribute.
    image = getattr(response, "image", None)
    if isinstance(image, bytes):
        return image
    if image is not None and hasattr(image, "data"):
        data = getattr(image, "data")
        if isinstance(data, bytes):
            return data
        if isinstance(data, str):
            try:
                return base64.b64decode(data)
            except Exception:  # pragma: no cover - best effort only.
                pass

    # Some variants return a list of images.
    images = getattr(response, "images", None)
    if images:
        for candidate in images:
            if isinstance(candidate, bytes):
                return candidate
            data = getattr(candidate, "data", None)
            if isinstance(data, bytes):
                return data
            if isinstance(data, str):
                try:
                    return base64.b64decode(data)
                except Exception:  # pragma: no cover - best effort only.
                    pass
            image_attr = getattr(candidate, "image", None)
            if isinstance(image_attr, bytes):
                return image_attr
            if image_attr is not None and hasattr(image_attr, "data"):
                data = getattr(image_attr, "data")
                if isinstance(data, bytes):
                    return data
                if isinstance(data, str):
                    try:
                        return base64.b64decode(data)
                    except Exception:  # pragma: no cover - best effort only.
                        pass

    # Fallback: check for inline data in candidates used by generate_content.
    candidates = getattr(response, "candidates", None)
    if candidates:
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", None)
            if not parts:
                continue
            for part in parts:
                inline_data = getattr(part, "inline_data", None)
                if inline_data:
                    data = getattr(inline_data, "data", None)
                    if isinstance(data, bytes):
                        return data
                    if isinstance(data, str):
                        try:
                            return base64.b64decode(data)
                        except Exception:  # pragma: no cover - best effort only.
                            pass
                # Some responses may surface Base64 strings.
                b64_data = getattr(part, "data", None)
                if isinstance(b64_data, str):
                    try:
                        return base64.b64decode(b64_data)
                    except Exception:  # pragma: no cover - best effort only.
                        continue

    return None


@app.post("/generate", response_model=ImageResponse)
def generate_image(payload: GenerateRequest):
    try:
        img_bytes = generate_image_from_prompt(payload.prompt)
        refined_prompt = payload.prompt
        b64_image = base64.b64encode(img_bytes).decode("utf-8")

        return ImageResponse(prompt=refined_prompt, image_b64=b64_image)

    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Image generation failed: {exc}") from exc


# -----------------------------
# Health Check Endpoint
# -----------------------------
@app.get("/healthz")
def healthz():
    return {"ok": True}

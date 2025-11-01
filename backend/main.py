import base64
import os
from typing import Optional, Dict, Any, List
from io import BytesIO
from PIL import Image

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from langchain_core.prompts import ChatPromptTemplate

try:
    from google.genai.types import GenerateContentConfig, Modality  # type: ignore
except ImportError:
    GenerateContentConfig = None  # type: ignore
    Modality = None  # type: ignore


# -----------------------------
# ENV & constants
# -----------------------------
GOOGLE_GENAI_API_KEY = os.getenv("GOOGLE_GENAI_API_KEY")
if not GOOGLE_GENAI_API_KEY:
    raise RuntimeError("Set GOOGLE_GENAI_API_KEY in your environment.")

GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image"
GEMINI_TEXT_MODEL = "gemini-2.5-flash"

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    if origin.strip()
]


# -----------------------------
# LangChain Setup with Gemini
# -----------------------------
genai_client = genai.Client(api_key=GOOGLE_GENAI_API_KEY)


# -----------------------------
# PROMPT TEMPLATES
# -----------------------------
LAYOUT_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are an expert creative director designing printable layouts for healthcare campaigns in Singapore. "
     "You must produce a structured JSON layout for use in a design editor like Canva or Fabric.js. "
     "Positions must be given as percentages of the canvas (0-100) for responsive scaling. "
     "Return ONLY valid JSON with no markdown formatting, no code blocks, and no explanatory text."),
    ("user",
     "Campaign Core Idea:\n{core_idea}\n"
     "Target Audience:\n{audience}\n\n"
     "Return only a **valid JSON** structure with coordinates for key visual elements:\n"
     "`background_image`, `headline`, `tagline`, `cta_text`, and `logo_area`.\n"
     "Each should have `x`, `y`, `width`, and `height` fields (percentages). Example:\n"
     "{{\n"
     "  \"background_image\": {{\"x\":0,\"y\":0,\"width\":100,\"height\":100}},\n"
     "  \"headline\": {{\"x\":10,\"y\":70,\"width\":80,\"height\":10}},\n"
     "  \"tagline\": {{\"x\":10,\"y\":82,\"width\":80,\"height\":5}},\n"
     "  \"cta_text\": {{\"x\":10,\"y\":88,\"width\":30,\"height\":5}},\n"
     "  \"logo_area\": {{\"x\":75,\"y\":5,\"width\":20,\"height\":10}}\n"
     "}}\n\n"
     "Ensure the proportions visually balance the elements for a general healthcare poster.")
])

CAPTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "You are a healthcare copywriter crafting concise, emotionally engaging poster text for SATA CommHealth campaigns. "
     "Your writing style should be clear, warm, and motivating — suitable for public awareness, preventive health, and community care. "
     "Return ONLY valid JSON — no markdown, code blocks, or explanations."),
    ("user",
     "Core Idea:\n{core_idea}\n"
     "Target Audience:\n{audience}\n"
     "Tone & Style:\n{writing_style}\n\n"
     "Generate a short, natural-language caption set in JSON format:\n"
     "{{\n"
     "  \"headline\": \"...\",\n"
     "  \"tagline\": \"...\",\n"
     "  \"cta\": \"...\"\n"
     "}}\n\n"
     "Rules:\n"
     "- Keep the headline under 8 words.\n"
     "- Make the tagline supportive and empathetic.\n"
     "- Keep the CTA direct, community-oriented, and free of jargon.")
])

DIRECT_IMAGE_PROMPT = """
Create a photorealistic healthcare campaign image for SATA CommHealth Singapore.

Core Message: {core_idea}
Target Audience: {audience}

Creative Direction:
- Depict authentic, diverse Singaporean individuals (Chinese, Malay, Indian, and others) engaging in positive healthcare-related interactions.
- Scene should feel distinctly local — e.g., HDB heartland settings, community clinics, wellness centers, neighborhood parks, or home environments.
- Emphasize empathy, trust, and community connection. The tone should be warm, hopeful, and caring.
- Lighting: soft, natural daylight with realistic shadows and textures.
- Mood: friendly, uplifting, and genuine — avoid overly posed or stock-like imagery.
- Wardrobe: realistic Singaporean everyday wear; healthcare professionals in SATA CommHealth-style uniforms (light blue/teal tones, professional but approachable).
- Composition: cinematic realism, inspired by Canon EOS R6 with a 50mm lens — shallow depth of field, lifelike bokeh, balanced focus.
- Include clean **negative space** within the frame (e.g., blank wall, sky, or blurred background area) where text or campaign messages can later be placed.
- **Do not include any visible words, logos, or text** in the image itself.
- Ensure the image looks like a genuine professional photo taken in Singapore, ready for use in posters, brochures, or social media collateral.

Overall Theme:
Reflect SATA CommHealth’s values — trusted community healthcare that’s “close to your heart.”
"""


# -----------------------------
# FastAPI Setup
# -----------------------------
app = FastAPI(title="SATA CommHealth Canva-AI Generator v3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import APIRouter
api_router = APIRouter(prefix="")


# -----------------------------
# Models
# -----------------------------
class CanvaAIRequest(BaseModel):
    core_idea: str
    audience: Optional[str] = "General public"
    writing_style: Optional[str] = "Informative"
    sample_image_b64: Optional[str] = None


class RefinementRequest(BaseModel):
    refinement_prompt: str
    element_type: str  # layout, captions, images, all
    core_idea: str
    audience: Optional[str] = "General public"
    writing_style: Optional[str] = "Informative"
    current_layout: Optional[Dict[str, Any]] = None
    current_captions: Optional[Dict[str, str]] = None
    current_visual_prompt: Optional[str] = None
    sample_image_b64: Optional[str] = None  # main image to refine
    reference_image_b64: Optional[str] = None  # new field for guidance image


class CanvaAIResponse(BaseModel):
    layout_json: Dict[str, Any]
    captions: Dict[str, str]
    visual_prompt: str
    images_b64: List[str]


# -----------------------------
# Helper Functions
# -----------------------------
def _generate_layout(payload: CanvaAIRequest) -> Dict[str, Any]:
    layout_prompt = LAYOUT_PROMPT.invoke({
        "core_idea": payload.core_idea,
        "audience": payload.audience,
    })
    response = genai_client.models.generate_content(
        model=GEMINI_TEXT_MODEL,
        contents=[{"role": "user", "parts": [{"text": layout_prompt.to_string()}]}],
    )
    import json, re
    try:
        text = response.text.strip()
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception as e:
        print(f"Layout JSON parsing error: {e}")
    return {
        "background_image": {"x": 0, "y": 0, "width": 100, "height": 100},
        "headline": {"x": 10, "y": 70, "width": 80, "height": 10},
        "tagline": {"x": 10, "y": 82, "width": 80, "height": 5},
        "cta_text": {"x": 10, "y": 88, "width": 30, "height": 5},
        "logo_area": {"x": 75, "y": 5, "width": 20, "height": 10},
    }


def _generate_captions(payload: CanvaAIRequest) -> Dict[str, str]:
    caption_prompt = CAPTION_PROMPT.invoke({
        "core_idea": payload.core_idea,
        "audience": payload.audience,
        "writing_style": payload.writing_style,
    })
    response = genai_client.models.generate_content(
        model=GEMINI_TEXT_MODEL,
        contents=[{"role": "user", "parts": [{"text": caption_prompt.to_string()}]}],
    )
    import json, re
    try:
        text = response.text.strip()
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception:
        pass
    return {
        "headline": "Take Control of Your Health",
        "tagline": "Early detection saves lives",
        "cta": "Book Your Free Screening Today",
    }


def _generate_images_direct(payload: CanvaAIRequest) -> tuple[str, List[str]]:
    direct_prompt = DIRECT_IMAGE_PROMPT.format(
        core_idea=payload.core_idea, audience=payload.audience
    )
    if payload.sample_image_b64:
        direct_prompt = f"Use the provided reference image as visual inspiration.\n\n{direct_prompt}"

    parts = []
    if payload.sample_image_b64:
        parts.append({"inline_data": {"mime_type": "image/jpeg", "data": payload.sample_image_b64}})
    parts.append({"text": direct_prompt})

    response = genai_client.models.generate_content(
        model=GEMINI_IMAGE_MODEL, contents=[{"role": "user", "parts": parts}]
    )

    images = []
    if hasattr(response, "candidates"):
        for c in response.candidates:
            for p in getattr(c.content, "parts", []):
                if getattr(p, "inline_data", None):
                    data = p.inline_data.data
                    if isinstance(data, bytes):
                        images.append(base64.b64encode(data).decode())
                    elif data:
                        images.append(data)
    if not images:
        images.append("")
    return direct_prompt.strip(), images


def _refine_layout(req: RefinementRequest) -> Dict[str, Any]:
    context = f"""
You previously generated this layout:
{req.current_layout}

User wants refinement:
{req.refinement_prompt}

Return updated layout JSON.
"""
    response = genai_client.models.generate_content(
        model=GEMINI_TEXT_MODEL, contents=[{"role": "user", "parts": [{"text": context}]}]
    )
    import json, re
    try:
        text = response.text.strip()
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception:
        pass
    return req.current_layout or {}


def _refine_captions(req: RefinementRequest) -> Dict[str, str]:
    context = f"""
You previously generated these captions:
{req.current_captions}

User wants refinement:
{req.refinement_prompt}

Return new captions JSON.
"""
    response = genai_client.models.generate_content(
        model=GEMINI_TEXT_MODEL, contents=[{"role": "user", "parts": [{"text": context}]}]
    )
    import json, re
    try:
        text = response.text.strip()
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0))
    except Exception:
        pass
    return req.current_captions or {}


def _refine_images(req: RefinementRequest) -> tuple[str, List[str]]:
    """Refine campaign image, optionally using a reference image for guidance."""
    if not req.sample_image_b64:
        return "No base campaign image provided", [""]

    refinement_prompt = f"""
Refine this healthcare campaign image according to the user instruction below.

User instruction:
{req.refinement_prompt}

If a second reference image is provided, use it as visual guidance — for example, 
to match clothing, uniforms, or other visual details. Keep the same composition, 
lighting, and overall realism of the original.
"""

    try:
        base_img = Image.open(BytesIO(base64.b64decode(req.sample_image_b64)))
        contents = [base_img]

        if req.reference_image_b64:
            try:
                ref_img = Image.open(BytesIO(base64.b64decode(req.reference_image_b64)))
                contents.append(ref_img)
            except Exception as e:
                print(f"⚠️ Reference image decode failed: {e}")

        contents.append(refinement_prompt)

        response = genai_client.models.generate_content(
            model=GEMINI_IMAGE_MODEL,
            contents=contents,
            config=GenerateContentConfig(response_modalities=[Modality.TEXT, Modality.IMAGE]),
        )

        images = []
        for part in response.candidates[0].content.parts:
            if getattr(part, "inline_data", None):
                data = part.inline_data.data
                if isinstance(data, bytes):
                    images.append(base64.b64encode(data).decode())
                else:
                    images.append(data)

        if not images:
            images.append("")

        return refinement_prompt, images

    except Exception as e:
        print(f"❌ Image refinement error: {e}")
        return refinement_prompt, [""]


# -----------------------------
# Endpoints
# -----------------------------
@api_router.post("/create-collateral", response_model=CanvaAIResponse)
def create_collateral(payload: CanvaAIRequest):
    """Generate layout, captions, and one image."""
    try:
        layout = _generate_layout(payload)
        captions = _generate_captions(payload)
        visual_prompt, images = _generate_images_direct(payload)
        return CanvaAIResponse(
            layout_json=layout, captions=captions, visual_prompt=visual_prompt, images_b64=images
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Collateral generation failed: {exc}")


@api_router.post("/refine-collateral", response_model=CanvaAIResponse)
def refine_collateral(req: RefinementRequest):
    """Refine layout, captions, images, or all — supports optional reference image."""
    try:
        layout = req.current_layout or {}
        captions = req.current_captions or {}
        visual_prompt = req.current_visual_prompt or ""
        images = []

        if req.element_type in ["layout", "all"]:
            layout = _refine_layout(req)
        if req.element_type in ["captions", "all"]:
            captions = _refine_captions(req)
        if req.element_type in ["images", "all"]:
            visual_prompt, images = _refine_images(req)

        return CanvaAIResponse(
            layout_json=layout, captions=captions, visual_prompt=visual_prompt, images_b64=images
        )

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Refinement failed: {exc}")


@app.get("/healthz")
def healthz():
    return {"ok": True}


app.include_router(api_router)

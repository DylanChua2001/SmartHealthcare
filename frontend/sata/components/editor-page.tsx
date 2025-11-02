"use client"

import { useEffect, useRef, useState } from "react"
import * as fabric from "fabric"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EditorPageProps {
  content: {
    layout_json?: Record<string, any>
    captions: { headline: string; tagline: string; cta: string }
    images_b64: string[]
  }
  onBack: () => void
}

const hexToRgb = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

export function EditorPage({ content, onBack }: EditorPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [zoom, setZoom] = useState(1)

  // Text / style states
  const [fontColor, setFontColor] = useState("#ffffff")
  const [bgColor, setBgColor] = useState("#000000")
  const [bgOpacity, setBgOpacity] = useState(0)
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState("Helvetica")
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left")
  const [fontWeight, setFontWeight] = useState<"normal" | "bold">("normal")
  const [fontStyle, setFontStyle] = useState<"normal" | "italic">("normal")
  const [underline, setUnderline] = useState(false)
  const [strokeColor, setStrokeColor] = useState("#000000")
  const [strokeWidth, setStrokeWidth] = useState(0)
  const [shadowColor, setShadowColor] = useState("#000000")
  const [shadowBlur, setShadowBlur] = useState(0)
  const [posterSize, setPosterSize] = useState("A4")
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")

  // 🆕 Image editing states
  const [cornerRadius, setCornerRadius] = useState(0)
  const [isCropping, setIsCropping] = useState(false)
  const [cropRectId, setCropRectId] = useState<string | null>(null)

  // 🆕 Text rounding state
  const [textCornerRadius, setTextCornerRadius] = useState(0)

  // Paper sizes
  const BASE_SIZES: Record<string, { w: number; h: number }> = {
    Letter: { w: 816, h: 1056 },
    A4: { w: 794, h: 1123 },
    A5: { w: 559, h: 794 },
    A6: { w: 397, h: 559 },
    Postcard: { w: 400, h: 600 },
  }

  const getCanvasDimensions = () => {
    const base = BASE_SIZES[posterSize]
    return orientation === "portrait" ? { w: base.w, h: base.h } : { w: base.h, h: base.w }
  }

  // Initialize canvas
  useEffect(() => {
    const setupCanvas = async () => {
      if (!canvasRef.current) return

      const pixelRatio = window.devicePixelRatio || 1
      const { w, h } = getCanvasDimensions()

      canvasRef.current.width = w * pixelRatio
      canvasRef.current.height = h * pixelRatio
      canvasRef.current.style.width = `${w}px`
      canvasRef.current.style.height = `${h}px`

      const c = new fabric.Canvas(canvasRef.current, {
        backgroundColor: "#111827",
        preserveObjectStacking: true,
      })

      c.setZoom(pixelRatio)
      setCanvas(c)
    }

    setupCanvas()

    // ✅ cleanup must be synchronous
    return () => {
      if (canvas) {
        canvas.dispose()
      }
    }
  }, [])

  // Scale / resize canvas on window or orientation change
  useEffect(() => {
    if (!canvas || !containerRef.current) return

    const resizeCanvas = () => {
      const { w, h } = getCanvasDimensions()
      const container = containerRef.current
      if (!container) return

      const cw = container.clientWidth
      const ch = container.clientHeight
      const scale = Math.min(cw / w, ch / h)

      canvas.setDimensions({ width: w, height: h })
      canvas.setZoom(scale)
      setZoom(scale)
      canvas.calcOffset()
      canvas.renderAll()
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [canvas, orientation, posterSize])

  // Load content when ready
  useEffect(() => {
    if (!canvas || !content) return

    const { w: width, h: height } = getCanvasDimensions()
    canvas.clear()

    // Base image
    const firstImg = content.images_b64?.[0]
    if (firstImg) {
      let imgUrl = firstImg.trim()
      if (!imgUrl.startsWith("data:image")) {
        imgUrl = imgUrl.startsWith("iVBOR")
          ? `data:image/png;base64,${imgUrl}`
          : `data:image/jpeg;base64,${imgUrl}`
      }
      const imgEl = new Image()
      imgEl.crossOrigin = "anonymous"
      imgEl.onload = () => {
        const fabImg = new fabric.Image(imgEl, { originX: "center", originY: "center" })
        const scale =
          imgEl.width / imgEl.height > width / height ? width / imgEl.width : height / imgEl.height
        fabImg.scale(scale)
        fabImg.left = width / 2
        fabImg.top = height / 2
        canvas.add(fabImg)
        canvas.sendObjectToBack(fabImg)
        canvas.renderAll()
      }
      imgEl.src = imgUrl
    }

    // Text captions
    const captions = content.captions
    const layout = content.layout_json || {
      headline: { x: 10, y: 15 },
      tagline: { x: 10, y: 25 },
      cta_text: { x: 10, y: 35 },
    }

    const addText = (text: string, pos: any, extra: any = {}) => {
      const t = new fabric.Textbox(text, {
        left: (pos.x / 100) * width,
        top: (pos.y / 100) * height,
        width: width * 0.8,
        fontSize: 24,
        fill: "#ffffff",
        backgroundColor: "transparent",
        ...extra,
      })
      canvas.add(t)
    }

    addText(captions.headline, layout.headline, { fontWeight: "bold", fontSize: 36 })
    addText(captions.tagline, layout.tagline, { fontStyle: "italic", fontSize: 24 })
    addText(captions.cta, layout.cta_text, { fill: "#00bfff", fontSize: 20 })
    canvas.renderAll()
  }, [canvas, content, posterSize, orientation])

  // Selection tracking
  useEffect(() => {
    if (!canvas) return
    const handleSelect = (e: any) => {
      const obj = e.selected?.[0] || null
      setSelectedObject(obj)
      if (obj && obj.type === "textbox") {
        const tb = obj as fabric.Textbox
        setFontColor((tb.fill as string) || "#ffffff")
        setFontSize(tb.fontSize || 24)
        setFontFamily(tb.fontFamily || "Helvetica")
        setTextAlign((tb.textAlign as "left" | "center" | "right") || "left")
        setFontWeight((tb.fontWeight as any) || "normal")
        setFontStyle((tb.fontStyle as any) || "normal")
        setUnderline(tb.underline || false)
      }
    }
    const handleClear = () => setSelectedObject(null)
    canvas.on("selection:created", handleSelect)
    canvas.on("selection:updated", handleSelect)
    canvas.on("selection:cleared", handleClear)
    return () => {
      canvas.off("selection:created", handleSelect)
      canvas.off("selection:updated", handleSelect)
      canvas.off("selection:cleared", handleClear)
    }
  }, [canvas])

  // Helpers
  const updateSelected = (prop: string, val: any) => {
    if (selectedObject && selectedObject.type === "textbox") {
      ; (selectedObject as fabric.Textbox).set(prop, val)
      canvas?.renderAll()
    }
  }

  const bringFront = () => selectedObject && canvas?.bringObjectToFront(selectedObject)
  const sendBack = () => selectedObject && canvas?.sendObjectToBack(selectedObject)
  const flipHorizontal = () =>
    selectedObject && ((selectedObject.flipX = !selectedObject.flipX), canvas?.renderAll())
  const flipVertical = () =>
    selectedObject && ((selectedObject.flipY = !selectedObject.flipY), canvas?.renderAll())

  const handleAddText = () => {
    if (!canvas) return
    const t = new fabric.Textbox("New text", {
      left: 100,
      top: 100,
      width: 300,
      fontSize,
      fontFamily,
      fill: fontColor,
      fontWeight,
      fontStyle,
      underline,
      backgroundColor: `rgba(${hexToRgb(bgColor)},${bgOpacity})`,
      stroke: strokeColor,
      strokeWidth,
      shadow: shadowBlur
        ? new fabric.Shadow({ color: shadowColor, blur: shadowBlur })
        : undefined,
    })
    canvas.add(t)
    canvas.setActiveObject(t)
    canvas.renderAll()
  }

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canvas || !e.target.files?.[0]) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.src = reader.result as string
      img.onload = () => {
        const fabImg = new fabric.Image(img, { left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 })
        canvas.add(fabImg)
        canvas.setActiveObject(fabImg)
        canvas.renderAll()
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = () => {
    if (canvas && selectedObject) {
      canvas.remove(selectedObject)
      setSelectedObject(null)
      canvas.renderAll()
    }
  }

  const handleExportPrintQuality = () => {
    if (!canvas) return
    const dpi = 300
    const base = BASE_SIZES[posterSize]
    const { w, h } =
      orientation === "portrait" ? { w: base.w, h: base.h } : { w: base.h, h: base.w }

    // Convert px → inches (Fabric default ~96 PPI)
    const pxPerInch = 96
    const scale = (dpi / pxPerInch)

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: scale,
    })

    const link = document.createElement("a")
    link.download = `poster_${posterSize}_${dpi}dpi.png`
    link.href = dataUrl
    link.click()
  }

  // 🆕 Rounded corners for images (clipPath)
  const handleApplyRounding = () => {
    if (selectedObject && selectedObject.type === "image") {
      const img = selectedObject as fabric.Image

      // clipPath must be in image's coordinate space
      const rect = new fabric.Rect({
        width: (img.width || 0),
        height: (img.height || 0),
        rx: cornerRadius,
        ry: cornerRadius,
        originX: "center",
        originY: "center",
      })
      img.set("clipPath", rect)
      canvas?.renderAll()
    }
  }

  // 🆕 Rounded corners for text boxes
  const handleApplyTextRounding = () => {
    if (selectedObject && selectedObject.type === "textbox") {
      const tb = selectedObject as fabric.Textbox

      const rect = new fabric.Rect({
        width: tb.getScaledWidth() / (tb.scaleX || 1),
        height: tb.getScaledHeight() / (tb.scaleY || 1),
        rx: textCornerRadius,
        ry: textCornerRadius,
        originX: "center",
        originY: "center",
      })

      tb.set("clipPath", rect)
      canvas?.renderAll()
    }
  }

  // 🆕 Cropping (via clipping)
  const handleCropStart = () => {
    if (!canvas || !selectedObject || selectedObject.type !== "image") return
    setIsCropping(true)

    const img = selectedObject as fabric.Image
    // create a temp rect on top of image
    const rect = new fabric.Rect({
      left: img.left,
      top: img.top,
      width: 150,
      height: 150,
      fill: "rgba(255,255,255,0.2)",
      stroke: "red",
      strokeDashArray: [5, 5],
      selectable: true,
      hasBorders: true,
      hasControls: true,
      name: "__cropRect",
    })

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
    setCropRectId((rect as any).id || "__cropRect")
  }

  const handleCropApply = () => {
    if (!canvas || !selectedObject || selectedObject.type !== "image") return

    // ✅ Find the crop rectangle first
    const cropRect = canvas.getObjects().find(
      (obj) => obj.type === "rect" && (obj as any).name === "__cropRect"
    ) as fabric.Rect | undefined

    // ✅ If not found, exit
    if (!cropRect) {
      setIsCropping(false)
      return
    }

    const img = selectedObject as fabric.Image

    // ✅ Convert canvas rect (absolute) -> image local coords
    const imgLeft = img.left || 0
    const imgTop = img.top || 0
    const imgScaleX = img.scaleX || 1
    const imgScaleY = img.scaleY || 1

    const rectLeftCanvas = cropRect.left || 0
    const rectTopCanvas = cropRect.top || 0
    const rectWidthCanvas = cropRect.width! * (cropRect.scaleX || 1)
    const rectHeightCanvas = cropRect.height! * (cropRect.scaleY || 1)

    // ✅ Position of rect relative to image (in image's unscaled space)
    const relLeft = (rectLeftCanvas - imgLeft) / imgScaleX
    const relTop = (rectTopCanvas - imgTop) / imgScaleY
    const relWidth = rectWidthCanvas / imgScaleX
    const relHeight = rectHeightCanvas / imgScaleY

    const clipRect = new fabric.Rect({
      left: relLeft,
      top: relTop,
      width: relWidth,
      height: relHeight,
      originX: "left",
      originY: "top",
    })

    // ✅ Apply crop and clean up
    img.set("clipPath", clipRect)
    canvas.remove(cropRect)
    canvas.setActiveObject(img)
    canvas.renderAll()
    setIsCropping(false)
    setCropRectId(null)
  }

  const { w, h } = getCanvasDimensions()

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 lg:p-8 flex flex-col">
      <div className="flex flex-col lg:flex-row flex-1 gap-4 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Canvas Area */}
        <div
          ref={containerRef}
          className="flex-1 bg-slate-900 border border-slate-700 rounded p-4 flex items-center justify-center overflow-auto"
        >
          <canvas
            ref={canvasRef}
            width={w}
            height={h}
            className="border border-slate-800 rounded shadow-lg block"
          />
        </div>

        {/* Sidebar */}
        <aside
          className="
    w-[300px] 
    h-[calc(100vh-6rem)] 
    flex-shrink-0 
    bg-slate-900 
    border border-slate-700 
    rounded 
    p-4 
    flex flex-col 
    overflow-y-auto
  "
        >
          <div className="sticky top-0 bg-slate-900 pb-3 z-10">
            <h2 className="font-semibold text-lg">Controls</h2>
          </div>

          <Label>Poster Size</Label>
          <select
            value={posterSize}
            onChange={(e) => setPosterSize(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-white rounded p-2 mb-3 mt-3"
          >
            {Object.entries(BASE_SIZES).map(([key]) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>

          <Label>Orientation</Label>
          <select
            value={orientation}
            onChange={(e) => setOrientation(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-600 text-white rounded p-2 mb-3 mt-3"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 mb-3"
            onClick={handleAddText}
          >
            ➕ Add Text
          </Button>

          <div className="mb-3">
            <Label htmlFor="upload">Upload Image</Label>
            <Input id="upload" type="file" accept="image/*" onChange={handleUploadImage} />
          </div>

          {/* Text editing controls */}
          {selectedObject && selectedObject.type === "textbox" ? (
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <Label>Edit Text</Label>
              <Input
                value={(selectedObject as fabric.Textbox).text || ""}
                onChange={(e) => updateSelected("text", e.target.value)}
              />

              <div className="flex gap-2">
                <Button
                  variant={fontWeight === "bold" ? "default" : "outline"}
                  className="w-1/3 font-bold"
                  onClick={() => {
                    const val = fontWeight === "bold" ? "normal" : "bold"
                    setFontWeight(val)
                    updateSelected("fontWeight", val)
                  }}
                >
                  B
                </Button>
                <Button
                  variant={fontStyle === "italic" ? "default" : "outline"}
                  className="w-1/3 italic"
                  onClick={() => {
                    const val = fontStyle === "italic" ? "normal" : "italic"
                    setFontStyle(val)
                    updateSelected("fontStyle", val)
                  }}
                >
                  I
                </Button>
                <Button
                  variant={underline ? "default" : "outline"}
                  className="w-1/3 underline"
                  onClick={() => {
                    const val = !underline
                    setUnderline(val)
                    updateSelected("underline", val)
                  }}
                >
                  U
                </Button>
              </div>

              <Label>Font Color</Label>
              <Input
                type="color"
                value={fontColor}
                onChange={(e) => {
                  setFontColor(e.target.value)
                  updateSelected("fill", e.target.value)
                }}
              />

              <Label>Stroke Color</Label>
              <Input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  setStrokeColor(e.target.value)
                  updateSelected("stroke", e.target.value)
                }}
              />

              <Label>Stroke Width</Label>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={strokeWidth}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setStrokeWidth(val)
                  updateSelected("strokeWidth", val)
                }}
                className="w-full accent-blue-500"
              />

              <Label>Shadow Blur</Label>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={shadowBlur}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setShadowBlur(val)
                  updateSelected(
                    "shadow",
                    val ? new fabric.Shadow({ color: shadowColor, blur: val }) : undefined
                  )
                }}
                className="w-full accent-blue-500"
              />

              <Label>Shadow Color</Label>
              <Input
                type="color"
                value={shadowColor}
                onChange={(e) => {
                  setShadowColor(e.target.value)
                  updateSelected(
                    "shadow",
                    shadowBlur
                      ? new fabric.Shadow({ color: e.target.value, blur: shadowBlur })
                      : undefined
                  )
                }}
              />

              <Label>Background Color</Label>
              <Input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value)
                  updateSelected("backgroundColor", `rgba(${hexToRgb(e.target.value)},${bgOpacity})`)
                }}
              />

              <Label>Background Opacity</Label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={bgOpacity}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setBgOpacity(val)
                  updateSelected("backgroundColor", `rgba(${hexToRgb(bgColor)},${val})`)
                }}
                className="w-full accent-blue-500"
              />

              <Label>Font Size</Label>
              <input
                type="range"
                min={8}
                max={80}
                step={1}
                value={fontSize}
                onChange={(e) => {
                  const s = Number(e.target.value)
                  setFontSize(s)
                  updateSelected("fontSize", s)
                }}
                className="w-full accent-blue-500"
              />

              <Label>Text Align</Label>
              <select
                value={textAlign}
                onChange={(e) => {
                  const v = e.target.value as any
                  setTextAlign(v)
                  updateSelected("textAlign", v)
                }}
                className="w-full bg-slate-800 border border-slate-600 text-white rounded p-2"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>

              {/* 🆕 Text rounding controls */}
              <Label className="mt-2">Text Corner Radius</Label>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={textCornerRadius}
                onChange={(e) => setTextCornerRadius(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <Button className="w-full" onClick={handleApplyTextRounding}>
                Apply Text Rounding
              </Button>
            </div>
          ) : (
            <p className="text-slate-400 text-sm italic mt-2">Select a text box to edit</p>
          )}

          {/* 🆕 Image Controls */}
          <div className="pt-4 border-t border-slate-700 space-y-2">
            <h3 className="font-semibold text-md mt-3">Image Controls</h3>

            {selectedObject && selectedObject.type === "image" ? (
              <>
                <Label>Corner Radius</Label>
                <input
                  type="range"
                  min={0}
                  max={120}
                  step={1}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
                <Button className="w-full" onClick={handleApplyRounding}>
                  Apply Image Rounding
                </Button>

                {!isCropping ? (
                  <Button
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    onClick={handleCropStart}
                  >
                    ✂ Start Cropping
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleCropApply}
                  >
                    ✅ Apply Crop (Clip)
                  </Button>
                )}
              </>
            ) : (
              <p className="text-slate-400 text-sm italic">Select an image to edit</p>
            )}
          </div>

          <div className="pt-4 border-t border-slate-700 space-y-2">
            <Button className="w-full" onClick={bringFront}>
              Bring to Front
            </Button>
            <Button className="w-full" onClick={sendBack}>
              Send to Back
            </Button>
            <div className="flex gap-2">
              <Button className="w-1/2" onClick={flipHorizontal}>
                Flip H
              </Button>
              <Button className="w-1/2" onClick={flipVertical}>
                Flip V
              </Button>
            </div>
            <Button
              className="w-full bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              🗑 Delete
            </Button>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-6 max-w-7xl mx-auto w-full">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-slate-600 text-white hover:bg-slate-700"
        >
          Back
        </Button>
        <Button
          onClick={handleExportPrintQuality}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Export PNG
        </Button>
      </div>
    </div>
  )
}

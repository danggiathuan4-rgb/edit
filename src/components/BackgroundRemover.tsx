/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { 
  Upload, Sparkles, RefreshCw, Download, Image as ImageIcon, 
  Trash2, HelpCircle, Eye, Sliders, Play, Brush, Eraser, 
  Maximize2, Check, Info, Palette
} from "lucide-react";

// Types
import { PresetBackground } from "../types";

// Standard royalty-free/easy Unsplash asset endpoints for background testing:
const PRESETS: PresetBackground[] = [
  { id: "trans", name: "Trong suốt", url: "", type: "gradient" },
  { id: "bg-white", name: "Trắng Studio", url: "#FFFFFF", type: "color" },
  { id: "bg-grey", name: "Xám Hi-Tech", url: "#E2E8F0", type: "color" },
  { id: "sunset", name: "Bình Minh Thơ Mộng", url: "linear-gradient(135deg, #fce38a, #f38181)", type: "gradient" },
  { id: "aurora", name: "Cực Quang Huyền Diệu", url: "linear-gradient(135deg, #0575e6, #00f260)", type: "gradient" },
  { id: "cyber", name: "Cyberpunk Glow", url: "linear-gradient(135deg, #8a2387, #e94057, #f27121)", type: "gradient" },
  { id: "scenery-office", name: "Văn Phòng Hiện Đại", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80", type: "scenery" },
  { id: "scenery-nature", name: "Rừng Thưa Sương Mù", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80", type: "scenery" },
];

const PRESET_SAMPLES = [
  {
    id: "sample-obj",
    name: "Sản phẩm (Bình giữ nhiệt trên nền trắng)",
    url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
    desc: "Nền trắng studio đồng nhất, lý tưởng để thử tách nền tự động"
  },
  {
    id: "sample-flower",
    name: "Đồ vật (Chậu cây cảnh nhỏ)",
    url: "https://images.unsplash.com/photo-1485955900006-10f5d324726e?auto=format&fit=crop&w=600&q=80",
    desc: "Đặc điểm chi tiết phức tạp ở rìa lá cây"
  },
  {
    id: "sample-portrait",
    name: "Chân dung (Mẫu tạo dáng trên phông xanh)",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    desc: "Mẫu người với chi tiết tóc tinh xảo trên phông sẫm màu"
  }
];

export default function BackgroundRemover() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  // Canvas configuration
  const [tolerance, setTolerance] = useState<number>(30);
  const [edgeSoftness, setEdgeSoftness] = useState<number>(3);
  const [autoDetectMode, setAutoDetectMode] = useState<boolean>(true);
  const [transparentColor, setTransparentColor] = useState<{r: number, g: number, b: number} | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<PresetBackground>(PRESETS[0]);
  const [customBgColor, setCustomBgColor] = useState<string>("#e0f2fe");
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);

  // Brush settings
  const [brushMode, setBrushMode] = useState<"paint" | "erase" | null>(null);
  const [brushSize, setBrushSize] = useState<number>(25);
  const [brushSoftness, setBrushSoftness] = useState<number>(20);

  // Server-side AI assist states
  const [loadingAiBg, setLoadingAiBg] = useState(false);
  const [aiBgPrompt, setAiBgPrompt] = useState("");
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [generatingTips, setGeneratingTips] = useState(false);

  // References
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null); // Keeps track of transparent pixels
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  // Store original image dimensions
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });
  const [isDrawing, setIsDrawing] = useState(false);

  // Set sample image
  const loadSample = (url: string, name: string) => {
    setLoading(true);
    setTransparentColor(null);
    setBrushMode(null);
    setCustomBgUrl(null);
    setSelectedBackground(PRESETS[0]);
    setAiTips([]);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
      setFileName(name);
      
      // Initialize layout canvas
      initCanvasInstances(img);
      setLoading(false);
    };
    img.onerror = () => {
      alert("Không thể tải ảnh mẫu này do lỗi bảo mật CORS hoặc mạng. Bạn hãy tải ảnh cá nhân từ thiết bị.");
      setLoading(false);
    };
    // Append timestamp to avoid CORS cache issues
    img.src = url + (url.includes("?") ? "&" : "?") + "not-cached=" + Date.now();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setLoading(true);
    setTransparentColor(null);
    setBrushMode(null);
    setCustomBgUrl(null);
    setSelectedBackground(PRESETS[0]);
    setAiTips([]);

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
        initCanvasInstances(img);
        setLoading(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Setup both canvas stores
  const initCanvasInstances = (img: HTMLImageElement) => {
    setImageSrc(img.src);

    const origCanvas = originalCanvasRef.current;
    const viewCanvas = viewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!origCanvas || !viewCanvas || !maskCanvas) return;

    // Set matching dimensions
    origCanvas.width = img.naturalWidth;
    origCanvas.height = img.naturalHeight;
    viewCanvas.width = img.naturalWidth;
    viewCanvas.height = img.naturalHeight;
    maskCanvas.width = img.naturalWidth;
    maskCanvas.height = img.naturalHeight;

    const origCtx = origCanvas.getContext("2d");
    const viewCtx = viewCanvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    if (!origCtx || !viewCtx || !maskCtx) return;

    // Write primary source
    origCtx.drawImage(img, 0, 0);
    viewCtx.drawImage(img, 0, 0);

    // Initial mask canvas is solid white (fully visible)
    maskCtx.fillStyle = "#ffffff";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Attempt smart default detect: corner color sampling
    try {
      const imgData = origCtx.getImageData(0, 0, origCanvas.width, origCanvas.height);
      const data = imgData.data;
      // Let's sample a few edge pixels: top-left, top-right, bottom-left
      const getPixel = (x: number, y: number) => {
        const idx = (y * origCanvas.width + x) * 4;
        return { r: data[idx], g: data[idx+1], b: data[idx+2] };
      };
      const tl = getPixel(5, 5);
      const tr = getPixel(origCanvas.width - 5, 5);
      const bl = getPixel(5, origCanvas.height - 5);

      // If they are closely similar, set as default translucent color sample
      const avgR = Math.round((tl.r + tr.r + bl.r) / 3);
      const avgG = Math.round((tl.g + tr.g + bl.g) / 3);
      const avgB = Math.round((tl.b + tr.b + bl.b) / 3);
      
      setTransparentColor({ r: avgR, g: avgG, b: avgB });
    } catch (e) {
      // Default fallback
      setTransparentColor({ r: 255, g: 255, b: 255 });
    }
  };

  // Re-run background chroma removal whenever parameters update
  useEffect(() => {
    if (!imageSrc) return;
    renderCompositeOutput();
  }, [tolerance, edgeSoftness, transparentColor, selectedBackground, customBgColor, customBgUrl, imageSrc]);

  // Compute composite rendering of Transparent Subject + Background + Manual Eraser mask
  const renderCompositeOutput = () => {
    const origCanvas = originalCanvasRef.current;
    const viewCanvas = viewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;

    if (!origCanvas || !viewCanvas || !maskCanvas) return;

    const w = origCanvas.width;
    const h = origCanvas.height;

    const origCtx = origCanvas.getContext("2d");
    const viewCtx = viewCanvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    if (!origCtx || !viewCtx || !maskCtx) return;

    // 1. Get raw base photo pixel data
    const sourceData = origCtx.getImageData(0, 0, w, h);
    const sourceArr = sourceData.data;

    // 2. Get manual slider/mask eraser matrix data
    const maskData = maskCtx.getImageData(0, 0, w, h);
    const maskArr = maskData.data;

    // Create container output buffer
    const outputData = viewCtx.createImageData(w, h);
    const outArr = outputData.data;

    // Fast pixel color extractor parameters
    const key = transparentColor;
    const tolSq = tolerance * tolerance;

    for (let i = 0; i < sourceArr.length; i += 4) {
      const r = sourceArr[i];
      const g = sourceArr[i + 1];
      const b = sourceArr[i + 2];
      const a = sourceArr[i + 3];

      // Original opacity starts high
      let opacity = a;

      // Calculate distance if key color mapped
      if (key) {
        const dr = r - key.r;
        const dg = g - key.g;
        const db = b - key.b;
        const distSq = (dr * dr + dg * dg + db * db) / 3;

        if (distSq < tolSq) {
          // Inside tolerance: transparent
          opacity = 0;
        } else if (edgeSoftness > 0) {
          // Feathered blending boundary
          const margin = tolerance * (1 + edgeSoftness / 10);
          const marginSq = margin * margin;
          if (distSq < marginSq) {
            const factor = (distSq - tolSq) / (marginSq - tolSq);
            opacity = Math.min(opacity, Math.round(a * factor));
          }
        }
      }

      // Multiply by manual brush mask (which ranges from black 0 to white 255)
      const brushVal = maskArr[i] / 255; // Using Red channel of mask as alpha scale
      opacity = Math.round(opacity * brushVal);

      outArr[i] = r;
      outArr[i + 1] = g;
      outArr[i + 2] = b;
      outArr[i + 3] = opacity;
    }

    // Now, render beautiful merged canvas layers!
    // Clear canvas
    viewCtx.clearRect(0, 0, w, h);

    // Apply Chosen Background Layer
    if (selectedBackground.id !== "trans") {
      viewCtx.save();
      if (selectedBackground.type === "color") {
        viewCtx.fillStyle = selectedBackground.url;
        viewCtx.fillRect(0, 0, w, h);
      } else if (selectedBackground.id === "bg-custom-color") {
        viewCtx.fillStyle = customBgColor;
        viewCtx.fillRect(0, 0, w, h);
      } else if (selectedBackground.type === "gradient") {
        // Simple mock gradient
        const grad = viewCtx.createLinearGradient(0, 0, w, h);
        if (selectedBackground.id === "sunset") {
          grad.addColorStop(0, "#fce38a");
          grad.addColorStop(1, "#f38181");
        } else if (selectedBackground.id === "aurora") {
          grad.addColorStop(0, "#0575e6");
          grad.addColorStop(1, "#00f260");
        } else {
          grad.addColorStop(0, "#8a2387");
          grad.addColorStop(1, "#f27121");
        }
        viewCtx.fillStyle = grad;
        viewCtx.fillRect(0, 0, w, h);
      } else if (selectedBackground.type === "scenery" || selectedBackground.id === "bg-custom-image") {
        const bgImgUrl = selectedBackground.id === "bg-custom-image" ? customBgUrl : selectedBackground.url;
        if (bgImgUrl) {
          const bgImg = new Image();
          bgImg.crossOrigin = "anonymous";
          bgImg.onload = () => {
            // Draw matching aspect cover
            const scale = Math.max(w / bgImg.width, h / bgImg.height);
            const xOffset = (w - bgImg.width * scale) / 2;
            const yOffset = (h - bgImg.height * scale) / 2;
            viewCtx.drawImage(bgImg, xOffset, yOffset, bgImg.width * scale, bgImg.height * scale);
            
            // Draw subject layer on top of background
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = w;
            tempCanvas.height = h;
            const tempCtx = tempCanvas.getContext("2d");
            if (tempCtx) {
              tempCtx.putImageData(outputData, 0, 0);
              viewCtx.drawImage(tempCanvas, 0, 0);
            }
          };
          bgImg.src = bgImgUrl;
          viewCtx.restore();
          return; // The image onload will handle standard drawing callback
        }
      }
      viewCtx.restore();
    }

    // Write isolated translucent layer
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.putImageData(outputData, 0, 0);
      viewCtx.drawImage(tempCanvas, 0, 0);
    }
  };

  // Interactive Color Color Picker sampling by directly clicking coordinates on the active preview image
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (brushMode) return; // Ignore color selection if currently using brush tool
    
    const canvas = viewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    const origCanvas = originalCanvasRef.current;
    if (!origCanvas) return;
    const ctx = origCanvas.getContext("2d");
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      setTransparentColor({ r: pixel[0], g: pixel[1], b: pixel[2] });
    } catch (err) {
      console.error("Error sampling coordinate background color:", err);
    }
  };

  // Brush drawing helpers
  const handleBrushStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!brushMode) return;
    setIsDrawing(true);
    drawBrushStroke(e);
  };

  const handleBrushMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    drawBrushStroke(e);
  };

  const handleBrushEnd = () => {
    if (isDrawing) {
      setIsDrawing(false);
      renderCompositeOutput();
    }
  };

  const drawBrushStroke = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = viewCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!canvas || !maskCanvas || !brushMode) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * maskCanvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * maskCanvas.height;

    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    
    // Set softness using radial visual gradients
    const grad = ctx.createRadialGradient(x, y, brushSize / 6, x, y, brushSize);
    
    if (brushMode === "erase") {
      // Black in mask layer acts as transparency in final output
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = "destination-out"; // Delete visible mask parts
    } else {
      // Solid white restores subject visibility
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.globalCompositeOperation = "source-over"; // Draw visible mask parts back
    }

    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Fast-preview trace directly on the client canvas so the user gets instant visual loop
    renderCompositeOutput();
  };

  // Reset all manual brush mask changes
  const handleResetMask = () => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    renderCompositeOutput();
  };

  // Trigger Gemini-powered expand prompts
  const handleAiSuggestBackground = async () => {
    if (!aiBgPrompt) return;
    setLoadingAiBg(true);
    try {
      const response = await fetch("/api/generate-bg-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiBgPrompt })
      });
      const data = await response.json();
      if (data.expanded) {
        setAiBgPrompt(data.expanded);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e: any) {
      alert("Không kết nối được server AI: " + e.message);
    } finally {
      setLoadingAiBg(false);
    }
  };

  // Trigger Gemini photo analysis advice
  const triggerAiEditingTips = async () => {
    if (!imageSrc) return;
    setGeneratingTips(true);
    try {
      const response = await fetch("/api/image-editing-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          image: imageSrc,
          mimeType: "image/png" 
        })
      });
      const data = await response.json();
      if (data.tips) {
        const list = data.tips
          .split("\n")
          .map((line: string) => line.replace(/^[•\-\*\d\.\s]+/, "").trim())
          .filter((line: string) => line.length > 0);
        setAiTips(list);
      } else if (data.error) {
        alert(data.error);
      }
    } catch (e: any) {
      setAiTips([
        "Không thể gửi yêu cầu đến server AI.",
        "Mách bạn: Tẩy và xóa nền thủ công sẽ xóa được góc nhỏ.",
        "Sử dụng cọ tẩy kích thước nhỏ cạnh chủ thể để nét cắt mịn màng hơn."
      ]);
    } finally {
      setGeneratingTips(false);
    }
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setCustomBgUrl(url);
      setSelectedBackground({ id: "bg-custom-image", name: "Ảnh tự chọn", url: url, type: "scenery" });
    };
    reader.readAsDataURL(file);
  };

  // One-click Transparent PNG Download (Preserving high resolution uploaded dimensions!)
  const handleDownloadResult = () => {
    const viewCanvas = viewCanvasRef.current;
    if (!viewCanvas) return;

    // Direct canvas download
    const link = document.createElement("a");
    link.download = fileName.replace(/\.[^/.]+$/, "") + "_no_bg.png";
    link.href = viewCanvas.toDataURL("image/png");
    link.click();
  };

  // Preset quick filters
  const applyGrayPreset = () => {
    setTransparentColor({ r: 247, g: 247, b: 247 });
    setTolerance(20);
  };

  const applyGreenPreset = () => {
    setTransparentColor({ r: 0, g: 177, b: 64 });
    setTolerance(35);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="bg-remover-module">
      
      {/* 1. Left controls panel */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
        
        {/* Upload module */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-500" />
              Tải ảnh lên
            </h3>
            {imageSrc && (
              <button 
                onClick={() => {
                  setImageSrc(null);
                  setFileName("");
                }}
                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
              </button>
            )}
          </div>

          {!imageSrc ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-sky-50/20 group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="bg-white group-hover:scale-110 p-4 rounded-full shadow-sm max-w-fit mx-auto mb-3 transition">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-sky-500" />
              </div>
              <p className="font-medium text-slate-700 text-sm">
                Kéo thả ảnh hoặc chọn từ máy
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hỗ trợ PNG, JPG, JPEG, WEBP.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-700 font-medium truncate max-w-[180px]">
                  {fileName}
                </span>
              </div>
              <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                {imgDim.w}x{imgDim.h}
              </span>
            </div>
          )}

          {/* Preset image templates to test immediately */}
          {!imageSrc && (
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Thử nhanh với ảnh mẫu:
              </p>
              <div className="grid grid-cols-1 gap-2">
                {PRESET_SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => loadSample(sample.url, sample.name)}
                    disabled={loading}
                    className="flex text-left items-center gap-3 p-2 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 transition cursor-pointer disabled:opacity-50"
                  >
                    <img 
                      src={sample.url} 
                      alt="" 
                      className="w-10 h-10 object-cover rounded bg-slate-100 border border-slate-200 shrink-0" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{sample.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{sample.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Background removal controls */}
        {imageSrc && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            <h3 className="font-semibold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              Chỉnh tách nền AI & Canvas
            </h3>

            {/* Click explanation helper banner */}
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/50 flex gap-2">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-900 leading-relaxed">
                Nhấp chuột vào <strong>phần màu nền bất kỳ</strong> trên bức ảnh để bắt đầu xóa khoảng màu đó tự động!
              </p>
            </div>

            {/* Quick preset filters */}
            <div className="space-y-2">
              <span className="text-xs font-medium text-slate-500">Màu nền phổ biến nhanh:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyGrayPreset}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer transition"
                >
                  Phông xám tủ/studio
                </button>
                <button
                  type="button"
                  onClick={applyGreenPreset}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium border border-emerald-200 cursor-pointer transition"
                >
                  Xanh lá (Chroma-key)
                </button>
              </div>
            </div>

            {/* Tolerance slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Sai số tách màu (Tolerance)</span>
                <span className="font-mono text-emerald-600 font-semibold">{tolerance}</span>
              </div>
              <input 
                type="range"
                min="1"
                max="120"
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
              />
              <p className="text-[10px] text-slate-400">Tăng lên để xóa nhiều dải màu tương tự nền hơn.</p>
            </div>

            {/* Hand details / Brush eraser details */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-xs font-medium text-slate-700">
                <span>Làm mềm rìa (Feather edges)</span>
                <span className="font-mono text-emerald-600 font-semibold">{edgeSoftness}px</span>
              </div>
              <input 
                type="range"
                min="0"
                max="20"
                value={edgeSoftness}
                onChange={(e) => setEdgeSoftness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
              />
            </div>
            
            {/* Fine refinement Brush Tools */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Cọ tinh chỉnh thủ công:</span>
                {brushMode && (
                  <button 
                    onClick={handleResetMask}
                    className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
                  >
                    Khôi phục gốc
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBrushMode(null)}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border cursor-pointer transition py-2 ${
                    brushMode === null 
                      ? "bg-slate-900 text-white border-slate-950 shadow-sm" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 mx-auto mb-1" />
                  Mặc định
                </button>
                <button
                  type="button"
                  onClick={() => setBrushMode("erase")}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border cursor-pointer transition py-2 ${
                    brushMode === "erase" 
                      ? "bg-red-600 text-white border-red-700 shadow-sm" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5 mx-auto mb-1" />
                  Cọ Xóa
                </button>
                <button
                  type="button"
                  onClick={() => setBrushMode("paint")}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border cursor-pointer transition py-2 ${
                    brushMode === "paint" 
                      ? "bg-emerald-600 text-white border-emerald-700 shadow-sm" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Brush className="w-3.5 h-3.5 mx-auto mb-1" />
                  Cọ Vẽ Lại
                </button>
              </div>

              {brushMode && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Kích thước cọ</span>
                    <span className="font-mono">{brushSize}px</span>
                  </div>
                  <input 
                    type="range"
                    min="5"
                    max="100"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1 bg-slate-200 rounded accent-slate-800 cursor-pointer" 
                  />
                  <p className="text-[10px] text-slate-400">Rê chuột vẽ trực tiếp lên ảnh để xóa góc nhỏ hoặc khôi phục.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. Middle Preview Area */}
      <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
        <div className="bg-slate-900 rounded-3xl p-4 border border-slate-950 flex flex-col justify-center items-center min-h-[420px] relative overflow-hidden group">
          {loading && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center z-20 text-white space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm font-medium">Đang tải và xử lý hình ảnh...</p>
            </div>
          )}

          {!imageSrc ? (
            <div className="text-slate-400 text-center py-10">
              <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-sm">Hãy tải ảnh hoặc chọn một mẫu bên trái để chỉnh tách nền</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              {/* Invisible support canvases */}
              <canvas ref={originalCanvasRef} className="hidden" />
              <canvas ref={maskCanvasRef} className="hidden" />

              {/* Main Interactive render canvas */}
              <div className="relative max-w-full max-h-[450px] overflow-auto rounded-lg border border-slate-800 shadow-2xl bg-slate-950">
                {/* Transparent grid backdrop indicator */}
                <div 
                  className="absolute inset-0 bg-[linear-gradient(45deg,#2e2e2e_25%,transparent_25%),linear-gradient(-45deg,#2e2e2e_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#2e2e2e_75%),linear-gradient(-45deg,transparent_75%,#2e2e2e_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px]"
                />
                
                <canvas 
                  ref={viewCanvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleBrushStart}
                  onMouseMove={handleBrushMove}
                  onMouseUp={handleBrushEnd}
                  onMouseLeave={handleBrushEnd}
                  className={`relative z-10 block max-h-[420px] object-contain cursor-crosshair max-w-full ${brushMode ? 'pointer-events-auto' : ''}`}
                  title={brushMode ? "Kéo vẽ để sửa đổi" : "Nhấp để xóa màu này"}
                />
              </div>

              {/* Reset to see coordinates indicator */}
              <div className="mt-3 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Kiểm tra chính xác phông tách trên nền caro trong suốt.</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. New Background Customization Panels */}
        {imageSrc && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Palette className="w-4 h-4 text-sky-500" />
              Thay thế phông nền mới
            </h3>
            
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedBackground(preset)}
                  className={`p-1.5 rounded-lg border transition text-center cursor-pointer flex flex-col justify-center items-center ${
                    selectedBackground.id === preset.id 
                    ? "border-sky-500 bg-sky-50/20 shadow-xs" 
                    : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {preset.id === "trans" ? (
                    <div className="w-8 h-8 rounded border border-slate-300 bg-[linear-gradient(45deg,#e2e2e2_25%,transparent_25%),linear-gradient(-45deg,#e2e2e2_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#e2e2e2_75%),linear-gradient(-45deg,transparent_75%,#e2e2e2_75%)] bg-[size:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0px]" />
                  ) : preset.type === "color" ? (
                    <div className="w-8 h-8 rounded border border-slate-300" style={{ backgroundColor: preset.url }} />
                  ) : preset.type === "gradient" ? (
                    <div className="w-8 h-8 rounded border border-slate-300" style={{ backgroundImage: preset.url }} />
                  ) : (
                    <img src={preset.url} alt="" className="w-8 h-8 object-cover rounded border border-slate-300" />
                  )}
                  <span className="text-[9px] text-slate-600 mt-1 font-medium truncate max-w-full">
                    {preset.name}
                  </span>
                </button>
              ))}

              {/* custom color block */}
              <button
                onClick={() => {
                  setSelectedBackground({ id: "bg-custom-color", name: "Màu tự chọn", url: customBgColor, type: "color" });
                }}
                className={`p-1.5 rounded-lg border transition text-center cursor-pointer flex flex-col justify-center items-center ${
                  selectedBackground.id === "bg-custom-color" 
                  ? "border-sky-500 bg-sky-50/20" 
                  : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input 
                  type="color" 
                  value={customBgColor} 
                  onChange={(e) => {
                    setCustomBgColor(e.target.value);
                    setSelectedBackground({ id: "bg-custom-color", name: "Màu tự chọn", url: e.target.value, type: "color" });
                  }}
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0 bg-transparent"
                />
                <span className="text-[9px] text-slate-600 mt-1 font-medium truncate">Màu riêng</span>
              </button>

              {/* upload wallpaper block */}
              <button
                onClick={() => bgFileInputRef.current?.click()}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-center cursor-pointer flex flex-col justify-center items-center"
              >
                <input 
                  type="file" 
                  ref={bgFileInputRef}
                  onChange={handleCustomBgUpload}
                  accept="image/*"
                  className="hidden" 
                />
                <div className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-[9px] text-slate-600 mt-1 font-medium truncate">Ảnh nền riêng</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right AI Assistant & Export Panel */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Gemini intelligent tips for image editing */}
        {imageSrc && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
              Mẹo Cắt Ghép Ảnh AI
            </h3>

            {aiTips.length === 0 ? (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-slate-500">Gặp khó khăn khi tách các chi tiết khó? Hãy nhận tư vấn trực tiếp từ AI thế hệ mới!</p>
                <button
                  type="button"
                  onClick={triggerAiEditingTips}
                  disabled={generatingTips}
                  className="bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-2 w-full transition cursor-pointer disabled:opacity-50"
                >
                  {generatingTips ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang phân tích nét ảnh...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Gợi Ý Mẹo Chỉnh Ảnh AI
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2.5">
                  {aiTips.map((tip, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-xs text-slate-700">
                      <span className="bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed font-medium">{tip}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setAiTips([])}
                  className="text-[10px] text-slate-400 hover:text-slate-600 block text-center w-full mt-2"
                >
                  Ẩn tư vấn
                </button>
              </div>
            )}
          </div>
        )}

        {/* AI Background suggest helpers */}
        {imageSrc && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
              Khơi nguồn ảnh nền sáng tạo
            </h3>
            <p className="text-xs text-slate-500">Bí ý tưởng thiết kế? Gõ mô tả tiếng Việt, AI sẽ dịch thuật và mở rộng thành phong cách chụp Studio chi tiết cho phông nền của bạn:</p>
            
            <div className="space-y-2">
              <textarea
                value={aiBgPrompt}
                onChange={(e) => setAiBgPrompt(e.target.value)}
                placeholder="Ví dụ: bãi biển lúc hoàng hôn, văn phòng làm việc sang trọng..."
                rows={3}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-sky-500 bg-slate-50 focus:bg-white transition"
              />
              <button
                type="button"
                onClick={handleAiSuggestBackground}
                disabled={loadingAiBg || !aiBgPrompt}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              >
                {loadingAiBg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-violet-500" />}
                Dịch & Tạo Lời Gợi ý Background
              </button>
            </div>
          </div>
        )}

        {/* Actions Export panel */}
        {imageSrc && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 text-emerald-400">
                <Download className="w-4 h-4" /> Xuất ảnh tách nền
              </h3>
              <p className="text-xs text-slate-300 leading-normal">
                Xuất ảnh chất lượng cao vẹn nguyên độ phân giải thiết bị với định dạng PNG trong suốt hoặc ghép nền hoàn chỉnh.
              </p>
            </div>

            <button
              onClick={handleDownloadResult}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-emerald-500/20 transition-all text-sm"
            >
              <Download className="w-4 h-4" />
              Tải ảnh ngay (Mã PNG)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

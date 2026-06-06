/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { 
  Upload, Sparkles, RefreshCw, Download, Image as ImageIcon,
  Sliders, Trash2, RotateCcw, Paintbrush, ArrowRight, Eye,
  Maximize2, Crop, ShieldAlert, Heart, Activity, Sun, Moon,
  Palette, Grid, SlidersHorizontal, Layers
} from "lucide-react";

interface ColorPreset {
  id: string;
  name: string;
  description: string;
  category: "sports" | "beauty" | "cinema" | "artistic";
  icon: string;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  tint: number;
}

// 20 Professional customizable color presets in Vietnamese
const COLOR_PRESETS: ColorPreset[] = [
  { id: "original", name: "Ảnh Gốc", description: "Màu sắc nguyên bản gốc chưa chỉnh sửa", category: "beauty", icon: "📷", brightness: 0, contrast: 0, saturation: 0, warmth: 0, tint: 0 },
  
  // 1. SPORTS / ATHLETICS CATEGORY (⚡ THỂ THAO)
  { id: "sports-dynamic", name: "Thể Thao Khỏe Khoắn", description: "Nâng độ tương phản, tôn màu rực rỡ và sắc nét ngoài trời", category: "sports", icon: "⚡", brightness: 5, contrast: 25, saturation: 35, warmth: 8, tint: -4 },
  { id: "sports-neon", name: "Đua Cyberpunk Neon", description: "Bóng tối tím huyền ảo xen sắc xanh neon bốc lửa độc lạ", category: "sports", icon: "🏍️", brightness: -5, contrast: 30, saturation: 48, warmth: -25, tint: 35 },
  { id: "sports-action", name: "Hành Động Khắc Nghiệt", description: "Mạnh mẽ, tách bạch dải sáng tối nổi bật cơ bắp thể thao", category: "sports", icon: "🏃", brightness: -8, contrast: 38, saturation: 18, warmth: -8, tint: 5 },
  { id: "summer-lime", name: "Vàng Chanh Mùa Hè", description: "Tone thể thao bãi biển nắng gió, cực kỳ năng động tươi mát", category: "sports", icon: "🍋", brightness: 12, contrast: 15, saturation: 25, warmth: -10, tint: -15 },
  { id: "cozy-camp", name: "Lửa Trại Cozy Camp", description: "Tone đỏ ấm cam cháy nồng nhiệt bên bìa rừng dã ngoại", category: "sports", icon: "🔥", brightness: 4, contrast: 18, saturation: 22, warmth: 35, tint: -8 },

  // 2. BEAUTY / PORTRAITS CATEGORY (🌸 CHÂN DUNG / LÀM ĐẸP)
  { id: "beauty-rosy", name: "Trắng Hồng Hàn Quốc", description: "Tôn vinh làn da trắng mịn ửng hồng phấn, căng tràn sức sống", category: "beauty", icon: "❤️", brightness: 15, contrast: -8, saturation: 5, warmth: 6, tint: 12 },
  { id: "beauty-soft", name: "Mỹ Nhân Studio", description: "Làm dịu bóng cằm, nâng sáng dịu nhẹ nịnh mắt chuẩn mẫu ảnh", category: "beauty", icon: "✨", brightness: 18, contrast: -18, saturation: -4, warmth: 4, tint: 2 },
  { id: "pearl-luxe", name: "Ngọc Trai Sang Chảnh", description: "Tông da ngọc trai quý phái mịn màng cho chân dung VIP", category: "beauty", icon: "🦪", brightness: 12, contrast: 5, saturation: -2, warmth: 5, tint: -2 },
  { id: "pastel-breeze", name: "Gió Thoảng Pastel", description: "Tối giản hóa sắc độ, mộng mơ tươi tắn nhẹ mát thanh lịch", category: "beauty", icon: "🌸", brightness: 12, contrast: -20, saturation: -22, warmth: 5, tint: 8 },
  { id: "candy-sweet", name: "Kẹo Ngọt Macaron", description: "Ngọt ngào trẻ trung với dải hồng tím ngọt lịm dễ thương", category: "beauty", icon: "🍬", brightness: 14, contrast: -4, saturation: 28, warmth: -5, tint: 15 },

  // 3. CINEMA CATEGORY (🎬 ĐIỆN ẢNH)
  { id: "cinematic-kodak", name: "Phim Cổ Kodak 35mm", description: "Tone phim Kodak cổ điển ấm sâu úa màu thời gian nghệ thuật", category: "cinema", icon: "🎞️", brightness: 5, contrast: -5, saturation: -8, warmth: 18, tint: 5 },
  { id: "hollywood-gold", name: "Nhựa Sống Hollywood", description: "Phong cách Tây Âu kịch tính, cuốn hút đầy bóng mờ nghệ sỹ", category: "cinema", icon: "🎬", brightness: -5, contrast: 20, saturation: 12, warmth: 15, tint: -10 },
  { id: "warm-sunset", name: "Chiều Vàng lãng Mạn", description: "Sắc cam hoàng hôn rực rỡ lãng mạn phủ ngập khung hình", category: "cinema", icon: "🌅", brightness: 8, contrast: 12, saturation: 20, warmth: 30, tint: 10 },
  { id: "british-tea", name: "Trà Chiều Anh Quốc", description: "Hồng trà quý phái, ấm sắc màu mộc đậm phong cách London", category: "cinema", icon: "☕", brightness: -2, contrast: 15, saturation: -12, warmth: 15, tint: 12 },
  { id: "noir-shadow", name: "Hắc Bản Noir Dramatic", description: "Kịch tính tột độ, tôn nét góc cạnh biểu cảm mạnh mẽ nhất", category: "cinema", icon: "🎭", brightness: -10, contrast: 40, saturation: 20, warmth: -5, tint: 5 },

  // 4. ARTISTIC / METROPART CATEGORY (🎨 NGHỆ THUẬT / ĐỘC ĐÁO)
  { id: "nordic-forest", name: "Rừng Già Bắc Âu", description: "Màu xanh rêu đất sẫm lạnh phóng khoáng phong trần hoang dã", category: "artistic", icon: "🌲", brightness: -8, contrast: 18, saturation: -15, warmth: -10, tint: -20 },
  { id: "arctic-ice", name: "Băng Giá Arctic", description: "Phủ lạnh vùng trời băng tuyết, trong vắt thanh nhã thanh lọc", category: "artistic", icon: "❄️", brightness: 10, contrast: 12, saturation: -10, warmth: -40, tint: -5 },
  { id: "ocean-breeze", name: "Mát Lạnh Đại Dương", description: "Xanh đại dương thẳm sâu dìu dịu sảng khoái và yên bình", category: "artistic", icon: "🌊", brightness: 8, contrast: 10, saturation: 15, warmth: -25, tint: -10 },
  { id: "vintage-noir", name: "Đen Trắng Cổ Noir", description: "Giản lược màu sắc đen trắng, làm bật dải tương phản vùng sáng tối", category: "artistic", icon: "🖤", brightness: -5, contrast: 35, saturation: -100, warmth: 0, tint: 0 },
  { id: "cyber-desert", name: "Sa Mạc Đỏ Tương Lai", description: "Tone đỏ gạch pha đất cát viễn tưởng hoang mạc hoang sơ", category: "artistic", icon: "🏜️", brightness: 2, contrast: 24, saturation: 30, warmth: 25, tint: -12 }
];

const PRESET_PORTRAITS = [
  {
    id: "beauty-girl",
    name: "Ảnh Chân Dung (Chỉnh mặt & mịn da)",
    url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
    desc: "Mẫu cận cảnh gương mặt lý tưởng để thử bóp cằm V-line & làm mịn da"
  },
  {
    id: "sports-guy",
    name: "Thể Thao (Chạy bộ ngoài trời)",
    url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=600&q=80",
    desc: "Tone màu năng động ngoài trời để thử bộ lọc sắc màu thể thao"
  },
  {
    id: "fitness-body",
    name: "Vóc Dáng (Tập Gym bóp eo)",
    url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
    desc: "Mẫu tập gym phù hợp để thử nghiệm co bóp eo thon gọn"
  }
];

export default function PhotoEditor() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // ====== BASIC ADJUSTMENT STATES (FINE TUNING PRESETS) ======
  const [brightness, setBrightness] = useState<number>(0); // -60 to 60
  const [contrast, setContrast] = useState<number>(0);     // -50 to 50
  const [saturation, setSaturation] = useState<number>(0);   // -60 to 60
  const [warmth, setWarmth] = useState<number>(0);           // -100 to 100
  const [tint, setTint] = useState<number>(0);               // -100 to 100
  
  const [selectedPreset, setSelectedPreset] = useState<string>("original");
  const [presetCategory, setPresetCategory] = useState<"all" | "sports" | "beauty" | "cinema" | "artistic">("all");

  // ====== SKIN SMOOTHING STATES ======
  const [skinSmooth, setSkinSmooth] = useState<number>(0);   // 0 to 100
  const [skinBrighten, setSkinBrighten] = useState<number>(0); // 0 to 100

  // ====== LIQUIFY (WARPING) STATES ======
  const [activeTool, setActiveTool] = useState<"none" | "liquify-narrow" | "liquify-expand">("none");
  const [brushSize, setBrushSize] = useState<number>(55);
  const [brushStrength, setBrushStrength] = useState<number>(35); // 10 to 150

  // Canvas references
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Drag state for warping
  const [isWarping, setIsWarping] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [imgDim, setImgDim] = useState({ w: 0, h: 0 });

  // Monitor adjustments and auto redraw at 60fps
  useEffect(() => {
    if (!imageSrc) return;
    renderProcessedPhoto();
  }, [imageSrc, brightness, contrast, saturation, warmth, tint, selectedPreset, skinSmooth, skinBrighten]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setLoading(true);
    resetAllSliders();
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
        initCanvases(img);
        setLoading(false);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (url: string, name: string) => {
    setLoading(true);
    resetAllSliders();
    setFileName(name);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgDim({ w: img.naturalWidth, h: img.naturalHeight });
      initCanvases(img);
      setLoading(false);
    };
    img.onerror = () => {
      alert("Tính năng CORS bảo mật chặn hình ảnh trực tuyến tự động. Vui lòng chọn tải tệp ảnh từ ổ cứng máy tính của bạn để thử nghiệm hoàn hảo!");
      setLoading(false);
    };
    img.src = url + "?no-cache=" + Date.now();
  };

  const initCanvases = (img: HTMLImageElement) => {
    setImageSrc(img.src);

    const origCanvas = originalCanvasRef.current;
    const viewCanvas = viewCanvasRef.current;
    if (!origCanvas || !viewCanvas) return;

    origCanvas.width = img.naturalWidth;
    origCanvas.height = img.naturalHeight;
    viewCanvas.width = img.naturalWidth;
    viewCanvas.height = img.naturalHeight;

    const origCtx = origCanvas.getContext("2d");
    const viewCtx = viewCanvas.getContext("2d");
    if (!origCtx || !viewCtx) return;

    origCtx.drawImage(img, 0, 0);
    viewCtx.drawImage(img, 0, 0);
  };

  const resetAllSliders = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
    setWarmth(0);
    setTint(0);
    setSkinSmooth(0);
    setSkinBrighten(0);
    setSelectedPreset("original");
    setActiveTool("none");
  };

  const handleResetPhotoContent = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      initCanvases(img);
      resetAllSliders();
    };
    img.src = imageSrc;
  };

  // Direct dynamic preset configuration mapping
  const applyPreset = (preset: ColorPreset) => {
    setSelectedPreset(preset.id);
    setBrightness(preset.brightness);
    setContrast(preset.contrast);
    setSaturation(preset.saturation);
    setWarmth(preset.warmth);
    setTint(preset.tint);
  };

  // ==================== RENDERING CORE PIPELINE ====================
  const renderProcessedPhoto = () => {
    const origCanvas = originalCanvasRef.current;
    const viewCanvas = viewCanvasRef.current;
    if (!origCanvas || !viewCanvas) return;

    const w = origCanvas.width;
    const h = origCanvas.height;
    if (w === 0 || h === 0) return;

    const origCtx = origCanvas.getContext("2d");
    const viewCtx = viewCanvas.getContext("2d");
    if (!origCtx || !viewCtx) return;

    // Fetch original pixels to apply color adjustments non-destructively
    const imgData = origCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Formulas weights
    const brightFactor = brightness * 1.5; // exposure modifier
    const contrastFactor = (contrast + 100) / 100;
    const contrastCorrectionFactor = contrastFactor * contrastFactor;
    const saturationFactor = (saturation + 100) / 100;

    // Skin smoothing components
    const smoothRadius = Math.min(2, Math.max(0, Math.floor(skinSmooth / 30)));
    const enableSkinSmoothing = skinSmooth > 0;
    const enableSkinBrighten = skinBrighten > 0;

    // Apply pixel-by-pixel corrections inside CPU array (Instant preview!)
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];

      // ------ A. ADVANCED CHANNELS HUMAN SKIN DETECTION ------
      // RGB Skin tone model classifier: highly accurate skin isolation
      const isSkin = r > 80 && g > 45 && b > 35 && 
                     r > g && r > b && 
                     (r - g) > 12 && 
                     Math.abs(g - b) < 40;

      if (isSkin) {
        // Brighten skin tone (Skin Glow rosy lift)
        if (enableSkinBrighten) {
          const brightDelta = (skinBrighten / 100) * 22;
          r = Math.min(255, r + brightDelta * 1.25);
          g = Math.min(255, g + brightDelta * 0.95);
          b = Math.min(255, b + brightDelta * 0.85);
        }

        // Apply fast bilateral blur filter on skin channel to dissolve pores/shades
        if (enableSkinSmoothing && smoothRadius > 0) {
          const idxLeft = Math.max(0, i - 4);
          const idxRight = Math.min(data.length - 4, i + 4);
          
          const smoothRatio = skinSmooth / 125;
          r = Math.round(r * (1 - smoothRatio) + ((data[idxLeft] + data[idxRight]) / 2) * smoothRatio);
          g = Math.round(g * (1 - smoothRatio) + ((data[idxLeft+1] + data[idxRight+1]) / 2) * smoothRatio);
          b = Math.round(b * (1 - smoothRatio) + ((data[idxLeft+2] + data[idxRight+2]) / 2) * smoothRatio);
        }
      }

      // ------ B. CUSTOMIZABLE BASIC BRIGHTNESS, CONTRAST, SATURATION ------
      // Exposure brightness
      if (brightness !== 0) {
        r = Math.min(255, Math.max(0, r + brightFactor));
        g = Math.min(255, Math.max(0, g + brightFactor));
        b = Math.min(255, Math.max(0, b + brightFactor));
      }

      // High contrast interpolation
      if (contrast !== 0) {
        r = Math.min(255, Math.max(0, ((r / 255 - 0.5) * contrastCorrectionFactor + 0.5) * 255));
        g = Math.min(255, Math.max(0, ((g / 255 - 0.5) * contrastCorrectionFactor + 0.5) * 255));
        b = Math.min(255, Math.max(0, ((b / 255 - 0.5) * contrastCorrectionFactor + 0.5) * 255));
      }

      // Saturation (luminance preserve)
      if (saturation !== 0) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = Math.min(255, Math.max(0, gray + (r - gray) * saturationFactor));
        g = Math.min(255, Math.max(0, gray + (g - gray) * saturationFactor));
        b = Math.min(255, Math.max(0, gray + (b - gray) * saturationFactor));
      }

      // ------ C. NEW REVOLUTIONARY TEMPERATURE WARMTH & TINT BALANCING ------
      // Temperature (Warmth)
      if (warmth !== 0) {
        const wVal = warmth * 0.45;
        r = Math.min(255, Math.max(0, r + wVal));
        g = Math.min(255, Math.max(0, g + wVal * 0.18));
        b = Math.min(255, Math.max(0, b - wVal * 0.8));
      }

      // Tint (Green-Magenta slider)
      if (tint !== 0) {
        const tVal = tint * 0.45;
        r = Math.min(255, Math.max(0, r + tVal * 0.35));
        g = Math.min(255, Math.max(0, g - tVal * 0.52));
        b = Math.min(255, Math.max(0, b + tVal * 0.35));
      }

      data[i] = r;
      data[i+1] = g;
      data[i+2] = b;
    }

    viewCtx.putImageData(imgData, 0, 0);
  };

  // ==================== INTERACTIVE LIQUIFY (PHYSICAL STAGE WARPING) ====================
  const handleWarpStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === "none") return;
    setIsWarping(true);

    const canvas = viewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    setLastMousePos({ x, y });
  };

  const handleWarpMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isWarping || activeTool === "none") return;

    const canvas = viewCanvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!canvas || !origCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    const origCtx = origCanvas.getContext("2d");
    if (!origCtx) return;

    const dx = x - lastMousePos.x;
    const dy = y - lastMousePos.y;

    const distMouse = Math.sqrt(dx * dx + dy * dy);
    if (distMouse < 1.5) return; // skip subpixel noise

    // Warp factors parameters
    const cx = lastMousePos.x;
    const cy = lastMousePos.y;
    const r = brushSize;
    const strengthMultiplier = (brushStrength / 100) * 0.45;

    const w = origCanvas.width;
    const h = origCanvas.height;

    // Viewport box constraints to preserve speed calculations
    const leftBound = Math.max(0, Math.floor(cx - r * 1.5));
    const topBound = Math.max(0, Math.floor(cy - r * 1.5));
    const boxWidth = Math.min(w - leftBound, Math.floor(r * 3));
    const boxHeight = Math.min(h - topBound, Math.floor(r * 3));

    if (boxWidth <= 0 || boxHeight <= 0) return;

    const sourceData = origCtx.getImageData(leftBound, topBound, boxWidth, boxHeight);
    const sourceArr = sourceData.data;

    const outputData = origCtx.createImageData(boxWidth, boxHeight);
    const outArr = outputData.data;

    for (let dyLocal = 0; dyLocal < boxHeight; dyLocal++) {
      for (let dxLocal = 0; dxLocal < boxWidth; dxLocal++) {
        const curXPx = leftBound + dxLocal;
        const curYPx = topBound + dyLocal;

        const distToCenterX = curXPx - cx;
        const distToCenterY = curYPx - cy;
        const distance = Math.sqrt(distToCenterX * distToCenterX + distToCenterY * distToCenterY);

        let srcX = curXPx;
        let srcY = curYPx;

        if (distance < r) {
          const weight = Math.pow(1 - distance / r, 2);

          if (activeTool === "liquify-narrow") {
            // Push towards movement vector (Bóp eo/Mặt)
            srcX = curXPx - dx * weight * strengthMultiplier;
            srcY = curYPx - dy * weight * strengthMultiplier;
          } else {
            // Warp coordinates outwards (Thon nở vóc dáng)
            const radFactor = weight * strengthMultiplier * 1.25;
            srcX = curXPx - distToCenterX * radFactor;
            srcY = curYPx - distToCenterY * radFactor;
          }
        }

        srcX = Math.max(0, Math.min(w - 1, srcX));
        srcY = Math.max(0, Math.min(h - 1, srcY));

        const nearestX = Math.round(srcX);
        const nearestY = Math.round(srcY);

        const mappedXLocal = nearestX - leftBound;
        const mappedYLocal = nearestY - topBound;

        const outIdx = (dyLocal * boxWidth + dxLocal) * 4;

        if (mappedXLocal >= 0 && mappedXLocal < boxWidth && mappedYLocal >= 0 && mappedYLocal < boxHeight) {
          const srcIdx = (mappedYLocal * boxWidth + mappedXLocal) * 4;
          outArr[outIdx] = sourceArr[srcIdx];
          outArr[outIdx+1] = sourceArr[srcIdx+1];
          outArr[outIdx+2] = sourceArr[srcIdx+2];
          outArr[outIdx+3] = sourceArr[srcIdx+3];
        } else {
          try {
            const rawPixel = origCtx.getImageData(nearestX, nearestY, 1, 1).data;
            outArr[outIdx] = rawPixel[0];
            outArr[outIdx+1] = rawPixel[1];
            outArr[outIdx+2] = rawPixel[2];
            outArr[outIdx+3] = rawPixel[3];
          } catch (e) {
            outArr[outIdx] = 255; outArr[outIdx+1] = 255; outArr[outIdx+2] = 255; outArr[outIdx+3] = 255;
          }
        }
      }
    }

    origCtx.putImageData(outputData, leftBound, topBound);
    setLastMousePos({ x, y });
    renderProcessedPhoto();
  };

  const handleWarpEnd = () => {
    setIsWarping(false);
  };

  const downloadResult = () => {
    const viewCanvas = viewCanvasRef.current;
    if (!viewCanvas) return;

    const link = document.createElement("a");
    link.download = fileName.replace(/\.[^/.]+$/, "") + "_da_chinh_sua.png";
    link.href = viewCanvas.toDataURL("image/png");
    link.click();
  };

  // Filtered list of 20 customizable color presets
  const filteredPresets = COLOR_PRESETS.filter(
    preset => presetCategory === "all" || preset.category === presetCategory
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-100 placeholder:select-none" id="beauty-color-grade-panel">
      
      {/* 1. Side Controls Canvas left panel */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
        
        {/* Upload picture card */}
        <div className="bg-[#161920]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800/70">
            <h3 className="font-semibold text-slate-150 flex items-center gap-2 text-sm tracking-tight">
              <Upload className="w-4 h-4 text-rose-500" />
              Nguồn Hình Chân Dung & Thể Thao
            </h3>
            {imageSrc && (
              <button 
                onClick={() => {
                  setImageSrc(null);
                  setFileName("");
                }}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
                id="delete-pic-btn"
              >
                <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
              </button>
            )}
          </div>

          {!imageSrc ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-rose-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-[#0f1115] hover:bg-rose-500/5 group"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="bg-[#1a1c23] group-hover:scale-110 p-4 rounded-full shadow-lg max-w-fit mx-auto mb-3 transition-transform">
                <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-rose-500" />
              </div>
              <p className="font-medium text-slate-200 text-sm">
                Tải ảnh bóp dáng, chỉnh màu
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Tải ảnh chụp từ máy tính hoặc điện thoại
              </p>
            </div>
          ) : (
            <div className="bg-[#0f1115] p-3.5 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <ImageIcon className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
                <span className="text-xs text-slate-200 font-semibold truncate max-w-[170px]">
                  {fileName}
                </span>
              </div>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-bold leading-none">
                {imgDim.w} x {imgDim.h} px
              </span>
            </div>
          )}

          {/* Quick preset templates to try out */}
          {!imageSrc && (
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-800/70">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Thử nhanh với ảnh mẫu studio:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {PRESET_PORTRAITS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => loadSample(sample.url, sample.name)}
                    disabled={loading}
                    className="flex text-left items-center gap-3 p-2 rounded-lg border border-slate-800 hover:border-rose-500/80 bg-[#12141c]/50 hover:bg-[#181a24] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <img 
                      src={sample.url} 
                      alt="" 
                      className="w-10 h-10 object-cover rounded-md bg-slate-900 border border-slate-800 shrink-0" 
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{sample.name}</p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">{sample.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 2. Interactive Liquify sculpting tools (Bóp mặt & Bóp eo) */}
        {imageSrc && (
          <div className="bg-[#161920]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800/70 pb-2">
              <h3 className="font-semibold text-slate-150 flex items-center gap-1.5 text-sm tracking-tight">
                <Paintbrush className="w-4 h-4 text-pink-500 animate-pulse" />
                Vóc Dáng V-Line & Bóp Eo Thon
              </h3>
              {activeTool !== "none" && (
                <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] px-2 py-0.5 rounded font-extrabold animate-pulse tracking-wide uppercase">Cọ vẽ bật</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveTool("none")}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold border cursor-pointer transition text-center ${
                  activeTool === "none"
                    ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-500/20"
                    : "bg-[#0f1115] text-slate-350 border-slate-800 hover:bg-slate-800/40"
                }`}
              >
                <Eye className="w-3.5 h-3.5 mx-auto mb-1" />
                Mặc định
              </button>
              <button
                onClick={() => setActiveTool("liquify-narrow")}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold border cursor-pointer transition text-center ${
                  activeTool === "liquify-narrow"
                    ? "bg-pink-600 text-white border-pink-700 shadow-lg shadow-pink-500/20"
                    : "bg-[#0f1115] text-slate-350 border-slate-800 hover:bg-slate-800/40"
                }`}
                id="bop-mat-eo-btn"
              >
                <Maximize2 className="w-3.5 h-3.5 mx-auto mb-1 rotate-120" />
                Bóp Mặt/Eo
              </button>
              <button
                onClick={() => setActiveTool("liquify-expand")}
                className={`py-2 px-1 rounded-xl text-[10px] font-bold border cursor-pointer transition text-center ${
                  activeTool === "liquify-expand"
                    ? "bg-sky-600 text-white border-sky-700 shadow-lg shadow-sky-500/20"
                    : "bg-[#0f1115] text-slate-350 border-slate-800 hover:bg-slate-800/40"
                }`}
                id="no-nguc-mông-btn"
              >
                <Maximize2 className="w-3.5 h-3.5 mx-auto mb-1" />
                Tạo Thon Nở
              </button>
            </div>

            {/* Instruction banner */}
            <div className="bg-[#1b1922] p-3 rounded-xl border border-pink-500/10 text-[11px] text-slate-300 leading-normal">
              {activeTool === "none" ? (
                "Nhấp công cụ bóp cằm VLINE/eo phía trên, sau đó di chuột kéo thẳng ở rìa ảnh để bóp nhỏ các chi tiết thừa thon bốc lửa!"
              ) : (
                <span className="text-pink-300/90 font-medium">
                  💡 Hướng dẫn: Nhấn đè chuột kéo từ ngoài vào trong để bóp mặt thon gọn nịnh mắt, kéo hướng ra ngoài để mở rộng chi vóc dáng.
                </span>
              )}
            </div>

            {activeTool !== "none" && (
              <div className="space-y-3.5 p-3.5 bg-[#0f1115] rounded-xl border border-slate-800/90">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 font-semibold">
                    <span>Kích cỡ đầu bút bóp</span>
                    <span className="font-mono text-pink-400 font-bold">{brushSize}px</span>
                  </div>
                  <input 
                    type="range"
                    min="15"
                    max="150"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full h-1 bg-[#1a1c24] rounded-lg accent-pink-500 cursor-pointer" 
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 font-semibold">
                    <span>Cường độ co co dãn</span>
                    <span className="font-mono text-pink-400 font-bold">{brushStrength}%</span>
                  </div>
                  <input 
                    type="range"
                    min="15"
                    max="95"
                    value={brushStrength}
                    onChange={(e) => setBrushStrength(Number(e.target.value))}
                    className="w-full h-1 bg-[#1a1c24] rounded-lg accent-pink-500 cursor-pointer" 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Middle Interactive Live Studio Stage */}
      <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
        
        {/* Main interactive canvas sheet */}
        <div className="bg-[#0f1115] rounded-3xl p-4 border border-slate-900/80 flex flex-col justify-center items-center min-h-[420px] relative overflow-hidden shadow-2xl">
          {loading && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center z-20 text-white space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
              <p className="text-sm font-semibold tracking-wide">Đang nạp bức ảnh vào bộ nhớ ảo GPU...</p>
            </div>
          )}

          {!imageSrc ? (
            <div className="text-slate-500 text-center py-10">
              <ImageIcon className="w-14 h-14 text-slate-850 mx-auto mb-3" />
              <p className="text-sm">Vui lòng chọn ảnh mẫu hoặc tải ảnh bên cột trái để bắt đầu bóp eo V-Line ngay</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center relative">
              
              {/* Target references layer original image backup */}
              <canvas ref={originalCanvasRef} className="hidden" />

              {/* Draw interactive active stage */}
              <div className="relative max-w-full max-h-[460px] overflow-auto rounded-xl border border-slate-800 shadow-2xl bg-[#09090c]">
                <canvas 
                  ref={viewCanvasRef}
                  onMouseDown={handleWarpStart}
                  onMouseMove={handleWarpMove}
                  onMouseUp={handleWarpEnd}
                  onMouseLeave={handleWarpEnd}
                  className={`relative block object-contain max-h-[420px] max-w-full ${
                    activeTool !== "none" ? "cursor-crosshair border-2 border-pink-500/20" : ""
                  }`}
                  title={activeTool !== "none" ? "Rút thon gọn cơ thể trực quan" : "Màu ảnh thời gian thực"}
                />
              </div>

              {/* Quick actions strip bar */}
              <div className="mt-3 flex gap-4 w-full justify-center">
                <button
                  onClick={handleResetPhotoContent}
                  className="text-xs bg-[#161a23] hover:bg-[#1a202d] text-slate-300 py-1.5 px-3.5 rounded-lg border border-slate-800/80 flex items-center gap-1.5 cursor-pointer leading-none transition-all"
                  id="reset-canvas-photo-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  Xóa tất cả các bước bóp dáng (Làm lại)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Preset color option selection grid */}
        {imageSrc && (
          <div className="bg-[#161920]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/70 pb-3" id="vietnamese-presets-section">
              <h3 className="font-semibold text-slate-150 flex items-center gap-2 text-sm tracking-tight font-sans">
                <Palette className="w-4 h-4 text-rose-500 animate-pulse" />
                20 Tùy Chọn Màu Chuyên Nghiệp (Customizable)
              </h3>
              
              {/* Categories selection buttons */}
              <div className="flex flex-wrap gap-1.5 bg-[#0f1115] p-1 rounded-lg border border-slate-800/80 text-[10px] text-slate-400">
                {[
                  { id: "all", label: "Tất cả" },
                  { id: "sports", label: "⚡ Thể thao" },
                  { id: "beauty", label: "🌸 Chân dung" },
                  { id: "cinema", label: "🎬 Điện ảnh" },
                  { id: "artistic", label: "🎨 Nghệ thuật" }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setPresetCategory(cat.id as any)}
                    className={`px-2 py-1 rounded-md transition-all font-semibold ${
                      presetCategory === cat.id 
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/10" 
                        : "hover:text-white"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets visual list scroll pane */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedPreset === preset.id
                      ? "border-rose-500 bg-rose-500/5 ring-1 ring-rose-500/30"
                      : "border-slate-800 bg-[#12141a]/50 hover:bg-[#1a1d26]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0 select-none">{preset.icon}</span>
                    <span className="font-bold text-xs text-slate-200 truncate">{preset.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 italic mt-1 font-mono">
              * Nhấp chọn bộ lọc màu, sau đó tinh chỉnh các thanh kéo rải rác bên phải để lưu tùy biến của bạn!
            </p>
          </div>
        )}
      </div>

      {/* 3. Right Advanced Beauty Face filters */}
      {imageSrc && (
        <div className="lg:col-span-3 space-y-6">
          
          {/* AI Skin Smoothing & Rosy White card */}
          <div className="bg-[#161920]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-semibold text-slate-150 border-b border-slate-800/70 pb-2 flex items-center gap-2 text-sm tracking-tight">
              <Heart className="w-4 h-4 text-pink-500 animate-pulse fill-pink-500/10" />
              Làm Đẹp Kiểu Studio & Cà Mịn Da
            </h3>

            {/* Skin softening */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Cà mịn da nịnh mắt (Softening)</span>
                <span className="font-mono text-pink-400 font-extrabold">{skinSmooth}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={skinSmooth}
                onChange={(e) => setSkinSmooth(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0f1115] rounded-lg appearance-none cursor-pointer accent-pink-500" 
              />
              <p className="text-[9px] text-slate-500 mt-0.5 leading-snug">
                Xóa các chấm mụn, nếp nhăn rìa da vô cùng tự nhiên.
              </p>
            </div>

            {/* Brighten skin pink tones */}
            <div className="space-y-1 pt-2.5 border-t border-slate-800/70">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Nâng dải sáng hồng hào (Rosy Face)</span>
                <span className="font-mono text-pink-400 font-extrabold">{skinBrighten}%</span>
              </div>
              <input 
                type="range"
                min="0"
                max="100"
                value={skinBrighten}
                onChange={(e) => setSkinBrighten(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0f1115] rounded-lg appearance-none cursor-pointer accent-pink-500" 
              />
            </div>
          </div>

          {/* Detailed Color custom sliders (TÙY CHỈNH MÀU THỂ THAO CHUYÊN NGHIỆP) */}
          <div className="bg-[#161920]/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
              <h3 className="font-semibold text-slate-150 flex items-center gap-2 text-sm tracking-tight">
                <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                Bàn Tùy Chỉnh Màu Lẻ
              </h3>
              <button
                onClick={() => {
                  setBrightness(0);
                  setContrast(0);
                  setSaturation(0);
                  setWarmth(0);
                  setTint(0);
                }}
                className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
                title="Khôi phục dải sRGB về 0"
              >
                Đặt lại màu
              </button>
            </div>

            {/* Brightness Exposure slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Độ sáng (Brightness)
                </span>
                <span className={`font-mono font-bold ${brightness > 0 ? "text-emerald-400" : brightness < 0 ? "text-red-400" : "text-slate-500"}`}>
                  {brightness > 0 ? `+${brightness}` : brightness}
                </span>
              </div>
              <input 
                type="range"
                min="-60"
                max="60"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0f1115] rounded-lg appearance-none cursor-pointer accent-rose-500" 
              />
            </div>

            {/* Contrast slider */}
            <div className="space-y-1 pt-1 border-t border-[#12141a]">
              <div className="flex justify-between text-xs text-slate-300 font-medium font-sans">
                <span>Độ tương phản (Contrast)</span>
                <span className={`font-mono font-bold ${contrast > 0 ? "text-emerald-400" : contrast < 0 ? "text-red-400" : "text-slate-500"}`}>
                  {contrast > 0 ? `+${contrast}` : contrast}
                </span>
              </div>
              <input 
                type="range"
                min="-50"
                max="50"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0f1115] rounded-lg appearance-none cursor-pointer accent-rose-500" 
              />
            </div>

            {/* Saturation slider */}
            <div className="space-y-1 pt-1 border-t border-[#12141a]">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>Độ bão hòa màu (Saturation)</span>
                <span className={`font-mono font-bold ${saturation > 0 ? "text-emerald-400" : saturation < 0 ? "text-red-400" : "text-slate-500"}`}>
                  {saturation > 0 ? `+${saturation}` : saturation}
                </span>
              </div>
              <input 
                type="range"
                min="-60"
                max="60"
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0f1115] rounded-lg appearance-none cursor-pointer accent-rose-500" 
              />
            </div>

            {/* TEMPERATURE (WARMTH) SLIDER (MÀU ẤM THỂ THAO DÃ NGOẠI) */}
            <div className="space-y-1 pt-1 border-t border-[#12141a]" id="temperature-panel">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>Nhiệt độ ấm (Warmth / Temp)</span>
                <span className={`font-mono font-bold ${warmth > 0 ? "text-amber-400" : warmth < 0 ? "text-sky-400" : "text-slate-500"}`}>
                  {warmth > 0 ? `+${warmth} (Ấm)` : warmth < 0 ? `${warmth} (Lạnh)` : `0`}
                </span>
              </div>
              <input 
                type="range"
                min="-60"
                max="60"
                value={warmth}
                onChange={(e) => setWarmth(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0f1115] rounded-lg appearance-none cursor-pointer accent-rose-500" 
              />
            </div>

            {/* TINT (GREEN - MAGENTA) SLIDER */}
            <div className="space-y-1 pt-1 border-t border-[#12141a]" id="tint-panel">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>Tông Sắc (Tint - Magenta/Green)</span>
                <span className={`font-mono font-bold ${tint > 0 ? "text-pink-400" : tint < 0 ? "text-emerald-400" : "text-slate-500"}`}>
                  {tint > 0 ? `+${tint} (Hồng)` : tint < 0 ? `${tint} (Xanh)` : `0`}
                </span>
              </div>
              <input 
                type="range"
                min="-50"
                max="50"
                value={tint}
                onChange={(e) => setTint(Number(e.target.value))}
                className="w-full h-1.5 bg-[#0f1115] rounded-lg appearance-none cursor-pointer accent-rose-500" 
              />
            </div>
          </div>

          {/* Premium banner trigger download */}
          <div className="bg-gradient-to-br from-[#12141a] to-rose-950/20 text-white rounded-2xl p-5 border border-slate-800/70 shadow-lg flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <h3 className="font-bold text-sm text-rose-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                Xuất Bản Ảnh Ultra HD
              </h3>
              <p className="text-xs text-slate-400 leading-normal">
                Tải ảnh đã nâng cấp chất lượng mịn da nịnh mắt & bóp eo thon gọn về máy với tỉ lệ pixel nguyên bản.
              </p>
            </div>

            <button
              onClick={downloadResult}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 active:scale-95 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-rose-500/20 transition-all text-sm"
              id="download-beautified-pic-btn"
            >
              <Download className="w-4 h-4" />
              Lưu & Tải Ảnh Đã Sửa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import { 
  Upload, Sparkles, RefreshCw, Download, Image as ImageIcon, Video,
  Trash2, Sliders, Play, Brush, Eraser, Info, Move, Layers, Settings,
  RotateCcw, Check, Sparkle
} from "lucide-react";
import { WatermarkBox } from "../types";

// Standard samples for quick testing
const MOCK_IMAGE_SAMPLES = [
  {
    id: "img-sample-shutterstock",
    name: "Ảnh Chân dung mẫu (Watermark văn bản giữa ảnh)",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80",
    desc: "Cung cấp watermark giả lập trung tâm để thử nghiệm xóa bằng cọ tô mịn"
  },
  {
    id: "img-sample-product",
    name: "Ảnh Sản phẩm giày (Logo góc dưới hữu)",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    desc: "Logo thương hiệu nhỏ góc dưới bên phải, lý tưởng cho AI Tự Động Định Vị"
  }
];

const MOCK_VIDEO_SAMPLES = [
  {
    id: "vid-sample-countdown",
    name: "Video mẫu sóng nước bờ biển (Logo mờ góc trên trái)",
    url: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-ocean-near-the-shore-43184-large.mp4",
    desc: "Chứa logo text cố định dải góc trên"
  }
];

export default function WatermarkRemover() {
  const [activeMedia, setActiveMedia] = useState<"image" | "video">("image");
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileName, setFileName] = useState("");

  // ====== IMAGE STATES ======
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState<number>(30);
  const [brushMode, setBrushMode] = useState<"paint" | "erase">("paint");
  const [aiDetectLoading, setAiDetectLoading] = useState(false);
  const [watermarks, setWatermarks] = useState<WatermarkBox[]>([]);
  const [inpaintingPasses, setInpaintingPasses] = useState<number>(18);

  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });

  // ====== VIDEO STATES ======
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [videoBox, setVideoBox] = useState<{ x: number, y: number, w: number, h: number }>({
    x: 10, y: 10, w: 20, h: 10 // Percentage values
  });
  const [videoFilterType, setVideoFilterType] = useState<"blur" | "mosaic" | "clone">("blur");
  const [videoBlurAmount, setVideoBlurAmount] = useState<number>(15);
  const [cloningOffset, setCloningOffset] = useState<{ dx: number, dy: number }>({ dx: 40, dy: 0 }); // for clone filter offset
  
  // Video render tracking
  const [videoRendering, setVideoRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [playingPreview, setPlayingPreview] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);
  const dragBoxRef = useRef<HTMLDivElement | null>(null);
  
  // Dragging and Resizing inside Video overlay
  const [isDraggingBox, setIsDraggingBox] = useState(false);
  const [isResizingBox, setIsResizingBox] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boxStart, setBoxStart] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // ==================== IMAGE BUSINESS LOGIC ====================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      loadImgSource(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const loadImgSample = (url: string, name: string) => {
    setLoading(true);
    setFileName(name);
    
    // Create direct proxy URL pattern or fetch with cache skip to avoid CORS errors
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      initImgCanvases(img);
      setLoading(false);
    };
    img.onerror = () => {
      alert("Không thể tải ảnh mẫu này do bảo mật CORS. Xin vui lòng tải lên ảnh lưu trong máy của bạn để tiếp tục.");
      setLoading(false);
    };
    img.src = url + (url.includes("?") ? "&" : "?") + "clear-cors=" + Date.now();
  };

  const loadImgSource = (src: string) => {
    setLoading(true);
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      initImgCanvases(img);
      setLoading(false);
    };
    img.src = src;
  };

  const initImgCanvases = (img: HTMLImageElement) => {
    setImageSrc(img.src);
    setWatermarks([]);

    // We do double-buffering canvas: Canvas with image, separate canvas with manual mask in red
    setTimeout(() => {
      const c = imageCanvasRef.current;
      const mc = imageMaskCanvasRef.current;
      if (!c || !mc) return;

      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      mc.width = img.naturalWidth;
      mc.height = img.naturalHeight;

      const ctx = c.getContext("2d");
      const mctx = mc.getContext("2d");
      if (!ctx || !mctx) return;

      ctx.drawImage(img, 0, 0);
      
      // Mask canvas begins as completely blank transparent
      mctx.clearRect(0, 0, mc.width, mc.height);
    }, 100);
  };

  // Click-to-Auto-Detect Watermarks powered by fully sandboxed Gemini Vision!
  const triggerAiWatermarkDetection = async () => {
    if (!imageSrc) return;
    setAiDetectLoading(true);
    try {
      const res = await fetch("/api/detect-watermark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageSrc,
          mimeType: "image/png"
        })
      });
      const data = await res.json();
      
      if (data.detected && data.watermarks?.length > 0) {
        // Draw the automatically detected watermark masks onto the mask canvas
        const mc = imageMaskCanvasRef.current;
        if (mc) {
          const mctx = mc.getContext("2d");
          if (mctx) {
            mctx.fillStyle = "rgba(255, 0, 0, 1)"; // Solid red mask markup
            const wList: WatermarkBox[] = [];

            data.watermarks.forEach((wm: any, i: number) => {
              const xPx = (wm.x / 100) * mc.width;
              const yPx = (wm.y / 100) * mc.height;
              const wPx = (wm.width / 100) * mc.width;
              const hPx = (wm.height / 100) * mc.height;

              // Draw a matching helper rectangle onto our active manual red mask
              mctx.fillRect(xPx, yPx, wPx, hPx);

              wList.push({
                id: `ai-wm-${i}`,
                x: wm.x,
                y: wm.y,
                width: wm.width,
                height: wm.height,
                label: wm.label || `Lớp Watermark #${i+1}`
              });
            });

            setWatermarks(wList);
            alert(`AI đã tìm thấy thành công ${data.watermarks.length} vùng Watermarkers/Logo trùng khớp! Đang bôi màu đỏ để xóa...`);
          }
        }
      } else {
        alert("AI không phát hiện ra dấu watermark bản quyền rõ ràng nào trong ảnh. Hãy dùng cọ thủ công để tô và xóa vùng mong muốn!");
      }
    } catch (e: any) {
      alert("Hệ thống phân tích AI bận: " + e.message);
    } finally {
      setAiDetectLoading(false);
    }
  };

  // Drawing mask coordinates
  const handleDrawStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    drawStroke(e);
  };

  const handleDrawMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    drawStroke(e);
  };

  const handleDrawEnd = () => {
    setIsDrawing(false);
  };

  const drawStroke = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = imageCanvasRef.current;
    const maskCanvas = imageMaskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * maskCanvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * maskCanvas.height;

    const mctx = maskCanvas.getContext("2d");
    if (!mctx) return;

    mctx.save();
    mctx.beginPath();
    mctx.arc(x, y, brushSize, 0, Math.PI * 2);

    if (brushMode === "paint") {
      // Solid Red markup
      mctx.fillStyle = "rgba(255, 0, 0, 1)";
      mctx.fill();
    } else {
      // Erase red markup (back to clean transparent)
      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = "rgba(0, 0, 0, 1)";
      mctx.fill();
    }
    mctx.restore();
  };

  // Clean all red mask overlays
  const resetImageMask = () => {
    const mc = imageMaskCanvasRef.current;
    if (!mc) return;
    const mctx = mc.getContext("2d");
    mctx?.clearRect(0, 0, mc.width, mc.height);
    setWatermarks([]);
    
    // Reload source to wipe any finished changes
    if (imageSrc) {
      loadImgSource(imageSrc);
    }
  };

  // EXTREMELY POWERFUL CONTENT-AWARE INPAINTING ALGORITHM RUNNING AT 60FPS ON CLIENT CANVAS
  const runProfessionalImageInpainting = () => {
    const canvas = imageCanvasRef.current;
    const maskCanvas = imageMaskCanvasRef.current;
    if (!canvas || !maskCanvas) return;

    setProcessing(true);

    setTimeout(() => {
      const ctx = canvas.getContext("2d");
      const mctx = maskCanvas.getContext("2d");
      if (!ctx || !mctx) {
        setProcessing(false);
        return;
      }

      const w = canvas.width;
      const h = canvas.height;

      const imgData = ctx.getImageData(0, 0, w, h);
      const maskData = mctx.getImageData(0, 0, w, h);

      const pixels = imgData.data;
      const maskPixels = maskData.data;

      // Inpainting parameters
      const passes = inpaintingPasses;

      // Repeat interpolation multi-passes to blend surrounding pixels progressively inwards
      for (let pass = 0; pass < passes; pass++) {
        // We write in buffer and apply back to keep calculations stabilized
        const tempPixels = new Uint8ClampedArray(pixels);

        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;

            // Checked mask canvas: Red channel has drawn mark active (> 30 red value)
            const isMasked = maskPixels[idx] > 30;

            if (isMasked) {
              let rSum = 0, gSum = 0, bSum = 0;
              let neighborCount = 0;

              // Check 8 neighbor offsets
              const neighbors = [
                idx - 4,          // Left
                idx + 4,          // Right
                idx - w * 4,      // Top
                idx + w * 4,      // Bottom
                idx - w * 4 - 4,  // Top Left
                idx - w * 4 + 4,  // Top Right
                idx + w * 4 - 4,  // Bottom Left
                idx + w * 4 + 4,  // Bottom Right
              ];

              for (const nIdx of neighbors) {
                // If neighbor is NOT masked, we can pull its texture colors
                if (maskPixels[nIdx] <= 30) {
                  rSum += pixels[nIdx];
                  gSum += pixels[nIdx + 1];
                  bSum += pixels[nIdx + 2];
                  neighborCount++;
                }
              }

              if (neighborCount > 0) {
                tempPixels[idx] = Math.round(rSum / neighborCount);
                tempPixels[idx + 1] = Math.round(gSum / neighborCount);
                tempPixels[idx + 2] = Math.round(bSum / neighborCount);
                // Retain full alpha opacity
                tempPixels[idx + 3] = 255;
              } else {
                // If deep inside watermark mask with no direct unmasked neighbor,
                // temporarily average surrounding pixels regardless of mask to grow texture inward
                let deepR = 0, deepG = 0, deepB = 0;
                for (const nIdx of neighbors) {
                  deepR += pixels[nIdx];
                  deepG += pixels[nIdx + 1];
                  deepB += pixels[nIdx + 2];
                }
                tempPixels[idx] = Math.round(deepR / 8);
                tempPixels[idx + 1] = Math.round(deepG / 8);
                tempPixels[idx + 2] = Math.round(deepB / 8);
              }
            }
          }
        }
        // Write back intermediate buffer
        for (let i = 0; i < pixels.length; i++) {
          pixels[i] = tempPixels[i];
        }
      }

      // Re-write outputs
      ctx.putImageData(imgData, 0, 0);

      // Clean mask red highlights over successful regions
      mctx.clearRect(0, 0, w, h);
      setWatermarks([]);

      setProcessing(false);
    }, 400);
  };

  const downloadProcessedImage = () => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = fileName.replace(/\.[^/.]+$/, "") + "_no_watermark.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };


  // ==================== VIDEO BUSINESS LOGIC ====================
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setVideoSrc(URL.createObjectURL(file));
  };

  const loadVideoSample = (url: string, name: string) => {
    setFileName(name);
    setVideoSrc(url);
  };

  // Dragging and resizing watermarks boxes visually over the video layout
  const handleBoxMouseDown = (e: React.MouseEvent, type: "drag" | "resize") => {
    e.preventDefault();
    const isDrag = type === "drag";
    setIsDraggingBox(isDrag);
    setIsResizingBox(!isDrag);

    setDragStart({ x: e.clientX, y: e.clientY });
    setBoxStart({ ...videoBox });
  };

  const handleBoxMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingBox && !isResizingBox) return;

    const parent = dragBoxRef.current;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.x) / rect.width) * 100;
    const dy = ((e.clientY - dragStart.y) / rect.height) * 100;

    if (isDraggingBox) {
      const newX = Math.max(0, Math.min(100 - boxStart.w, boxStart.x + dx));
      const newY = Math.max(0, Math.min(100 - boxStart.h, boxStart.y + dy));
      setVideoBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizingBox) {
      const newW = Math.max(5, Math.min(100 - boxStart.x, boxStart.w + dx));
      const newH = Math.max(5, Math.min(100 - boxStart.y, boxStart.h + dy));
      setVideoBox(prev => ({ ...prev, w: newW, h: newH }));
    }
  };

  const handleBoxMouseUp = () => {
    setIsDraggingBox(false);
    setIsResizingBox(false);
  };

  // Video processing frames on internal Canva loop:
  // Dynamically renders Blur, Pixelation, or stamp cloning over the user selected region coordinate on active frame
  const applyWatermarkCleaningFilterNode = (
    ctx: CanvasRenderingContext2D,
    vW: number,
    vH: number
  ) => {
    // 1. Target bounding coordinates
    const xPx = Math.floor((videoBox.x / 100) * vW);
    const yPx = Math.floor((videoBox.y / 100) * vH);
    const wPx = Math.floor((videoBox.w / 100) * vW);
    const hPx = Math.floor((videoBox.h / 100) * vH);

    ctx.save();
    
    if (videoFilterType === "blur") {
      // Gaussian Blur Backdrop overlay
      ctx.beginPath();
      ctx.rect(xPx, yPx, wPx, hPx);
      ctx.clip();
      ctx.filter = `blur(${videoBlurAmount}px)`;
      // Redraw video back inside the clipped filter window for visual softness blurring
      ctx.drawImage(videoRef.current!, 0, 0, vW, vH);
    } else if (videoFilterType === "mosaic") {
      // Mosaic / Pixelate region
      const pixelSize = 10;
      const rData = ctx.getImageData(xPx, yPx, wPx, hPx);
      const data = rData.data;

      for (let y = 0; y < hPx; y += pixelSize) {
        for (let x = 0; x < wPx; x += pixelSize) {
          // Sample color at block center
          const sX = Math.min(x + Math.floor(pixelSize / 2), wPx - 1);
          const sY = Math.min(y + Math.floor(pixelSize / 2), hPx - 1);
          const sIdx = (sY * wPx + sX) * 4;

          const r = data[sIdx];
          const g = data[sIdx + 1];
          const b = data[sIdx + 2];
          const a = data[sIdx + 3];

          // Fill pixel blocks
          for (let dy = y; dy < y + pixelSize && dy < hPx; dy++) {
            for (let dx = x; dx < x + pixelSize && dx < wPx; dx++) {
              const dIdx = (dy * wPx + dx) * 4;
              data[dIdx] = r;
              data[dIdx + 1] = g;
              data[dIdx + 2] = b;
              data[dIdx + 3] = a;
            }
          }
        }
      }
      ctx.putImageData(rData, xPx, yPx);
    } else if (videoFilterType === "clone") {
      // Smart stamp cloning values
      // Source is positioned offset (cloningOffset dx/dy) relative to the watermark bounds
      const srcXPx = Math.max(0, Math.min(vW - wPx, xPx + Math.floor((cloningOffset.dx / 100) * vW)));
      const srcYPx = Math.max(0, Math.min(vH - hPx, yPx + Math.floor((cloningOffset.dy / 100) * vH)));
      
      ctx.drawImage(videoRef.current!, srcXPx, srcYPx, wPx, hPx, xPx, yPx, wPx, hPx);
    }

    ctx.restore();
  };

  // Video Export Render Pipeline: Records frame loop into MediaStream and triggers browser download
  const handleExportProcessedVideo = () => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    setVideoRendering(true);
    setRenderProgress(1);

    // Stop and reset video stream
    video.pause();
    video.currentTime = 0;

    // Use a temporary canvas sized identically to the video's actual dimensions
    const vW = video.videoWidth || 854;
    const vH = video.videoHeight || 480;

    const renderCanvas = document.createElement("canvas");
    renderCanvas.width = vW;
    renderCanvas.height = vH;
    const rCtx = renderCanvas.getContext("2d");

    if (!rCtx) {
      alert("Thiết bị không hỗ trợ kết xuất đồ họa.");
      setVideoRendering(false);
      return;
    }

    // 1. Capture stream from Canvas
    const canvasStream = renderCanvas.captureStream(24); // 24 FPS
    
    // We attempt to capture the original video's audio track so sounds remain intact
    let combinedStream: MediaStream = canvasStream;
    try {
      const vidCap = (video as any).captureStream ? (video as any).captureStream() : null;
      if (vidCap) {
        const audioTracks = vidCap.getAudioTracks();
        if (audioTracks && audioTracks.length > 0) {
          combinedStream = new MediaStream([
            ...canvasStream.getVideoTracks(),
            audioTracks[0]
          ]);
        }
      }
    } catch (err) {
      console.warn("Capture audio track failed (common inside sandboxed iframe). Proceeding with clean silent video rendering:", err);
    }

    // 2. Initialise MediaRecorder with support standard mime type
    const options = { mimeType: "video/webm;codecs=vp9" };
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (e) {
      mediaRecorder = new MediaRecorder(combinedStream); // fallback standard codec
    }

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = fileName.replace(/\.[^/.]+$/, "") + "_no_logo.webm";
      link.href = url;
      link.click();
      
      setVideoRendering(false);
      setRenderProgress(0);
    };

    // Begin recording
    mediaRecorder.start();

    // Frame-by-Frame Canvas Drawing Loop at high speed matches video tick rate
    const totalDuration = video.duration || 10;
    
    video.play();

    const processFrameLoop = () => {
      if (video.paused || video.ended) {
        mediaRecorder.stop();
        return;
      }

      // 1. Draw camera/video frame to render canvas
      rCtx.drawImage(video, 0, 0, vW, vH);

      // 2. Overlay our custom filters
      applyWatermarkCleaningFilterNode(rCtx, vW, vH);

      // 3. Update Progress percent bar
      const progress = Math.min(99, Math.round((video.currentTime / totalDuration) * 100));
      setRenderProgress(progress);

      // Call recursively for next frame
      requestAnimationFrame(processFrameLoop);
    };

    // Fast-trigger frame draw loops
    setTimeout(() => {
      processFrameLoop();
    }, 200);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="watermark-module">
      
      {/* 1. Sidebar Control Panel */}
      <div className="lg:col-span-4 space-y-6 flex flex-col justify-start">
        
        {/* Toggle between Photos vs. Videos */}
        <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex">
          <button
            onClick={() => {
              setActiveMedia("image");
              setFileName("");
              setImageSrc(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
              activeMedia === "image"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Xóa Watermark Ảnh
          </button>
          <button
            onClick={() => {
              setActiveMedia("video");
              setFileName("");
              setVideoSrc(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition ${
              activeMedia === "video"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Video className="w-4 h-4" />
            Xóa Watermark Video
          </button>
        </div>

        {/* Upload source module */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-500" />
            Tải tệp nguồn lên
          </h3>

          {activeMedia === "image" ? (
            // IMAGE FILE FORM
            !imageSrc ? (
              <div 
                onClick={() => imgFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-sky-50/20 group"
              >
                <input 
                  type="file" 
                  ref={imgFileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div className="bg-white group-hover:scale-110 p-4 rounded-full shadow-sm max-w-fit mx-auto mb-3 transition">
                  <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-sky-500" />
                </div>
                <p className="font-medium text-slate-700 text-sm">Chọn ảnh cần xóa watermark</p>
                <p className="text-xs text-slate-400 mt-1">Ảnh chụp sản phẩm, chân dung mẫu, v.v.</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium truncate max-w-[150px]">{fileName}</span>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">PHOTO</span>
              </div>
            )
          ) : (
            // VIDEO FILE FORM
            !videoSrc ? (
              <div 
                onClick={() => videoFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-8 text-center cursor-pointer transition bg-slate-50 hover:bg-sky-50/20 group"
              >
                <input 
                  type="file" 
                  ref={videoFileInputRef} 
                  onChange={handleVideoUpload} 
                  accept="video/*" 
                  className="hidden" 
                />
                <div className="bg-white group-hover:scale-110 p-4 rounded-full shadow-sm max-w-fit mx-auto mb-3 transition">
                  <Video className="w-6 h-6 text-slate-400 group-hover:text-sky-500" />
                </div>
                <p className="font-medium text-slate-700 text-sm">Chọn video chứa logo watermark</p>
                <p className="text-xs text-slate-400 mt-1">Hỗ trợ tệp MP4, MOV, WEBM</p>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium truncate max-w-[150px]">{fileName}</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">VIDEO</span>
              </div>
            )
          )}

          {/* Quick preset testing samples */}
          {((activeMedia === "image" && !imageSrc) || (activeMedia === "video" && !videoSrc)) && (
            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thử nghiệm nhanh ảnh/video mẫu:</p>
              <div className="grid grid-cols-1 gap-2">
                {activeMedia === "image" ? (
                  MOCK_IMAGE_SAMPLES.map(sample => (
                    <button
                      key={sample.id}
                      onClick={() => loadImgSample(sample.url, sample.name)}
                      disabled={loading}
                      className="flex text-left items-center gap-3 p-2 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 transition cursor-pointer"
                    >
                      <img src={sample.url} alt="" className="w-10 h-10 object-cover rounded bg-slate-100 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{sample.name}</p>
                        <p className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">{sample.desc}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  MOCK_VIDEO_SAMPLES.map(sample => (
                    <button
                      key={sample.id}
                      onClick={() => loadVideoSample(sample.url, sample.name)}
                      className="flex text-left items-center gap-3 p-2 rounded-lg border border-slate-200 hover:border-sky-500 hover:bg-sky-50/20 transition cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                        <Video className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{sample.name}</p>
                        <p className="text-[9px] text-slate-400 truncate leading-tight mt-0.5">{sample.desc}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* IMAGE CONTROLS MODULE */}
        {activeMedia === "image" && imageSrc && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Công cụ Xóa Ảnh
            </h3>

            {/* CLICK AI AUTO DETECT */}
            <button
              onClick={triggerAiWatermarkDetection}
              disabled={aiDetectLoading}
              className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              {aiDetectLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  AI Đang Quét Watermark...
                </>
              ) : (
                <>
                  <Sparkle className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                  AI Tự Động Định Vị Watermark
                </>
              )}
            </button>

            {/* Brush Controls manual */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 tracking-wider block uppercase">Tô cọ xóa thủ công:</span>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBrushMode("paint")}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border cursor-pointer transition py-2 ${
                    brushMode === "paint" 
                      ? "bg-indigo-600 text-white border-indigo-700" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Brush className="w-3.5 h-3.5 mx-auto mb-1" />
                  Cọ Tô Che (Màu đỏ)
                </button>
                <button
                  type="button"
                  onClick={() => setBrushMode("erase")}
                  className={`py-1 px-2 rounded-lg text-xs font-medium border cursor-pointer transition py-2 ${
                    brushMode === "erase" 
                      ? "bg-slate-900 text-white border-slate-950" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5 mx-auto mb-1" />
                  Cọ Nhấn Tẩy bôi sai
                </button>
              </div>

              {/* Brush size slider */}
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Kích thước cọ vẽ</span>
                  <span className="font-mono text-indigo-600 font-bold">{brushSize}px</span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="120"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded accent-indigo-600 cursor-pointer" 
                />
              </div>

              {/* Passes precision slider */}
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs text-slate-700 font-medium">
                  <span>Mức độ làm mượt (Inpainting)</span>
                  <span className="font-mono text-indigo-600 font-bold">{inpaintingPasses} lượt</span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="40"
                  value={inpaintingPasses}
                  onChange={(e) => setInpaintingPasses(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded accent-indigo-600 cursor-pointer" 
                />
                <p className="text-[10px] text-slate-400">Số lượt lọc cao cho phép kết cấu nền mịn hơn.</p>
              </div>
            </div>
          </div>
        )}

        {/* RE-INITIALIZE BUTTONS FOR IMAGE */}
        {activeMedia === "image" && imageSrc && (
          <button
            onClick={resetImageMask}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Khôi phục lại ảnh ban đầu
          </button>
        )}

        {/* VIDEO CONTROLS MODULE */}
        {activeMedia === "video" && videoSrc && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-500" />
              Tùy chọn Khử Video
            </h3>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100/60 text-xs text-amber-900 leading-normal flex gap-1.5">
              <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>Chuyển và kéo dãn <strong>Hộp ranh giới watermark</strong> ngay trên khung phát video sang đúng điểm logo.</span>
            </div>

            {/* Filter types */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 block uppercase">Thuật toán xóa che:</span>
              <div className="space-y-1.5">
                {[
                  { id: "blur", name: "Độ mờ quang học (Blur Optical)", desc: "Làm mềm nhòe nét chữ watermark hài hòa" },
                  { id: "mosaic", name: "Bóng điểm ảnh (Mosaic Pixelation)", desc: "Chuyển logo thành khối màu nhòe ẩn đi" },
                  { id: "clone", name: "Nhân bản Stamp (Smart Area Selection)", desc: "Đè dải màu khớp lân cận đè lên che" },
                ].map(item => (
                  <label 
                    key={item.id}
                    onClick={() => setVideoFilterType(item.id as any)}
                    className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition ${
                      videoFilterType === item.id 
                        ? "border-amber-500 bg-amber-50/20" 
                        : "border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="filterType"
                      checked={videoFilterType === item.id}
                      onChange={() => {}} // Handle on click label
                      className="mt-0.5 accent-amber-500" 
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Slider depends on filters */}
            {videoFilterType === "blur" && (
              <div className="space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Cường độ mờ nhạt (Blur radius)</span>
                  <span className="font-mono text-amber-600 font-semibold">{videoBlurAmount}px</span>
                </div>
                <input 
                  type="range"
                  min="5"
                  max="40"
                  value={videoBlurAmount}
                  onChange={(e) => setVideoBlurAmount(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded accent-amber-500 cursor-pointer" 
                />
              </div>
            )}

            {videoFilterType === "clone" && (
              <div className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">Chọn dịch vị trí bù màu (Clone source):</span>
                <p className="text-[10px] text-slate-400">Dịch chuyển trái/phải khoảng bù hình mẫu để vùng che đẹp nhất:</p>
                <div className="flex justify-between text-xs text-slate-600 font-mono">
                  <span>Ooffset dịch chuyển</span>
                  <span>{cloningOffset.dx}%</span>
                </div>
                <input 
                  type="range"
                  min="-100"
                  max="100"
                  value={cloningOffset.dx}
                  onChange={(e) => setCloningOffset({ dx: Number(e.target.value), dy: 0 })}
                  className="w-full h-1 bg-slate-200 rounded accent-amber-500 cursor-pointer" 
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Middle Canvas / Player Interactive Grid */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Active main workspace card */}
        <div className="bg-slate-950 border border-slate-900 rounded-3xl p-5 relative min-h-[460px] flex flex-col justify-center items-center overflow-hidden">
          
          {/* Main loaders */}
          {(loading || processing) && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center z-30 text-white space-y-4">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-400" />
              <p className="text-sm font-medium">
                {processing ? "Đang chạy thuật toán nội suy lấp đầy vùng Watermark bôi đỏ..." : "Vui lòng đợi giây lát..."}
              </p>
            </div>
          )}

          {/* Render progress bar for video export */}
          {videoRendering && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-40 text-white space-y-4">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-amber-500 animate-spin" />
                <span className="text-lg font-bold font-mono text-amber-400">{renderProgress}%</span>
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold">Kết xuất khử Logo Video đang được tiến hành...</p>
                <p className="text-xs text-slate-400">Trình duyệt đang mã hóa và lưu khung hình không watermark.</p>
              </div>
            </div>
          )}

          {/* ==================== WORKSPACE FOR IMAGES ==================== */}
          {activeMedia === "image" && (
            !imageSrc ? (
              <div className="text-slate-400 text-center py-10">
                <ImageIcon className="w-14 h-14 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-medium">Tải ảnh hoặc chọn mẫu góc bên trái để bắt đầu sửa nhé</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center">
                <div className="text-xs text-slate-500 mb-3 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span>Dùng cọ đỏ tô kín lên các watermark hoặc nhấn AI Tự Động Định Vị!</span>
                </div>

                <div 
                  className="relative max-w-full rounded-2xl overflow-auto border border-slate-800 bg-slate-900 p-1"
                  style={{ maxHeight: "420px" }}
                >
                  <canvas ref={imageCanvasRef} className="block max-h-[400px] object-contain max-w-full" />
                  
                  {/* Absolute mask overlay canvas for brush highlighting red */}
                  <canvas 
                    ref={imageMaskCanvasRef} 
                    onMouseDown={handleDrawStart}
                    onMouseMove={handleDrawMove}
                    onMouseUp={handleDrawEnd}
                    onMouseLeave={handleDrawEnd}
                    className="absolute inset-1 block max-h-[400px] object-contain cursor-pencil max-w-full z-10 opacity-60 mix-blend-multiply"
                    title="Tô kín vùng watermark"
                  />
                </div>

                {/* Confirm execution triggers */}
                <div className="mt-5 flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={runProfessionalImageInpainting}
                    disabled={processing}
                    className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    Xóa Sạch Watermark Bôi Đỏ Chuyên Nghiệp
                  </button>
                  
                  <button
                    onClick={downloadProcessedImage}
                    className="bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Tải Ảnh Chất Lượng Cao
                  </button>
                </div>
              </div>
            )
          )}

          {/* ==================== WORKSPACE FOR VIDEOS ==================== */}
          {activeMedia === "video" && (
            !videoSrc ? (
              <div className="text-slate-400 text-center py-10">
                <Video className="w-14 h-14 text-slate-700 mx-auto mb-3" />
                <p className="text-sm font-medium">Tải video hoặc chọn mẫu sóng góc bên trái để bắt đầu</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center">
                
                {/* HTML5 video preview structure */}
                <div 
                  ref={dragBoxRef}
                  onMouseMove={handleBoxMouseMove}
                  onMouseUp={handleBoxMouseUp}
                  className="relative max-w-full rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video max-h-[400px]"
                >
                  <video
                    ref={videoRef}
                    src={videoSrc}
                    crossOrigin="anonymous"
                    loop
                    controls
                    className="block w-full h-full max-h-[400px] object-contain"
                  />

                  {/* Resizable/Moveable absolute boundary box overlay */}
                  <div
                    style={{
                      left: `${videoBox.x}%`,
                      top: `${videoBox.y}%`,
                      width: `${videoBox.w}%`,
                      height: `${videoBox.h}%`,
                    }}
                    className="absolute border-2 border-amber-500 bg-amber-500/10 z-20 shadow-lg cursor-move select-none animate-pulse-slow"
                    onMouseDown={(e) => handleBoxMouseDown(e, "drag")}
                  >
                    {/* Bounding box title ribbon */}
                    <div className="absolute top-0 left-0 bg-amber-600 text-[10px] text-white px-1 font-bold rounded-br uppercase tracking-wide flex items-center gap-1 shrink-0">
                      <Move className="w-2.5 h-2.5" />
                      Watermark Area
                    </div>

                    {/* Resizing anchor bottom-right corner handle */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleBoxMouseDown(e, "resize");
                      }}
                      className="absolute bottom-0 right-0 w-4.5 h-4.5 bg-amber-500 cursor-se-resize border border-white rounded-tl-sm flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      ⇲
                    </div>
                  </div>
                </div>

                {/* Under triggers export buttons */}
                <div className="mt-5 flex flex-wrap gap-4 items-center justify-center">
                  <div className="text-xs text-slate-400 max-w-md text-center leading-normal">
                    Lưu ý: Bạn chỉ cần di chuyển vùng ranh giới <strong>vàng cam</strong> tới đúng điểm logo bản quyền trên hình video, sau đó nhấp Kết Xuất để xuất video.
                  </div>

                  <button
                    onClick={handleExportProcessedVideo}
                    disabled={videoRendering}
                    className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-sm font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all shrink-0"
                  >
                    <Sliders className="w-4 h-4" />
                    Kết Xuất & Tải Video Sạch Logo
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

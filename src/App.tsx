/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, Image as ImageIcon, Video, Layers, Wand2, Heart,
  Settings, PanelsRightBottom, Columns, Compass, Info, HelpCircle,
  Scissors, PlayCircle, Minimize, Undo2, RefreshCw, 
  Palette, Download, Upload, ZoomIn, Grid, HelpCircle as HelpIcon,
  MousePointer, Crop, Eye, Sliders, Brush, Eraser, FileText, CheckCircle, Flame,
  Maximize2, Activity, Play, Zap, Check, ChevronDown
} from "lucide-react";

// Components
import BackgroundRemover from "./components/BackgroundRemover";
import WatermarkRemover from "./components/WatermarkRemover";
import PhotoEditor from "./components/PhotoEditor";

interface HistoryLog {
  id: string;
  action: string;
  time: string;
  type: "system" | "ai" | "user";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"background" | "beauty" | "watermark">("beauty");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [showLayers, setShowLayers] = useState<boolean>(true);
  const [photoshopTheme, setPhotoshopTheme] = useState<"dark-nordic" | "obsidian" | "classic-studio">("dark-nordic");
  const [statusBarMsg, setStatusBarMsg] = useState<string>("Sẵn sàng xử lý hình ảnh...");
  const [quickTips, setQuickTips] = useState<string>("Mẹo: Hãy sử dụng cọ bóp dáng để cân chỉnh thon gọn gương mặt, đùi, eo.");

  // History system
  const [historyList, setHistoryList] = useState<HistoryLog[]>([
    { id: "1", action: "Khởi tạo Photoshop Studio AI", time: "09:41", type: "system" },
    { id: "2", action: "Đã nạp công cụ chỉnh màu Thể Thao", time: "09:42", type: "system" },
    { id: "3", action: "Mở Workspace Làm Đẹp & Thon Dáng", time: "09:43", type: "user" }
  ]);

  // Update status bar when tab changes
  useEffect(() => {
    if (activeTab === "background") {
      setStatusBarMsg("Workspace: Tách Nền AI - Cắt phông nền bằng giải thuật Edge Smart Masking.");
      setQuickTips("Mẹo: Dùng tính năng Tách Nền để tự động tách đối tượng sản phẩm hoặc mẫu người.");
      addHistory("Kích hoạt Tách Nền AI", "user");
    } else if (activeTab === "beauty") {
      setStatusBarMsg("Workspace: Làm Đẹp & Chỉnh Màu - Thao tác mịn da, nâng tông hồng hào & bóp dáng.");
      setQuickTips("Mẹo: Nhấn và giữ chuột để bóp nhỏ cằm V-line hoặc hông eo trực tiếp trên ảnh.");
      addHistory("Kích hoạt Chỉnh Màu & Làm Đẹp", "user");
    } else {
      setStatusBarMsg("Workspace: Xóa Watermark & Logo - Định vị pixel phục hồi ảnh & video.");
      setQuickTips("Mẹo: Vẽ vùng chứa logo hoặc chữ chìm, trí tuệ nhân tạo sẽ tự lấp đầy lỗ hổng.");
      addHistory("Kích hoạt Xóa Logo/Watermark", "user");
    }
  }, [activeTab]);

  const addHistory = (action: string, type: "system" | "ai" | "user") => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setHistoryList(prev => [
      ...prev,
      { id: Date.now().toString(), action, time: timeStr, type }
    ]);
  };

  const handleZoom = (direction: "in" | "out" | "fit") => {
    if (direction === "in") setZoomLevel(prev => Math.min(prev + 25, 200));
    else if (direction === "out") setZoomLevel(prev => Math.max(prev - 25, 50));
    else setZoomLevel(100);
    setStatusBarMsg(`Tỉ lệ thu phóng hiển thị: ${direction === "fit" ? "100" : zoomLevel}%`);
  };

  const alertComingSoon = (feature: string) => {
    setStatusBarMsg(`Yêu cầu '${feature}' đã được ghi nhận. Hệ thống đang đồng bộ Cloud Creative Suite.`);
    addHistory(`Yêu cầu tính năng: ${feature}`, "user");
  };

  const themeClasses = {
    "dark-nordic": {
      bg: "bg-[#0f1115]",
      panelBg: "bg-[#161920]",
      toolbarBg: "bg-[#1b1f27]",
      border: "border-slate-800/80",
      itemHover: "hover:bg-slate-800/60",
      accent: "text-rose-500",
      badgeBg: "bg-rose-500/10 text-rose-400 border-rose-500/20"
    },
    obsidian: {
      bg: "bg-[#09090b]",
      panelBg: "bg-[#111113]",
      toolbarBg: "bg-[#161619]",
      border: "border-zinc-800/80",
      itemHover: "hover:bg-zinc-800/60",
      accent: "text-[#00c8ff]",
      badgeBg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
    },
    "classic-studio": {
      bg: "bg-[#1c1d1f]",
      panelBg: "bg-[#252629]",
      toolbarBg: "bg-[#2d2e32]",
      border: "border-[#1e1f22]",
      itemHover: "hover:bg-slate-700/60",
      accent: "text-amber-500",
      badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20"
    }
  };

  const cTheme = themeClasses[photoshopTheme];

  return (
    <div className={`min-h-screen ${cTheme.bg} text-slate-200 antialiased font-sans flex flex-col justify-between overflow-x-hidden`} id="photoshop-v2026">
      
      {/* 1. APP BAR HEADER (Modern Apple/Lightroom Hybrid Header with Glassy Design) */}
      <header className={`${cTheme.panelBg} border-b ${cTheme.border} px-4 py-2.5 flex items-center justify-between z-50 sticky top-0 backdrop-blur-md bg-opacity-95 select-none`}>
        <div className="flex items-center gap-6">
          {/* Brand Logo with gradient effect */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-rose-500 to-indigo-600 text-white font-extrabold px-2.5 py-1 rounded-lg text-sm tracking-tighter shadow-md shadow-rose-500/10 border border-rose-400/20 flex items-center gap-1.5 font-mono">
              <span>Ps</span>
              <span className="text-[9px] font-bold bg-white/20 px-1 rounded">AI</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-150 tracking-tight leading-none flex items-center gap-2">
                Photoshop AI Studio
              </h1>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-wider uppercase">Chuỗi Đám Mây Sáng Tạo (Cloud Creative)</p>
            </div>
          </div>

          <div className="hidden lg:h-6 lg:w-[1px] lg:bg-slate-800/50"></div>

          {/* Clean Menu Bar */}
          <nav className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-slate-400">
            {["Tệp tin (File)", "Chỉnh sửa (Edit)", "Hình ảnh (Image)", "Bộ lọc AI (Filter)", "Giao diện (View)", "Trợ giúp"].map((menu, i) => (
              <div 
                key={i} 
                onClick={() => alertComingSoon(menu.split(" ")[0])}
                className={`px-3 py-1.5 rounded-md ${cTheme.itemHover} hover:text-slate-100 transition cursor-pointer`}
              >
                {menu}
              </div>
            ))}
          </nav>
        </div>

        {/* Toolbar Center Workspace Selection tab controller (distinct separate rounded pills) */}
        <div className="flex items-center bg-[#00000033] p-1 rounded-xl border border-slate-800/60 shadow-inner">
          <button
            onClick={() => setActiveTab("beauty")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === "beauty"
                ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Làm Đẹp Chân Dung & Màu Thể Thao
          </button>

          <button
            onClick={() => setActiveTab("background")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === "background"
                ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tách Ghép Nền AI
          </button>

          <button
            onClick={() => setActiveTab("watermark")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === "watermark"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Xóa Logo & Watermark
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Modern Theme Switch Switcher */}
          <div className="hidden sm:flex bg-slate-900/60 p-0.5 rounded-lg border border-slate-800 text-slate-400 gap-1 text-[10px]">
            <button
              onClick={() => setPhotoshopTheme("dark-nordic")}
              className={`px-2 py-1 rounded transition ${photoshopTheme === "dark-nordic" ? "bg-slate-800 text-slate-100 font-bold" : ""}`}
            >
              Phông Tối Nordic
            </button>
            <button
              onClick={() => setPhotoshopTheme("obsidian")}
              className={`px-2 py-1 rounded transition ${photoshopTheme === "obsidian" ? "bg-slate-800 text-slate-100 font-bold" : ""}`}
            >
              Huyền Bí Obsidian
            </button>
            <button
              onClick={() => setPhotoshopTheme("classic-studio")}
              className={`px-2 py-1 rounded transition ${photoshopTheme === "classic-studio" ? "bg-slate-800 text-slate-100 font-bold" : ""}`}
            >
              Phòng Studio
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold bg-emerald-950/50 text-emerald-400 px-3 py-1 rounded-full border border-emerald-920">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse block"></span>
            <span className="hidden xs:inline">Động cơ Gemini 3.5</span>
          </div>
        </div>
      </header>

      {/* 2. PROPERTIES OVERVIEW BAR (Informative, sleek, minimal info banner) */}
      <section className="bg-slate-950 px-4 py-2 border-b border-slate-900 text-xs flex flex-wrap items-center justify-between text-slate-400 select-none">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-500 text-[10px] uppercase font-mono tracking-wider">Hồ sơ màu:</span>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold font-mono ${cTheme.badgeBg}`}>
              {activeTab === "beauty" ? "Bộ chỉnh chân dung" : activeTab === "background" ? "Mặt nạ kênh Alpha" : "Mảnh xóa logo"}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-350 font-medium">{statusBarMsg}</span>
          </div>
        </div>

        {/* Zoom and Grid quick settings */}
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1 rounded flex items-center gap-1 text-[10px] border border-transparent hover:bg-slate-800 transition ${showGrid ? "text-rose-400" : "text-slate-500"}`}
            title="Hiện lưới pixel"
          >
            <Grid className="w-3.5 h-3.5" />
            <span>{showGrid ? "Tắt lưới" : "Bật lưới"}</span>
          </button>

          <button 
            onClick={() => setShowLayers(!showLayers)}
            className={`p-1 rounded flex items-center gap-1 text-[10px] border border-transparent hover:bg-slate-800 transition ${showLayers ? "text-rose-450" : "text-slate-500"}`}
            title="Đóng / Mở bảng giám sát bên phải"
          >
            <PanelsRightBottom className="w-3.5 h-3.5" />
            <span>Cột giám sát</span>
          </button>

          <div className="w-[1px] h-3 bg-slate-800"></div>

          <div className="flex items-center gap-1 bg-slate-900 rounded-md p-0.5 border border-slate-800">
            <button onClick={() => handleZoom("out")} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white font-mono font-bold hover:bg-slate-800 rounded">
              -
            </button>
            <span className="px-1.5 text-[10px] text-slate-300 font-mono font-bold leading-none">{zoomLevel}%</span>
            <button onClick={() => handleZoom("in")} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white font-mono font-bold hover:bg-slate-800 rounded">
              +
            </button>
            <button onClick={() => handleZoom("fit")} className="px-1.5 h-5 flex items-center justify-center text-xs text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded border-l border-slate-800">
              Khớp
            </button>
          </div>
        </div>
      </section>

      {/* 3. WORKING VIEWPORT FRAME (Sidebar Left - Creative Space Center - Sidebar Right) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* A. LEFT TOOL BOX (Clean physical tool icons with labels and separated categories) */}
        <aside className={`${cTheme.toolbarBg} border-r ${cTheme.border} w-[64px] flex flex-col items-center py-4 gap-4 shrink-0 select-none`}>
          <div className="font-mono text-[9px] text-slate-500 tracking-wider uppercase text-center pb-2 border-b border-slate-800/60 w-full">Hộp cọ</div>

          {/* Group 1: General Move Tool */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button 
              onClick={() => setStatusBarMsg("Đã chọn công cụ Di chuyển đối tượng.")}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:bg-slate-800/80 hover:text-white transition group relative"
              title="Công cụ Di chuyển (Move Tool)"
            >
              <MousePointer className="w-4 h-4 text-slate-300 group-hover:scale-110 transition" />
              <span className="text-[8px] text-slate-500 mt-0.5">Kéo ảnh</span>
            </button>
          </div>

          <div className="w-8 h-[1px] bg-slate-800/60"></div>

          {/* Group 2: AI Workspaces Trigger Buttons */}
          <div className="flex flex-col items-center gap-2 w-full">
            <button 
              onClick={() => setActiveTab("beauty")}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                activeTab === "beauty"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
              title="Làm Đẹp Chân Dung (Mịn da / Bóp eo)"
            >
              <Heart className="w-4 h-4" />
              <span className="text-[8px] mt-0.5 font-bold leading-none">Màu sắc</span>
            </button>

            <button 
              onClick={() => setActiveTab("background")}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                activeTab === "background"
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/10"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
              title="Tách & Thay Thế Nền AI"
            >
              <Layers className="w-4 h-4" />
              <span className="text-[8px] mt-0.5 font-bold leading-none">Cắt nền</span>
            </button>

            <button 
              onClick={() => setActiveTab("watermark")}
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all ${
                activeTab === "watermark"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
              title="Xóa Logo / Phục hồi Watermark"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-[8px] mt-0.5 font-bold leading-none">Xóa logo</span>
            </button>
          </div>

          <div className="w-8 h-[1px] bg-slate-800/60"></div>

          {/* Group 3: Virtual Tools */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            <button 
              onClick={() => alertComingSoon("Bút Vẽ Tự Do (Pen Tool)")}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-emerald-400 transition"
              title="Bút vẽ tự do Pen Tool (P)"
            >
              <Wand2 className="w-4 h-4" />
              <span className="text-[8px] mt-0.5">Bút</span>
            </button>

            <button 
              onClick={() => alertComingSoon("Cọ sơn vẽ mờ (Soft Brush)")}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-pink-400 transition"
              title="Cọ sơn phủ mờ Brush (B)"
            >
              <Brush className="w-4 h-4" />
              <span className="text-[8px] mt-0.5">Tô cọ</span>
            </button>

            <button 
              onClick={() => alertComingSoon("Cắt Xén Tỷ Lệ (Auto-Crop)")}
              className="w-10 h-10 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-800 hover:text-amber-400 transition"
              title="Cắt cúp ảnh Crop Tool (C)"
            >
              <Crop className="w-4 h-4" />
              <span className="text-[8px] mt-0.5">Cắt ảnh</span>
            </button>
          </div>

          <div className="flex-1"></div>

          <button 
            onClick={() => alertComingSoon("Cài đặt hệ thống nâng cao")}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 transition"
            title="Cài đặt (Settings)"
          >
            <Settings className="w-4 h-4" />
          </button>
        </aside>

        {/* B. MAIN CANVAS PANEL VIEWPORT (Spacious, elegant layout designed like a high-end application slate) */}
        <main className="flex-1 bg-[#101216] flex flex-col overflow-auto relative">
          
          {/* Document dynamic file tab header strip */}
          <div className="bg-[#15181f] border-b border-slate-900/80 flex items-center text-xs text-slate-400 select-none overflow-x-auto min-h-[38px] max-h-[38px] scrollbar-none">
            
            <button
              onClick={() => setActiveTab("beauty")}
              className={`px-5 h-full flex items-center gap-2 border-r border-slate-900/60 transition-all cursor-pointer ${
                activeTab === "beauty"
                  ? "bg-[#101216] text-slate-150 font-bold border-t-2 border-rose-500"
                  : "bg-transparent text-slate-500 hover:bg-slate-800/40"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Làm_Đẹp_Chân_Dung.psd</span>
              <span className="text-[9px] text-slate-600 font-mono">@ {zoomLevel}%</span>
            </button>

            <button
              onClick={() => setActiveTab("background")}
              className={`px-5 h-full flex items-center gap-2 border-r border-slate-900/60 transition-all cursor-pointer ${
                activeTab === "background"
                  ? "bg-[#101216] text-slate-150 font-bold border-t-2 border-sky-500"
                  : "bg-transparent text-slate-500 hover:bg-slate-800/40"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              <span>Tách_Thay_Nền_AI.psd</span>
              <span className="text-[9px] text-slate-600 font-mono">@ {zoomLevel}%</span>
            </button>

            <button
              onClick={() => setActiveTab("watermark")}
              className={`px-5 h-full flex items-center gap-2 border-r border-slate-900/60 transition-all cursor-pointer ${
                activeTab === "watermark"
                  ? "bg-[#101216] text-slate-150 font-bold border-t-2 border-indigo-500"
                  : "bg-transparent text-slate-500 hover:bg-slate-800/40"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span>Xóa_Watermark_Logo.psd</span>
              <span className="text-[9px] text-slate-600 font-mono">@ {zoomLevel}%</span>
            </button>

            <div className="flex-1"></div>
            
            <span className="px-4 text-[10px] text-slate-500 font-mono uppercase tracking-wider hidden md:block select-none">
              Không gian màu: Dải rộng sRGB (8-bit)
            </span>
          </div>

          {/* Master layout Stage containing components */}
          <div className="flex-1 p-6 md:p-8 flex flex-col h-full bg-[#101216]">
            
            {/* Elegant info dashboard bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-900 border border-slate-800/60 p-4 rounded-xl mb-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  Giao diện Photoshop AI Chuyên Nghiệp
                </span>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-tight leading-none">
                  {activeTab === "beauty" 
                    ? "✨ PORTRAIT RETAINING CÀ MỊN DA & MÀU SẮC THỂ THAO" 
                    : activeTab === "background" 
                    ? "🤖 TÁCH GHÉP BACKGROUND & CHÈN PHÔNG NỂN TỰ ĐỘNG" 
                    : "🔒 LOẠI BỎ CHỮ CHÌM WATERMARK / LOGO THÔNG MINH"
                  }
                </h2>
              </div>

              {/* Status metrics bar */}
              <div className="flex items-center gap-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80 shrink-0 text-[11px] text-slate-400">
                <span>Bộ tăng tốc đồ họa:</span>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">KÍCH HOẠT (60 FPS)</span>
              </div>
            </div>

            {/* Container for active editor */}
            <div 
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center", transition: "transform 0.1s ease-out" }}
              className={`w-full h-full relative transition-all ${
                showGrid ? "bg-[linear-gradient(to_right,#3341551c_1px,transparent_1px),linear-gradient(to_bottom,#3341551c_1px,transparent_1px)] bg-[size:30px_30px]" : ""
              }`}
            >
              <div className="opacity-100 transition-opacity duration-300">
                {activeTab === "background" ? (
                  <BackgroundRemover />
                ) : activeTab === "beauty" ? (
                  <PhotoEditor />
                ) : (
                  <WatermarkRemover />
                )}
              </div>
            </div>

          </div>
        </main>

        {/* C. RIGHT INSPECTOR PANEL (Layout lists, Historial, Interactive Layers - perfectly sized) */}
        {showLayers && (
          <aside className={`w-[280px] bg-[#15181f] border-l ${cTheme.border} flex flex-col justify-start shrink-0 select-none`}>
            
            {/* Section 1: NAVIGATOR ZOOM MAP */}
            <div className="border-b border-slate-900/80">
              <div className="bg-[#1c202a] px-3.5 py-2 text-[10px] font-bold text-slate-400 flex justify-between items-center tracking-wider uppercase">
                <span>Bản Đồ Thu Phóng</span>
                <span className="text-[8px] bg-slate-800 text-slate-350 px-1 py-0.5 rounded font-mono font-bold">KÍNH TRỰC QUAN</span>
              </div>
              <div className="p-3.5 space-y-3">
                <div className="w-full h-24 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[#383a40] opacity-5 bg-[linear-gradient(to_right,#aaa_1px,transparent_1px),linear-gradient(to_bottom,#aaa_1px,transparent_1px)] bg-[size:8px_8px]" />
                  <ImageIcon className="w-8 h-8 text-slate-700/80" />
                  {/* Indicator Box showing viewport */}
                  <div className="absolute w-14 h-14 border border-rose-500 rounded p-1 pointer-events-none"></div>
                </div>
                <div className="flex gap-2 justify-between items-center text-[10px] text-slate-400">
                  <span>Trạng thái: Khung tiêu chuẩn</span>
                  <button 
                    onClick={() => setZoomLevel(100)} 
                    className="text-rose-450 hover:underline cursor-pointer font-bold"
                  >
                    Mặc định (100%)
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: EDITING HISTORY (Classic Photoshop step recording) */}
            <div className="border-b border-slate-900/80 flex-1 flex flex-col justify-start min-h-[160px]">
              <div className="bg-[#1c202a] px-3.5 py-2 text-[10px] font-bold text-slate-400 flex justify-between items-center tracking-wider uppercase">
                <span>Quy Trình Hành Động (History)</span>
                <button 
                  onClick={() => {
                    setHistoryList([
                      { id: "1", action: "Khởi tạo Photoshop Studio AI", time: "09:41", type: "system" }
                    ]);
                    setStatusBarMsg("Đã dọn dẹp lịch sử hành động!");
                  }} 
                  className="text-[9px] text-slate-500 hover:text-slate-300 transition shrink-0 cursor-pointer"
                >
                  Dọn dẹp
                </button>
              </div>
              
              <div className="p-3.5 space-y-2 overflow-y-auto max-h-[180px] lg:max-h-[220px] font-mono scrollbar-thin">
                {historyList.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-[10px] p-1 rounded hover:bg-slate-800/40 group">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.type === "ai" ? "bg-emerald-400" : log.type === "system" ? "bg-slate-600" : "bg-rose-400"}`}></span>
                      <span className="text-slate-300 truncate font-mono text-[10px] leading-tight font-medium select-all">{log.action}</span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-mono font-bold shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: ACTIVE LAYERS LIST (Beautiful interactive mock layers) */}
            <div className="h-[210px] border-b border-slate-900/80 flex flex-col justify-start">
              <div className="bg-[#1c202a] px-3.5 py-2 text-[10px] font-bold text-slate-400 flex justify-between items-center tracking-wider uppercase">
                <span>Danh sách Lớp (Layers)</span>
                <span className="text-[9px] text-slate-500 font-mono font-semibold">Chế độ hòa trộn: Thường</span>
              </div>

              <div className="p-3.5 space-y-2.5 overflow-y-auto font-sans flex-1">
                {/* Active Dynamic Layer item 1 */}
                <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-slate-950 border border-slate-700/60 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      <div className="absolute w-5 h-5 bg-slate-800 opacity-20 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:3px_3px]" />
                      <Wand2 className="w-4 h-4 text-rose-400 relative z-10 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-200 truncate leading-none">
                        Lớp 2: Bộ lọc AI Gemini
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5">Xử lý thời gian thực</p>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-rose-500 shrink-0" />
                </div>

                {/* Base Image item 2 */}
                <div className="bg-slate-900/40 rounded-lg p-2 border border-transparent flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded bg-slate-950 border border-slate-800 flex-shrink-0 flex items-center justify-center">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 truncate leading-none">
                        Lớp 1: Ảnh gốc ban đầu
                      </p>
                      <p className="text-[9px] text-slate-500 mt-0.5 font-sans">Chi tiết ảnh thô gốc</p>
                    </div>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>
              </div>
            </div>

          </aside>
        )}
      </div>

      {/* 4. bottom tip / guide string strip */}
      <div className="bg-slate-900 px-4 py-1 flex items-center justify-between text-[11px] text-rose-450 border-b border-slate-950/40 select-none">
        <div className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5 fill-rose-50" />
          <span className="font-medium">{quickTips}</span>
        </div>
      </div>

      {/* 5. APP BAR FOOTER (True Photoshop-style black footer bar) */}
      <footer className="bg-[#15181f] border-t border-slate-900/80 py-1.5 px-4 text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2.5 select-none z-50">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="bg-rose-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider font-mono">BẢN CHUYÊN NGHIỆP</span>
          <span className="text-slate-350 font-sans truncate">{statusBarMsg}</span>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500">
          <span>Phiên bản: 2026.06 (Studio CC)</span>
          <span className="hidden md:inline">|</span>
          <span>Người dùng: danggiathuan4@gmail.com</span>
          <span className="hidden md:inline">|</span>
          <span>Khối màu sắc: RGB 16-bit sRGB</span>
        </div>
      </footer>

    </div>
  );
}

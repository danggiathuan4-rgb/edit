import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 50mb limit for base64 media uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MISSING_GEMINI_API_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. AI Watermark Bounding Box Detection
app.post("/api/detect-watermark", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      res.status(400).json({ error: "Missing image data" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please set it in the Secrets panel in Settings."
      });
      return;
    }

    const ai = getAIClient();
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanBase64,
      },
    };

    const textPart = {
      text: "Analyze this image and identify the bounding boxes coordinates of any watermarks, logos, brand names, custom text overlays, or date-stamps created to lock or brand the content. Return the results as percentages from 0 to 100 relative to the image size (where x is percent from left, y is percent from top, and width/height are the box's percentage span). Formulate your output strictly mapping to the requested schema. If no watermark or logo is found, return detected as false."
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected: { type: Type.BOOLEAN },
            watermarks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.NUMBER, description: "Left offset coordinate in percentage (0 to 100)" },
                  y: { type: Type.NUMBER, description: "Top offset coordinate in percentage (0 to 100)" },
                  width: { type: Type.NUMBER, description: "Width span in percentage (1 to 100)" },
                  height: { type: Type.NUMBER, description: "Height span in percentage (1 to 100)" },
                  label: { type: Type.STRING, description: "A summary label of what watermark was detected" },
                },
                required: ["x", "y", "width", "height"],
              },
            },
          },
          required: ["detected", "watermarks"],
        },
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error in detect-watermark:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 2. AI Background Prompt Builder / Expansion Helper
app.post("/api/generate-bg-prompt", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Missing design prompt" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: "GEMINI_API_KEY is missing. Please set it in Settings > Secrets."
      });
      return;
    }

    const ai = getAIClient();
    const systemPrompt = "You are a professional Creative Prompt Engineer for state-of-the-art AI image generators (such as Imagen or Stable Diffusion). Expand the user's short background concept into a detailed, descriptive, visually striking backdrop prompt in English. Focus on lighting (e.g. volumetric, studio-soft, cinematic sunset), texture, color palette, camera setup (e.g. photorealistic 8k, shallow depth of field, macro lens), and background aesthetic. Avoid adding subjects, focus only on the scenery/backdrop itself. Keep the expanded prompt elegant and under 100 words. Translate into English matches if the concept is in Vietnamese.";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({
      original: prompt,
      expanded: response.text?.trim() || "A clean studio background with soft lighting and professional setup."
    });
  } catch (error: any) {
    console.error("Error expanding prompt:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// 3. AI Help and Tips Engine
app.post("/api/image-editing-tips", async (req, res) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      res.status(400).json({ error: "Missing image" });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: "GEMINI_API_KEY is missing."
      });
      return;
    }

    const ai = getAIClient();
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType: mimeType || "image/png",
        data: cleanBase64,
      },
    };

    const textPart = {
      text: "Nhìn vào bức ảnh này và đưa ra 3 lời khuyên ngắn gọn bằng tiếng Việt để chỉnh sửa: làm thế nào để tách nền sạch đẹp hơn, hoặc lời khuyên về tạo dáng, độ sáng và phông nền mới phù hợp với chủ thể này trong ảnh. Hãy trả lời ngắn đúng 3 gạch đầu dòng, ngôn ngữ tự nhiên, hữu ích."
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [imagePart, textPart] },
    });

    res.json({ tips: response.text || "• Điều chỉnh ánh sáng trước khi tách nền.\n• Sử dụng kích thước cọ nhỏ hơn để tẩy vùng tóc.\n• Thay nền có độ sâu trường ảnh để tạo cảm giác chân thực hơn nhẩt." });
  } catch (error: any) {
    console.error("Error in editing tips:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Setup dev server vs static serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer();

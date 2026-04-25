import axios from "axios";
import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import Tesseract from "tesseract.js";

const dotenvConfig = dotenv.config();
const dotenvEnv = dotenvConfig.parsed ?? {};

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const AI_RESPONSE_DIR = path.resolve(process.cwd(), "ai_responses");

type AiReferenceTradeResult = {
  stock_name: string | null;
  timeframe: string | null;
  entry: number | null;
  exit: number | null;
  target: number | null;
  stop_loss: number | null;
};

const parseJsonFromContent = (
  content: string,
): AiReferenceTradeResult | null => {
  try {
    return JSON.parse(content) as AiReferenceTradeResult;
  } catch {
    const fenced = content.match(/```json\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      try {
        return JSON.parse(fenced[1].trim()) as AiReferenceTradeResult;
      } catch {
        return null;
      }
    }
    return null;
  }
};

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const pruneAiResponses = (maxCount: number) => {
  const files = fs
    .readdirSync(AI_RESPONSE_DIR)
    .filter((file) => file.toLowerCase().endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(AI_RESPONSE_DIR, file);
      const stats = fs.statSync(fullPath);
      return { fullPath, mtimeMs: stats.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  for (const staleFile of files.slice(maxCount)) {
    fs.unlinkSync(staleFile.fullPath);
  }
};

const persistAiResponse = (prompt: string, parsed: AiReferenceTradeResult) => {
  if (!fs.existsSync(AI_RESPONSE_DIR)) {
    fs.mkdirSync(AI_RESPONSE_DIR, { recursive: true });
  }
  const promptFileName = sanitizeFileName(prompt) || "prompt";
  const timeframeFileName =
    sanitizeFileName(parsed.timeframe ?? "") || "no-timeframe";
  const generatedAt = new Date().toISOString();
  const timestamp = generatedAt.replace(/[:.]/g, "-");
  const filePath = path.join(
    AI_RESPONSE_DIR,
    `${promptFileName}-${timeframeFileName}-${timestamp}.json`,
  );
  const payload = {
    prompt,
    timeframe: parsed.timeframe,
    generated_at: generatedAt,
    response: parsed,
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), "utf-8");
  pruneAiResponses(5);
};

// Simple chat endpoint using LocalAI
router.post("/chat", async (req: Request, res: Response) => {
  try {
    const localAiBaseUrl =
      process.env.LOCALAI_BASE_URL || "http://localhost:8080/v1";
    const localAiModel = process.env.LOCALAI_MODEL;

    if (!localAiModel) {
      return res.status(500).json({
        message:
          "Missing LOCALAI_MODEL in backend environment (e.g. name of the model loaded in LocalAI)",
      });
    }

    const { messages } = req.body as {
      messages?: { role: "user" | "assistant" | "system"; content: string }[];
    };

    if (!messages || messages.length === 0) {
      return res
        .status(400)
        .json({
          message: "Request body must include non-empty messages array",
        });
    }

    const completionResponse = await axios.post(
      `${localAiBaseUrl}/chat/completions`,
      {
        model: localAiModel,
        messages,
        temperature: 0.3,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 300000,
      },
    );

    const content: unknown =
      completionResponse.data?.choices?.[0]?.message?.content;

    // if (typeof content !== "string" || !content.trim()) {
    // 	return res
    // 		.status(502)
    // 		.json({ message: "Invalid LocalAI response format" });
    // }

    return res.json({ reply: content });
  } catch (error: unknown) {
    console.error("AI chat error:", error);
    return res.status(500).json({ message: "Failed to process chat request" });
  }
});

router.post(
  "/reference-trade",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const ocrResult = await Tesseract.recognize(file.buffer, "eng");
      const ocrText = ocrResult.data.text?.trim();

      if (!ocrText) {
        return res
          .status(502)
          .json({ message: "Failed to extract text from image locally" });
      }

      const localAiBaseUrl =
        process.env.LOCALAI_BASE_URL || "http://localhost:8080/v1";
      const localAiModel = process.env.LOCALAI_MODEL;

      if (!localAiModel) {
        return res.status(500).json({
          message:
            "Missing LOCALAI_MODEL in backend environment (e.g. name of the model loaded in LocalAI)",
        });
      }

      const prompt =
        "You are a trading assistant. Extract the stock name, timeframe, entry, exit, target, and stop loss from the following text. " +
        "Return ONLY a valid JSON object with keys: stock_name, timeframe, entry, exit, target, stop_loss. " +
        "If a value is missing, set it to null.";
      console.log("prompt", prompt);
      const completionResponse = await axios.post(
        `${localAiBaseUrl}/chat/completions`,
        {
          model: localAiModel,
          messages: [
            { role: "system", content: prompt },
            {
              role: "user",
              content: `Text from screenshot:\n\n${ocrText}`,
            },
          ],
          temperature: 0,
        },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 300000,
        },
      );

      const text: unknown =
        completionResponse.data?.choices?.[0]?.message?.content;

      if (typeof text !== "string" || !text.trim()) {
        return res
          .status(502)
          .json({ message: "Invalid LocalAI response format" });
      }

      const parsed = parseJsonFromContent(text);
      if (!parsed) {
        return res.status(502).json({
          message: "Failed to parse LocalAI JSON response",
          raw: text,
        });
      }

      persistAiResponse(prompt, parsed);

      return res.json({ data: parsed });
    } catch (error: unknown) {
      console.error("AI reference-trade error:", error);
      return res
        .status(500)
        .json({ message: "Failed to process reference image" });
    }
  },
);

router.post(
  "/external-reference-trade",
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const externalModel =
        dotenvEnv.EXTERNAL_LLM_MODEL ?? process.env.EXTERNAL_LLM_MODEL;
      const externalApiKey =
        dotenvEnv.EXTERNAL_LLM_API_KEY ?? process.env.EXTERNAL_LLM_API_KEY;
      console.log({ externalApiKey, externalModel });
      const externalBaseUrl =
        dotenvEnv.EXTERNAL_LLM_BASE_URL ??
        process.env.EXTERNAL_LLM_BASE_URL ??
        "https://api.openai.com/v1";

      if (!externalModel || !externalApiKey) {
        return res.status(500).json({
          message:
            "Missing EXTERNAL_LLM_MODEL or EXTERNAL_LLM_API_KEY in backend environment",
        });
      }

      const imageMimeType =
        typeof file.mimetype === "string" && file.mimetype.trim()
          ? file.mimetype
          : "image/png";
      const imageBase64 = file.buffer.toString("base64");
      const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;

      const prompt = `You are an expert forex/stock technical analysis assistant. 
Analyze the chart screenshot carefully and extract the following trade setup information.

Instructions:
- Determine direction: look for market structure labels (LH = Lower High, LL = Lower Low, HH = Higher High, HL = Higher Low), candlestick patterns, trendlines, consolidation boxes, and breakout direction.
- "LH" and "LL" labels = bearish/downtrend = SELL signal.
- "HH" and "HL" labels = bullish/uptrend = BUY signal.
- If a descending box/triangle is visible with price coiling downward, bias is SELL.
- If an ascending box/triangle is visible with price coiling upward, bias is BUY.
- entry: the price level where a trade would be entered (breakout of box, key level, or current price if at signal point).
- stop_loss: the nearest swing high (for SELL) or swing low (for BUY) visible on the chart.
- target: the next major support (for SELL) or resistance (for BUY) level visible on the chart.
- If any value cannot be determined from the chart, use null.

Return ONLY a valid JSON object with exactly these keys:
{
  "stock_name": string,        // e.g. "GBP/USD" or "AAPL"
  "timeframe": string,         // e.g. "1m", "5m", "1h"
  "direction": "BUY" | "SELL", // trade direction based on market structure
  "entry": number | null,      // entry price
  "stop_loss": number | null,  // stop loss price
  "target": number | null,     // take profit price
  "market_structure": string | null, // e.g. "LH-LL bearish" or "HH-HL bullish"
  "pattern": string | null     // e.g. "descending triangle", "bullish engulfing"
}`;

      const completionResponse = await axios.post(
        `${externalBaseUrl}/chat/completions`,
        {
          model: externalModel,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: prompt,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract trade setup values from this image.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageDataUrl,
                  },
                },
              ],
            },
          ],
          temperature: 0,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${externalApiKey}`,
          },
          timeout: 300000,
        },
      );

      const text: unknown =
        completionResponse.data?.choices?.[0]?.message?.content;

      if (typeof text !== "string" || !text.trim()) {
        return res
          .status(502)
          .json({ message: "Invalid external LLM response format" });
      }

      const parsed = parseJsonFromContent(text);
      if (!parsed) {
        return res.status(502).json({
          message: "Failed to parse external LLM JSON response",
          raw: text,
        });
      }

      persistAiResponse(prompt, parsed);

      return res.json({ data: parsed });
    } catch (error: unknown) {
      console.error("AI external-reference-trade error:", error);
      return res.status(500).json({
        message: "Failed to process image with external LLM",
      });
    }
  },
);

export default router;

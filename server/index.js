import express from "express";
import cors from "cors";
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const app = express();
const port = 3001;

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from .env");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (
      !Array.isArray(messages) ||
      messages.length === 0 ||
      messages.length > 30 ||
      messages.some(
        (m) =>
          !["user", "assistant"].includes(m.role) ||
          typeof m.content !== "string" ||
          !m.content.trim() ||
          m.content.length > 4000,
      )
    ) {
      return res.status(400).json({ error: "Invalid messages." });
    }

    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

   const start = Date.now();

const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-lite",
  contents,
  config: {
    temperature: 0.3,
    maxOutputTokens: 200,
    systemInstruction:
      "You are SIDEKICK, a friendly and witty AI companion. Use correct spelling and grammar. Keep replies concise and natural.",
  },
});

console.log(`Gemini took ${Date.now() - start}ms`);

    res.json({ reply: response.text || "I'm here. Want to try that again?" });
  } catch (error) {
    console.error("Gemini request failed:", error.message);
    res.status(500).json({
      error: "SIDEKICK couldn't reply just now. Please try again.",
    });
  }
});

app.listen(port, () => {
  console.log(`SIDEKICK backend running at http://localhost:${port}`);
});

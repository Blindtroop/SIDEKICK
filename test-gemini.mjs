
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: "Introduce yourself as the AI powering SIDEKICK in one friendly sentence.",
  });

  console.log(response.text);
}

main().catch(console.error);

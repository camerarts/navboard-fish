import { GoogleGenAI } from "@google/genai";

/**
 * Service to interact with the Google Gemini API for quick answers.
 * This implementation adheres to the latest @google/genai SDK guidelines:
 * - Accesses process.env.API_KEY directly.
 * - Uses the recommended 'gemini-3-flash-preview' model for basic text tasks.
 * - Directly accesses the response.text property.
 */
export const askGeminiQuickAnswer = async (query: string): Promise<string> => {
  try {
    // Initialize the SDK using the pre-configured API_KEY from process.env
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const response = await ai.models.generateContent({
      // Using 'gemini-3-flash-preview' as the default model for basic text/Q&A tasks
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: "你是一个高效、简洁的桌面助手。请用中文提供简短、直接的回答，适合快速查阅。尽可能将回答控制在 100 字以内。",
      }
    });

    // Extracting text output directly from the response property
    return response.text || "未生成回答。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，暂时无法获取回答，请稍后再试。";
  }
};

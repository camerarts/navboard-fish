
import { GoogleGenAI } from "@google/genai";

// Safely access process.env to prevent "process is not defined" errors in browser environments
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY || '';
    }
  } catch (e) {
    // Ignore error if process is not available
  }
  return '';
};

const apiKey = getApiKey();

export const askGeminiQuickAnswer = async (query: string): Promise<string> => {
  if (!apiKey) {
    return "请在环境变量中配置 API_KEY 以使用 AI 助手。";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: "你是一个高效、简洁的桌面助手。请用中文提供简短、直接的回答，适合快速查阅。尽可能将回答控制在 100 字以内。",
      }
    });

    return response.text || "未生成回答。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "抱歉，暂时无法获取回答，请稍后再试。";
  }
};

import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateInterviewQuestions = async (jobRole: string, count: number = 3): Promise<any[]> => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Returning mock data.");
    return [
      { text: `Why do you want to work as a ${jobRole}?`, prepTimeSeconds: 30, maxAnswerTimeSeconds: 120 },
      { text: "Describe a challenging situation you overcame.", prepTimeSeconds: 45, maxAnswerTimeSeconds: 180 },
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} interview questions for a ${jobRole} position.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING, description: "The interview question text" },
              prepTimeSeconds: { type: Type.INTEGER, description: "Recommended preparation time in seconds (e.g. 30, 60)" },
              maxAnswerTimeSeconds: { type: Type.INTEGER, description: "Recommended max answer time in seconds (e.g. 120, 180)" }
            },
            required: ["text", "prepTimeSeconds", "maxAnswerTimeSeconds"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};

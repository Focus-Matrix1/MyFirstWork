import { GoogleGenAI, Type } from "@google/genai";
import { CategoryId } from "../types";
import { GEMINI_API_KEY } from "../config";

export interface ClassificationResult {
  category: CategoryId;
  duration?: string;
  error?: 'quota' | 'other';
}

export const useTaskClassifier = () => {
  const classifyTaskWithAI = async (title: string, description?: string): Promise<ClassificationResult> => {
    // 1. Check Key Presence
    if (!GEMINI_API_KEY) {
      console.warn("AI Mode: No API Key configured");
      return { category: 'inbox' }; 
    }

    try {
      // 2. Init Client
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      // 3. Use 'gemini-1.5-flash' - it has the highest free tier quota and stability
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash', 
        contents: `Classify this task into the Eisenhower Matrix: "${title}". ${description ? `Context: ${description}` : ''}`,
        config: {
          systemInstruction: "You are a productivity expert. Classify tasks into the Eisenhower Matrix (q1, q2, q3, q4). Rule: NEVER return 'inbox'. You MUST make a best guess based on the title. q1=Urgent+Important, q2=Important, q3=Urgent, q4=Neither. Also estimate duration in '15m', '1h' format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: ['q1', 'q2', 'q3', 'q4'] },
              duration: { type: Type.STRING, description: "Estimated duration, e.g. '30m'" }
            },
            required: ['category']
          }
        }
      });
      
      const text = response.text;
      if (!text) {
          return { category: 'inbox', error: 'other' };
      }
      
      const result = JSON.parse(text);
      const cat = result.category?.toLowerCase();
      
      if (['q1', 'q2', 'q3', 'q4'].includes(cat)) {
        return { 
          category: cat as CategoryId, 
          duration: result.duration 
        };
      }
      
      return { category: 'inbox', error: 'other' };

    } catch (e: any) {
      // 4. Specific Error Handling
      console.error("AI Classification Failed:", e.status, e.message);
      
      if (e.status === 429) {
          return { category: 'inbox', error: 'quota' };
      }
      
      return { category: 'inbox', error: 'other' };
    }
  };

  return { classifyTaskWithAI };
};
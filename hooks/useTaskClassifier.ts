import { GoogleGenAI, Type } from "@google/genai";
import { CategoryId } from "../types";
import { GEMINI_API_KEY } from "../config";

export const useTaskClassifier = () => {
  const classifyTaskWithAI = async (title: string, description?: string): Promise<{ category: CategoryId, duration?: string }> => {
    // 1. Check Key Presence
    if (!GEMINI_API_KEY) {
      console.warn("AI Mode: No API Key configured");
      return { category: 'inbox' }; 
    }

    try {
      // 2. Init Client
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      // 3. Switch to 'gemini-2.0-flash' which is currently more widely available and stable than 3-preview
      // If 2.0 fails, it usually falls back gracefully or throws a readable error.
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash', 
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
          console.warn("AI returned empty text");
          return { category: 'inbox' };
      }
      
      const result = JSON.parse(text);
      const cat = result.category?.toLowerCase();
      
      if (['q1', 'q2', 'q3', 'q4'].includes(cat)) {
        return { 
          category: cat as CategoryId, 
          duration: result.duration 
        };
      }
      
      console.warn("AI returned invalid category:", cat);
      return { category: 'inbox' };

    } catch (e: any) {
      // 4. Detailed Error Logging
      // Check your browser console (F12) to see this message if it fails again.
      console.error("AI Classification Failed. Details:", {
          message: e.message,
          status: e.status, // HTTP Status (400, 403, 404, etc)
          statusText: e.statusText,
          details: e.errorDetails
      });
      return { category: 'inbox' };
    }
  };

  return { classifyTaskWithAI };
};
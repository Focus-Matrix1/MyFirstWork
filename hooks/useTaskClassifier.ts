import { GoogleGenAI, Type } from "@google/genai";
import { CategoryId } from "../types";
import { GEMINI_API_KEY } from "../config";

export const useTaskClassifier = () => {
  const classifyTaskWithAI = async (title: string, description?: string): Promise<{ category: CategoryId, duration?: string }> => {
    // Check the centralized configuration
    if (!GEMINI_API_KEY) {
      console.warn("AI Mode: No API Key configured");
      return { category: 'inbox' }; 
    }

    try {
      // Create instance using the key from config directly
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Classify this task into the Eisenhower Matrix: "${title}". ${description ? `Context: ${description}` : ''}`,
        config: {
          // Updated instruction to forbid 'inbox' and force a choice based on best guess
          systemInstruction: "You are a productivity expert. Classify tasks into the Eisenhower Matrix (q1, q2, q3, q4). Rule: NEVER return 'inbox'. You MUST make a best guess based on the title. q1=Urgent+Important, q2=Important, q3=Urgent, q4=Neither. Also estimate duration.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              // Removed 'inbox' from enum to force classification
              category: { type: Type.STRING, enum: ['q1', 'q2', 'q3', 'q4'] },
              duration: { type: Type.STRING, description: "Estimated duration, e.g. '30m'" }
            },
            required: ['category']
          }
        }
      });
      
      const text = response.text;
      if (!text) return { category: 'inbox' };
      
      const result = JSON.parse(text);
      const cat = result.category?.toLowerCase();
      
      if (['q1', 'q2', 'q3', 'q4'].includes(cat)) {
        return { 
          category: cat as CategoryId, 
          duration: result.duration 
        };
      }
      
      return { category: 'inbox' };
    } catch (e) {
      // Log full error object to console so user can verify if API Key is invalid (e.g., 400 or 403)
      console.error("AI Classification API Error:", e);
      return { category: 'inbox' };
    }
  };

  return { classifyTaskWithAI };
};
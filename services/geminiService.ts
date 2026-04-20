import { GoogleGenAI, Type } from "@google/genai";
import { ChatMessage } from '../types';

const getApiKey = () => {
    try {
        // Safely attempt to access process.env.API_KEY with type check
        if (typeof process !== 'undefined' && process.env) {
            return process.env.API_KEY || '';
        }
    } catch (e) {
        console.warn("API Key environment variable not accessible.");
    }
    return '';
};

const SYSTEM_INSTRUCTION = `You are "WasselBot", the friendly and efficient AI assistant for Wassel Logistics. 
Your goal is to help customers with:
1. Understanding shipping policies (International vs Domestic).
2. Explaining how to track packages (mock advise).
3. Providing general estimates or explaining how the rate calculator works.
4. Assisting with pickup requests guidance.

Language Support:
- You must be fully bilingual in English and Arabic.
- Detect the language of the user's message.
- If the user speaks English, reply in English.
- If the user speaks Arabic, reply in Arabic.

Tone: Professional, helpful, concise, and polite.

Guidelines:
- Do not make up fake tracking numbers. If asked to track, ask the user to provide a valid ID and tell them to use the Tracking page.
- If asked about rates, guide them to the Rate Calculator page but you can give rough estimates if they provide weights (e.g., "Usually sending 1kg to Dubai costs around $50 via DHL").
`;

export const getGeminiResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn("API Key is missing. Returning offline message.");
    return "I'm sorry, I'm currently offline (API Key missing). Please try again later.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I didn't catch that. Could you rephrase?";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the network right now. Please try again in a moment.";
  }
};

export const getResourceSearchResponse = async (query: string): Promise<{ answer: string; relatedTopics: string[] }> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { 
        answer: "I'm sorry, I'm currently offline (API Key missing).", 
        relatedTopics: [] 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: query,
        config: {
            systemInstruction: `You are an expert logistics assistant for Wassel. Answer the user's question about shipping, customs, packaging, or policies clearly and concisely. 
            Also provide 3-4 short related topic phrases that a user might want to know more about.
            Language Support: Detect the language of the user's question (English or Arabic) and respond in the same language.`,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    answer: { type: Type.STRING },
                    relatedTopics: { 
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    }
                }
            }
        }
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
    throw new Error("No response");

  } catch (error) {
      console.error("Gemini Resource Search Error", error);
      return {
          answer: "I couldn't find an answer at the moment. Please browse our categories below.",
          relatedTopics: []
      };
  }
};
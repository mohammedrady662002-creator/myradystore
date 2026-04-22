import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ImageSearchResult {
  keyword: string;
  confidence: number;
}

export const generateMarketingDescription = async (productName: string, category: string): Promise<string> => {
  if (!productName) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "أنت خبير تسويق في محل موبايلات. اكتب وصفاً تسويقياً قصيراً وجذاباً.",
      },
      contents: `اكتب وصف تسويقي قصير وجذاب لمنتج في محل موبايلات. اسم المنتج: "${productName}". القسم: "${category}". باللغة العربية بدون مقدمات.`,
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const diagnoseHardwareIssue = async (issueDescription: string): Promise<string> => {
  if (!issueDescription) return "";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "أنت فني صيانة موبايلات محترف. أعط تشخيصاً سريعاً للمشكلة.",
      },
      contents: `أنا فني صيانة. العميل يشتكي من: "${issueDescription}". أعطني باختصار: 1. أهم احتمالين للسبب 2. خطوة للفحص. باللغة العربية باختصار.`,
    });
    
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const identifyProductFromImage = async (imageData: string, mimeType: string): Promise<ImageSearchResult | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: imageData.replace(/^data:image\/\w+;base64,/, ""),
              mimeType: mimeType,
            },
          },
          {
            text: "Identify the electronic mobile product or accessory in this image. Return a JSON object with: 1. 'keyword': a short 2-3 word search term (Arabic or English) for inventory search. 2. 'confidence': a percentage from 0 to 100 based on how sure you are about the identification.",
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["keyword", "confidence"]
        }
      }
    });
    
    if (!response.text) return null;
    return JSON.parse(response.text.trim()) as ImageSearchResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

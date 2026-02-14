
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AdventureTurn } from "../types";

export class GeminiService {
  private static getAi() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static async getQuickImagePrompt(
    genre: string,
    history: AdventureTurn[],
    userChoice: string
  ): Promise<string> {
    const ai = this.getAi();
    const lastStory = history[history.length - 1]?.story || "";
    
    const prompt = `
      Жанр: ${genre}.
      Последнее событие: ${lastStory.substring(0, 300)}...
      Игрок выбрал: "${userChoice}".
      ЗАДАЧА: Напиши короткое (10-15 слов) описание визуальной сцены на английском.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 0.7
      }
    });

    return response.text?.trim() || "cinematic scene, high quality";
  }

  static async generateNextTurn(
    genre: string,
    history: AdventureTurn[],
    userChoice: string,
    characterDescription: string
  ): Promise<AdventureTurn> {
    const ai = this.getAi();
    
    const contextHistory = history.slice(-3).map(h => 
      `Место: ${h.locationName}\nСобытие: ${h.story}\nИгрок выбрал: ${userChoice}`
    ).join('\n');
    
    const prompt = `
      Продолжи приключение в жанре "${genre}". 
      Игрок выбрал: "${userChoice}".
      Персонаж: ${characterDescription}.
      
      ЗАДАЧА: Сгенерируй JSON с полями:
      - locationName: очень краткое название места (2-3 слова)
      - story: текст продолжения (на русском)
      - choices: 3 варианта (на русском)
      - inventory: список предметов
      - currentQuest: текущая цель
      - imagePrompt: описание сцены на английском
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            locationName: { type: Type.STRING },
            story: { type: Type.STRING },
            choices: { type: Type.ARRAY, items: { type: Type.STRING } },
            inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
            currentQuest: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["locationName", "story", "choices", "inventory", "currentQuest", "imagePrompt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    return JSON.parse(text) as AdventureTurn;
  }

  static async generateImage(prompt: string): Promise<string> {
    const ai = this.getAi();
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `${prompt}. Masterpiece, high detail.` }]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return "";
    } catch (error) {
      return "";
    }
  }

  static async getOracleResponse(question: string, context: AdventureTurn[]): Promise<string> {
    const ai = this.getAi();
    const gameContext = context.slice(-3).map(c => c.story).join('\n');
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Контекст:\n${gameContext}\n\nВопрос к Оракулу: ${question}`,
      config: {
        systemInstruction: "Ты — мудрый Оракул. Отвечай кратко на русском."
      }
    });
    return response.text || "Оракул молчит...";
  }

  static async initializeCharacter(genre: string): Promise<{ turn: AdventureTurn, characterDescription: string }> {
    const ai = this.getAi();
    const prompt = `Начни игру в жанре "${genre}". Создай первого героя и первый ход.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            characterDescription: { type: Type.STRING },
            turn: {
              type: Type.OBJECT,
              properties: {
                locationName: { type: Type.STRING },
                story: { type: Type.STRING },
                choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
                currentQuest: { type: Type.STRING },
                imagePrompt: { type: Type.STRING }
              },
              required: ["locationName", "story", "choices", "inventory", "currentQuest", "imagePrompt"]
            }
          },
          required: ["characterDescription", "turn"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Init error");
    return JSON.parse(text);
  }
}

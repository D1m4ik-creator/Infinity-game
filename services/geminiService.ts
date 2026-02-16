
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AdventureTurn, CharacterStats, CombatInfo, CustomWorldSettings } from "../types";

export class GeminiService {
  private static getAi() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  private static async withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
    let delay = 3000;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        const errorMsg = error?.message?.toLowerCase() || "";
        const isQuotaError = errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('limit') || errorMsg.includes('exhausted');
        
        if (isQuotaError && i < maxRetries - 1) {
          const jitter = Math.random() * 1500;
          const totalDelay = delay + jitter;
          console.warn(`Лимит запросов (429). Ожидание ${Math.round(totalDelay/1000)}с... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, totalDelay));
          delay *= 3;
          continue;
        }
        throw error;
      }
    }
    throw new Error("API_QUOTA_EXHAUSTED");
  }

  static async generateNextTurn(
    genre: string,
    history: AdventureTurn[],
    userAction: string,
    characterDescription: string,
    stats: CharacterStats,
    isCombat: boolean = false
  ): Promise<{ turn: AdventureTurn; updatedStats: CharacterStats }> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      const lastTurn = history[history.length - 1];
      
      const prompt = `
        Жанр: "${genre}". 
        Действие: "${userAction}".
        Персонаж: ${characterDescription}.
        ОЗ:${stats.hp}/${stats.maxHp}, СИЛ:${stats.str}, ЛОВ:${stats.agi}, ИНТ:${stats.int}.
        Инвентарь: ${lastTurn?.inventory.join(', ') || 'пусто'}.
        В бою: ${isCombat ? 'ДА' : 'НЕТ'}.
        
        ЗАДАЧА: Сгенерируй JSON для следующего шага. 
        - Если ОЗ <= 0, опиши смерть.
        - story и choices на РУССКОМ.
        - imagePrompt (для генерации картинки) на АНГЛИЙСКОМ, детально.

        JSON Schema:
        - locationName: название
        - locationType: "threat", "poi" или "neutral"
        - threatLevel: 0-10
        - discoveryTag: фраза о находке
        - story: текст приключения (2-3 абзаца)
        - choices: 3 варианта
        - inventory: список предметов
        - currentQuest: цель
        - imagePrompt: visual description (English, 15 words)
        - updatedStats: { hp, maxHp, str, agi, int, level, exp }
        - combatInfo (если бой): { enemyName, enemyHp, enemyMaxHp, lastActionLog }
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
              locationType: { type: Type.STRING, enum: ["threat", "poi", "neutral"] },
              threatLevel: { type: Type.NUMBER },
              discoveryTag: { type: Type.STRING },
              story: { type: Type.STRING },
              choices: { type: Type.ARRAY, items: { type: Type.STRING } },
              inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
              currentQuest: { type: Type.STRING },
              imagePrompt: { type: Type.STRING },
              updatedStats: {
                type: Type.OBJECT,
                properties: {
                  hp: { type: Type.NUMBER },
                  maxHp: { type: Type.NUMBER },
                  str: { type: Type.NUMBER },
                  agi: { type: Type.NUMBER },
                  int: { type: Type.NUMBER },
                  level: { type: Type.NUMBER },
                  exp: { type: Type.NUMBER }
                },
                required: ["hp", "maxHp", "str", "agi", "int", "level", "exp"]
              },
              combatInfo: {
                type: Type.OBJECT,
                properties: {
                  enemyName: { type: Type.STRING },
                  enemyHp: { type: Type.NUMBER },
                  enemyMaxHp: { type: Type.NUMBER },
                  lastActionLog: { type: Type.STRING }
                }
              }
            },
            required: ["locationName", "locationType", "threatLevel", "discoveryTag", "story", "choices", "inventory", "currentQuest", "imagePrompt", "updatedStats"]
          }
        }
      });

      const text = response.text || "{}";
      const data = JSON.parse(text);
      return { turn: data as AdventureTurn, updatedStats: data.updatedStats as CharacterStats };
    });
  }

  static async generateImage(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `${prompt}. Cinematic fantasy art, high detail, masterpiece.` }]
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return "";
    });
  }

  static async getOracleResponse(question: string, context: AdventureTurn[]): Promise<string> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Контекст:\n${context.slice(-1).map(c => c.story).join('\n')}\nВопрос: ${question}`,
        config: { systemInstruction: "Ты — Оракул. Отвечай кратко на русском." }
      });
      return response.text || "Оракул молчит.";
    });
  }

  static async initializeCharacter(genre: string, settings?: CustomWorldSettings): Promise<{ turn: AdventureTurn, characterDescription: string, stats: CharacterStats }> {
    return this.withRetry(async () => {
      const ai = this.getAi();
      
      const customContext = settings ? `
        ПОЛЬЗОВАТЕЛЬСКИЕ НАСТРОЙКИ:
        - Окружение/Мир: ${settings.worldDesc || 'на твой вкус'}
        - Главный герой: ${settings.heroDesc || 'на твой вкус'}
        - Оружие героя: ${settings.weaponDesc || 'соответствующее сеттингу'}
        - Главный злодей: ${settings.villainDesc || 'таинственная угроза'}
      ` : '';

      const prompt = `
        Начни приключение в жанре "${genre}". 
        ${customContext}
        Создай экспозицию, героя и первую сцену. 
        Учти все пользовательские настройки, если они указаны. Оружие должно быть в инвентаре героя.
        JSON ответ на русском.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              characterDescription: { type: Type.STRING },
              stats: {
                type: Type.OBJECT,
                properties: {
                  hp: { type: Type.NUMBER }, maxHp: { type: Type.NUMBER }, str: { type: Type.NUMBER },
                  agi: { type: Type.NUMBER }, int: { type: Type.NUMBER }, level: { type: Type.NUMBER }, exp: { type: Type.NUMBER }
                },
                required: ["hp", "maxHp", "str", "agi", "int", "level", "exp"]
              },
              turn: {
                type: Type.OBJECT,
                properties: {
                  locationName: { type: Type.STRING }, locationType: { type: Type.STRING }, threatLevel: { type: Type.NUMBER },
                  discoveryTag: { type: Type.STRING }, story: { type: Type.STRING }, choices: { type: Type.ARRAY, items: { type: Type.STRING } },
                  inventory: { type: Type.ARRAY, items: { type: Type.STRING } }, currentQuest: { type: Type.STRING }, imagePrompt: { type: Type.STRING }
                },
                required: ["locationName", "locationType", "threatLevel", "discoveryTag", "story", "choices", "inventory", "currentQuest", "imagePrompt"]
              }
            },
            required: ["characterDescription", "stats", "turn"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    });
  }
}

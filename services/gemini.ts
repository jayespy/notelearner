
import { GoogleGenAI, Type } from "@google/genai";
import { MusicalNote, MnemonicResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getNoteMnemonic(note: MusicalNote): Promise<MnemonicResponse> {
  const prompt = `Provide a short, memorable mnemonic and one interesting musical fact for the note ${note.name}${note.octave} on the ${note.clef.toLowerCase()} clef. 
  For mnemonics, focus on standard ones like 'Every Good Boy Does Fine' or creative ones that help beginners identify the line or space.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mnemonic: { type: Type.STRING, description: "A catchy mnemonic for the note." },
            fact: { type: Type.STRING, description: "A brief interesting fact about this note or its frequency." }
          },
          required: ["mnemonic", "fact"]
        }
      }
    });

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      mnemonic: `Note: ${note.name} at octave ${note.octave}`,
      fact: "Music is the language of the soul."
    };
  }
}

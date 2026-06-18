import Groq from "groq-sdk";
import { toFile } from "groq-sdk/uploads";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function speechToText(
  buffer: Buffer,
  filename = "audio.ogg",
): Promise<string> {
  try {
    const maxBytes = Number(process.env.GROQ_MAX_UPLOAD_BYTES || 5_000_000);

    if (buffer.length > maxBytes) {
      throw new Error(`File too large: ${buffer.length} bytes`);
    }

    const file = await toFile(buffer, filename);

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "whisper-large-v3",
    });

    return transcription.text;
  } catch (error) {
    console.error("Groq transcription error:", error);
    throw error;
  }
}

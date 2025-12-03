import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

if (!process.env.GOOGLE_API_KEY) {
  logger.error('Missing GOOGLE_API_KEY environment variable');
  throw new Error('Missing GOOGLE_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash';

export async function generateWithGemini(
  prompt: string,
  systemInstruction?: string,
  useFallback = false
): Promise<string> {
  const modelName = useFallback ? GEMINI_FALLBACK_MODEL : GEMINI_MODEL;
  const startTime = Date.now();

  try {
    logger.info(`Generating content with ${modelName}`, {
      promptLength: prompt.length,
      hasSystemInstruction: !!systemInstruction
    });

    const model = genAI.getGenerativeModel({
      model: modelName,
      ...(systemInstruction && { systemInstruction })
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    const duration = Date.now() - startTime;
    logger.info(`Successfully generated content with ${modelName}`, {
      promptLength: prompt.length,
      responseLength: text.length,
      duration: `${duration}ms`
    });

    return text;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error(`Error generating content with ${modelName}:`, {
      error: error.message,
      model: modelName,
      useFallback,
      duration: `${duration}ms`,
      stack: error.stack
    });

    // Try fallback model if primary fails and we haven't already used fallback
    if (!useFallback && modelName !== GEMINI_FALLBACK_MODEL) {
      logger.info('Attempting with fallback model', { fallbackModel: GEMINI_FALLBACK_MODEL });
      return generateWithGemini(prompt, systemInstruction, true);
    }

    throw error;
  }
}

export async function generateJSONWithGemini<T>(
  prompt: string,
  systemInstruction?: string
): Promise<T> {
  const startTime = Date.now();

  try {
    logger.info('Generating JSON response with Gemini');
    const text = await generateWithGemini(prompt, systemInstruction);

    // Extract JSON from markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonText);
    const duration = Date.now() - startTime;

    logger.info('Successfully parsed JSON response', {
      duration: `${duration}ms`,
      keys: Object.keys(parsed)
    });

    return parsed;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Error parsing JSON from Gemini response:', {
      error: error.message,
      duration: `${duration}ms`,
      stack: error.stack
    });
    throw new Error('Failed to parse JSON response from Gemini');
  }
}

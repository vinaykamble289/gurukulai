import { supabase } from '../config/supabase';
import { generateWithGemini, generateJSONWithGemini } from '../config/gemini';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class QuestionService {
  async generateQuestion(userId: string, topicId: string, difficulty: number, context?: any) {
    const startTime = Date.now();
    logger.info('Generating question', { userId, topicId, difficulty });

    try {
      // Get topic and concept information
      const { data: topic, error: topicError } = await supabase
        .from('topics')
        .select('*, concepts(*)')
        .eq('id', topicId)
        .single();

      if (topicError || !topic) {
        logger.error('Topic not found', { topicId, error: topicError });
        throw new AppError(404, 'Topic not found');
      }

      logger.info('Topic retrieved', { topicName: topic.name, conceptCount: topic.concepts?.length || 0 });

      // Get user's progress on this topic
      const { data: progress } = await supabase
        .from('user_topic_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('topic_id', topicId)
        .single();

      logger.info('User progress retrieved', { 
        hasProgress: !!progress, 
        mastery: progress?.mastery_level 
      });

      // Select appropriate concept based on difficulty and progress
      const concept = this.selectConcept(topic.concepts, difficulty, progress);
      logger.info('Concept selected', { conceptName: concept?.name, conceptDifficulty: concept?.difficulty });

      // Generate Socratic question using Gemini
      const questionText = await this.generateSocraticQuestion(
        topic.name,
        concept?.name || topic.name,
        difficulty,
        context
      );

      // Create question record
      const questionId = uuidv4();
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          id: questionId,
          session_id: context?.sessionId,
          concept_id: concept?.id,
          question_text: questionText,
          question_type: difficulty <= 3 ? 'guided' : difficulty <= 7 ? 'scaffolded' : 'open-ended',
          difficulty,
          context: context || {}
        })
        .select()
        .single();

      if (questionError) {
        logger.error('Failed to create question', { error: questionError });
        throw new AppError(500, 'Failed to create question');
      }

      // Generate hints
      await this.generateHints(questionId, questionText, difficulty);

      const duration = Date.now() - startTime;
      logger.info('Question generated successfully', {
        questionId,
        duration: `${duration}ms`,
        difficulty,
        type: question.question_type
      });

      return {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        difficulty: question.difficulty,
        topicId,
        conceptId: concept?.id
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Error generating question', {
        error: error.message,
        duration: `${duration}ms`,
        userId,
        topicId,
        difficulty
      });
      throw error;
    }
  }

  private async generateSocraticQuestion(
    topicName: string,
    conceptName: string,
    difficulty: number,
    context?: any
  ): Promise<string> {
    const startTime = Date.now();
    logger.info('Generating Socratic question with Gemini', {
      topicName,
      conceptName,
      difficulty
    });

    try {
      const difficultyDescriptions: Record<number, string> = {
        1: 'very basic, introductory level',
        2: 'basic with simple examples',
        3: 'fundamental understanding',
        4: 'intermediate with some complexity',
        5: 'intermediate requiring deeper thought',
        6: 'moderately challenging',
        7: 'challenging requiring analysis',
        8: 'advanced requiring synthesis',
        9: 'very advanced requiring evaluation',
        10: 'expert level requiring creation'
      };

      const prompt = `Generate a Socratic question for learning about "${conceptName}" in the topic of "${topicName}".

Difficulty level: ${difficulty}/10 (${difficultyDescriptions[difficulty] || 'intermediate'})

Guidelines:
- Use the Socratic method: ask questions that guide thinking rather than providing answers
- Encourage critical thinking and self-discovery
- Build on prior knowledge
- Be clear and focused
- Appropriate for difficulty level ${difficulty}
${context?.previousResponse ? `\nPrevious learner response: "${context.previousResponse}"` : ''}
${context?.previousQuestion ? `\nPrevious question: "${context.previousQuestion}"` : ''}

Generate only the question text, no additional explanation.`;

      const systemInstruction = 'You are an expert educator using the Socratic method to help learners discover knowledge through guided questioning. Generate clear, thought-provoking questions that encourage critical thinking.';

      const questionText = await generateWithGemini(prompt, systemInstruction);

      const duration = Date.now() - startTime;
      logger.info('Socratic question generated', {
        duration: `${duration}ms`,
        questionLength: questionText.length
      });

      return questionText.trim();
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Error generating Socratic question', {
        error: error.message,
        duration: `${duration}ms`,
        topicName,
        conceptName
      });
      // Fallback question
      return `Can you explain the key concepts of ${conceptName} in your own words?`;
    }
  }

  private async generateHints(questionId: string, questionText: string, difficulty: number) {
    const startTime = Date.now();
    logger.info('Generating hints', { questionId, difficulty });

    try {
      const prompt = `For the following Socratic question, generate 3 progressive hints:

Question: "${questionText}"

Generate 3 hints with increasing specificity:
1. Gentle nudge - very subtle guidance
2. More specific - clearer direction
3. Scaffolding - break down the problem

Format as JSON array: ["hint1", "hint2", "hint3"]`;

      const systemInstruction = 'You are an expert educator creating progressive hints for Socratic questions. Each hint should be more specific than the last, but never give away the answer directly.';

      const hints = await generateJSONWithGemini<string[]>(prompt, systemInstruction);

      for (let i = 0; i < hints.length && i < 3; i++) {
        await supabase.from('hints').insert({
          question_id: questionId,
          level: i + 1,
          hint_text: hints[i]
        });
      }

      const duration = Date.now() - startTime;
      logger.info('Hints generated successfully', {
        questionId,
        hintCount: hints.length,
        duration: `${duration}ms`
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Error generating hints', {
        error: error.message,
        duration: `${duration}ms`,
        questionId
      });
      // Create fallback hints
      const fallbackHints = [
        'Think about the fundamental concepts involved.',
        'Consider how the different elements relate to each other.',
        'Break down the problem into smaller, manageable parts.'
      ];

      for (let i = 0; i < fallbackHints.length; i++) {
        await supabase.from('hints').insert({
          question_id: questionId,
          level: i + 1,
          hint_text: fallbackHints[i]
        });
      }
    }
  }

  async getHint(questionId: string, level: number, userId: string) {
    logger.info('Getting hint', { questionId, level, userId });

    try {
      const { data: hint, error } = await supabase
        .from('hints')
        .select('*')
        .eq('question_id', questionId)
        .eq('level', level)
        .single();

      if (error || !hint) {
        logger.warn('Hint not found', { questionId, level, error });
        throw new AppError(404, 'Hint not found');
      }

      logger.info('Hint retrieved successfully', { questionId, level });
      return {
        level: hint.level,
        text: hint.hint_text
      };
    } catch (error: any) {
      logger.error('Error getting hint', {
        error: error.message,
        questionId,
        level
      });
      throw error;
    }
  }

  async evaluateResponse(questionId: string, response: string, userId: string) {
    const startTime = Date.now();
    logger.info('Evaluating response', { questionId, userId, responseLength: response.length });

    try {
      // Get question details
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .select('*, concepts(*)')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        logger.error('Question not found for evaluation', { questionId, error: questionError });
        throw new AppError(404, 'Question not found');
      }

      // Use Gemini to evaluate the response
      const evaluation = await this.evaluateWithGemini(
        question.question_text,
        response,
        question.concepts?.name || '',
        question.difficulty
      );

      // Store the response
      const { error: responseError } = await supabase.from('user_responses').insert({
        question_id: questionId,
        user_id: userId,
        response_text: response,
        understanding_score: evaluation.score,
        cognitive_load: evaluation.cognitiveLoad,
        evaluation: evaluation
      });

      if (responseError) {
        logger.error('Failed to store response', { error: responseError });
      }

      const duration = Date.now() - startTime;
      logger.info('Response evaluated successfully', {
        questionId,
        score: evaluation.score,
        understanding: evaluation.understanding,
        duration: `${duration}ms`
      });

      return evaluation;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Error evaluating response', {
        error: error.message,
        duration: `${duration}ms`,
        questionId
      });
      throw error;
    }
  }

  private async evaluateWithGemini(
    question: string,
    response: string,
    conceptName: string,
    difficulty: number
  ) {
    const startTime = Date.now();
    logger.info('Evaluating with Gemini', { conceptName, difficulty });

    try {
      const prompt = `Evaluate this learner's response to a Socratic question about "${conceptName}".

Question: "${question}"
Learner's Response: "${response}"
Difficulty Level: ${difficulty}/10

Evaluate the response and provide:
1. Understanding score (0-100)
2. Cognitive load estimate (0-100, where 50-75 is optimal)
3. Key strengths in the response
4. Areas for improvement
5. A follow-up Socratic question to deepen understanding

Format as JSON:
{
  "score": number,
  "cognitiveLoad": number,
  "understanding": "low" | "medium" | "high",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "followUpQuestion": "question text"
}`;

      const systemInstruction = 'You are an expert educator evaluating learner responses using evidence-based assessment methods. Be constructive and encouraging while providing accurate evaluation.';

      const evaluation = await generateJSONWithGemini<any>(prompt, systemInstruction);

      const duration = Date.now() - startTime;
      logger.info('Evaluation completed', {
        score: evaluation.score,
        understanding: evaluation.understanding,
        duration: `${duration}ms`
      });

      return evaluation;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('Error in Gemini evaluation', {
        error: error.message,
        duration: `${duration}ms`
      });

      // Fallback evaluation
      return {
        score: 50,
        cognitiveLoad: 60,
        understanding: 'medium',
        strengths: ['Response provided'],
        improvements: ['Could provide more detail'],
        followUpQuestion: 'Can you elaborate on your answer?'
      };
    }
  }

  private selectConcept(concepts: any[], difficulty: number, progress: any) {
    if (!concepts || concepts.length === 0) {
      logger.warn('No concepts available for selection');
      return null;
    }

    // Filter concepts by difficulty range
    const suitableConcepts = concepts.filter(c =>
      Math.abs(c.difficulty - difficulty) <= 2
    );

    if (suitableConcepts.length === 0) {
      logger.info('No suitable concepts found, using first available');
      return concepts[0];
    }

    // Prefer concepts not yet mastered
    const unmastered = suitableConcepts.filter(c => {
      // Check if concept is mastered (simplified for now)
      return true;
    });

    const selected = unmastered[0] || suitableConcepts[0];
    logger.info('Concept selected', { conceptName: selected.name, difficulty: selected.difficulty });
    return selected;
  }
}

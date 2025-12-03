from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import logging
from datetime import datetime
import sys
from dotenv import load_dotenv

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(parent_dir, '.env')
load_dotenv(env_path)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configure Gemini
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    logger.error('GOOGLE_API_KEY environment variable not set')
    logger.error('Please set GOOGLE_API_KEY in your .env file')
    sys.exit(1)

try:
    genai.configure(api_key=GOOGLE_API_KEY)
    logger.info('✅ Gemini API configured successfully')
except Exception as e:
    logger.error(f'Failed to configure Gemini API: {str(e)}')
    sys.exit(1)

GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.0-flash-exp')
GEMINI_FALLBACK_MODEL = os.getenv('GEMINI_FALLBACK_MODEL', 'gemini-1.5-flash')

logger.info(f'🤖 ML Service starting with model: {GEMINI_MODEL}')

def generate_with_gemini(prompt, system_instruction=None, use_fallback=False):
    """Generate content using Gemini with fallback support"""
    model_name = GEMINI_FALLBACK_MODEL if use_fallback else GEMINI_MODEL
    start_time = datetime.now()
    
    try:
        logger.info(f'Generating content with {model_name}')
        
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=system_instruction
        )
        
        response = model.generate_content(prompt)
        text = response.text
        
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f'✅ Successfully generated content with {model_name} in {duration:.2f}s')
        
        return text
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        logger.error(f'❌ Error with {model_name} after {duration:.2f}s: {str(e)}')
        
        # Try fallback if not already using it
        if not use_fallback and model_name != GEMINI_FALLBACK_MODEL:
            logger.info(f'🔄 Attempting with fallback model: {GEMINI_FALLBACK_MODEL}')
            return generate_with_gemini(prompt, system_instruction, use_fallback=True)
        
        raise

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    logger.info('Health check requested')
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'model': GEMINI_MODEL,
        'fallback_model': GEMINI_FALLBACK_MODEL
    })

@app.route('/api/v1/generate-question', methods=['POST'])
def generate_question():
    """Generate a Socratic question"""
    start_time = datetime.now()
    
    try:
        data = request.json
        logger.info(f'📝 Question generation requested: {data}')
        
        topic = data.get('topic', 'general topic')
        concept = data.get('concept', topic)
        difficulty = data.get('difficulty', 5)
        context = data.get('context', {})
        
        prompt = f"""Generate a Socratic question for learning about "{concept}" in the topic of "{topic}".

Difficulty level: {difficulty}/10

Guidelines:
- Use the Socratic method: ask questions that guide thinking
- Encourage critical thinking and self-discovery
- Be clear and focused
- Appropriate for difficulty level {difficulty}

Generate only the question text, no additional explanation."""

        system_instruction = 'You are an expert educator using the Socratic method to help learners discover knowledge through guided questioning.'
        
        question_text = generate_with_gemini(prompt, system_instruction)
        
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f'✅ Question generated successfully in {duration:.2f}s')
        
        return jsonify({
            'question': question_text.strip(),
            'difficulty': difficulty,
            'topic': topic,
            'concept': concept
        })
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        logger.error(f'❌ Error generating question after {duration:.2f}s: {str(e)}')
        return jsonify({
            'error': str(e),
            'message': 'Failed to generate question'
        }), 500

@app.route('/api/v1/evaluate-response', methods=['POST'])
def evaluate_response():
    """Evaluate a learner's response"""
    start_time = datetime.now()
    
    try:
        data = request.json
        logger.info(f'📊 Response evaluation requested')
        
        question = data.get('question', '')
        response = data.get('response', '')
        concept = data.get('concept', '')
        difficulty = data.get('difficulty', 5)
        
        prompt = f"""Evaluate this learner's response to a Socratic question about "{concept}".

Question: "{question}"
Learner's Response: "{response}"
Difficulty Level: {difficulty}/10

Evaluate and provide JSON:
{{
  "score": number (0-100),
  "cognitiveLoad": number (0-100, 50-75 is optimal),
  "understanding": "low" | "medium" | "high",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1"],
  "followUpQuestion": "question text"
}}"""

        system_instruction = 'You are an expert educator evaluating learner responses. Be constructive and encouraging. Return only valid JSON.'
        
        evaluation_text = generate_with_gemini(prompt, system_instruction)
        
        # Parse JSON from response
        json_text = evaluation_text.strip()
        if json_text.startswith('```json'):
            json_text = json_text.replace('```json', '').replace('```', '').strip()
        elif json_text.startswith('```'):
            json_text = json_text.replace('```', '').strip()
        
        evaluation = json.loads(json_text)
        
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f'✅ Response evaluated successfully in {duration:.2f}s, score: {evaluation.get("score")}')
        
        return jsonify(evaluation)
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        logger.error(f'❌ Error evaluating response after {duration:.2f}s: {str(e)}')
        return jsonify({
            'error': str(e),
            'message': 'Failed to evaluate response'
        }), 500

@app.route('/api/v1/adapt-difficulty', methods=['POST'])
def adapt_difficulty():
    """Adapt difficulty based on performance"""
    start_time = datetime.now()
    
    try:
        data = request.json
        logger.info(f'🎯 Difficulty adaptation requested')
        
        current_difficulty = data.get('currentDifficulty', 5)
        score = data.get('score', 50)
        cognitive_load = data.get('cognitiveLoad', 60)
        
        # Simple adaptation logic
        new_difficulty = current_difficulty
        
        if score >= 85 and cognitive_load < 60:
            new_difficulty = min(10, current_difficulty + 1)
        elif score < 60 or cognitive_load > 85:
            new_difficulty = max(1, current_difficulty - 1)
        
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f'✅ Difficulty adapted: {current_difficulty} -> {new_difficulty} in {duration:.2f}s')
        
        return jsonify({
            'newDifficulty': new_difficulty,
            'previousDifficulty': current_difficulty,
            'adjusted': new_difficulty != current_difficulty
        })
    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        logger.error(f'❌ Error adapting difficulty after {duration:.2f}s: {str(e)}')
        return jsonify({
            'error': str(e),
            'message': 'Failed to adapt difficulty'
        }), 500

if __name__ == '__main__':
    logger.info('=' * 60)
    logger.info('🚀 Starting ML Service')
    logger.info(f'   Model: {GEMINI_MODEL}')
    logger.info(f'   Fallback: {GEMINI_FALLBACK_MODEL}')
    logger.info(f'   Port: 5000')
    logger.info('=' * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)


import os, re
try:
    import google.generativeai as genai
except Exception:
    genai = None
DEFAULT_MODEL = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')

def call_gemini(prompt: str, model: str = None, max_tokens: int = 512, temperature: float = 0.2) -> str:
    if genai is None:
        raise RuntimeError('google-generativeai is not installed. See requirements.')
    API_KEY = os.getenv('GOOGLE_API_KEY')
    if not API_KEY:
        raise RuntimeError('GOOGLE_API_KEY not set in environment.')
    genai.configure(api_key=API_KEY)
    m = model or DEFAULT_MODEL
    response = genai.GenerativeModel(m).generate_content(prompt, generation_config={'max_output_tokens': max_tokens, 'temperature': temperature})
    try:
        return ''.join([part.text for part in response.candidates[0].content.parts]).strip()
    except Exception:
        return str(response)

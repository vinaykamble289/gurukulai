
import random, re
from typing import Optional, List, Tuple, Dict, Any
from ..utils.metrics import tokenize

BLOOM_LEVELS = [
    ('remember', 'What key terms or facts are relevant here?'),
    ('understand', 'Can you restate the idea in your own words?'),
    ('apply', 'Where could you apply this concept to a new example?'),
    ('analyze', 'What are the underlying assumptions or parts at play?'),
    ('evaluate', 'How would you critique or compare the alternatives?'),
    ('create', 'What novel approach or analogy could you propose?'),
]
SOCRATIC_TEMPLATES = [
    'What information do you already have, and what is missing?',
    'If you had to explain this to a younger student, how would you phrase it?',
    'What would change if we altered one key variable in the problem?',
    'Which misconception is most likely here, and how would you rule it out?',
    'How does this connect to a topic you studied last week?',
]

def socratic_questions(seed: Optional[int] = None):
    rnd = random.Random(seed)
    q1 = rnd.choice([t for _, t in BLOOM_LEVELS] + SOCRATIC_TEMPLATES)
    q2 = rnd.choice([t for _, t in BLOOM_LEVELS] + SOCRATIC_TEMPLATES)
    while q2 == q1:
        q2 = rnd.choice([t for _, t in BLOOM_LEVELS] + SOCRATIC_TEMPLATES)
    return q1, q2

def generator_prompt(user_q: str, context_docs: List[str], delivery_hints: List[str]) -> str:
    context_text = '\n\n'.join(context_docs or [])
    hints = '\n- '.join(delivery_hints)
    return f"""You are a Socratic tutor. Provide a clear, step-by-step explanatory answer. Keep grounded; label external facts with SOURCE: <note>. Close with exactly 2 Socratic follow-ups.\n\nDELIVERY HINTS:\n- {hints if hints else 'None'}\n\nUSER QUESTION:\n{user_q}\n\nCONTEXT:\n{context_text}"""

def critic_prompt(draft: str) -> str:
    return f"""You are a critic assistant. Review the draft answer below for factual errors, pedagogy, and clarity. Return compact JSON only as: {{'score':0-100,'issues':[...],'edits':'<improved answer>'}}. Draft:\n{draft}"""

class ContextAwareReasoner:
    @staticmethod
    def infer_context(device: Optional[str], local_time: Optional[str]):
        features = {'device': device or 'unknown'}
        try:
            from datetime import datetime
            if local_time:
                dt = datetime.fromisoformat(local_time)
                features.update({
                    'hour': dt.hour,
                    'is_evening': 1 if 18 <= dt.hour <= 23 else 0,
                    'is_commute_window': 1 if (7 <= dt.hour <= 10 or 17 <= dt.hour <= 20) else 0
                })
        except Exception:
            features.update({'hour': None, 'is_evening': 0, 'is_commute_window': 0})
        return features

    @staticmethod
    def delivery_hints(ctx: dict) -> list[str]:
        """
        Produce a list of hints for the generator prompt based on the context.
        """
        hints: list[str] = []
        if ctx.get('device') == 'mobile':
            hints.append('Prefer micro-learning chunks and concise steps.')
        if ctx.get('is_evening'):
            hints.append('Use reflective prompts suitable for end-of-day learning.')
        if ctx.get('is_commute_window'):
            hints.append('Offer low-friction, short interactions.')
        return hints

class AdaptiveProfile:
    def __init__(self, raw=None):
        raw = raw or {}
        self.knowledge_level = float(raw.get('knowledge_level', 0.5))
        self.engagement = float(raw.get('engagement', 0.5))
        self.fatigue = float(raw.get('fatigue', 0.1))
        self.reliance = float(raw.get('reliance', 0.3))
        self.style = raw.get('style', 'balanced')
    def to_json(self):
        return {'knowledge_level': self.knowledge_level, 'engagement': self.engagement, 'fatigue': self.fatigue, 'reliance': self.reliance, 'style': self.style}

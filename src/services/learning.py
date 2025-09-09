
import time, re, json, uuid
from ..models.schemas import ChatRequest
from ..storage.db import get_db
from ..core.gemini import call_gemini, DEFAULT_MODEL
from ..services.socratic import generator_prompt, critic_prompt, socratic_questions, ContextAwareReasoner, AdaptiveProfile
from ..utils.metrics import count_tokens, bleu_score, rouge_l, perplexity_proxy
from fastapi import HTTPException
import os

def run_chain(req: ChatRequest):
    # Basic validation
    if not req.user_id:
        raise HTTPException(status_code=400, detail='user_id required')
    conn = get_db()
    try:
        # Ensure learner exists
        cur = conn.execute('SELECT profile_json FROM learners WHERE user_id=?', (req.user_id,))
        row = cur.fetchone()
        if row:
            profile = AdaptiveProfile(json.loads(row[0]))
        else:
            profile = AdaptiveProfile()
            conn.execute('INSERT INTO learners(user_id, created_at, profile_json) VALUES (?,?,?)', (req.user_id, time.strftime('%Y-%m-%dT%H:%M:%SZ'), json.dumps(profile.to_json())))
            conn.commit()

        ctx = ContextAwareReasoner.infer_context(req.device, req.local_time)
        hints = ContextAwareReasoner.delivery_hints(ctx)

        g_prompt = generator_prompt(req.question, req.context_docs or [], hints)
        # If GOOGLE_API_KEY not set, inform user
        if not os.getenv('GOOGLE_API_KEY'):
            raise HTTPException(status_code=500, detail='GOOGLE_API_KEY not set; set it in env to enable Gemini calls.')
        generator = call_gemini(g_prompt, model=req.model or DEFAULT_MODEL, max_tokens=req.max_tokens, temperature=req.temperature)

        c_prompt = critic_prompt(generator)
        critic_raw = call_gemini(c_prompt, model=req.model or DEFAULT_MODEL, max_tokens=400, temperature=0.0)
        final_answer = generator
        try:
            m = re.search(r"\{(?:.|\n)*\}", critic_raw)
            if m:
                parsed = json.loads(m.group(0))
                if parsed.get('edits'):
                    final_answer = parsed['edits']
        except Exception:
            pass

        q1, q2 = socratic_questions()
        ai_tokens = count_tokens(final_answer)
        user_tokens = count_tokens(req.question)
        reliance_score = ai_tokens / max(1, user_tokens)

        conn.execute('INSERT INTO interactions(session_id, ts, question, context_json, generator, critic_raw, final_answer, socratic_q1, socratic_q2, ai_tokens, user_tokens, reliance_score, difficulty) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                     (str(uuid.uuid4()), time.strftime('%Y-%m-%dT%H:%M:%SZ'), req.question, json.dumps({'ctx': ctx, 'hints': hints}), generator, critic_raw, final_answer, q1, q2, ai_tokens, user_tokens, reliance_score, profile.knowledge_level))
        interaction_id = conn.execute('SELECT last_insert_rowid()').fetchone()[0]
        conn.commit()

        bleu = bleu_score(final_answer, generator)
        rouge = rouge_l(final_answer, generator)
        ppl = perplexity_proxy(final_answer)
        conn.execute('INSERT INTO metrics(interaction_id, bleu, rougeL, perplexity_proxy, meta_json) VALUES (?,?,?,?,?)', (interaction_id, bleu, rouge, ppl, json.dumps({'note':'final vs generator'})))
        conn.commit()

        # Create formatted HTML for enhanced display
        formatted_answer = final_answer.replace('\n', '<br>')
        formatted_html = f"""
        <div class="response-container">
            <div class="final-answer">
                <h4>📝 Answer</h4>
                <div class="answer-content">{formatted_answer}</div>
            </div>

            <div class="response-meta">
                <div class="signals">
                    <strong>Signals:</strong> Reliance Score: {reliance_score:.2f}
                </div>

            </div>
        </div>
        """

        response_data = {
            'final_answer': final_answer,
            'socratic_questions': [q1, q2],
            'generator': generator,
            'critic': critic_raw,
            'signals': {'reliance_score': reliance_score},
            'provenance': {'model': req.model or DEFAULT_MODEL, 'endpoint':'Google Generative AI'},
            'formatted_html': formatted_html.strip()
        }
        return response_data
    finally:
        conn.close()

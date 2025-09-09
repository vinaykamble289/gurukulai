
import re, math
def tokenize(text: str):
    return re.findall(r"\w+|[^\w\s]", (text or '').lower(), flags=re.UNICODE)
def count_tokens(text: str):
    return max(1, len(tokenize(text)))
def bleu_score(candidate: str, reference: str) -> float:
    c = set(tokenize(candidate))
    r = set(tokenize(reference))
    if not c or not r:
        return 0.0
    return len(c & r) / len(c | r)
def rouge_l(candidate: str, reference: str) -> float:
    a = tokenize(candidate); b = tokenize(reference)
    if not a or not b:
        return 0.0
    dp = [[0]*(len(b)+1) for _ in range(len(a)+1)]
    for i in range(1, len(a)+1):
        for j in range(1, len(b)+1):
            if a[i-1] == b[j-1]:
                dp[i][j] = dp[i-1][j-1] + 1
            else:
                dp[i][j] = max(dp[i-1][j], dp[i][j-1])
    l = dp[-1][-1]
    return l / max(1, len(b))
def perplexity_proxy(text: str) -> float:
    toks = tokenize(text)
    if not toks:
        return 0.0
    from collections import Counter
    counts = Counter(toks)
    total = sum(counts.values())
    probs = [c/total for c in counts.values()]
    entropy = -sum(p * math.log(p + 1e-12) for p in probs)
    return math.exp(entropy)

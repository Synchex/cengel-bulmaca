import json
import random

with open("src/data/questions_db.json", "r", encoding="utf-8") as f:
    db = json.load(f)

# Filter: 5-11 letters and pristine tags
pool = [q for q in db if 5 <= q.get("answerLength", 0) <= 11 and "yeni-sorular-tdk" in q.get("tags", [])]
random.shuffle(pool)

def calc_score(q):
    score = 25  # base score
    
    # Heuristic: Answer length (longer -> harder)
    score += (q["answerLength"] - 5) * 8
    
    # Tag heuristic
    tags = q.get("tags", [])
    if "zor" in tags or q.get("difficulty") == "hard":
        score += 15
    if "kolay" in tags or q.get("difficulty") == "easy":
        score -= 10
        
    score = max(0, min(100, score))
    return int(score)

for q in pool:
    q["calcScore"] = calc_score(q)

pool.sort(key=lambda x: x["calcScore"])

output = {
    "regenerated_from_chapter": 5,
    "chapters": []
}

used = set()
N = 12
ch = 5

while ch <= N:
    target_min = 35 + int((ch - 5) * 1.5)
    target_max = 45 + int((ch - 5) * 1.5)
    
    items = []
    i = 0
    while i < len(pool) and len(items) < 30:
        q = pool[i]
        if q["answer"] not in used:
            if target_min - 25 <= q["calcScore"] <= target_max + 25:
                # Decide tag based strictly on final difficulty score
                if q["calcScore"] < 40:
                    diff_tag = "easy"
                elif q["calcScore"] >= 40 and q["calcScore"] <= 60:
                    diff_tag = "medium"
                elif q["calcScore"] > 60 and q["calcScore"] <= 85:
                    diff_tag = "hard"
                else:
                    diff_tag = "expert"
                
                clue_clean = q["clue"].replace("(Zor)", "").replace("(Orta)", "").replace("(Kolay)", "").replace("(Bölüm Sonu Sorusu)", "").strip()
                
                items.append({
                    "answer": q["answer"],
                    "clue": clue_clean,
                    "difficulty_tag": diff_tag,
                    "difficulty_score": q["calcScore"]
                })
                used.add(q["answer"])
                pool.pop(i)
                continue
        i += 1
        
    output["chapters"].append({
        "chapter": ch,
        "target_band": f"{target_min}-{target_max}",
        "items": items
    })
    ch += 1

with open("output_strict.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print("Generated N={} chapters strictly.".format(N))

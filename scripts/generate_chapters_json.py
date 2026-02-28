import json
import random
import os

with open("src/data/questions_db.json", "r", encoding="utf-8") as f:
    db = json.load(f)

# Filter 5-11 letters and only include our pristine generated words
pool = [q for q in db if 5 <= q.get("answerLength", 0) <= 11 and "yeni-sorular-tdk" in q.get("tags", [])]
random.shuffle(pool)

def calc_score(q):
    score = 20
    score += (q["answerLength"] - 5) * 8
    tags = q.get("tags", [])
    if "zor" in tags or q.get("difficulty") == "hard":
        score += 15
    if "kolay" in tags or q.get("difficulty") == "easy":
        score -= 10
    score = max(0, min(100, score))
    return score

for q in pool:
    q["calcScore"] = calc_score(q)

pool.sort(key=lambda x: x["calcScore"])

# output for full 60 chapters
big_output = {
    "regenerated_from_chapter": 5,
    "chapters": []
}

used = set()
for ch in range(5, 61): # up to N=60
    target_min = 35 + int((ch - 5) * 0.8) # slow progression
    target_max = 45 + int((ch - 5) * 0.8)
    
    items = []
    
    # scan for items close to target
    i = 0
    while i < len(pool) and len(items) < 30:
        q = pool[i]
        if q["answer"] not in used:
            if target_min - 20 <= q["calcScore"] <= target_max + 20:
                diff_tag = "medium"
                if q["calcScore"] < 40:
                    diff_tag = "easy"
                elif q["calcScore"] > 75:
                    diff_tag = "expert"
                elif q["calcScore"] > 60:
                    diff_tag = "hard"
                
                clue = q["clue"].replace("(Zor)", "").replace("(Orta)", "").replace("(Kolay)", "").strip()
                
                items.append({
                    "answer": q["answer"],
                    "clue": clue,
                    "difficulty_tag": diff_tag,
                    "difficulty_score": int(q["calcScore"])
                })
                used.add(q["answer"])
                pool.pop(i)
                continue
        i += 1
        
    big_output["chapters"].append({
        "chapter": ch,
        "target_band": f"{target_min}-{target_max}",
        "items": items
    })

with open("src/data/chapters_5_to_60.json", "w", encoding="utf-8") as f:
    json.dump(big_output, f, ensure_ascii=False, indent=2)

# Also create a small output of just ch 5 & 6 for the console
small_output = {
    "regenerated_from_chapter": 5,
    "chapters": big_output["chapters"][0:3] # just 5, 6, 7
}
with open("chapters_small.json", "w", encoding="utf-8") as f:
    json.dump(small_output, f, ensure_ascii=False, indent=2)

print("Done generating chapters.")

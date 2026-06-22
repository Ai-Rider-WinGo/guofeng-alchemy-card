import json, os

base = r"F:\guofeng-alchemy-card"
with open(os.path.join(base, "loc_data_37.json"), "r", encoding="utf-8") as f:
    locs = json.load(f)

print(f"Loaded {len(locs)} locations")

# Generate V2_CARDS Python code
parts = ["V2_CARDS = ["]
parts.append('    # 37张地点卡')
for c in locs:
    entry = "    " + json.dumps(c, ensure_ascii=False)
    parts.append(entry + ",")
parts.append("]")
new_v2 = "\n".join(parts)

# Replace in card_server.py
with open(os.path.join(base, "card_server.py"), "r", encoding="utf-8") as f:
    content = f.read()

# Find V2_CARDS boundaries - the first V2_CARDS = [ and its matching ]
start_idx = content.index("V2_CARDS = [")
# Count brace depth to find the matching ]
depth = 0
end_idx = start_idx
for i in range(start_idx, len(content)):
    ch = content[i]
    if ch == '[':
        depth += 1
    elif ch == ']':
        depth -= 1
        if depth == 0:
            end_idx = i + 1
            break

new_content = content[:start_idx] + new_v2 + "\n" + content[end_idx:]

with open(os.path.join(base, "card_server.py"), "w", encoding="utf-8") as f:
    f.write(new_content)

# Verify
try:
    compile(new_content, "card_server.py", "exec")
    print("COMPILE OK")
except SyntaxError as e:
    print(f"SYNTAX ERROR: {e}")
    print(f"  line {e.lineno}: {e.msg}")

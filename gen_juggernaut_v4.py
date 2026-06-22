"""
国风炼金卡牌 · 写实国风批量生成 v4 (Juggernaut模型)
- 使用 Juggernaut-XL 写实摄影模型（非动漫）
- 英文写实提示词（模型对英文写实词响应最佳）
- 严格男性化/历史写实，强力负面词压制女性化
- 每张自动清理缓存防OOM
- 进度追踪+断线重连+DB回填
"""
import sqlite3
import json
import urllib.request
import uuid
import time
import os
import datetime
import shutil
import subprocess
from pathlib import Path

# ======================== 配置 ========================
DB_PATH = r"F:\guofeng-alchemy-card\server\data2.db"
COMFY_URL = "http://127.0.0.1:8188"
COMFY_DIR = r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI"
COMFY_PYTHON = os.path.join(COMFY_DIR, ".venv", "Scripts", "python.exe")
COMFY_MAIN = os.path.join(COMFY_DIR, "main.py")
COMFY_OUTPUT = os.path.join(COMFY_DIR, "output")

# 关键：用写实模型，不用动漫模型
CKPT_NAME = "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
WIDTH, HEIGHT = 832, 1216

BASE_DIR = Path(r"F:\guofeng-alchemy-card")
OUT_DIR = BASE_DIR / "assets-output" / "cards" / "zh-v1"
PROGRESS_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v1_progress.json"
LOG_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v1_log.txt"

# 朝代英文映射
DYNASTY_EN = {
    "QH": ("Qin-Han dynasty", "Qin dynasty China", "ancient Chinese"),
    "SG": ("Three Kingdoms period", "Three Kingdoms era China", "ancient Chinese"),
    "LJ": ("Six Dynasties period", "Wei-Jin period China", "ancient Chinese"),
    "ST": ("Tang dynasty", "Tang dynasty China", "ancient Chinese"),
    "SY": ("Song-Yuan dynasty", "Song dynasty China", "ancient Chinese"),
    "MQ": ("Ming-Qing dynasty", "Ming dynasty China", "ancient Chinese"),
}

# 强力负面词 - 彻底压制女性化/动漫化
NEG_PROMPT = (
    "1girl, female, feminine, woman, girl, lady, "
    "anime, manga, cartoon, chibi, kawaii, moe, loli, "
    "bishounen, pretty boy, androgynous, soft feminine face, "
    "big anime eyes, makeup, lipstick, eyeliner, long flowing hair on men, "
    "nsfw, nude, 3d render, illustration, painting, watercolor, "
    "lowres, bad anatomy, bad hands, extra fingers, missing fingers, "
    "text, watermark, signature, username, worst quality, low quality, "
    "blurry, deformed, mutated, disfigured, "
    "modern clothing, gun, western, european, fantasy magic"
)

QUALITY = "masterpiece, best quality, ultra realistic, photorealistic, highly detailed, 8k, sharp focus, cinematic lighting"

# ======================== 日志 ========================
def log(msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except:
        pass

# ======================== 数据库 ========================
def load_cards_from_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM cards ORDER BY id")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def update_image_url(card_id, image_url):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE cards SET image_url=?, thumbnail_url=? WHERE card_id=?",
                (image_url, image_url, card_id))
    conn.commit()
    conn.close()

# ======================== 提示词生成（英文写实） ========================
def get_dynasty_en(card):
    cid = card["card_id"]
    prefix = cid.split("-")[0] if "-" in cid else ""
    return DYNASTY_EN.get(prefix, ("ancient Chinese history", "ancient China", "ancient Chinese"))

def parse_tags(card):
    tags = card.get("tags")
    if tags is None:
        return []
    if isinstance(tags, str):
        try:
            return json.loads(tags)
        except:
            return [t.strip() for t in tags.split(",")]
    return tags

def tags_to_en(tags):
    """标签翻译映射（常见中文标签→英文）"""
    mapping = {
        "帝王":"emperor","将军":"general","名将":"famous general","谋士":"strategist",
        "诗人":"poet","丞相":"prime minister","霸王":"warlord","开国":"founding",
        "统一":"unification","长城":"Great Wall","宫殿":"palace","战场":"battlefield",
        "起义":"uprising","兵器":"weapon","宝剑":"sword","铠甲":"armor",
        "汉朝":"Han dynasty","秦朝":"Qin dynasty","唐朝":"Tang dynasty",
        "宋朝":"Song dynasty","明朝":"Ming dynasty","三国":"Three Kingdoms",
        "佛教":"Buddhism","医学":"medicine","数学":"mathematics","法律":"law",
        "典籍":"ancient text","历史":"historical","战争":"war","外交":"diplomacy",
    }
    return [mapping.get(t, t) for t in tags]

def build_prompt_person(card):
    name = card["name"]
    dyn_full, dyn_short, dyn_style = get_dynasty_en(card)
    tags = tags_to_en(parse_tags(card))[:4]
    tags_str = ", ".join(tags) if tags else "historical figure"
    return (
        f"{QUALITY}, 1man, solo, portrait of {name} the {dyn_short} historical figure, "
        f"masculine adult Chinese man, stern dignified face, short black beard, thick eyebrows, "
        f"weathered mature face, wearing {dyn_style} traditional Han Chinese robes and court dress, "
        f"historical drama style, realistic Chinese historical figure, "
        f"identity: {tags_str}, "
        f"standing in {dyn_short} palace or historical setting, "
        f"vertical composition, national historical drama cinematography, "
        f"detailed face, realistic skin texture, ornate traditional costume"
    )

def build_prompt_event(card):
    name = card["name"]
    dyn_full, dyn_short, dyn_style = get_dynasty_en(card)
    tags = tags_to_en(parse_tags(card))[:4]
    tags_str = ", ".join(tags) if tags else "historical event"
    return (
        f"{QUALITY}, epic historical scene of {name}, {dyn_full} historical event, "
        f"ancient Chinese soldiers, warriors in {dyn_style} armor, armies, castles, battlefields, "
        f"grand historical spectacle, {tags_str}, "
        f"realistic Chinese historical drama cinematography, "
        f"dramatic atmosphere, conflict and tension, "
        f"vertical composition, cinematic wide shot, atmospheric, detailed"
    )

def build_prompt_place(card):
    name = card["name"]
    dyn_full, dyn_short, dyn_style = get_dynasty_en(card)
    tags = tags_to_en(parse_tags(card))[:4]
    tags_str = ", ".join(tags) if tags else "historical landmark"
    return (
        f"{QUALITY}, no humans, landscape of {name}, {dyn_full} historical landmark, "
        f"ancient Chinese architecture, {dyn_style} city walls, palaces, temples, fortresses, "
        f"{tags_str}, grand ancient Chinese cityscape, "
        f"realistic Chinese historical scenery, atmospheric, misty mountains, "
        f"vertical composition, cinematic landscape, detailed architecture"
    )

def build_prompt_weapon(card):
    name = card["name"]
    dyn_full, dyn_short, dyn_style = get_dynasty_en(card)
    tags = tags_to_en(parse_tags(card))[:4]
    tags_str = ", ".join(tags) if tags else "ancient weapon"
    return (
        f"{QUALITY}, no humans, still life close-up of {name}, {dyn_full} ancient Chinese weapon, "
        f"ornate cold weapon, metal texture, intricate engravings, {dyn_style} craftsmanship, "
        f"{tags_str}, displayed on dark silk background, museum quality, "
        f"realistic product photography, dramatic lighting, vertical composition, detailed"
    )

def build_prompt_classic(card):
    name = card["name"]
    dyn_full, dyn_short, dyn_style = get_dynasty_en(card)
    tags = tags_to_en(parse_tags(card))[:4]
    tags_str = ", ".join(tags) if tags else "ancient text"
    return (
        f"{QUALITY}, no humans, still life of {name}, {dyn_full} ancient Chinese classic text, "
        f"bamboo slips, silk scrolls, thread-bound books, ink and brush, calligraphy, "
        f"{dyn_style} scholarly atmosphere, {tags_str}, "
        f"realistic still life photography, warm candlelight, vertical composition, detailed"
    )

def build_prompt_dynasty(card):
    name = card["name"]
    dyn_full, dyn_short, dyn_style = get_dynasty_en(card)
    tags = tags_to_en(parse_tags(card))[:4]
    tags_str = ", ".join(tags) if tags else "dynasty symbol"
    return (
        f"{QUALITY}, symbolic emblem of {name}, {dyn_full} Chinese empire, "
        f"imperial dragon flag, jade seal, grand palace, Great Wall silhouette, "
        f"{tags_str}, majestic imperial Chinese atmosphere, golden splendor, "
        f"realistic historical grandeur, vertical composition, epic, detailed"
    )

def build_prompt(card):
    t = card.get("type", "person")
    builders = {
        "person": build_prompt_person,
        "event": build_prompt_event,
        "place": build_prompt_place,
        "weapon": build_prompt_weapon,
        "classic": build_prompt_classic,
        "book": build_prompt_classic,
        "dynasty": build_prompt_dynasty,
    }
    return builders.get(t, build_prompt_person)(card)

# ======================== ComfyUI 交互 ========================
def check_comfyui():
    try:
        req = urllib.request.Request(f"{COMFY_URL}/system_stats")
        with urllib.request.urlopen(req, timeout=10) as r:
            return True, json.loads(r.read())
    except:
        return False, None

def start_comfyui():
    log("启动 ComfyUI...")
    try:
        subprocess.Popen(
            [COMFY_PYTHON, COMFY_MAIN, "--port", "8188", "--listen", "127.0.0.1", "--disable-auto-launch"],
            cwd=COMFY_DIR,
            stdout=open(os.path.join(COMFY_DIR, "comfyui_run.log"), "w"),
            stderr=subprocess.STDOUT,
            creationflags=0x00000008
        )
        for i in range(60):
            time.sleep(3)
            ok, _ = check_comfyui()
            if ok:
                log("✅ ComfyUI就绪")
                return True
        return False
    except Exception as e:
        log(f"❌ 启动失败: {e}")
        return False

def queue_prompt(prompt_text, neg_text, seed, filename_prefix):
    wf = {
        "1": {"inputs": {"ckpt_name": CKPT_NAME}, "class_type": "CheckpointLoaderSimple"},
        "2": {"inputs": {"text": prompt_text, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "3": {"inputs": {"text": neg_text, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "4": {"inputs": {"width": WIDTH, "height": HEIGHT, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "5": {"inputs": {
            "seed": seed, "steps": 30, "cfg": 7.0,
            "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0,
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]
        }, "class_type": "KSampler"},
        "6": {"inputs": {"samples": ["5", 0], "vae": ["1", 2]}, "class_type": "VAEDecode"},
        "7": {"inputs": {"images": ["6", 0], "filename_prefix": filename_prefix}, "class_type": "SaveImage"}
    }
    body = json.dumps({"prompt": wf, "client_id": f"jg-{uuid.uuid4().hex[:8]}"}).encode()
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=body)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def wait_result(prompt_id, timeout=600):
    start = time.time()
    last_log = start
    while time.time() - start < timeout:
        try:
            req = urllib.request.Request(f"{COMFY_URL}/history/{prompt_id}")
            with urllib.request.urlopen(req, timeout=15) as r:
                hist = json.loads(r.read())
            if prompt_id in hist:
                entry = hist[prompt_id]
                outputs = entry.get("outputs", {})
                if outputs:
                    result = []
                    for nid, out in outputs.items():
                        for img in out.get("images", []):
                            src = os.path.join(COMFY_OUTPUT, img.get("subfolder", ""), img["filename"])
                            if os.path.exists(src):
                                result.append(src)
                    if result:
                        return result
                status = entry.get("status", {})
                for m in status.get("messages", []):
                    if m[0] == "execution_error":
                        log(f"  ❌ ComfyUI错误: {str(m[1].get('exception_message',''))[:100]}")
                        return []
            if time.time() - last_log > 60:
                log(f"  ⏳ 等待中 ({int(time.time()-start)}s)")
                last_log = time.time()
        except Exception as e:
            if time.time() - last_log > 60:
                log(f"  ⚠️ 轮询异常: {str(e)[:60]}")
                last_log = time.time()
        time.sleep(5)
    return []

def clear_history():
    try:
        urllib.request.urlopen(urllib.request.Request(f"{COMFY_URL}/history", method="DELETE"), timeout=10)
    except: pass

def free_memory():
    try:
        urllib.request.urlopen(urllib.request.Request(f"{COMFY_URL}/free", method="POST",
            data=json.dumps({"unload_models": True, "free_memory": True}).encode()), timeout=15)
    except: pass

# ======================== 进度 ========================
def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed": {}, "failed": {}}

def save_progress(prog):
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(prog, f, ensure_ascii=False, indent=2)

# ======================== 生成单张 ========================
def generate_one(card, prog):
    cid = card["card_id"]
    name = card["name"]
    ctype = card.get("type", "person")
    if cid in prog["completed"]:
        return True
    
    prompt_text = build_prompt(card)
    seed = int(time.time() * 1000) % (2**32)
    fname = f"jgv1/{cid}"
    
    log(f"🎨 [{len(prog['completed'])+1}/149] {cid} {name} ({ctype})")
    log(f"   prompt: {prompt_text[:90]}...")
    
    try:
        result = queue_prompt(prompt_text, NEG_PROMPT, seed, fname)
        pid = result.get("prompt_id", "")
        if not pid:
            log(f"   ❌ 提交失败")
            prog["failed"][cid] = prog["failed"].get(cid, 0) + 1
            return False
        
        outputs = wait_result(pid, timeout=600)
        if outputs:
            dst = OUT_DIR / f"{cid}.png"
            OUT_DIR.mkdir(parents=True, exist_ok=True)
            shutil.copy2(outputs[0], dst)
            rel_path = f"/assets-output/cards/zh-v1/{cid}.png"
            update_image_url(cid, rel_path)
            prog["completed"][cid] = {"path": str(dst), "url": rel_path, "seed": seed,
                                       "time": datetime.datetime.now().isoformat()}
            if cid in prog["failed"]:
                del prog["failed"][cid]
            log(f"   ✅ 成功 -> {rel_path}")
            return True
        else:
            log(f"   ❌ 失败/超时")
            prog["failed"][cid] = prog["failed"].get(cid, 0) + 1
            return False
    except Exception as e:
        log(f"   ❌ 异常: {str(e)[:100]}")
        prog["failed"][cid] = prog["failed"].get(cid, 0) + 1
        return False

# ======================== 主函数 ========================
def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    log("=" * 60)
    log("国风炼金卡牌 · 写实国风生成 v4 (Juggernaut模型)")
    log(f"模型: {CKPT_NAME}")
    log("=" * 60)
    
    cards = load_cards_from_db()
    log(f"数据库卡牌: {len(cards)}")
    
    ok, _ = check_comfyui()
    if not ok:
        start_comfyui()
    
    prog = load_progress()
    log(f"已完成: {len(prog['completed'])}, 失败: {len(prog['failed'])}")
    
    MAX_RETRY = 3
    consecutive_fail = 0
    
    pending = [c for c in cards if c["card_id"] not in prog["completed"]]
    log(f"待生成: {len(pending)}")
    
    round_num = 0
    while pending:
        round_num += 1
        log(f"\n{'='*40}\n🔄 第{round_num}轮 - 剩余{len(pending)}张\n{'='*40}")
        
        new_pending = []
        for card in pending:
            cid = card["card_id"]
            if prog["failed"].get(cid, 0) >= MAX_RETRY:
                log(f"⏭️ {cid} 超过重试上限，跳过")
                continue
            
            save_progress(prog)
            success = generate_one(card, prog)
            save_progress(prog)
            
            # 每10张清理缓存防OOM
            if len(prog["completed"]) % 10 == 0 and success:
                clear_history()
                free_memory()
                log("   🧹 已清理缓存")
            
            if success:
                consecutive_fail = 0
            else:
                consecutive_fail += 1
                if consecutive_fail >= 3:
                    log("⚠️ 连续失败3次")
                    ok, _ = check_comfyui()
                    if not ok:
                        start_comfyui()
                    else:
                        clear_history()
                        free_memory()
                        time.sleep(10)
                    consecutive_fail = 0
            
            time.sleep(2)
            new_pending.append(card)
        
        pending = [c for c in new_pending if c["card_id"] not in prog["completed"] and prog["failed"].get(c["card_id"], 0) < MAX_RETRY]
        if not pending:
            break
        if len(pending) == len(new_pending):
            log("⚠️ 无进展，等待30秒")
            time.sleep(30)
    
    log("=" * 60)
    log(f"🎉 完成！成功: {len(prog['completed'])}/149, 失败: {len(prog['failed'])}")
    log("=" * 60)

if __name__ == "__main__":
    main()

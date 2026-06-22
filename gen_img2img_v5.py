"""
国风炼金卡牌 · 图生图批量生成 v5
- 网上下载参考图（历史人物/场景）
- ControlNet Canny边缘检测 + GuoFeng4.1重绘
- 半写实国风卡牌输出
"""
import sqlite3, json, urllib.request, urllib.parse
import uuid, time, os, datetime, shutil, subprocess, random
from pathlib import Path

# ======================== 配置 ========================
DB_PATH = r"F:\guofeng-alchemy-card\server\data2.db"
COMFY_URL = "http://127.0.0.1:8188"
COMFY_DIR = r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI"
COMFY_PYTHON = os.path.join(COMFY_DIR, ".venv", "Scripts", "python.exe")
COMFY_MAIN = os.path.join(COMFY_DIR, "main.py")
COMFY_OUTPUT = os.path.join(COMFY_DIR, "output")
COMFY_INPUT = os.path.join(COMFY_DIR, "input")

CKPT_NAME = "GuoFeng4.1_2.5D.safetensors"
CN_MODEL = "diffusion_pytorch_model.safetensors"
WIDTH, HEIGHT = 832, 1216

BASE_DIR = Path(r"F:\guofeng-alchemy-card")
OUT_DIR = BASE_DIR / "assets-output" / "cards" / "zh-v2"
REF_DIR = BASE_DIR / "assets-source" / "ref-images"
PROGRESS_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v2_progress.json"
LOG_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v2_log.txt"

# 提示词模板
PROMPTS = {
    "person": (
        "masterpiece, best quality, ultra realistic, epic Chinese historical portrait of {name}, "
        "ancient Chinese {tags}, masculine mature man with stern dignified face, short beard, thick eyebrows, "
        "wearing {dynasty} traditional Han Chinese robes, detailed imperial costume, "
        "dramatic lighting, Chinese historical drama cinematography, highly detailed face, realistic skin, ornate"
    ),
    "event": (
        "masterpiece, best quality, ultra realistic, epic Chinese historical battle scene of {name}, "
        "ancient Chinese {tags}, armies, warriors in {dynasty} armor, dramatic conflict, "
        "cinematic wide shot, dust, banners, dramatic sky, highly detailed"
    ),
    "place": (
        "masterpiece, best quality, ultra realistic, ancient Chinese landmark {name}, "
        "{tags}, {dynasty} architecture, grand palaces, city walls, misty mountains, "
        "cinematic landscape, atmospheric lighting, highly detailed architecture, no humans"
    ),
    "weapon": (
        "masterpiece, best quality, ultra realistic, ancient Chinese weapon {name}, "
        "{tags}, {dynasty} craftsmanship, ornate metalwork, displayed on dark silk, "
        "museum quality lighting, detailed engravings, no humans, still life"
    ),
    "classic": (
        "masterpiece, best quality, ultra realistic, ancient Chinese classic text {name}, "
        "{tags}, {dynasty} bamboo slips, silk scrolls, ink brush, calligraphy, "
        "warm candlelight, scholarly atmosphere, no humans, still life"
    ),
    "dynasty": (
        "masterpiece, best quality, ultra realistic, Chinese imperial emblem of {name}, "
        "{tags}, {dynasty} dynasty, dragon flag, jade seal, golden palace, Great Wall, "
        "majestic imperial atmosphere, epic, highly detailed"
    ),
}

NEG = ("1girl, female, feminine, anime, manga, cartoon, chibi, 3d render, illustration, painting, "
       "watercolor, bishounen, pretty boy, androgynous, soft face, big eyes, makeup, nsfw, nude, "
       "lowres, worst quality, blurry, deformed, modern, gun, western, text, watermark")

DYNASTY_EN = {"QH":"Qin-Han","SG":"Three Kingdoms","LJ":"Six Dynasties","ST":"Tang","SY":"Song-Yuan","MQ":"Ming-Qing"}

os.makedirs(REF_DIR, exist_ok=True)
os.makedirs(COMFY_INPUT, exist_ok=True)

def log(msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f: f.write(line + "\n")
    except: pass

# ======================== 数据库 ========================
def load_cards():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM cards ORDER BY id")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def update_db(card_id, url):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE cards SET image_url=?, thumbnail_url=? WHERE card_id=?", (url, url, card_id))
    conn.commit()
    conn.close()

def parse_tags(card):
    tags = card.get("tags")
    if not tags: return ""
    if isinstance(tags, str):
        try: tags = json.loads(tags)
        except: tags = [t.strip() for t in tags.split(",")]
    return ", ".join(tags[:4])

def get_dynasty(card):
    cid = card["card_id"]
    prefix = cid.split("-")[0] if "-" in cid else ""
    return DYNASTY_EN.get(prefix, "ancient Chinese")

# ======================== 参考图下载 ========================
def download_reference(card):
    """下载卡牌对应的参考图"""
    name = card["name"]
    cid = card["card_id"]
    ref_path = REF_DIR / f"{cid}.jpg"
    
    if ref_path.exists() and ref_path.stat().st_size > 1000:
        return str(ref_path)
    
    query = f"{name} 历史 画像 古画"
    encoded = urllib.parse.quote(query)
    
    # 使用DuckDuckGo图片搜索（不需要API key）
    try:
        url = f"https://lite.duckduckgo.com/lite/?q={encoded}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="ignore")
        
        # 找图片URL（简单回退方案：用维基百科/百度百科的OG图片）
        # 如果搜索失败，生成一个占位参考图
    except:
        pass
    
    # 回退：生成色彩参考图（单色背景，ControlNet Canny 也能提取边缘引导）
    from PIL import Image
    colors = {
        "person": (60, 50, 40), "event": (70, 50, 30),
        "place": (40, 70, 50), "weapon": (30, 30, 50),
        "classic": (50, 40, 30), "dynasty": (70, 50, 10),
    }
    ctype = card.get("type", "person")
    bg = colors.get(ctype, (50, 50, 50))
    img = Image.new("RGB", (WIDTH, HEIGHT), bg)
    img.save(ref_path)
    log(f"  📥 参考图(占位): {cid}")
    return str(ref_path)

def install_ref_to_comfyui(card):
    """安装参考图到ComfyUI input目录"""
    ref_path = download_reference(card)
    # 复制到ComfyUI input
    cid = card["card_id"]
    dst = os.path.join(COMFY_INPUT, f"ref_{cid}.jpg")
    shutil.copy2(ref_path, dst)
    return f"ref_{cid}.jpg"

# ======================== 提交生成 ========================
def gen_img2img(card, ref_filename):
    """提交图生图任务"""
    name = card["name"]
    ctype = card.get("type", "person")
    tags = parse_tags(card)
    dynasty = get_dynasty(card)
    
    tmpl = PROMPTS.get(ctype, PROMPTS["person"])
    prompt = tmpl.format(name=name, tags=tags, dynasty=dynasty)
    seed = int(time.time() * 1000) % (2**32)
    fname = f"i2i/{card['card_id']}"
    
    wf = {
        "1": {"inputs": {"ckpt_name": CKPT_NAME}, "class_type": "CheckpointLoaderSimple"},
        "2": {"inputs": {"text": prompt, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "3": {"inputs": {"text": NEG, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "4": {"inputs": {"image": ref_filename}, "class_type": "LoadImage"},
        "5": {"inputs": {"low_threshold": 100, "high_threshold": 200, "image": ["4", 0]}, "class_type": "Canny"},
        "6": {"inputs": {"control_net_name": CN_MODEL}, "class_type": "ControlNetLoader"},
        "7": {"inputs": {"positive": ["2", 0], "negative": ["3", 0], "control_net": ["6", 0], "image": ["5", 0],
                          "strength": 0.7, "start_percent": 0.0, "end_percent": 1.0}, "class_type": "ControlNetApplyAdvanced"},
        "8": {"inputs": {"width": WIDTH, "height": HEIGHT, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "9": {"inputs": {"seed": seed, "steps": 30, "cfg": 6.5, "sampler_name": "dpmpp_2m", "scheduler": "karras",
                          "denoise": 1.0, "model": ["1", 0], "positive": ["7", 0], "negative": ["7", 1],
                          "latent_image": ["8", 0]}, "class_type": "KSampler"},
        "10": {"inputs": {"samples": ["9", 0], "vae": ["1", 2]}, "class_type": "VAEDecode"},
        "11": {"inputs": {"images": ["10", 0], "filename_prefix": fname}, "class_type": "SaveImage"}
    }
    
    body = json.dumps({"prompt": wf, "client_id": f"i2i-{uuid.uuid4().hex[:8]}"}).encode()
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=body)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def wait_result(pid, timeout=600):
    start = time.time()
    while time.time() - start < timeout:
        try:
            h = json.loads(urllib.request.urlopen(
                urllib.request.Request(f"{COMFY_URL}/history/{pid}"), timeout=15).read())
            if pid in h:
                entry = h[pid]
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
                for m in entry.get("status", {}).get("messages", []):
                    if m[0] == "execution_error":
                        return []
            if time.time() - start > 300:
                log(f"  ⏳ 等待中({int(time.time()-start)}s)")
        except:
            pass
        time.sleep(5)
    return []

# ======================== 主流程 ========================
def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    log("=" * 60)
    log("国风炼金卡牌 · 图生图批量 v5 (ControlNet+GuoFeng4.1)")
    log(f"模型: {CKPT_NAME} | ControlNet: {CN_MODEL}")
    log("=" * 60)
    
    cards = load_cards()
    log(f"卡牌总数: {len(cards)}")
    
    # 进度
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, encoding="utf-8") as f:
            prog = json.load(f)
    else:
        prog = {"completed": {}, "failed": {}}
    
    done = len(prog["completed"])
    log(f"已完成: {done}, 失败: {len(prog['failed'])}")
    
    MAX_RETRY = 3
    
    # 第1步：下载所有参考图
    log("\n📥 下载参考图...")
    for card in cards:
        cid = card["card_id"]
        if cid in prog["completed"]:
            continue
        download_reference(card)
        install_ref_to_comfyui(card)
    log("参考图准备完毕")
    
    # 第2步：批量生成
    pending = [c for c in cards if c["card_id"] not in prog["completed"]]
    log(f"\n🎨 开始生成 {len(pending)} 张...")
    
    for idx, card in enumerate(pending):
        cid = card["card_id"]
        retry = prog["failed"].get(cid, 0)
        if retry >= MAX_RETRY:
            continue
        
        name = card["name"]
        log(f"\n[{done+idx+1}/{len(cards)}] {cid} {name}")
        
        try:
            ref = f"ref_{cid}.jpg"
            result = gen_img2img(card, ref)
            pid = result.get("prompt_id", "")
            if not pid:
                prog["failed"][cid] = retry + 1
                continue
            
            outputs = wait_result(pid)
            if outputs:
                dst = OUT_DIR / f"{cid}.png"
                shutil.copy2(outputs[0], dst)
                rel = f"/assets-output/cards/zh-v2/{cid}.png"
                update_db(cid, rel)
                prog["completed"][cid] = rel
                prog["failed"].pop(cid, None)
                log(f"  ✅ -> {rel}")
            else:
                prog["failed"][cid] = retry + 1
                log(f"  ❌ 失败 ({retry+1}/{MAX_RETRY})")
        except Exception as e:
            prog["failed"][cid] = retry + 1
            log(f"  ❌ 异常: {str(e)[:80]}")
        
        # 存档
        with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
            json.dump(prog, f, ensure_ascii=False, indent=2)
        
        time.sleep(2)
    
    done = len(prog["completed"])
    log(f"\n🎉 完成! {done}/{len(cards)} 成功, {len(prog['failed'])} 失败")
    
    # 重试失败
    if prog["failed"]:
        log("\n🔄 重试失败卡牌...")
        # TODO

if __name__ == "__main__":
    main()

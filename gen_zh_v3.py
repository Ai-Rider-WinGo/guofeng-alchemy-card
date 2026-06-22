"""
国风炼金卡牌 · 中文提示词批量生成器 v3
- 从数据库读取149张卡牌
- 生成中文历史风提示词（严格历史特征，无女性化）
- 批量调用ComfyUI生成
- 30分钟监控+断线重连
- 完成后回填image_url到数据库
"""
import sqlite3
import json
import urllib.request
import urllib.error
import uuid
import time
import os
import sys
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

CKPT_NAME = "animagine-xl-4.0-opt.safetensors"
WIDTH, HEIGHT = 832, 1216  # 竖版卡牌 2:3

BASE_DIR = Path(r"F:\guofeng-alchemy-card")
OUT_DIR = BASE_DIR / "assets-output" / "cards" / "zh-v1"
PROGRESS_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v1_progress.json"
LOG_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v1_log.txt"

# 朝代映射（按card_id前缀）
DYNASTY_MAP = {
    "QH": ("秦汉", "秦汉时期", "秦汉风"),
    "SG": ("三国", "三国时期", "三国风"),
    "LJ": ("两晋南北朝", "魏晋南北朝时期", "六朝风"),
    "ST": ("隋唐", "隋唐时期", "盛唐风"),
    "SY": ("宋元", "宋元时期", "宋元风"),
    "MQ": ("明清", "明清时期", "明清风"),
}

# 全局负面提示词
NEG_PROMPT = (
    "nsfw, nude, female, feminine, girly, makeup, lipstick, "
    "bishounen, pretty boy, androgynous, soft face, big eyes, "
    "anime, manga, cartoon, chibi, 3d, realistic photo, photograph, "
    "lowres, bad anatomy, bad hands, text, error, worst quality, "
    "low quality, signature, watermark, blurry, deformed, "
    "modern, gun, western, european"
)

# 质量增强
QUALITY = "masterpiece, best quality, high score, great score, absurdres, highly detailed"

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
    """从数据库读取所有卡牌"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM cards ORDER BY id")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def update_image_url(card_id, image_url):
    """回填图片URL到数据库"""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE cards SET image_url=?, thumbnail_url=? WHERE card_id=?",
                (image_url, image_url, card_id))
    conn.commit()
    conn.close()

# ======================== 提示词生成 ========================
def get_real_dynasty(card):
    """根据card_id前缀获取真实朝代"""
    cid = card["card_id"]
    prefix = cid.split("-")[0] if "-" in cid else ""
    if prefix in DYNASTY_MAP:
        return DYNASTY_MAP[prefix]
    # 旧格式卡牌，用数据库里的dynasty字段
    dyn = card.get("dynasty", "秦汉")
    return (dyn, f"{dyn}时期", f"{dyn}风")

def parse_tags(card):
    """解析tags字段（可能是JSON字符串或列表）"""
    tags = card.get("tags")
    if tags is None:
        return []
    if isinstance(tags, str):
        try:
            return json.loads(tags)
        except:
            return [t.strip() for t in tags.split(",") if t.strip()]
    return tags

def build_prompt_person(card):
    """人物卡中文提示词 - 严格历史特征，男性化"""
    name = card["name"]
    dyn_cn, dyn_period, dyn_style = get_real_dynasty(card)
    story = card.get("story") or card.get("knowledge_point") or ""
    tags = parse_tags(card)
    
    # 根据标签判断身份特征
    tags_str = "、".join(tags[:4]) if tags else "历史人物"
    
    prompt = (
        f"{QUALITY}, "
        f"中国古代历史人物插画，{name}，{dyn_period}，"
        f"成年男性，刚毅面容，浓眉，蓄须，"
        f"身穿{dyn_style}传统汉族服饰，"
        f"历史写实风格，国风半写实卡牌插画，"
        f"人物特征：{tags_str}，"
        f"背景为{dyn_period}历史场景，"
        f"竖版构图，庄重肃穆，"
        f"古籍纸纹质感，金石纹理，"
        f"高质量国风插画，细节丰富"
    )
    return prompt

def build_prompt_event(card):
    """事件卡中文提示词"""
    name = card["name"]
    dyn_cn, dyn_period, dyn_style = get_real_dynasty(card)
    story = card.get("story") or card.get("knowledge_point") or ""
    tags = parse_tags(card)
    tags_str = "、".join(tags[:4]) if tags else "历史事件"
    
    prompt = (
        f"{QUALITY}, "
        f"中国古代历史事件场景插画，{name}，{dyn_period}，"
        f"宏大历史场景，{tags_str}，"
        f"古代将士、军队、城池、战场氛围，"
        f"{dyn_style}历史史诗插画，"
        f"国风半写实卡牌插画，"
        f"冲突与历史氛围浓厚，"
        f"竖版构图，气势恢宏，"
        f"古籍纸纹质感，水墨渲染，"
        f"高质量国风插画，细节丰富"
    )
    return prompt

def build_prompt_place(card):
    """地点卡中文提示词"""
    name = card["name"]
    dyn_cn, dyn_period, dyn_style = get_real_dynasty(card)
    tags = parse_tags(card)
    tags_str = "、".join(tags[:4]) if tags else "历史地点"
    
    prompt = (
        f"{QUALITY}, "
        f"中国古代历史地点风景插画，{name}，{dyn_period}，"
        f"{tags_str}，"
        f"古城池、宫殿、关隘、山水建筑，"
        f"{dyn_style}历史建筑风景，"
        f"国风半写实卡牌插画，"
        f"无人物，纯场景，"
        f"竖版构图，意境深远，"
        f"古籍纸纹质感，水墨渲染，"
        f"高质量国风插画，细节丰富"
    )
    return prompt

def build_prompt_weapon(card):
    """兵器卡中文提示词"""
    name = card["name"]
    dyn_cn, dyn_period, dyn_style = get_real_dynasty(card)
    tags = parse_tags(card)
    tags_str = "、".join(tags[:4]) if tags else "古代兵器"
    
    prompt = (
        f"{QUALITY}, "
        f"中国古代兵器特写插画，{name}，{dyn_period}，"
        f"{tags_str}，"
        f"精致冷兵器，金属质感，纹饰精美，"
        f"{dyn_style}兵器工艺，"
        f"国风半写实卡牌插画，静物特写，"
        f"竖版构图，古朴庄重，"
        f"古籍纸纹质感，金石纹理，"
        f"高质量国风插画，细节丰富"
    )
    return prompt

def build_prompt_classic(card):
    """典籍卡中文提示词"""
    name = card["name"]
    dyn_cn, dyn_period, dyn_style = get_real_dynasty(card)
    tags = parse_tags(card)
    tags_str = "、".join(tags[:4]) if tags else "古代典籍"
    
    prompt = (
        f"{QUALITY}, "
        f"中国古代典籍文献插画，{name}，{dyn_period}，"
        f"{tags_str}，"
        f"竹简、帛书、线装古籍，毛笔墨迹，"
        f"{dyn_style}书卷气息，"
        f"国风半写实卡牌插画，书房静物，"
        f"竖版构图，古朴典雅，"
        f"古籍纸纹质感，水墨渲染，"
        f"高质量国风插画，细节丰富"
    )
    return prompt

def build_prompt_dynasty(card):
    """朝代卡中文提示词"""
    name = card["name"]
    dyn_cn, dyn_period, dyn_style = get_real_dynasty(card)
    tags = parse_tags(card)
    tags_str = "、".join(tags[:4]) if tags else "王朝象征"
    
    prompt = (
        f"{QUALITY}, "
        f"中国古代王朝象征插画，{name}，{dyn_period}，"
        f"{tags_str}，"
        f"龙旗、玉玺、皇宫、长城等王朝意象，"
        f"{dyn_style}帝国气象，"
        f"国风半写实卡牌插画，"
        f"竖版构图，恢宏大气，金碧辉煌，"
        f"古籍纸纹质感，金石纹理，"
        f"高质量国风插画，细节丰富"
    )
    return prompt

def build_prompt(card):
    """根据卡牌类型生成中文提示词"""
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
    builder = builders.get(t, build_prompt_person)
    return builder(card)

# ======================== ComfyUI 交互 ========================
def check_comfyui():
    try:
        req = urllib.request.Request(f"{COMFY_URL}/system_stats")
        with urllib.request.urlopen(req, timeout=10) as r:
            return True, json.loads(r.read())
    except:
        return False, None

def start_comfyui():
    """启动ComfyUI"""
    log("正在启动 ComfyUI...")
    try:
        subprocess.Popen(
            [COMFY_PYTHON, COMFY_MAIN, "--port", "8188", "--listen", "127.0.0.1", "--disable-auto-launch"],
            cwd=COMFY_DIR,
            stdout=open(os.path.join(COMFY_DIR, "comfyui_run.log"), "w"),
            stderr=subprocess.STDOUT,
            creationflags=0x00000008  # DETACHED_PROCESS
        )
        return True
    except Exception as e:
        log(f"启动失败: {e}")
        return False

def wait_comfyui(max_wait=180):
    for i in range(max_wait // 3):
        ok, _ = check_comfyui()
        if ok:
            log("ComfyUI 已就绪")
            return True
        time.sleep(3)
    return False

def queue_prompt(prompt_text, neg_text, seed, filename_prefix):
    """提交生成任务"""
    wf = {
        "1": {"inputs": {"ckpt_name": CKPT_NAME}, "class_type": "CheckpointLoaderSimple"},
        "2": {"inputs": {"text": prompt_text, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "3": {"inputs": {"text": neg_text, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "4": {"inputs": {"width": WIDTH, "height": HEIGHT, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "5": {"inputs": {
            "seed": seed, "steps": 25, "cfg": 6.0,
            "sampler_name": "dpmpp_2m", "scheduler": "karras", "denoise": 1.0,
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]
        }, "class_type": "KSampler"},
        "6": {"inputs": {"samples": ["5", 0], "vae": ["1", 2]}, "class_type": "VAEDecode"},
        "7": {"inputs": {"images": ["6", 0], "filename_prefix": filename_prefix}, "class_type": "SaveImage"}
    }
    body = json.dumps({"prompt": wf, "client_id": f"zh-{uuid.uuid4().hex[:8]}"}).encode()
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=body)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def wait_result(prompt_id, timeout=600):
    """等待结果，返回输出文件路径列表"""
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
                # 检查是否真的出错
                status = entry.get("status", {})
                msgs = status.get("messages", [])
                for m in msgs:
                    if m[0] == "execution_error":
                        log(f"  ❌ ComfyUI执行错误: {str(m[1].get('exception_message',''))[:100]}")
                        return []
            if time.time() - last_log > 60:
                elapsed = int(time.time() - start)
                log(f"  ⏳ 等待中 ({elapsed}s/{timeout}s)")
                last_log = time.time()
        except Exception as e:
            if time.time() - last_log > 60:
                log(f"  ⚠️ 轮询异常: {str(e)[:60]}")
                last_log = time.time()
        time.sleep(5)
    return []

# ======================== 进度管理 ========================
def clear_comfyui_history():
    """清理ComfyUI历史缓存，防止内存堆积"""
    try:
        req = urllib.request.Request(f"{COMFY_URL}/history", method="DELETE")
        urllib.request.urlopen(req, timeout=10)
        log("   🧹 已清理ComfyUI历史缓存")
    except:
        pass

def free_comfyui_memory():
    """释放ComfyUI显存/内存"""
    try:
        req = urllib.request.Request(f"{COMFY_URL}/free", method="POST",
            data=json.dumps({"unload_models": True, "free_memory": True}).encode())
        urllib.request.urlopen(req, timeout=15)
    except:
        pass

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed": {}, "failed": {}}

def save_progress(prog):
    PROGRESS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(prog, f, ensure_ascii=False, indent=2)

# ======================== 主生成逻辑 ========================
def generate_one(card, prog):
    """生成单张卡牌"""
    cid = card["card_id"]
    name = card["name"]
    ctype = card.get("type", "person")
    
    if cid in prog["completed"]:
        return True
    
    prompt_text = build_prompt(card)
    seed = int(time.time() * 1000) % (2**32)
    fname = f"zhv1/{cid}"
    
    log(f"🎨 [{len(prog['completed'])+1}/{149}] {cid} {name} ({ctype})")
    log(f"   提示词: {prompt_text[:80]}...")
    
    try:
        result = queue_prompt(prompt_text, NEG_PROMPT, seed, fname)
        pid = result.get("prompt_id", "")
        if not pid:
            log(f"   ❌ 提交失败")
            prog["failed"][cid] = prog["failed"].get(cid, 0) + 1
            return False
        
        outputs = wait_result(pid, timeout=600)
        if outputs:
            # 复制到输出目录
            dst = OUT_DIR / f"{cid}.png"
            OUT_DIR.mkdir(parents=True, exist_ok=True)
            shutil.copy2(outputs[0], dst)
            # 回填数据库
            rel_path = f"/assets-output/cards/zh-v1/{cid}.png"
            update_image_url(cid, rel_path)
            
            prog["completed"][cid] = {
                "path": str(dst),
                "url": rel_path,
                "seed": seed,
                "time": datetime.datetime.now().isoformat()
            }
            if cid in prog["failed"]:
                del prog["failed"][cid]
            log(f"   ✅ 成功 -> {rel_path}")
            return True
        else:
            log(f"   ❌ 生成失败/超时")
            prog["failed"][cid] = prog["failed"].get(cid, 0) + 1
            return False
    except Exception as e:
        log(f"   ❌ 异常: {str(e)[:100]}")
        prog["failed"][cid] = prog["failed"].get(cid, 0) + 1
        return False

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    
    log("=" * 60)
    log("国风炼金卡牌 · 中文提示词批量生成 v3")
    log("=" * 60)
    
    # 加载卡牌
    cards = load_cards_from_db()
    log(f"数据库卡牌总数: {len(cards)}")
    
    # 检查ComfyUI
    ok, _ = check_comfyui()
    if not ok:
        log("ComfyUI未运行，尝试启动...")
        start_comfyui()
        if not wait_comfyui():
            log("❌ ComfyUI启动失败，退出")
            return
    
    # 加载进度
    prog = load_progress()
    log(f"已完成: {len(prog['completed'])}, 失败: {len(prog['failed'])}")
    
    MAX_RETRY = 3
    consecutive_fail = 0
    
    # 主循环
    pending = [c for c in cards if c["card_id"] not in prog["completed"]]
    log(f"待生成: {len(pending)} 张")
    
    round_num = 0
    while pending:
        round_num += 1
        log(f"\n{'='*40}")
        log(f"🔄 第{round_num}轮 - 剩余{len(pending)}张")
        log(f"{'='*40}")
        
        new_pending = []
        for card in pending:
            cid = card["card_id"]
            retry = prog["failed"].get(cid, 0)
            if retry >= MAX_RETRY:
                log(f"⏭️ {cid} 超过最大重试{MAX_RETRY}次，跳过")
                continue
            
            save_progress(prog)
            success = generate_one(card, prog)
            save_progress(prog)
            
            # 每10张清理一次缓存，防止内存堆积导致OOM
            if len(prog["completed"]) % 10 == 0 and success:
                clear_comfyui_history()
                free_comfyui_memory()
            
            if success:
                consecutive_fail = 0
            else:
                consecutive_fail += 1
                if consecutive_fail >= 3:
                    log("⚠️ 连续失败3次，检查ComfyUI...")
                    ok, _ = check_comfyui()
                    if not ok:
                        log("❌ ComfyUI掉线，重启...")
                        start_comfyui()
                        wait_comfyui()
                    else:
                        # ComfyUI在线但失败，可能是内存问题，清理后重试
                        log("🧹 ComfyUI在线，清理内存后继续...")
                        clear_comfyui_history()
                        free_comfyui_memory()
                        time.sleep(10)
                    consecutive_fail = 0
            
            time.sleep(2)
            new_pending.append(card)
        
        # 更新pending：去掉已完成的
        pending = [c for c in new_pending if c["card_id"] not in prog["completed"] and prog["failed"].get(c["card_id"], 0) < MAX_RETRY]
        
        if not pending:
            break
        if len(pending) == len(new_pending):
            log("⚠️ 本轮无进展，等待30秒...")
            time.sleep(30)
    
    # 最终报告
    log("=" * 60)
    log(f"🎉 生成完成！")
    log(f"✅ 成功: {len(prog['completed'])}/149")
    log(f"❌ 失败: {len(prog['failed'])}")
    log("=" * 60)

if __name__ == "__main__":
    main()

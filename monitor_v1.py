"""
国风炼金卡牌 · 30分钟监控守护
- 每30分钟检查生成进度
- ComfyUI掉线自动重启
- 生成进程卡死自动重启
"""
import json
import urllib.request
import time
import os
import sys
import subprocess
import datetime
import sqlite3
from pathlib import Path

COMFY_URL = "http://127.0.0.1:8188"
COMFY_DIR = r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI"
COMFY_PYTHON = os.path.join(COMFY_DIR, ".venv", "Scripts", "python.exe")
COMFY_MAIN = os.path.join(COMFY_DIR, "main.py")
GEN_SCRIPT = r"F:\guofeng-alchemy-card\gen_juggernaut_v4.py"

BASE_DIR = Path(r"F:\guofeng-alchemy-card")
PROGRESS_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v1_progress.json"
LOG_FILE = BASE_DIR / "assets-output" / "cards" / "zh_v1_log.txt"
MONITOR_LOG = BASE_DIR / "assets-output" / "cards" / "monitor_v1_log.txt"
DB_PATH = r"F:\guofeng-alchemy-card\server\data2.db"

CHECK_INTERVAL = 1800  # 30分钟

def log(msg):
    ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    try:
        with open(MONITOR_LOG, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except:
        pass

def check_comfyui():
    try:
        req = urllib.request.Request(f"{COMFY_URL}/system_stats")
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            vram = data.get("devices", [{}])[0].get("vram_free", 0) / (1024**3)
            return True, f"VRAM {vram:.1f}GB"
    except:
        return False, ""

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
        # 等待就绪
        for i in range(60):
            time.sleep(3)
            ok, info = check_comfyui()
            if ok:
                log(f"✅ ComfyUI就绪 ({info})")
                return True
        log("❌ ComfyUI启动超时")
        return False
    except Exception as e:
        log(f"❌ 启动失败: {e}")
        return False

def start_gen_script():
    """启动生成脚本"""
    log("启动生成脚本...")
    try:
        subprocess.Popen(
            [COMFY_PYTHON, GEN_SCRIPT],
            cwd=str(BASE_DIR),
            creationflags=0x00000008
        )
        log("✅ 生成脚本已启动")
        return True
    except Exception as e:
        log(f"❌ 生成脚本启动失败: {e}")
        return False

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed": {}, "failed": {}}

def get_last_log_time():
    """获取生成日志最后修改时间"""
    if LOG_FILE.exists():
        return LOG_FILE.stat().st_mtime
    return 0

def get_db_count():
    """获取数据库中已回填图片的卡牌数"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM cards WHERE image_url LIKE '%zh-v1%'")
        n = cur.fetchone()[0]
        conn.close()
        return n
    except:
        return 0

def report():
    """报告进度"""
    prog = load_progress()
    completed = len(prog.get("completed", {}))
    failed = len(prog.get("failed", {}))
    db_count = get_db_count()
    
    log(f"📊 进度: {completed}/149 完成 | {failed} 失败 | DB回填: {db_count}")
    
    # 检查最近活动
    last_log = get_last_log_time()
    if last_log > 0:
        idle = time.time() - last_log
        if idle > 600:  # 10分钟无活动
            log(f"⚠️ 生成日志已{int(idle/60)}分钟无更新，可能卡住")
            return "STUCK"
    
    if completed >= 149:
        return "DONE"
    return "RUNNING"

def main():
    log("=" * 60)
    log("🔍 监控守护启动 (每30分钟检查)")
    log("=" * 60)
    
    check_count = 0
    while True:
        check_count += 1
        log(f"\n--- 第{check_count}次检查 ---")
        
        # 1. 检查ComfyUI
        ok, info = check_comfyui()
        if not ok:
            log("❌ ComfyUI掉线")
            start_comfyui()
        else:
            log(f"✅ ComfyUI在线 ({info})")
        
        # 2. 报告进度
        status = report()
        
        if status == "DONE":
            log("🎉 全部149张生成完成！监控退出")
            break
        
        if status == "STUCK":
            log("🔧 检测到卡顿，重启生成脚本...")
            start_gen_script()
        
        # 3. 等待30分钟
        next_time = datetime.datetime.now() + datetime.timedelta(seconds=CHECK_INTERVAL)
        log(f"下次检查: {next_time.strftime('%H:%M:%S')}")
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("监控已停止")

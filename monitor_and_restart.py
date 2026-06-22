"""
国风炼金卡牌 · 批量生成监控守护脚本
- 每 10 分钟检查 ComfyUI 和生成进程状态
- 自动重连断线的 ComfyUI
- 自动重启中断的生成任务
- 输出进度报告

用法: python monitor_and_restart.py
"""
import json
import urllib.request
import time
import os
import sys
import subprocess
import datetime
from pathlib import Path

COMFY_URL = "http://127.0.0.1:8188"
COMFY_DIR = r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI"
COMFY_PYTHON = os.path.join(COMFY_DIR, ".venv", "Scripts", "python.exe")
COMFY_MAIN = os.path.join(COMFY_DIR, "main.py")
OUTPUT_BASE = Path(r"F:\guofeng-alchemy-card\assets-output\cards")
PROGRESS_FILE = OUTPUT_BASE / "batch_200_progress.json"
LOG_FILE = OUTPUT_BASE / "batch_200_log.txt"
MONITOR_LOG = OUTPUT_BASE / "monitor_log.txt"

# 全局状态
comfyui_process = None

def log(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(MONITOR_LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def check_comfyui():
    """检查 ComfyUI 是否在线"""
    try:
        req = urllib.request.Request(f"{COMFY_URL}/system_stats", method="GET")
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            vram = data.get("devices", [{}])[0].get("vram_free", 0) / (1024**3) if data.get("devices") else 0
            return True, f"VRAM free: {vram:.1f}GB"
    except Exception as e:
        return False, str(e)

def start_comfyui():
    """启动 ComfyUI"""
    log("正在启动 ComfyUI...")
    try:
        proc = subprocess.Popen(
            [COMFY_PYTHON, COMFY_MAIN, "--port", "8188", "--listen", "127.0.0.1", "--disable-auto-launch"],
            cwd=COMFY_DIR,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW if sys.platform == "win32" else 0
        )
        return proc
    except Exception as e:
        log(f"启动 ComfyUI 失败: {e}")
        return None

def wait_for_comfyui(max_wait=180):
    """等待 ComfyUI 就绪"""
    for i in range(max_wait // 3):
        ok, info = check_comfyui()
        if ok:
            log(f"ComfyUI 已就绪 ({info})")
            return True
        time.sleep(3)
    return False

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def get_queue_status():
    """获取 ComfyUI 队列状态"""
    try:
        req = urllib.request.Request(f"{COMFY_URL}/queue", method="GET")
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            running = len(data.get("queue_running", []))
            pending = len(data.get("queue_pending", []))
            return running, pending
    except:
        return -1, -1

def report_progress():
    """报告当前进度"""
    prog = load_progress()
    if not prog:
        log("无进度文件")
        return
    
    total = prog.get("total", 0)
    completed = len(prog.get("completed", []))
    failed = len(prog.get("failed", {}))
    remaining = total - completed - failed
    
    running, pending = get_queue_status()
    
    pct = (completed / total * 100) if total > 0 else 0
    
    log(f"=" * 50)
    log(f"📊 进度报告: {completed}/{total} ({pct:.1f}%)")
    log(f"   ✅ 已完成: {completed}")
    log(f"   ❌ 失败: {failed}")
    log(f"   ⏳ 待处理: {remaining}")
    log(f"   🏃 ComfyUI队列: 运行中={running}, 等待中={pending}")
    
    # 展示最近失败
    if prog.get("failed"):
        recent_fails = list(prog["failed"].items())[-5:]
        for cid, count in recent_fails:
            log(f"   ⚠️ 失败卡牌: {cid} (失败{count}次)")
    
    # 预估剩余时间
    if completed > 0 and running >= 0:
        # 假设每张卡 90 秒
        est_seconds = remaining * 90
        est_min = est_seconds // 60
        log(f"   ⏱ 预估剩余时间: {est_min} 分钟 ({est_min//60:.0f}小时{est_min%60:.0f}分)")
    
    log(f"=" * 50)
    return completed, total

def main():
    global comfyui_process
    
    os.makedirs(OUTPUT_BASE, exist_ok=True)
    
    log("=" * 60)
    log("🔍 国风炼金卡牌 · 批量生成监控守护启动")
    log(f"检查间隔: 10 分钟")
    log("=" * 60)
    
    check_count = 0
    
    while True:
        check_count += 1
        log(f"\n--- 第 {check_count} 次检查 ---")
        
        # 1. 检查 ComfyUI 状态
        ok, info = check_comfyui()
        
        if not ok:
            log(f"⚠️ ComfyUI 掉线: {info}")
            
            # 尝试重启
            if comfyui_process:
                try:
                    comfyui_process.terminate()
                except:
                    pass
                comfyui_process = None
            
            comfyui_process = start_comfyui()
            if comfyui_process and wait_for_comfyui():
                log("✅ ComfyUI 重连成功")
            else:
                log("❌ ComfyUI 重连失败，将在下次检查再试")
        
        else:
            log(f"✅ ComfyUI 在线 ({info})")
        
        # 2. 报告进度
        completed, total = report_progress()
        
        # 3. 检查是否全部完成
        if completed and completed >= total:
            log("🎉 所有200张卡牌生成完成!")
            log("监控守护退出")
            break
        
        # 等待 10 分钟
        log(f"下次检查时间: {(datetime.datetime.now() + datetime.timedelta(minutes=10)).strftime('%H:%M:%S')}")
        time.sleep(600)  # 10 分钟

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("监控守护已手动停止")
        if comfyui_process:
            comfyui_process.terminate()

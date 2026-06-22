"""5张真实参考图 + Animagine 2D 模型图生图测试"""
import json, urllib.request, time, os, shutil, io, random
from pathlib import Path
from PIL import Image

ref_dir = Path(r"F:\guofeng-alchemy-card\assets-source\ref-images")
comfy_input = Path(r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI\input")
out_dir = Path(r"F:\guofeng-alchemy-card\assets-output\cards\zh-v3")
preview_dir = Path(r"F:\guofeng-alchemy-card\docs\i2i-previews")
for d in [ref_dir, comfy_input, out_dir, preview_dir]: d.mkdir(parents=True, exist_ok=True)

COMFY_URL = "http://127.0.0.1:8188"
CKPT = "animagine-xl-4.0-opt.safetensors"  # 2D 动漫模型
CN = "diffusion_pytorch_model.safetensors"

# 5张测试（不同类型）
test_cards = [
    ("QH-P-0001-L05", "秦始皇", "person", "Qin Shi Huang emperor portrait"),
    ("SG-P-0002-L04", "关羽", "person", "Guan Yu Three Kingdoms general portrait"),
    ("QH-E-0017-L03", "鸿门宴", "event", "Hongmen Banquet Chinese historical painting"),
    ("QH-L-0004-L01", "咸阳", "place", "Xianyang Qin dynasty capital ancient city"),
    ("QH-W-0025-L03", "天子剑", "weapon", "Chinese emperor sword ancient weapon"),
]

def download_ref(cid, name, query_en):
    """下载真实网络图片"""
    dst = ref_dir / f"{cid}.jpg"
    if dst.exists() and dst.stat().st_size > 10000:
        print(f"  [skip] {name}")
        return True
    
    # 尝试多个搜索引擎
    queries = [
        f"{query_en} historical illustration",
        f"{name} 历史 画像",
        f"{query_en} ancient Chinese art",
    ]
    
    for q in queries:
        try:
            time.sleep(random.uniform(3, 6))  # 延迟防限流
            # Bing 图片搜索
            bing_url = f"https://www.bing.com/images/search?q={urllib.parse.quote(q)}&first=1"
            req = urllib.request.Request(bing_url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read().decode("utf-8", errors="ignore")
            
            # 从Bing HTML提取图片URL
            import re
            img_urls = re.findall(r'murl&quot;:&quot;(https?://[^&]+\.(jpg|jpeg|png))', html)
            img_urls = [u[0].replace('&quot;','') for u in img_urls[:8]]
            
            for img_url in img_urls:
                try:
                    time.sleep(random.uniform(1, 2))
                    req = urllib.request.Request(img_url, headers={
                        "User-Agent": "Mozilla/5.0", "Referer": "https://www.bing.com/"
                    })
                    with urllib.request.urlopen(req, timeout=15) as r:
                        data = r.read()
                        if len(data) > 8000:
                            img = Image.open(io.BytesIO(data)).convert("RGB")
                            w, h = img.size
                            # 裁切到竖版
                            target = 832/1216
                            if w/h > target:
                                nw = int(h*target); left = (w-nw)//2
                                img = img.crop((left, 0, left+nw, h))
                            else:
                                nh = int(w/target); top = (h-nh)//2
                                img = img.crop((0, top, w, top+nh))
                            img = img.resize((832, 1216), Image.LANCZOS)
                            img.save(dst, "JPEG", quality=92)
                            print(f"  [OK] {name} <- Bing ({img_url[:50]}...)")
                            return True
                except: continue
        except Exception as e:
            print(f"  [retry] {q[:30]}: {str(e)[:40]}")
            continue
    
    print(f"  [FAIL] {name} - 所有来源均失败")
    return False

# ===== 步骤1：下载 =====
print("=== 下载真实参考图 ===")
for cid, name, ctype, query_en in test_cards:
    ok = download_ref(cid, name, query_en)
    if not ok:
        # 兜底：纯色背景
        Image.new("RGB", (832,1216), (50,45,40)).save(ref_dir/f"{cid}.jpg")
        print(f"  [占位] {name}")
    # 复制到ComfyUI input
    src = ref_dir / f"{cid}.jpg"
    dst = comfy_input / f"ref_{cid}.jpg"
    if src.exists():
        shutil.copy2(src, dst)

# ===== 步骤2：图生图 =====
PROMPTS = {
    "person": "masterpiece, best quality, 1man, solo, Chinese historical portrait of {name}, ancient Chinese emperor or general, masculine man, short beard, Chinese traditional clothing, hanfu, ancient Chinese art style, ink painting style, (flat color:1.2), cel shading, 2d illustration, year 2015",
    "event": "masterpiece, best quality, Chinese historical painting of {name}, ancient Chinese soldiers, armies, dramatic battle, traditional Chinese art, ink painting style, historical scene, (flat color:1.2), 2d illustration, multiple characters",
    "place": "masterpiece, best quality, Chinese ancient landscape of {name}, ancient architecture, traditional Chinese painting, ink wash style, no humans, misty mountains, pagodas, (flat color:1.2), 2d illustration, scenery",
    "weapon": "masterpiece, best quality, ancient Chinese weapon {name}, sword, ornate, still life, traditional Chinese art, ink painting style, (flat color:1.2), 2d illustration, no humans",
}
NEG = ("nsfw, nude, 3d, realistic, photorealistic, photo, photograph, western, european, gun, modern, "
       "bishounen, soft face, makeup, lipstick, feminine, androgynous, "
       "lowres, worst quality, blurry, deformed, text, watermark, signature")

print("\n=== 图生图生成 (Animagine XL 2D) ===")
for cid, name, ctype, query_en in test_cards:
    prompt = PROMPTS.get(ctype, PROMPTS["person"]).format(name=name)
    print(f"\n--- {cid} {name} ---")
    
    wf = {
        "1":{"inputs":{"ckpt_name":CKPT},"class_type":"CheckpointLoaderSimple"},
        "2":{"inputs":{"text":prompt,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "3":{"inputs":{"text":NEG,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "4":{"inputs":{"image":f"ref_{cid}.jpg"},"class_type":"LoadImage"},
        "5":{"inputs":{"low_threshold":0.25,"high_threshold":0.65,"image":["4",0]},"class_type":"Canny"},
        "6":{"inputs":{"control_net_name":CN},"class_type":"ControlNetLoader"},
        "7":{"inputs":{"positive":["2",0],"negative":["3",0],"control_net":["6",0],"image":["5",0],"strength":0.8,"start_percent":0.0,"end_percent":1.0},"class_type":"ControlNetApplyAdvanced"},
        "8":{"inputs":{"width":832,"height":1216,"batch_size":1},"class_type":"EmptyLatentImage"},
        "9":{"inputs":{"seed":hash(cid)%(2**32),"steps":28,"cfg":6.0,"sampler_name":"euler","scheduler":"normal","denoise":1.0,"model":["1",0],"positive":["7",0],"negative":["7",1],"latent_image":["8",0]},"class_type":"KSampler"},
        "10":{"inputs":{"samples":["9",0],"vae":["1",2]},"class_type":"VAEDecode"},
        "11":{"inputs":{"images":["10",0],"filename_prefix":f"i2iv3/{cid}"},"class_type":"SaveImage"}
    }
    
    body = json.dumps({"prompt":wf,"client_id":f"v3-{cid}"}).encode()
    try:
        pid = json.loads(urllib.request.urlopen(
            urllib.request.Request(f"{COMFY_URL}/prompt",data=body),timeout=30).read())["prompt_id"]
        print(f"  PID: {pid[:16]}...")
    except Exception as e:
        print(f"  ❌ 提交失败: {e}"); continue
    
    ok = False
    for i in range(80):
        time.sleep(2)
        try:
            h = json.loads(urllib.request.urlopen(
                urllib.request.Request(f"{COMFY_URL}/history/{pid}"),timeout=15).read())
            if pid in h:
                o = h[pid].get("outputs",{})
                e = [m for m in h[pid].get("status",{}).get("messages",[]) if m[0]=="execution_error"]
                if o:
                    for nid,out in o.items():
                        for img in out.get("images",[]):
                            src = Path(r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI\output") / img.get("subfolder","") / img["filename"]
                            dst = out_dir / f"{cid}.png"
                            if src.exists(): shutil.copy2(src, dst)
                            try:
                                pv = Image.open(dst); pv = pv.resize((260,380), Image.LANCZOS)
                                pv.save(preview_dir/f"v3_{cid}.jpg","JPEG",quality=80)
                            except: pass
                    print(f"  ✅"); ok = True; break
                if e:
                    print(f"  ❌ {e[0][1].get('exception_message','?')[:120]}"); break
        except: pass
        if ok: break
    if not ok:
        print(f"  ⏰")

# HTML预览
previews = sorted([f for f in os.listdir(preview_dir) if f.startswith("v3_")])
rows = ""
for f in previews:
    cid = f.replace("v3_","").replace(".jpg","")
    rows += f'<div style="display:inline-block;margin:8px;background:#1a1a1a;border-radius:10px;padding:8px;text-align:center"><img src="i2i-previews/{f}" style="width:200px;border-radius:6px"><br><span style="color:gold;font-size:11px">{cid}</span></div>'

html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>图生图v3 - 2D</title>
<style>body{{background:#0a0a0a;color:#ccc;font-family:Arial;padding:20px}}h2{{color:gold}}</style></head>
<body><h2>图生图 v3 - 真实网络图片 + Animagine 2D ({len(previews)}张)</h2>
<p>ControlNet 0.8 | Animagine XL 4.0 | 2D flat color | <a href="i2i-previews/">看原图</a></p>
<div>{rows}</div></body></html>"""
with open(r"F:\guofeng-alchemy-card\docs\i2i-test-v3.html","w",encoding="utf-8") as f:
    f.write(html)

print(f"\n🎉 {len(previews)}/5 成功")
print(f"预览: http://127.0.0.1:8888/docs/i2i-test-v3.html")

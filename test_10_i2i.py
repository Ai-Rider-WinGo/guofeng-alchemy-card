"""图生图10张测试 - 下载参考图 + ControlNet生成"""
import json, urllib.request, time, os, shutil, io, sys
from pathlib import Path
from PIL import Image

ref_dir = Path(r"F:\guofeng-alchemy-card\assets-source\ref-images")
ref_dir.mkdir(parents=True, exist_ok=True)
comfy_input = Path(r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI\input")
comfy_input.mkdir(parents=True, exist_ok=True)
out_dir = Path(r"F:\guofeng-alchemy-card\assets-output\cards\zh-v2")
out_dir.mkdir(parents=True, exist_ok=True)
preview_dir = Path(r"F:\guofeng-alchemy-card\docs\i2i-previews")
preview_dir.mkdir(parents=True, exist_ok=True)

COMFY_URL = "http://127.0.0.1:8188"
CKPT = "GuoFeng4.1_2.5D.safetensors"
CN = "diffusion_pytorch_model.safetensors"

test_cards = [
    ("QH-P-0001-L05", "秦始皇", "person", "秦始皇 历史画像 帝王"),
    ("SG-P-0002-L04", "关羽", "person", "关羽 三国 历史画像"),
    ("ST-P-0001-L05", "李世民", "person", "唐太宗李世民 历史画像"),
    ("QH-E-0017-L03", "鸿门宴", "event", "鸿门宴 历史场景 古画"),
    ("SG-E-0018-L04", "赤壁之战", "event", "赤壁之战 历史场景"),
    ("QH-L-0004-L01", "咸阳", "place", "咸阳 秦朝 古城 复原图"),
    ("SG-L-0001-L01", "赤壁", "place", "赤壁 长江 古战场"),
    ("QH-W-0025-L03", "天子剑", "weapon", "秦始皇 天子剑 太阿剑 古剑"),
    ("QH-B-0029-L03", "九章算术", "classic", "九章算术 古籍 竹简"),
    ("QH-D-0035-L05", "大秦帝国", "dynasty", "大秦帝国 秦朝 宫殿 兵马俑"),
]

PROMPTS = {
    "person": "masterpiece, best quality, ultra realistic, epic Chinese historical portrait of {name}, masculine mature man, stern dignified face, short beard, thick eyebrows, ancient Chinese imperial robes, dramatic lighting, Chinese historical drama cinematography, highly detailed, ornate",
    "event": "masterpiece, best quality, ultra realistic, epic Chinese historical scene of {name}, ancient Chinese armies, warriors, dramatic conflict, cinematic wide shot, highly detailed",
    "place": "masterpiece, best quality, ultra realistic, ancient Chinese landmark {name}, grand architecture, palaces, city walls, misty mountains, cinematic landscape, no humans, highly detailed",
    "weapon": "masterpiece, best quality, ultra realistic, ancient Chinese weapon {name}, ornate metalwork, displayed on dark silk, museum quality, no humans, still life, highly detailed",
    "classic": "masterpiece, best quality, ultra realistic, ancient Chinese classic {name}, bamboo slips, silk scrolls, ink brush, calligraphy, warm candlelight, no humans, still life, highly detailed",
    "dynasty": "masterpiece, best quality, ultra realistic, Chinese imperial emblem of {name}, dragon flag, jade seal, golden palace, Great Wall, majestic imperial atmosphere, epic, highly detailed",
}
NEG = "1girl, female, feminine, anime, manga, cartoon, chibi, illustration, painting, bishounen, pretty boy, soft face, big eyes, makeup, nsfw, nude, lowres, worst quality, blurry, deformed, modern, gun, western, text"

# ========== 步骤1：下载参考图 ==========
print("=== 下载参考图 ===")
for cid, name, ctype, query in test_cards:
    dst = ref_dir / f"{cid}.jpg"
    if dst.exists() and dst.stat().st_size > 5000:
        print(f"  [skip] {name}")
        continue
    try:
        from duckduckgo_search import DDGS
        with DDGS() as ddgs:
            results = list(ddgs.images(query, max_results=5))
            for r in results:
                img_url = r.get("image") or r.get("thumbnail")
                if not img_url: continue
                try:
                    req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, timeout=15) as resp:
                        data = resp.read()
                        if len(data) > 5000:
                            img = Image.open(io.BytesIO(data)).convert("RGB")
                            w, h = img.size
                            target = 832/1216
                            if w/h > target:
                                nw = int(h*target); left = (w-nw)//2
                                img = img.crop((left,0,left+nw,h))
                            else:
                                nh = int(w/target); top = (h-nh)//2
                                img = img.crop((0,top,w,top+nh))
                            img = img.resize((832,1216), Image.LANCZOS)
                            img.save(dst, "JPEG", quality=90)
                            print(f"  [OK] {name}")
                            break
                except: continue
        # 兜底占位图
        if not dst.exists() or dst.stat().st_size < 5000:
            colors = {"person":(60,50,40),"event":(70,50,30),"place":(40,70,50),
                      "weapon":(30,30,50),"classic":(50,40,30),"dynasty":(70,50,10)}
            Image.new("RGB",(832,1216),colors.get(ctype,(50,50,50))).save(dst)
            print(f"  [占位] {name}")
    except Exception as e:
        print(f"  [ERR] {name}: {e}")

# 复制到ComfyUI input
for cid, name, ctype, query in test_cards:
    shutil.copy2(ref_dir/f"{cid}.jpg", comfy_input/f"ref_{cid}.jpg")

# ========== 步骤2：图生图生成 ==========
print("\n=== 图生图生成 ===")
for cid, name, ctype, query in test_cards:
    prompt = PROMPTS.get(ctype, PROMPTS["person"]).format(name=name)
    print(f"\n--- {cid} {name} ---")
    
    wf = {
        "1":{"inputs":{"ckpt_name":CKPT},"class_type":"CheckpointLoaderSimple"},
        "2":{"inputs":{"text":prompt,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "3":{"inputs":{"text":NEG,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "4":{"inputs":{"image":f"ref_{cid}.jpg"},"class_type":"LoadImage"},
        "5":{"inputs":{"low_threshold":0.3,"high_threshold":0.7,"image":["4",0]},"class_type":"Canny"},
        "6":{"inputs":{"control_net_name":CN},"class_type":"ControlNetLoader"},
        "7":{"inputs":{"positive":["2",0],"negative":["3",0],"control_net":["6",0],"image":["5",0],"strength":0.7,"start_percent":0.0,"end_percent":1.0},"class_type":"ControlNetApplyAdvanced"},
        "8":{"inputs":{"width":832,"height":1216,"batch_size":1},"class_type":"EmptyLatentImage"},
        "9":{"inputs":{"seed":hash(cid)%(2**32),"steps":30,"cfg":6.5,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0,"model":["1",0],"positive":["7",0],"negative":["7",1],"latent_image":["8",0]},"class_type":"KSampler"},
        "10":{"inputs":{"samples":["9",0],"vae":["1",2]},"class_type":"VAEDecode"},
        "11":{"inputs":{"images":["10",0],"filename_prefix":f"i2i10/{cid}"},"class_type":"SaveImage"}
    }
    
    body = json.dumps({"prompt":wf,"client_id":f"i2i10-{cid}"}).encode()
    try:
        pid = json.loads(urllib.request.urlopen(
            urllib.request.Request(f"{COMFY_URL}/prompt",data=body),timeout=30).read())["prompt_id"]
        print(f"  PID: {pid}")
    except Exception as e:
        print(f"  Submit err: {e}"); continue
    
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
                            # 预览图
                            try:
                                pv = Image.open(dst); pv = pv.resize((260,380), Image.LANCZOS)
                                pv.save(preview_dir/f"{cid}.jpg","JPEG",quality=75)
                            except: pass
                    print(f"  ✅"); break
                if e:
                    print(f"  ❌ {e[0][1].get('exception_message','?')[:100]}"); break
        except: pass
    if i >= 79:
        print(f"  ⏰ 超时")

# ========== HTML预览 ==========
previews = sorted([f for f in os.listdir(preview_dir) if f.endswith(".jpg")])
rows = ""
for f in previews:
    cid = f.replace(".jpg","")
    rows += f'<div style="display:inline-block;margin:8px;text-align:center;background:#111;border-radius:10px;padding:8px"><img src="i2i-previews/{f}" style="width:200px;border-radius:6px"><br><span style="color:gold;font-size:11px">{cid}</span></div>'

html = f'<!DOCTYPE html><html><head><meta charset="utf-8"><title>图生图10张测试</title><style>body{{background:#0a0a0a;color:#ccc;font-family:Arial;padding:20px}}h2{{color:gold}}a{{color:#6af}}</style></head><body><h2>🖼️ 图生图测试 - ControlNet Canny + GuoFeng4.1 ({len(previews)}张)</h2><p>每张生成约25秒 | <a href="i2i-previews/">看大图</a></p><div>{rows}</div></body></html>'
with open(r"F:\guofeng-alchemy-card\docs\i2i-test.html","w",encoding="utf-8") as f:
    f.write(html)

print(f"\n🎉 完成! 预览: http://127.0.0.1:8888/docs/i2i-test.html")

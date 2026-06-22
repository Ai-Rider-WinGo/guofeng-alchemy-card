"""图生图10张测试v2 - 几何轮廓参考图 + ControlNet生成"""
import json, urllib.request, time, os, shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ref_dir = Path(r"F:\guofeng-alchemy-card\assets-source\ref-images")
comfy_input = Path(r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI\input")
out_dir = Path(r"F:\guofeng-alchemy-card\assets-output\cards\zh-v2")
preview_dir = Path(r"F:\guofeng-alchemy-card\docs\i2i-previews")
for d in [ref_dir, comfy_input, out_dir, preview_dir]: d.mkdir(parents=True, exist_ok=True)

COMFY_URL = "http://127.0.0.1:8188"
CKPT = "GuoFeng4.1_2.5D.safetensors"
CN = "diffusion_pytorch_model.safetensors"

test_cards = [
    ("QH-P-0001-L05", "秦始皇", "person"),
    ("SG-P-0002-L04", "关羽", "person"),
    ("ST-P-0001-L05", "李世民", "person"),
    ("QH-E-0017-L03", "鸿门宴", "event"),
    ("SG-E-0018-L04", "赤壁之战", "event"),
    ("QH-L-0004-L01", "咸阳", "place"),
    ("SG-L-0001-L01", "赤壁", "place"),
    ("QH-W-0025-L03", "天子剑", "weapon"),
    ("QH-B-0029-L03", "九章算术", "classic"),
    ("QH-D-0035-L05", "大秦帝国", "dynasty"),
]

def make_ref(cid, name, ctype):
    """生成几何轮廓参考图（提供Canny可检测的结构信息）"""
    W, H = 832, 1216
    img = Image.new("RGB", (W, H), (40, 38, 35))
    draw = ImageDraw.Draw(img)
    
    if ctype == "person":
        # 人物轮廓：头+肩+身体
        draw.ellipse((W//2-80, 100, W//2+80, 300), fill=(80, 70, 60), outline=(120, 100, 80), width=3)
        draw.rectangle((W//2-120, 300, W//2+120, 700), fill=(70, 60, 50), outline=(110, 90, 70), width=2)
        draw.rectangle((W//2-50, 700, W//2+50, 1000), fill=(70, 60, 50), outline=(110, 90, 70), width=2)
        # 头部细节
        draw.rectangle((W//2-30, 150, W//2+30, 180), fill=(60, 50, 40))  # 眉毛
        draw.rectangle((W//2-15, 190, W//2+15, 200), fill=(50, 40, 30))   # 嘴
        draw.rectangle((W//2-20, 160, W//2-8, 175), fill=(30, 25, 20))    # 左眼
        draw.rectangle((W//2+8, 160, W//2+20, 175), fill=(30, 25, 20))    # 右眼
        
    elif ctype == "event":
        # 多人场景轮廓
        for i in range(5):
            x = 100 + i * 150
            draw.ellipse((x-30, 500, x+30, 560), fill=(70, 55, 40))
            draw.rectangle((x-40, 560, x+40, 800), fill=(65, 50, 38))
        draw.rectangle((50, 800, W-50, 830), fill=(50, 40, 30))  # 地面
        draw.rectangle((W//2-200, 400, W//2+200, 480), fill=(80, 30, 20))  # 火焰/旗帜
        draw.polygon([(W//2, 200), (W//2-80, 400), (W//2+80, 400)], fill=(90, 35, 25))  # 山
        
    elif ctype == "place":
        # 建筑轮廓
        draw.rectangle((100, 400, 300, 900), fill=(70, 65, 55), outline=(100, 90, 70), width=2)
        draw.polygon([(80, 400), (200, 200), (320, 400)], fill=(80, 70, 50), outline=(110, 95, 70), width=2)
        draw.rectangle((350, 500, 550, 900), fill=(70, 65, 55), outline=(100, 90, 70), width=2)
        draw.polygon([(330, 500), (450, 300), (570, 500)], fill=(80, 70, 50), outline=(110, 95, 70), width=2)
        draw.rectangle((600, 600, 750, 900), fill=(75, 68, 58))
        draw.rectangle((50, 850, W-50, 900), fill=(50, 45, 38))  # 地
        # 远山
        draw.polygon([(0, 600), (200, 350), (400, 600)], fill=(50, 55, 45))
        draw.polygon([(400, 550), (600, 300), (W, 550)], fill=(45, 50, 40))
        
    elif ctype == "weapon":
        # 剑的轮廓
        draw.rectangle((W//2-30, 100, W//2+30, 350), fill=(90, 80, 60), outline=(140, 120, 90), width=3)
        draw.ellipse((W//2-25, 80, W//2+25, 130), fill=(100, 90, 70))
        draw.rectangle((W//2-80, 350, W//2+80, 420), fill=(80, 60, 30), outline=(140, 100, 50), width=3)
        draw.rectangle((W//2-15, 420, W//2+15, 650), fill=(70, 50, 25), outline=(130, 90, 40), width=2)
        draw.ellipse((W//2-20, 630, W//2+20, 680), fill=(60, 40, 20))
        draw.rectangle((W//2-60, 380, W//2+60, 395), fill=(120, 100, 60))
        
    elif ctype == "classic":
        # 书本/卷轴轮廓
        draw.rectangle((100, 200, 380, 600), fill=(70, 60, 45), outline=(110, 90, 60), width=3)
        draw.rectangle((120, 220, 360, 580), fill=(85, 75, 55))
        for y in range(260, 560, 40):
            draw.line((140, y, 340, y), fill=(60, 50, 35), width=2)
        draw.rectangle((400, 250, 700, 550), fill=(65, 55, 40), outline=(105, 85, 55), width=3)
        draw.line((420, 350, 680, 350), fill=(55, 45, 30), width=2)
        draw.rectangle((200, 650, 650, 680), fill=(50, 40, 30))
        # 毛笔
        draw.line((380, 150, 200, 150), fill=(30, 25, 20), width=5)
        draw.ellipse((370, 140, 395, 160), fill=(20, 18, 15))
        
    elif ctype == "dynasty":
        # 宫殿+龙+玉玺轮廓
        draw.rectangle((W//2-150, 350, W//2+150, 750), fill=(80, 70, 50), outline=(140, 120, 80), width=3)
        draw.polygon([(W//2-180, 350), (W//2, 150), (W//2+180, 350)], fill=(90, 75, 45), outline=(150, 125, 75), width=3)
        draw.rectangle((W//2-250, 750, W//2+250, 780), fill=(60, 50, 35))
        # 远山
        draw.polygon([(0, 850), (250, 550), (500, 850)], fill=(45, 50, 40))
        # 太阳
        draw.ellipse((W//2-70, 200, W//2+70, 340), fill=(120, 100, 20))
        # 长城轮廓
        for x in range(0, W, 80):
            draw.rectangle((x, 820, x+60, 840), fill=(60, 55, 45), outline=(90, 80, 60))
    
    return img

# 生成参考图
print("=== 生成几何轮廓参考图 ===")
for cid, name, ctype in test_cards:
    ref_img = make_ref(cid, name, ctype)
    ref_path = ref_dir / f"{cid}.jpg"
    ref_img.save(ref_path, "JPEG", quality=95)
    shutil.copy2(ref_path, comfy_input / f"ref_{cid}.jpg")
    print(f"  [OK] {name} ({ctype})")

# 提示词
PROMPTS = {
    "person": "masterpiece, best quality, ultra realistic, epic Chinese historical portrait of {name}, masculine mature man, stern dignified face, short beard, thick eyebrows, ancient Chinese imperial robes, dramatic lighting, Chinese historical drama cinematography, highly detailed, ornate",
    "event": "masterpiece, best quality, ultra realistic, epic Chinese historical scene of {name}, ancient Chinese armies, warriors, dramatic conflict, cinematic wide shot, highly detailed",
    "place": "masterpiece, best quality, ultra realistic, ancient Chinese landmark {name}, grand architecture, palaces, city walls, misty mountains, cinematic landscape, no humans, highly detailed",
    "weapon": "masterpiece, best quality, ultra realistic, ancient Chinese weapon {name}, ornate metalwork, displayed on dark silk, museum quality, no humans, still life, highly detailed",
    "classic": "masterpiece, best quality, ultra realistic, ancient Chinese classic {name}, bamboo slips, silk scrolls, ink brush, calligraphy, warm candlelight, no humans, still life, highly detailed",
    "dynasty": "masterpiece, best quality, ultra realistic, Chinese imperial emblem of {name}, dragon flag, jade seal, golden palace, Great Wall, majestic imperial atmosphere, epic, highly detailed",
}
NEG = "1girl, female, feminine, anime, manga, cartoon, chibi, illustration, painting, bishounen, pretty boy, soft face, big eyes, makeup, nsfw, nude, lowres, worst quality, blurry, deformed, modern, gun, western, text"

# 图生图生成
print("\n=== 图生图生成 ===")
results = []
for cid, name, ctype in test_cards:
    prompt = PROMPTS.get(ctype, PROMPTS["person"]).format(name=name)
    print(f"\n--- {cid} {name} ({ctype}) ---")
    
    wf = {
        "1":{"inputs":{"ckpt_name":CKPT},"class_type":"CheckpointLoaderSimple"},
        "2":{"inputs":{"text":prompt,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "3":{"inputs":{"text":NEG,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "4":{"inputs":{"image":f"ref_{cid}.jpg"},"class_type":"LoadImage"},
        "5":{"inputs":{"low_threshold":0.3,"high_threshold":0.7,"image":["4",0]},"class_type":"Canny"},
        "6":{"inputs":{"control_net_name":CN},"class_type":"ControlNetLoader"},
        "7":{"inputs":{"positive":["2",0],"negative":["3",0],"control_net":["6",0],"image":["5",0],"strength":0.75,"start_percent":0.0,"end_percent":1.0},"class_type":"ControlNetApplyAdvanced"},
        "8":{"inputs":{"width":832,"height":1216,"batch_size":1},"class_type":"EmptyLatentImage"},
        "9":{"inputs":{"seed":hash(cid)%(2**32),"steps":30,"cfg":6.5,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0,"model":["1",0],"positive":["7",0],"negative":["7",1],"latent_image":["8",0]},"class_type":"KSampler"},
        "10":{"inputs":{"samples":["9",0],"vae":["1",2]},"class_type":"VAEDecode"},
        "11":{"inputs":{"images":["10",0],"filename_prefix":f"i2iv2/{cid}"},"class_type":"SaveImage"}
    }
    
    body = json.dumps({"prompt":wf,"client_id":f"i2iv2-{cid}"}).encode()
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
                                pv.save(preview_dir/f"{cid}.jpg","JPEG",quality=80)
                            except: pass
                    print(f"  ✅ 生成成功")
                    results.append(cid)
                    ok = True; break
                if e:
                    print(f"  ❌ {e[0][1].get('exception_message','?')[:120]}"); break
        except: pass
        if ok: break
    if not ok:
        print(f"  ⏰ 超时/失败")

# HTML预览
previews = sorted([f for f in os.listdir(preview_dir) if f.endswith(".jpg")])
rows = ""
for f in previews:
    cid = f.replace(".jpg","")
    rows += f'<div style="display:inline-block;margin:8px;background:#1a1a1a;border-radius:10px;padding:8px;text-align:center"><img src="i2i-previews/{f}" style="width:200px;border-radius:6px"><br><span style="color:gold;font-size:11px">{cid}</span></div>'

html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"><title>图生图10张 v2</title>
<style>body{{background:#0a0a0a;color:#ccc;font-family:Arial;padding:20px}}h2{{color:gold}}a{{color:#6af}}</style></head>
<body><h2>图生图 v2 - ControlNet Canny + GuoFeng4.1 ({len(previews)}张)</h2>
<p>ControlNet strength=0.75 | 采样 dpmpp_2m 30步 | <a href="i2i-previews/">看原图</a></p>
<div>{rows}</div></body></html>"""
with open(r"F:\guofeng-alchemy-card\docs\i2i-test-v2.html","w",encoding="utf-8") as f:
    f.write(html)

print(f"\n🎉 完成! {len(results)}/10 成功")
print(f"预览: http://127.0.0.1:8888/docs/i2i-test-v2.html")
for c in results:
    print(f"  ✅ {c}")

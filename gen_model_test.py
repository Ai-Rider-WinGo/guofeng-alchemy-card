"""批量生成地点卡 — 指定模型"""
import json, urllib.request, uuid, time, os, shutil, sys

COMFY = "http://127.0.0.1:8188"
OUT_DIR = r"F:\guofeng-alchemy-card\assets-output\cards\model-tests"
os.makedirs(OUT_DIR, exist_ok=True)

# 20张地点卡（取card_id和prompt）
test_cards = [
    ("LJ-L-0001-L01", "建康", "ancient Chinese capital Jiankang, Six Dynasties era capital city, Qinhuai river with traditional buildings along banks, grand palace complex, misty southern Chinese atmosphere, ancient bridges and pavilions, historical Chinese cityscape"),
    ("LJ-L-0002-L01", "洛阳", "ancient Chinese capital Luoyang, grand city with traditional Chinese palace architecture, Longmen grottoes in distance, misty plains, ancient pagodas and temples, White Horse Temple, historical Chinese landscape"),
    ("LJ-L-0003-L01", "金陵", "ancient Chinese Jinling city, Purple Mountain in background, Stone City fortress, misty southern Chinese landscape, traditional architecture with curved roofs, ancient city walls, poetic atmosphere"),
    ("LJ-L-0004-L01", "邺城", "ancient Chinese city Yecheng, Northern China capital city with grand Tongque bronze sparrow platform, mathematical grid city layout, majestic palace complex surrounded by Zhang river"),
    ("LJ-L-0005-L01", "平城", "ancient Chinese capital Pingcheng, Northern Wei dynasty mountain city, Yungang Buddhist grottoes carved into cliff face, traditional Chinese and Xianbei fusion architecture"),
    ("LJ-L-0006-L01", "姑臧", "ancient Chinese frontier city Guzang, Hexi Corridor trading city on Silk Road, mix of Han Chinese and Central Asian architecture, desert oasis with green fields"),
    ("MQ-L-0001-L01", "北京城", "ancient Chinese capital Beijing, Ming dynasty grand city walls and gates, traditional Chinese architecture with grey roofs, wide streets with arches, majestic city gate towers"),
    ("MQ-L-0002-L01", "南京", "ancient Chinese capital Nanjing, Ming dynasty stone city walls, Qinhuai river with traditional buildings, grand city gates, Purple Mountain in background"),
    ("MQ-L-0003-L01", "山海关", "ancient Chinese frontier fortress Shanhai Pass, Great Wall meeting the sea, massive mountain fortress with multiple guard towers, dramatic coastal landscape"),
    ("MQ-L-0004-L01", "紫禁城", "ancient Chinese imperial palace Forbidden City, Ming dynasty grand palace complex, golden roofs and red walls under blue sky, marble balustrades and bronze lions"),
    ("MQ-L-0005-L01", "十三陵", "ancient Chinese Ming dynasty imperial tombs, Spirit Way with stone statues of animals and officials, grand tomb mounds against mountains, ancient pine trees"),
    ("MQ-L-0006-L01", "承德避暑山庄", "ancient Chinese imperial summer resort Chengde, Qing dynasty mountain resort, traditional Chinese gardens with lakes and pavilions, golden roof pagodas"),
    ("QH-L-0003-L01", "函谷关", "ancient Chinese mountain pass Hangu Pass, Qin dynasty massive fortress gate carved into yellow mountain cliffs, narrow winding road through steep cliffs"),
    ("QH-L-0004-L01", "咸阳", "ancient Chinese Qin dynasty imperial capital Xianyang, grand Chinese palace complex with sweeping curved roofs, massive Chinese city walls with watchtowers"),
    ("QH-L-0005-L01", "彭城", "ancient Chinese city Pengcheng, Chu kingdom capital, grand ancient city walls with Chu dynasty banners, wide streets with ancient buildings"),
    ("QH-L-0006-L01", "汉中", "ancient Chinese mountain city Hanzhong, surrounded by misty mountains and valleys, traditional Chinese city walls built into mountain terrain"),
    ("QH-L-0007-L01", "骊山", "ancient Chinese mountain landscape Lishan, Qin Shi Huang mausoleum at its foot, misty mountain peaks with ancient pine trees, classical Chinese mountain scenery"),
    ("QH-L-0008-L01", "陈仓", "ancient Chinese mountain pass Chencang, Qinling mountain range with ancient plank road built on cliffside, rugged mountain terrain with swirling mist"),
    ("QH-L-0009-L01", "灞上", "ancient Chinese riverside military camp Bashang, willow trees along Ba river, flowing water with misty banks, simple Han dynasty military tents and campfires"),
    ("SG-L-0001-L01", "赤壁", "ancient Chinese Red Cliffs Chibi on Yangtze river, dramatic red cliff walls rising from the river, misty river view with ancient war ships")
]

NEG = "nsfw, nude, anime, manga, cartoon, cg, 3d, 2.5d, anime style, anime eyes, japanese art, kawaii, moe, bishounen, big eyes, chibi, deformed, realistic photo, photograph, lowres, bad anatomy, text, watermark, signature, worst quality"

def build_workflow(ckpt_name, prompt_text):
    return {
        "3": {"class_type": "KSampler", "inputs": {"seed": 42, "steps": 28, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": ckpt_name}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 960, "height": 1408, "batch_size": 1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt_text, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": NEG, "clip": ["4", 1]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": "test", "images": ["8", 0]}}
    }

def generate(ckpt_name, model_label, cards):
    results = {"ok": 0, "error": 0}
    for i, (cid, name, prompt) in enumerate(cards):
        dst = os.path.join(OUT_DIR, f"{cid}_{model_label}.png")
        if os.path.exists(dst):
            print(f"  [{i+1}/{len(cards)}] {name} exists, skip")
            results["ok"] += 1
            continue
        
        wf = build_workflow(ckpt_name, prompt)
        wf["3"]["inputs"]["seed"] = int(time.time() * 1000) % 2**32
        wf["9"]["inputs"]["filename_prefix"] = f"mt_{cid}_{model_label}"
        
        body = {"prompt": wf, "client_id": f"mt-{uuid.uuid4().hex[:8]}"}
        try:
            req = urllib.request.Request(f"{COMFY}/prompt", data=json.dumps(body).encode(), headers={"Content-Type":"application/json"})
            resp = json.loads(urllib.request.urlopen(req,timeout=30).read())
            pid = resp.get("prompt_id","")
        except Exception as e:
            print(f"  [{i+1}/{len(cards)}] {name} submit fail: {e}")
            results["error"] += 1
            continue
        
        ok = False
        for _ in range(120):
            time.sleep(2)
            try:
                r = urllib.request.urlopen(f"{COMFY}/history/{pid}",timeout=10)
                hist = json.loads(r.read())
                if pid in hist:
                    for nid, out in hist[pid].get("outputs",{}).items():
                        for img in out.get("images",[]):
                            src = os.path.join(r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI\output", img["subfolder"], img["filename"])
                            if os.path.exists(src):
                                shutil.copy2(src, dst)
                                ok = True
                                results["ok"] += 1
                                break
                        if ok: break
                    break
            except: pass
        
        if ok:
            print(f"  [{i+1}/{len(cards)}] {name} ✅")
        else:
            print(f"  [{i+1}/{len(cards)}] {name} timeout")
            results["error"] += 1
    
    return results

def main():
    if len(sys.argv) < 2:
        print("用法: python gen_model_test.py <model_label>")
        print("  model_label: guofeng 或 juggernaut")
        return
    
    label = sys.argv[1]
    if label == "guofeng":
        ckpt = "GuoFeng4.1_2.5D.safetensors"
    elif label == "juggernaut":
        ckpt = "Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors"
    else:
        print(f"未知模型: {label}")
        return
    
    print(f"模型: {ckpt}")
    print(f"生成 {len(test_cards)} 张...")
    r = generate(ckpt, label, test_cards)
    print(f"完成: ✅ {r['ok']}  ❌ {r['error']}")

if __name__ == "__main__":
    main()

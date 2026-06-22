"""生成18张新地点卡"""
import json, urllib.request, uuid, time, os, shutil, sys, re

COMFY = "http://127.0.0.1:8188"
OUT_DIR = r"F:\guofeng-alchemy-card\assets-output\cards\originals-v2"
os.makedirs(OUT_DIR, exist_ok=True)

# 直接定义18张新地点
new_locs = [
    {"no":"QH-L-0007-L01","name":"骊山","prompt":"ancient Chinese mountain landscape Lishan, Qin Shi Huang mausoleum at its foot, misty mountain peaks with ancient pine trees, classical Chinese mountain scenery, early morning mist, traditional Chinese architecture temples nestled in mountains, Chinese historical illustration style"},
    {"no":"QH-L-0008-L01","name":"陈仓","prompt":"ancient Chinese mountain pass Chencang, Qinling mountain range with ancient plank road built on cliffside, rugged mountain terrain with swirling mist, traditional Chinese architecture guard tower at mountain pass, early morning atmosphere, Han dynasty military outpost, Chinese historical illustration style"},
    {"no":"QH-L-0009-L01","name":"灞上","prompt":"ancient Chinese riverside military camp Bashang, willow trees along Ba river, flowing water with misty banks, simple Han dynasty military tents and campfires, vast plain under grey-blue sky, Chinese historical landscape painting style"},
    {"no":"SG-L-0004-L01","name":"许昌","prompt":"ancient Chinese city Xuchang, Three Kingdoms era Han dynasty capital city, traditional Chinese palace architecture with sweeping roofs, Cao Cao administration center, bustling ancient Chinese city streets with scholars and soldiers, warm golden hour light, grand Chinese city walls"},
    {"no":"SG-L-0005-L01","name":"成都","prompt":"ancient Chinese city Chengdu, Three Kingdoms era Shu Han capital, surrounded by fertile fields and rivers, traditional Sichuan architecture with red walls and grey tiles, misty distant mountains, peaceful yet majestic atmosphere, prosperous ancient Chinese streets with silk merchants"},
    {"no":"SG-L-0006-L01","name":"建业","prompt":"ancient Chinese capital Jianye, Three Kingdoms era Wu capital by Yangtze river, Stone City fortress on cliff, grand Chinese palace complex with curved roofs, river view with ancient ships at sunset, prosperous southern Chinese city"},
    {"no":"LJ-L-0004-L01","name":"邺城","prompt":"ancient Chinese city Yecheng, Northern China capital city with grand Tongque bronze sparrow platform, mathematical grid city layout, majestic palace complex surrounded by Zhang river, traditional Chinese architecture, misty northern plains"},
    {"no":"LJ-L-0005-L01","name":"平城","prompt":"ancient Chinese capital Pingcheng, Northern Wei dynasty mountain city, Yungang Buddhist grottoes carved into cliff face, traditional Chinese and Xianbei fusion architecture, misty northern mountains, ancient Buddhist pagodas and temples"},
    {"no":"LJ-L-0006-L01","name":"姑臧","prompt":"ancient Chinese frontier city Guzang, Hexi Corridor trading city on Silk Road, mix of Han Chinese and Central Asian architecture, desert oasis with green fields, camel caravans entering city gates, distant snow capped Qilian mountains"},
    {"no":"ST-L-0004-L01","name":"大明宫","prompt":"ancient Chinese imperial palace Daming Palace, Tang dynasty grand palace complex, massive vermillion gates and golden roofs, sprawling traditional Chinese palace architecture, thousands of rooms, imperial grandeur"},
    {"no":"ST-L-0005-L01","name":"扬州","prompt":"ancient Chinese canal city Yangzhou, Tang dynasty prosperous commercial city, Grand Canal with countless boats, traditional Jiangnan architecture white walls black tiles, moonlit river scene, bustling waterfront markets"},
    {"no":"ST-L-0006-L01","name":"凉州","prompt":"ancient Chinese frontier city Liangzhou, Hexi Corridor fortress city, vast Gobi desert with Great Wall in distance, Tang dynasty soldiers on city walls, camel caravans, sunset over desert"},
    {"no":"SY-L-0004-L01","name":"襄阳","prompt":"ancient Chinese fortified city Xiangyang, Song dynasty massive double city walls by Han river, Mongol siege with trebuchets, smoke and fire, defenders on walls, dramatic cloudy sky"},
    {"no":"SY-L-0005-L01","name":"泉州","prompt":"ancient Chinese international port Quanzhou, Song dynasty world's largest harbor, countless foreign ships and Chinese junks in bay, pagoda on hill overlooking port, diverse merchants, vibrant trading port"},
    {"no":"SY-L-0006-L01","name":"幽州","prompt":"ancient Chinese border city Youzhou, Liao-Song dynasty frontier fortress, majestic northern Chinese city walls and gates, mix of Khitan and Han architecture, cold autumn atmosphere"},
    {"no":"MQ-L-0004-L01","name":"紫禁城","prompt":"ancient Chinese imperial palace Forbidden City, Ming dynasty grand palace complex, golden roofs and red walls under blue sky, marble balustrades and bronze lions, grand courtyards, symmetrical palace layout"},
    {"no":"MQ-L-0005-L01","name":"十三陵","prompt":"ancient Chinese Ming dynasty imperial tombs, Spirit Way with stone statues of animals and officials, grand tomb mounds against mountains, ancient pine and cypress trees"},
    {"no":"MQ-L-0006-L01","name":"承德避暑山庄","prompt":"ancient Chinese imperial summer resort Chengde, Qing dynasty mountain resort, traditional Chinese gardens with lakes and pavilions, fusion of Han Tibetan and Mongolian architecture, golden roof pagodas, peaceful lake with lotus"}
]

print(f"新地点卡: {len(new_locs)} 张")
for c in new_locs:
    print(f"  {c['no']} {c['name']}")

# 读取ComfyUI工作流模板
wf_path = r"F:\guofeng-alchemy-card\workflow_api.json"

print(f"使用工作流: {wf_path}")
WORKFLOW = json.load(open(wf_path,'r',encoding='utf-8'))

def generate_one(card, seed):
    no = card['no']
    prompt_text = card['prompt']
    name = card['name']
    
    dst = os.path.join(OUT_DIR, f"{no}.png")
    
    print(f"  输出路径: {dst}")
    if os.path.exists(dst):
        print(f"  [SKIP] {name} 已存在")
        return 'skip'
    
    neg = "nsfw, nude, anime, manga, cartoon, cg, 3d, 2.5d, anime style, anime eyes, japanese art, kawaii, moe, bishounen, big eyes, chibi, deformed, realistic photo, photograph, oversized breasts, lowres, bad anatomy, bad hands, text, error, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry, western architecture, european, greek, roman, medieval europe"
    
    wf = json.loads(json.dumps(WORKFLOW))
    # 找到节点
    ks_node = None
    pos_nodes = []
    neg_nodes = []
    
    for nid, node in wf.items():
        if isinstance(node, dict):
            cls = node.get('class_type','')
            if cls in ('KSampler','KSamplerAdvanced'):
                ks_node = nid
            if cls == 'CLIPTextEncode':
                txt = node.get('inputs',{}).get('text','')
                if 'masterpiece' in txt or 'best quality' in txt or txt.startswith('semi-realistic') or 'Chinese' in txt:
                    pos_nodes.append(nid)
                else:
                    neg_nodes.append(nid)
    
    # 设置prompt
    if pos_nodes:
        wf[pos_nodes[0]]['inputs']['text'] = prompt_text
    elif neg_nodes:
        # 第一个CLIP当正向
        wf[neg_nodes[0]]['inputs']['text'] = prompt_text
        neg_nodes = neg_nodes[1:]
    
    for nid in neg_nodes:
        wf[nid]['inputs']['text'] = neg
    
    if ks_node:
        wf[ks_node]['inputs']['seed'] = seed
    
    # 输出文件名
    for nid, node in wf.items():
        if isinstance(node, dict) and node.get('class_type') == 'SaveImage':
            wf[nid]['inputs']['filename_prefix'] = f"loc_{no}"
    
    body = {"prompt": wf, "client_id": f"gen18-{uuid.uuid4().hex[:8]}"}
    try:
        req = urllib.request.Request(f"{COMFY}/prompt", data=json.dumps(body).encode(), headers={"Content-Type":"application/json"})
        resp = json.loads(urllib.request.urlopen(req,timeout=30).read())
        prompt_id = resp.get('prompt_id','')
        if not prompt_id:
            return f"error: no prompt_id"
    except Exception as e:
        return f"error: submit failed {e}"
    
    for _ in range(180):
        time.sleep(2)
        try:
            r = urllib.request.urlopen(f"{COMFY}/history/{prompt_id}",timeout=10)
            hist = json.loads(r.read())
            if prompt_id in hist:
                outputs = hist[prompt_id].get('outputs',{})
                for nid, out in outputs.items():
                    for img in out.get('images',[]):
                        src = os.path.join(r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI\output", img['subfolder'], img['filename'])
                        if os.path.exists(src):
                            shutil.copy2(src, dst)
                            print(f"  ✅ {name} done (seed:{seed})")
                            return 'ok'
                print(f"  ⚠ {name} finished no image")
                return 'error: no image'
        except urllib.error.HTTPError as e:
            if e.code == 400:
                continue
            return f"error: {e}"
        except Exception as e:
            if _ > 10:
                print(f"  wait error: {e}")
                time.sleep(3)
                continue
    return 'error: timeout'

print("\n开始生成18张地点...")
results = {'ok':0, 'skip':0, 'error':0}
for i, card in enumerate(new_locs):
    seed = int(time.time() * 1000) % 2**32
    print(f"\n[{i+1}/{len(new_locs)}] {card['name']} ({card['no']})")
    r = generate_one(card, seed)
    if r == 'ok': results['ok'] += 1; print(f"  ✅")
    elif r == 'skip': results['skip'] += 1; print(f"  ⏭️")
    else: results['error'] += 1; print(f"  ❌ {r}")
    if i < len(new_locs)-1 and r != 'skip':
        time.sleep(1)

print(f"\n{'='*40}")
print(f"完成: ✅ {results['ok']} 成功 | ⏭️ {results['skip']} 跳过 | ❌ {results['error']} 失败")
print(f"{'='*40}")

"""
国风炼金卡牌 · 本地Web看板
启动：python card_server.py
访问：http://127.0.0.1:8888
"""
import http.server
import json
import uuid
import os
import shutil
import urllib.parse
import urllib.request
import glob
import random

BASE = r"F:\guofeng-alchemy-card"
ASSETS = os.path.join(BASE, "assets-output", "cards")
CONFIG = os.path.join(BASE, "config", "card_text_content.json")
PROMPTS_100 = os.path.join(BASE, "config", "card_prompts_100.json")

COMFY_URL = "http://127.0.0.1:8188"
CKPT = "animagine-xl-4.0-opt.safetensors"

# ═══════════════════════════════════════════
# 提示词系统（严格遵循策划案 v2.0 + card-art-style.md）
# ═══════════════════════════════════════════

# ── 基础负面提示词（所有卡牌通用）──
NEG_BASE = (
    "lowres, bad anatomy, bad hands, text, error, missing fingers, "
    "extra digits, fewer digits, cropped, worst quality, low quality, "
    "normal quality, jpeg artifacts, signature, watermark, username, "
    "blurry, 3d, realistic, photorealistic, photo, "
    "western, european, caucasian, knight, crusader, blonde, "
    "modern, gun, xianxia, fantasy magic, deformed, "
    "anime, chibi, cartoon, nsfw, nude"
)

# ── 男性历史人物专用负面（防止日漫模型女性化）──
NEG_ANTI_FEM = (
    "female, woman, girl, 1girl, feminine, effeminate, "
    "soft face, pretty boy, bishounen, androgynous, "
    "makeup, lipstick, blush, eyeliner, groomed eyebrows, "
    "delicate features, cute, kawaii, moe, waifu, "
    "slender, slim, narrow shoulders, cross-dressing, trap"
)

# ── 女性历史人物专用负面（防止男性化）──
NEG_ANTI_MASC = (
    "masculine, manly, rugged, muscular, beard, facial hair, "
    "bodybuilder, hulk, testosterone, male"
)

# ── 非人物卡（地点/事件/兵器/典籍/朝代）专用负面（禁止出现人物主体）──
NEG_NO_FIGURE = (
    "1girl, 1boy, solo, character focus, portrait, close-up, "
    "anime girl, waifu, person, people, crowd, face, looking at viewer"
)

# ── 朝代映射 ──
ERAS = {"QH":"秦汉","SG":"三国","LJ":"两晋南北朝","ST":"隋唐","SY":"宋元","MQ":"明清"}

# ── 各朝代视觉关键词（注入 prompt 增强历史感）──
ERA_VISUALS = {
    "QH": "black Qin dynasty robes and bronze lamellar armor, Great Wall silhouette, terracotta warriors, Qin imperial solemnity, bronze and black color palette",
    "SG": "Three Kingdoms warring chaos, red cliff bluffs, ancient Chinese battlefields, heroic warriors in colorful armor, Han dynasty military banners",
    "LJ": "flowing Wei-Jin robes, bamboo groves, calligraphy and poetry, Buddhist grotto art, Six Dynasties refined elegance, ink painting aesthetics",
    "ST": "Tang dynasty golden age, Chang'an cosmopolitan markets, silk road caravans, peony flowers, grand palace halls, tri-color glazed pottery",
    "SY": "Song dynasty refined aesthetics, ink wash landscape painting, celadon porcelain, bustling canal cities, scholar-garden pavilions",
    "MQ": "Ming-Qing imperial grandeur, Forbidden City vermilion walls and golden roofs, dragon and phoenix motifs, blue-and-white porcelain, elaborate court robes"
}

# ── 等级与稀有度（策划案 v2.0：N/R/SR/SSR/UR）──
CN_NUMS = {1:"壹",2:"贰",3:"叁",4:"肆",5:"伍",6:"陆",7:"柒",8:"捌",9:"玖",10:"拾",11:"拾壹",12:"拾贰"}
RARITY_MAP = {1:"Common",2:"Uncommon",3:"Rare",4:"Epic",5:"Legendary"}

# ── 已知男性/女性历史人物名册（用于性别检测，防女性化）──
MALE_NAMES = {
    "刘邦","项羽","张良","韩信","萧何","蒙恬","扶苏","赵高","范增","樊哙","章邯",
    "秦始皇","嬴政","诸葛亮","关羽","曹操","刘备","赵云","周瑜","吕布","孙权","司马懿",
    "典韦","黄忠","陆逊","董卓","李世民","李白","杜甫","魏征","白居易","玄奘","王维",
    "李靖","孙思邈","吴道子","秦琼","杜牧","王羲之","谢安","陶渊明","祖逖","顾恺之",
    "嵇康","阮籍","苻坚","刘裕","潘岳","贾思勰","石勒","苏轼","岳飞","赵匡胤","文天祥",
    "包拯","辛弃疾","成吉思汗","忽必烈","沈括","毕升","王安石","宋江","关汉卿",
    "纪信","铁木真","孔丘","孔子","孟子","庄子","老子","韩非","张仲景",
}

FEMALE_NAMES = {
    "吕雉","虞姬","貂蝉","杨玉环","武则天","花木兰","谢道韫","李清照",
    "吕后","杨贵妃","武曌","文成公主",
}

V2_CARDS = [
    # 37张地点卡
    {"no": "QH-L-0004-L01", "era": "QH", "name": "咸阳", "type": "地点", "lv": 1, "kp": "咸阳是秦朝都城，中国历史上第一座大一统帝国首都。", "tags": ["秦都", "关中", "宫殿", "帝国"]},
    {"no": "QH-L-0003-L01", "era": "QH", "name": "函谷关", "type": "地点", "lv": 1, "kp": "秦国东大门，一夫当关万夫莫开的军事天险。", "tags": ["关中", "天险", "函谷", "秦国"]},
    {"no": "QH-L-0005-L01", "era": "QH", "name": "彭城", "type": "地点", "lv": 1, "kp": "项羽定都的西楚霸王城，楚汉相争的核心战场。", "tags": ["西楚", "古都", "徐州", "霸王"]},
    {"no": "QH-L-0006-L01", "era": "QH", "name": "汉中", "type": "地点", "lv": 1, "kp": "刘邦封汉王的龙兴之地，蜀道咽喉南北要塞。", "tags": ["刘邦", "巴蜀", "栈道", "汉水"]},
    {"no": "SG-L-0001-L01", "era": "SG", "name": "赤壁", "type": "地点", "lv": 1, "kp": "赤壁之战火烧连船，三国鼎立格局从此奠定。", "tags": ["长江", "火攻", "赤壁之战", "战场"]},
    {"no": "SG-L-0002-L01", "era": "SG", "name": "官渡", "type": "地点", "lv": 1, "kp": "官渡之战曹操以少胜多，奠定北方霸业。", "tags": ["曹操", "黄河", "以少胜多", "战场"]},
    {"no": "SG-L-0003-L01", "era": "SG", "name": "荆州", "type": "地点", "lv": 1, "kp": "三国兵家必争之地，关羽大意失荆州的千古遗恨。", "tags": ["关羽", "江陵", "九省通衢", "战略要地"]},
    {"no": "LJ-L-0001-L01", "era": "LJ", "name": "建康", "type": "地点", "lv": 1, "kp": "东晋南朝三百年的都城，六朝金粉之地。", "tags": ["六朝", "金陵", "秦淮", "都城"]},
    {"no": "LJ-L-0002-L01", "era": "LJ", "name": "洛阳", "type": "地点", "lv": 1, "kp": "魏晋名都，白马寺与龙门石窟的佛国圣地。", "tags": ["古都", "白马寺", "龙门", "中原"]},
    {"no": "LJ-L-0003-L01", "era": "LJ", "name": "金陵", "type": "地点", "lv": 1, "kp": "六朝古都帝王州，钟山龙蟠石头虎踞的形胜之地。", "tags": ["建康", "钟山", "石头城", "紫金山"]},
    {"no": "ST-L-0001-L01", "era": "ST", "name": "长安", "type": "地点", "lv": 1, "kp": "大唐帝国首都，丝绸之路起点，万国来朝的天下之中。", "tags": ["唐", "丝路", "大明宫", "帝都"]},
    {"no": "ST-L-0002-L01", "era": "ST", "name": "洛阳", "type": "地点", "lv": 1, "kp": "隋唐东都，武则天定都的神都，牡丹花城。", "tags": ["唐", "东都", "神都", "武则天"]},
    {"no": "ST-L-0003-L01", "era": "ST", "name": "敦煌", "type": "地点", "lv": 1, "kp": "丝绸之路上的明珠，莫高窟壁画千佛洞的佛教艺术宝库。", "tags": ["丝路", "莫高窟", "佛教", "沙漠"]},
    {"no": "SY-L-0001-L01", "era": "SY", "name": "汴京", "type": "地点", "lv": 1, "kp": "北宋都城，清明上河图的繁华盛世，世界最大城市。", "tags": ["宋", "开封", "清明上河", "都城"]},
    {"no": "SY-L-0002-L01", "era": "SY", "name": "临安", "type": "地点", "lv": 1, "kp": "南宋偏安之都，西湖歌舞几时休的烟雨江南。", "tags": ["南宋", "西湖", "江南", "杭州"]},
    {"no": "SY-L-0003-L01", "era": "SY", "name": "大散关", "type": "地点", "lv": 1, "kp": "宋金对峙的雄关险隘，铁马秋风大散关的边塞要塞。", "tags": ["宋金", "铁马秋风", "秦岭", "关隘"]},
    {"no": "MQ-L-0001-L01", "era": "MQ", "name": "北京城", "type": "地点", "lv": 1, "kp": "明清两代帝都，四九城格局的世界文化遗产之城。", "tags": ["明清", "帝都", "紫禁", "燕京"]},
    {"no": "MQ-L-0002-L01", "era": "MQ", "name": "南京", "type": "地点", "lv": 1, "kp": "明朝开国都城，虎踞龙盘的六朝文脉延续。", "tags": ["明", "金陵", "秦淮", "古都"]},
    {"no": "MQ-L-0003-L01", "era": "MQ", "name": "山海关", "type": "地点", "lv": 1, "kp": "天下第一关，万里长城东起点的山海雄关。", "tags": ["长城", "天下第一关", "山海", "边关"]},
    {"no": "QH-L-0007-L01", "era": "QH", "name": "骊山", "type": "地点", "lv": 1, "kp": "秦始皇陵所在地，焚书坑儒的历史现场，华清宫坐落于山麓。", "tags": ["秦陵", "华清宫", "骊山", "关中"]},
    {"no": "QH-L-0008-L01", "era": "QH", "name": "陈仓", "type": "地点", "lv": 1, "kp": "暗度陈仓，刘邦还定三秦的军事要道，秦岭古栈道咽喉。", "tags": ["秦岭", "栈道", "暗度陈仓", "汉中"]},
    {"no": "QH-L-0009-L01", "era": "QH", "name": "灞上", "type": "地点", "lv": 1, "kp": "刘邦率先入关驻军灞上，与关中父老约法三章之地。", "tags": ["长安", "霸水", "刘邦", "关中"]},
    {"no": "SG-L-0004-L01", "era": "SG", "name": "许昌", "type": "地点", "lv": 1, "kp": "曹操迎献帝迁都许昌，挟天子以令诸侯的霸业起点。", "tags": ["曹操", "许都", "汉室", "中原"]},
    {"no": "SG-L-0005-L01", "era": "SG", "name": "成都", "type": "地点", "lv": 1, "kp": "刘备称帝建蜀汉，天府之国的中心，诸葛亮治蜀的大本营。", "tags": ["蜀汉", "天府", "锦官城", "益州"]},
    {"no": "SG-L-0006-L01", "era": "SG", "name": "建业", "type": "地点", "lv": 1, "kp": "孙权称帝建都建业，六朝古都之始，虎踞龙盘帝王州。", "tags": ["孙权", "石头城", "金陵", "长江"]},
    {"no": "LJ-L-0004-L01", "era": "LJ", "name": "邺城", "type": "地点", "lv": 1, "kp": "曹魏至北齐六朝古都，铜雀台与漳水环绕的北方雄城。", "tags": ["铜雀台", "漳水", "曹魏", "古都"]},
    {"no": "LJ-L-0005-L01", "era": "LJ", "name": "平城", "type": "地点", "lv": 1, "kp": "北魏都城，云冈石窟与佛教艺术的北国圣地。", "tags": ["北魏", "云冈", "大同", "佛教"]},
    {"no": "LJ-L-0006-L01", "era": "LJ", "name": "姑臧", "type": "地点", "lv": 1, "kp": "河西走廊重镇，前凉后凉北凉都城，东西文明交汇处。", "tags": ["凉州", "河西", "丝绸之路", "胡汉"]},
    {"no": "ST-L-0004-L01", "era": "ST", "name": "大明宫", "type": "地点", "lv": 1, "kp": "大唐帝国的大朝正殿，世界最大宫殿群，九天阊阖开宫殿。", "tags": ["唐", "长安", "含元殿", "宫殿"]},
    {"no": "ST-L-0005-L01", "era": "ST", "name": "扬州", "type": "地点", "lv": 1, "kp": "隋唐大运河枢纽，天下三分明月夜二分在扬州的繁华商都。", "tags": ["隋唐", "运河", "江南", "商都"]},
    {"no": "ST-L-0006-L01", "era": "ST", "name": "凉州", "type": "地点", "lv": 1, "kp": "河西走廊重镇，丝绸之路要冲，葡萄美酒夜光杯的边塞雄关。", "tags": ["河西", "边塞", "葡萄酒", "丝绸之路"]},
    {"no": "SY-L-0004-L01", "era": "SY", "name": "襄阳", "type": "地点", "lv": 1, "kp": "宋元决战之地，坚守六年终陷落，改写中国历史的铁血雄城。", "tags": ["宋元", "襄阳", "樊城", "汉水"]},
    {"no": "SY-L-0005-L01", "era": "SY", "name": "泉州", "type": "地点", "lv": 1, "kp": "宋元时期世界第一大港，海上丝绸之路的东方起点。", "tags": ["宋元", "刺桐", "海港", "海上丝路"]},
    {"no": "SY-L-0006-L01", "era": "SY", "name": "幽州", "type": "地点", "lv": 1, "kp": "燕云十六州之首，宋辽边界重镇，自古兵家必争之地。", "tags": ["幽云", "燕京", "宋辽", "边防"]},
    {"no": "MQ-L-0004-L01", "era": "MQ", "name": "紫禁城", "type": "地点", "lv": 1, "kp": "明清两代的皇家宫殿，世界最大木结构建筑群，九千九百九十九间半。", "tags": ["故宫", "太和殿", "明清", "皇城"]},
    {"no": "MQ-L-0005-L01", "era": "MQ", "name": "十三陵", "type": "地点", "lv": 1, "kp": "明十三位皇帝的陵寝群，世界文化遗产，神道石像生庄严排列。", "tags": ["明陵", "天寿山", "神道", "长陵"]},
    {"no": "MQ-L-0006-L01", "era": "MQ", "name": "承德避暑山庄", "type": "地点", "lv": 1, "kp": "清代夏宫与木兰围场，世界最大皇家园林，汉蒙藏建筑荟萃。", "tags": ["清", "热河", "园林", "行宫"]},
]
def _card_meta(cid):
    for c in V2_CARDS:
        if c["no"] == cid:
            return c
    return None

# ═══════════════════════════════════════════
# 结构化提示词构建器（按策划案 6 大类型）
# ═══════════════════════════════════════════

def _detect_gender(meta):
    """检测人物卡性别：返回 'male' / 'female'"""
    name = meta.get("name", "")
    tags = meta.get("tags", [])
    kp = meta.get("kp", "")
    
    # 已知名单优先匹配
    if name in FEMALE_NAMES:
        return "female"
    if name in MALE_NAMES:
        return "male"
    
    # 基于标签/知识点的关键词检测
    combined = name + " " + " ".join(tags) + " " + kp
    female_kw = ["女","皇后","妃","姬","公主","美人","夫人","后","贵妃","太后","才女","女皇"]
    male_kw = ["男","帝","帝王","皇帝","王","将","帅","臣","子","皇","宗","祖","圣","霸","君","侯","相"]
    
    f_score = sum(1 for w in female_kw if w in combined)
    m_score = sum(1 for w in male_kw if w in combined)
    
    # 特殊处理：武则天是女皇
    if "武则天" in name or "女皇" in combined or "女帝" in combined:
        return "female"
    
    return "male" if m_score >= f_score else "female"

def _build_person_prompt(meta):
    """人物卡 → 角色名+朝代+身份+服饰+场景+情绪+国风半写实+竖版"""
    name = meta["name"]
    era = meta.get("era", "")
    era_cn = ERAS.get(era, "")
    era_visual = ERA_VISUALS.get(era, "")
    kp = meta.get("kp", "")[:100]  # 截取前100字作为身份描述
    tags = meta.get("tags", [])
    gender = _detect_gender(meta)
    
    quality = "masterpiece, best quality, high score, great score, absurdres"
    
    if gender == "female":
        persona = (
            f"dignified East Asian woman, classical Chinese beauty, "
            f"elegant refined facial features, authentic {era_cn} dynasty appearance, "
            f"wearing elaborate traditional {era_cn} hanfu robes with period-correct patterns, "
            f"ornate historical Chinese hair ornaments and jewelry, "
            f"graceful poised posture, historical figure portrait"
        )
        neg_add = NEG_ANTI_MASC
    else:
        persona = (
            f"masculine rugged East Asian man, strong angular jaw, piercing intense dark eyes, "
            f"short black beard or mustache, weathered mature masculine face, "
            f"broad shoulders, powerful commanding stance, "
            f"wearing period-correct {era_cn} dynasty robes or historical Chinese armor, "
            f"dignified historical figure, authentic {era_cn} appearance"
        )
        neg_add = NEG_ANTI_FEM
    
    # 从标签中提取角色特征
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    
    prompt = (
        f"{quality}, "
        f"Chinese historical figure {name}, {era_cn} dynasty, "
        f"{persona}, "
        f"{'Context: ' + tag_ctx + ', ' if tag_ctx else ''}"
        f"historical background: {era_visual}, "
        f"semi-realistic Chinese historical portrait illustration, "
        f"ancient Chinese scroll painting aesthetic with ink and mineral pigment texture, "
        f"vertical composition, historical accuracy, museum-quality artwork, "
        f"solemn dignified atmosphere, no modern elements"
    )
    
    return prompt, name, neg_add

def _build_place_prompt(meta):
    """地点卡 → 地名+朝代+建筑/地貌特征+历史氛围+国风山水+竖版"""
    name = meta["name"]
    era = meta.get("era", "")
    era_cn = ERAS.get(era, "")
    era_visual = ERA_VISUALS.get(era, "")
    kp = meta.get("kp", "")
    tags = meta.get("tags", [])
    
    quality = "masterpiece, best quality, high score, great score, absurdres"
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    
    prompt = (
        f"{quality}, "
        f"Chinese historical site {name}, {era_cn} dynasty, "
        f"ancient Chinese {'architecture and landscape' if '宫殿' in tag_ctx or '城' in name else 'landscape scenery'}, "
        f"{tag_ctx}, "
        f"{kp[:150]}, "
        f"historical atmosphere: {era_visual}, "
        f"traditional Chinese ink wash landscape painting aesthetic, "
        f"semi-realistic Chinese historical illustration, "
        f"vertical composition, atmospheric lighting, no people in foreground, "
        f"museum-quality historical artwork"
    )
    
    return prompt, name, NEG_NO_FIGURE

def _build_event_prompt(meta):
    """事件卡 → 事件名+历史阶段+核心场景+双方势力+氛围+国风史诗+竖版"""
    name = meta["name"]
    era = meta.get("era", "")
    era_cn = ERAS.get(era, "")
    era_visual = ERA_VISUALS.get(era, "")
    kp = meta.get("kp", "")
    tags = meta.get("tags", [])
    
    quality = "masterpiece, best quality, high score, great score, absurdres"
    tag_ctx = ", ".join(tags[:4]) if tags else ""
    
    prompt = (
        f"{quality}, "
        f"Chinese historical event: {name}, {era_cn} dynasty, "
        f"dramatic historical scene depicting {kp[:150]}, "
        f"key elements: {tag_ctx}, "
        f"historical atmosphere: {era_visual}, "
        f"epic Chinese historical painting, semi-realistic illustration, "
        f"ancient Chinese scroll painting composition, "
        f"vertical format, dramatic lighting and atmosphere, "
        f"historical accuracy, museum-quality epic artwork"
    )
    
    return prompt, name, NEG_NO_FIGURE

def _build_weapon_prompt(meta):
    """兵器卡 → 兵器名+朝代+工艺特征+材质纹理+博物馆陈列+竖版"""
    name = meta["name"]
    era = meta.get("era", "")
    era_cn = ERAS.get(era, "")
    era_visual = ERA_VISUALS.get(era, "")
    kp = meta.get("kp", "")
    tags = meta.get("tags", [])
    
    quality = "masterpiece, best quality, high score, great score, absurdres"
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    
    prompt = (
        f"{quality}, "
        f"ancient Chinese weapon: {name}, {era_cn} dynasty, "
        f"{kp[:120]}, "
        f"detailed craftsmanship: {tag_ctx}, "
        f"materials: forged steel, bronze fittings, wood shaft, "
        f"displayed on dark silk background with dramatic museum lighting, "
        f"artifact photography style, "
        f"semi-realistic illustration, vertical composition, "
        f"historical accuracy, museum-quality artifact presentation"
    )
    
    return prompt, name, NEG_NO_FIGURE

def _build_book_prompt(meta):
    """典籍卡 → 书名+朝代+书卷形态+笔墨纸砚+学者氛围+竖版"""
    name = meta["name"]
    era = meta.get("era", "")
    era_cn = ERAS.get(era, "")
    kp = meta.get("kp", "")
    tags = meta.get("tags", [])
    
    quality = "masterpiece, best quality, high score, great score, absurdres"
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    
    prompt = (
        f"{quality}, "
        f"ancient Chinese classic text: {name}, {era_cn} dynasty, "
        f"{kp[:120]}, "
        f"displayed as ancient Chinese bound book or scroll on dark wooden desk, "
        f"with ink brush, inkstone, and candlelight, "
        f"scholarly study atmosphere, {tag_ctx}, "
        f"traditional Chinese literati aesthetic, "
        f"semi-realistic illustration, vertical composition, "
        f"warm atmospheric lighting, museum-quality artifact presentation"
    )
    
    return prompt, name, NEG_NO_FIGURE

def _build_dynasty_prompt(meta):
    """朝代卡 → 朝代名+帝国象征+标志元素+宏伟气场+竖版"""
    name = meta["name"]
    era = meta.get("era", "")
    era_cn = ERAS.get(era, "")
    era_visual = ERA_VISUALS.get(era, "")
    kp = meta.get("kp", "")
    tags = meta.get("tags", [])
    
    quality = "masterpiece, best quality, high score, great score, absurdres"
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    
    prompt = (
        f"{quality}, "
        f"Chinese imperial dynasty symbol: {name}, "
        f"{kp[:120]}, "
        f"iconic elements: {tag_ctx}, "
        f"visual aesthetic: {era_visual}, "
        f"grand imperial scale, majestic atmosphere, "
        f"semi-realistic Chinese historical painting, "
        f"vertical composition, golden age imperial splendor, "
        f"museum-quality epic artwork"
    )
    
    return prompt, name, NEG_NO_FIGURE

def _build_prompt_from_meta(meta):
    """根据卡牌类型分发到对应的结构化提示词构建器"""
    card_type = meta.get("type", "")
    
    builders = {
        "人物": _build_person_prompt,
        "地点": _build_place_prompt,
        "事件": _build_event_prompt,
        "兵器": _build_weapon_prompt,
        "典籍": _build_book_prompt,
        "朝代": _build_dynasty_prompt,
        # 兼容英文类型名
        "person": _build_person_prompt,
        "place": _build_place_prompt,
        "event": _build_event_prompt,
        "weapon": _build_weapon_prompt,
        "book": _build_book_prompt,
        "dynasty": _build_dynasty_prompt,
    }
    
    builder = builders.get(card_type)
    if builder:
        return builder(meta)
    
    # 兜底：通用提示词
    name = meta.get("name", "")
    era = meta.get("era", "")
    era_cn = ERAS.get(era, "")
    kp = meta.get("kp", "")
    quality = "masterpiece, best quality"
    
    prompt = (
        f"{quality}, {name}, {era_cn} era Chinese historical illustration, "
        f"{kp[:120]}, semi-realistic Chinese historical art, vertical composition"
    )
    return prompt, name, NEG_NO_FIGURE

def _prompt_for(cid):
    """返回 (positive_prompt, name, negative_additions)
    
    - V2 卡牌（新编号 XX-?-NNNN-LNN）：使用结构化提示词构建器
    - V1 卡牌（旧编号 xxxxx_000）：使用硬编码高质量英文 prompt
    """
    # 优先尝试 V2 结构化构建
    meta = _card_meta(cid)
    if meta:
        return _build_prompt_from_meta(meta)
    
    # V1 硬编码 prompt（已包含性别描述，质量较高）
    old = {
        "liubang_002":"Chinese Han dynasty founding emperor Liu Bang, rugged masculine middle-aged East Asian man with weathered face, short black beard, wearing simple traditional Chinese Han robes, hand on sword hilt, standing outside Chinese military tent with Han red banners, semi-realistic Chinese historical portrait, vertical",
        "jixin_002":"Chinese Han dynasty loyal general Ji Xin, strong masculine East Asian man with determined expression, short black beard, wearing traditional Han dynasty bronze lamellar Chinese armor, before Chinese city gate at night with torchlight, heroic sacrificial demeanor, semi-realistic Chinese historical portrait, vertical",
        "xiangyu_002":"Xiang Yu the Hegemon-King of Western Chu, powerful muscular masculine East Asian warrior, fierce intense black eyes, black beard, wearing traditional Chu heavy Chinese armor, holding Chinese halberd on battlefield, semi-realistic Chinese historical portrait, vertical",
        "zhanghan_002":"Zhang Han the Qin dynasty general, weathered older East Asian man with graying beard, experienced military commander, wearing traditional Qin dynasty black Chinese armor, in military tent with maps, semi-realistic Chinese historical portrait, vertical",
        "xingyang_001":"ancient Chinese walled city of Xingyang in Qin-Han era, strategic fortress city on hills, traditional Chinese city walls and watchtowers, Chinese military camp outside gates, torches and campfires at dusk, Chinese banners, semi-realistic Chinese historical landscape, vertical",
        "julu_001":"Julu Chinese battlefield plains, vast open field with remnants of ancient Chinese battle, scattered broken Chinese chariots and weapons, Chinese war banners stuck in ground, smoke rising, semi-realistic Chinese historical war landscape, vertical",
        "hongmenyan_004":"Hongmen banquet scene, large Chinese military tent interior, Liu Bang and Xiang Yu facing each other across the feast, swordsman performing Chinese sword dance, candlelight and shadows, tense political atmosphere, semi-realistic Chinese historical painting, vertical",
        "xingyang_escape_004":"Xingyang city gate at night, Han commander disguised in royal Chinese robes riding Chinese chariot out of gate, torches and firelight, Chu siege army watching, ancient Chinese city walls, semi-realistic Chinese historical war painting, vertical",
        "julu_battle_004":"epic ancient Chinese battlefield, Chu army charging into Qin army at Julu, Xiang Yu leading charge on horseback with Chinese halberd raised, multiple Chinese soldiers clashing, Chinese war chariots, massive ancient Chinese battle, semi-realistic Chinese historical war painting, vertical",
        "gaixia_siege_004":"Gaixia siege night, isolated Chinese Chu camp surrounded by distant Han army campfires, Xiang Yu in Chinese tent looking at maps, Han soldiers singing Chu folk songs, tragic atmosphere, semi-realistic Chinese historical war painting, vertical",
        "chuhan_conflict_005":"epic Chinese historical scene, Chu and Han armies facing each other across battlefield, divided red Chu banners and dark Han banners, Xiang Yu on left, Liu Bang on right, grand scale, semi-realistic Chinese historical painting, vertical",
        "han_dynasty_founding_005":"grand founding ceremony, early Han dynasty Chinese court, Liu Bang as emperor in traditional Chinese imperial robes on throne, Chinese officials in attendance, dawn light, solemn and dignified, semi-realistic Chinese historical painting, vertical",
    }
    prompt = old.get(cid, "")
    if prompt:
        return prompt, "", NEG_ANTI_FEM  # V1 硬编码都是男性历史人物/场景
    return "", "", ""

def regenerate_card(cid):
    prompt, name, neg_add = _prompt_for(cid)
    if not prompt:
        return {"error": "unknown card_id", "card_id": cid}
    
    import datetime
    meta = _card_meta(cid)
    if meta:
        orig_path = os.path.join(ASSETS, "originals-v2", f"{cid}.png")
        backup_dir = os.path.join(ASSETS, "originals-v2", "_backup")
        os.makedirs(backup_dir, exist_ok=True)
        if os.path.exists(orig_path):
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = os.path.join(backup_dir, f"{cid}_backup_{ts}.png")
            shutil.move(orig_path, backup_path)
    else:
        orig_path = os.path.join(ASSETS, "originals", f"{cid}_v01_a.png")
        backup_dir = os.path.join(ASSETS, "originals", "_backup")
        os.makedirs(backup_dir, exist_ok=True)
        if os.path.exists(orig_path):
            ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = os.path.join(backup_dir, f"{cid}_v01_a_backup_{ts}.png")
            shutil.move(orig_path, backup_path)
    
    seed = random.randint(1, 2_000_000_000)
    
    # 组装正向/负向提示词
    pos = f"masterpiece, best quality, {prompt}"
    
    # 负向提示词 = 基础负面 + 卡牌类型专用负面
    neg = NEG_BASE
    if neg_add:
        neg = neg + ", " + neg_add
    
    wf = {
        "1":{"inputs":{"ckpt_name":CKPT},"class_type":"CheckpointLoaderSimple"},
        "2":{"inputs":{"text":pos,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "3":{"inputs":{"text":neg,"clip":["1",1]},"class_type":"CLIPTextEncode"},
        "4":{"inputs":{"width":960,"height":1408,"batch_size":1},"class_type":"EmptyLatentImage"},
        "5":{"inputs":{"seed":seed,"steps":30,"cfg":7.0,"sampler_name":"dpmpp_2m","scheduler":"karras","denoise":1.0,"model":["1",0],"positive":["2",0],"negative":["3",0],"latent_image":["4",0]},"class_type":"KSampler"},
        "6":{"inputs":{"samples":["5",0],"vae":["1",2]},"class_type":"VAEDecode"},
        "7":{"inputs":{"images":["6",0],"filename_prefix":f"regen/{cid}"},"class_type":"SaveImage"}
    }
    
    data = json.dumps({"prompt":wf,"client_id":str(uuid.uuid4())}).encode()
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=data)
    try:
        with urllib.request.urlopen(req) as r:
            pid = json.loads(r.read()).get("prompt_id","?")
        return {"status":"queued","card_id":cid,"name":name,"prompt_id":pid,"seed":seed}
    except Exception as e:
        return {"error":str(e),"card_id":cid}

def card_data():
    import re
    result = []
    
    with open(CONFIG, encoding="utf-8") as f:
        cards = json.load(f)
    
    for c in cards:
        cid = c["card_id"]
        lv = int(re.search(r'_(\d{3})$', cid).group(1)) if re.search(r'_(\d{3})$', cid) else 1
        
        framed = os.path.join(ASSETS, "framed", f"{cid}_v01_framed.png")
        originals = glob.glob(os.path.join(ASSETS, "originals", f"{cid}_v01_*.png"))
        thumbs = glob.glob(os.path.join(ASSETS, "thumbnails", f"{cid}_v01_*_thumb_256.png"))
        wf = glob.glob(os.path.join(ASSETS, "workflows", f"{cid}_v01_*.workflow.json"))
        
        seed = "?"
        if wf:
            try:
                with open(wf[0], encoding="utf-8") as fw:
                    seed = str(json.load(fw).get("seed", "?"))
            except: pass
        
        result.append({
            "card_id": cid,
            "name": c["display_name"],
            "type": c["card_type_label"],
            "rarity": c.get("rarity_label", "Common"),
            "level": lv,
            "level_cn": CN_NUMS.get(lv, str(lv)),
            "knowledge": c.get("knowledge_point", ""),
            "tags": c.get("image_keywords", []),
            "seed": seed,
            "framed": os.path.exists(framed),
            "originals_count": len(originals),
            "thumb": os.path.relpath(thumbs[0], BASE).replace("\\","/") if thumbs else None,
            "framed_path": os.path.relpath(framed, BASE).replace("\\","/") if os.path.exists(framed) else None,
        })
    
    for c in V2_CARDS:
        no = c["no"]
        orig = os.path.join(ASSETS, "originals-v2", f"{no}.png")
        framed = os.path.join(ASSETS, "framed", f"{no}_v01_framed.png")
        exists_orig = os.path.exists(orig)
        exists_framed = os.path.exists(framed)
        result.append({
            "card_id": no,
            "name": c["name"],
            "type": c["type"],
            "rarity": RARITY_MAP.get(c["lv"], "Common"),
            "level": c["lv"],
            "level_cn": CN_NUMS.get(c["lv"], str(c["lv"])),
            "knowledge": c.get("kp", ""),
            "tags": c.get("tags", []),
            "seed": "?",
            "framed": exists_framed,
            "originals_count": 1 if exists_orig else 0,
            "thumb": None,
            "framed_path": os.path.relpath(framed if exists_framed else orig, BASE).replace("\\","/") if (exists_framed or exists_orig) else None,
        })
    
        # 加载 SQLite 数据库中的卡牌（3167张主数据源）
        db_path = os.path.join(BASE, "server", "data2.db")
        if os.path.exists(db_path):
            import sqlite3
            db_conn = sqlite3.connect(db_path)
            db_conn.row_factory = sqlite3.Row
            db_cur = db_conn.cursor()
            db_cur.execute("SELECT card_id, name, type, dynasty, level, rarity, tags, short_desc, story, knowledge_point, image_url FROM cards ORDER BY id")
            db_rows = db_cur.fetchall()
            db_conn.close()
            for row in db_rows:
                cid = row["card_id"]
                if any(r["card_id"] == cid for r in result):
                    continue
                has_img = row["image_url"] and row["image_url"].strip()
                result.append({
                    "card_id": cid,
                    "name": row["name"],
                    "type": row["type"],
                    "rarity": row["rarity"] or "N",
                    "level": row["level"] or 1,
                    "level_cn": CN_NUMS.get(row["level"] or 1, str(row["level"])),
                    "knowledge": row["knowledge_point"] or row["short_desc"] or "",
                    "tags": json.loads(row["tags"]) if row["tags"] and row["tags"].startswith("[") else (row["tags"] or "").split(",") if row["tags"] else [],
                    "seed": "?",
                    "framed": False,
                    "originals_count": 1 if has_img else 0,
                    "thumb": None,
                    "framed_path": row["image_url"] if has_img else None,
                })
        
        # 加载 100 张预生成提示词卡牌（非图片数据）
        if os.path.exists(PROMPTS_100):
            with open(PROMPTS_100, encoding="utf-8") as f:
                prompt_cards = json.load(f)
            for pc in prompt_cards:
                # 检查是否已存在（避免与 V1/V2 重复）
                if any(r["card_id"] == pc["card_id"] for r in result):
                    continue
                # 检查是否有实际生成的图片
                cid = pc["card_id"]
                orig = os.path.join(ASSETS, "originals-v3", f"{cid}.png")
                framed = os.path.join(ASSETS, "framed", f"{cid}_v01_framed.png")
                exists_orig = os.path.exists(orig)
                exists_framed = os.path.exists(framed)
                result.append({
                    "card_id": cid,
                    "name": pc["name"],
                    "type": pc["type"],
                    "rarity": pc["rarity"],
                    "level": pc["level"],
                    "level_cn": pc.get("level_cn", CN_NUMS.get(pc["level"], str(pc["level"]))),
                    "knowledge": pc.get("knowledge", ""),
                    "tags": pc.get("tags", []),
                    "prompt_positive": pc.get("prompt_positive", ""),
                    "prompt_negative": pc.get("prompt_negative", ""),
                    "seed": "?",
                    "framed": exists_framed,
                    "originals_count": 1 if exists_orig else 0,
                    "thumb": None,
                    "framed_path": os.path.relpath(framed if exists_framed else orig, BASE).replace("\\","/") if (exists_framed or exists_orig) else None,
                })
    
    return result

class CardHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)
    
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/cards":
            self._json(card_data())
            return
        if parsed.path == "/api/stats":
            cards = card_data()
            total = len(cards)
            framed = sum(1 for c in cards if c["framed"])
            levels = {}
            for c in cards:
                lv = c["level"]
                levels[lv] = levels.get(lv, 0) + 1
            self._json({
                "total": total, "framed": framed, "pending": total-framed,
                "levels": levels, "model": "Animagine XL 4.0",
                "resolution": "960×1408"
            })
            return
        if parsed.path == "/api/batch-progress":
            self._json(self._batch_progress())
            return
        if parsed.path == "/api/comfyui-status":
            self._json(self._comfyui_status())
            return
        if parsed.path == "/api/batch-log":
            self._json(self._batch_log())
            return
        super().do_GET()
    
    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/regenerate":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length)) if length > 0 else {}
            cid = body.get("card_id", "")
            self._json(regenerate_card(cid))
            return
        self.send_response(404); self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def _batch_progress(self):
        """读取批量生成进度"""
        prog_file = os.path.join(ASSETS, "batch_200_progress.json")
        try:
            if os.path.exists(prog_file):
                with open(prog_file, "r", encoding="utf-8") as f:
                    prog = json.load(f)
                total = prog.get("total", 0)
                completed = len(prog.get("completed", []))
                failed = prog.get("failed", {})
                return {
                    "total": total,
                    "completed": completed,
                    "failed_count": len(failed),
                    "failed_list": list(failed.keys())[-10:],
                    "pct": round(completed/total*100, 1) if total > 0 else 0,
                    "remaining": total - completed - len(failed)
                }
            return {"total": 0, "completed": 0, "failed_count": 0, "pct": 0}
        except:
            return {"error": "读取进度失败"}

    def _comfyui_status(self):
        """获取 ComfyUI 状态"""
        try:
            req = urllib.request.Request(f"{COMFY_URL}/system_stats")
            with urllib.request.urlopen(req, timeout=5) as r:
                data = json.loads(r.read())
            # 获取队列状态
            qreq = urllib.request.Request(f"{COMFY_URL}/queue")
            with urllib.request.urlopen(qreq, timeout=5) as r:
                qdata = json.loads(r.read())
            devices = data.get("devices", [{}])[0]
            return {
                "online": True,
                "version": data.get("system", {}).get("comfyui_version", "?"),
                "python": data.get("system", {}).get("python_version", "?"),
                "vram_total_gb": round(devices.get("vram_total", 0)/(1024**3), 1),
                "vram_free_gb": round(devices.get("vram_free", 0)/(1024**3), 1),
                "queue_running": len(qdata.get("queue_running", [])),
                "queue_pending": len(qdata.get("queue_pending", []))
            }
        except:
            return {"online": False}

    def _batch_log(self):
        """读取最近的生成日志"""
        log_file = os.path.join(ASSETS, "batch_200_log.txt")
        try:
            if os.path.exists(log_file):
                with open(log_file, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                return {"lines": [l.strip() for l in lines[-50:]]}
            return {"lines": []}
        except:
            return {"lines": []}

    def _json(self, data):
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

if __name__ == "__main__":
    addr = ("127.0.0.1", 8888)
    print(f"\n  国风炼金卡牌 · 本地Web看板")
    print(f"  http://{addr[0]}:{addr[1]}/docs/card-dashboard.html\n")
    httpd = http.server.HTTPServer(addr, CardHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  已停止")

"""
国风炼金卡牌 · 批量生成 200 张卡牌
- 自动从网络搜索卡牌知识作为副提示词
- 断线重连机制
- 进度追踪和日志
- 定时健康检查

用法: python batch_generate_200.py
"""
import json
import urllib.request
import urllib.error
import uuid
import time
import os
import sys
import datetime
import shutil
import threading
import traceback
from pathlib import Path

# ======================== 配置 ========================
COMFY_URL = "http://127.0.0.1:8188"
CKPT_NAME = "animagine-xl-4.0-opt.safetensors"
OUTPUT_BASE = Path(r"F:\guofeng-alchemy-card\assets-output\cards")
ORIGINALS_DIR = OUTPUT_BASE / "originals-v3"
MODEL_TESTS_DIR = OUTPUT_BASE / "model-tests"
PROGRESS_FILE = OUTPUT_BASE / "batch_200_progress.json"
LOG_FILE = OUTPUT_BASE / "batch_200_log.txt"
WIDTH, HEIGHT = 960, 1408  # 竖版卡牌比例

# 负面提示词
NEG_PROMPT = (
    "lowres, bad anatomy, bad hands, text, error, missing finger, "
    "extra digits, fewer digits, cropped, worst quality, low quality, "
    "low score, bad score, average score, signature, watermark, username, "
    "blurry, nsfw, nude, 3d, realistic, photorealistic, photo, "
    "anime eyes, big eyes, chibi, deformed, cartoon, cg, 2.5d"
)

# 质量增强标签
QUALITY_TAGS = "masterpiece, high score, great score, absurdres"

# ======================== 200 张卡牌定义 ========================

# 辅助知识库（模拟网络搜索结果，实际生成时会动态查询）
CARD_KNOWLEDGE = {}

ALL_CARDS = []

# 朝代标签映射
DYNASTY_TAGS = {
    "QH": "Qin-Han era Chinese historical",
    "SG": "Three Kingdoms era Chinese historical",
    "LJ": "Six Dynasties era Chinese historical",
    "ST": "Sui-Tang era Chinese historical",
    "SY": "Song-Yuan era Chinese historical",
    "MQ": "Ming-Qing era Chinese historical",
}

def add_cards(dynasty, cards_data):
    """批量添加卡牌定义"""
    for c in cards_data:
        c["dynasty"] = dynasty
        c["card_id"] = f"{dynasty}-{c['type_code']}-{c['seq']:04d}-L{c['level']:02d}"
        ALL_CARDS.append(c)

# ======================== 秦汉 (QH) - 33张 ========================
add_cards("QH", [
    # 人物 (14)
    {"seq":1, "type_code":"P", "type":"人物", "name":"秦始皇", "level":5, "rarity":"UR",
     "tags":["帝王","秦朝","统一","长城"], "kp":"秦始皇嬴政，中国历史上第一位皇帝，统一六国，建立中央集权制度。",
     "prompt_extra":"first emperor of China Qin Shi Huang, majestic middle-aged man in imperial black and gold dragon robe, wearing flat-topped imperial crown with beaded tassels, stern authoritative expression, standing in grand Qin dynasty palace hall, holding imperial jade seal"},
    {"seq":2, "type_code":"P", "type":"人物", "name":"刘邦", "level":4, "rarity":"SSR",
     "tags":["帝王","汉朝","开国","布衣"], "kp":"汉高祖刘邦，出身布衣，秦末起义建立汉朝。",
     "prompt_extra":"Liu Bang Han dynasty founding emperor, rugged masculine middle-aged man with weathered face, short black beard, wearing simple traditional Han robes, hand on sword hilt, standing outside military tent with red banners"},
    {"seq":3, "type_code":"P", "type":"人物", "name":"项羽", "level":4, "rarity":"SSR",
     "tags":["霸王","西楚","武力","悲剧"], "kp":"西楚霸王项羽，力能扛鼎的绝世猛将，楚汉之争的核心人物。",
     "prompt_extra":"Xiang Yu Hegemon-King of Western Chu, powerful muscular warrior, fierce intense black eyes, black beard, wearing traditional Chu heavy armor, holding Chinese halberd on battlefield, dramatic sky"},
    {"seq":4, "type_code":"P", "type":"人物", "name":"张良", "level":3, "rarity":"SR",
     "tags":["谋士","运筹帷幄","汉初三杰"], "kp":"张良，汉初三杰之一，运筹帷幄之中决胜千里之外的顶级谋士。",
     "prompt_extra":"Zhang Liang Han dynasty strategist, refined scholarly middle-aged man in elegant Han robes, gentle wise eyes, holding jade Ruyi scepter, in quiet study with scrolls and maps, serene expression"},
    {"seq":5, "type_code":"P", "type":"人物", "name":"韩信", "level":3, "rarity":"SR",
     "tags":["兵仙","统帅","汉初三杰"], "kp":"韩信，汉初三杰之一，被后世尊为兵仙，暗度陈仓灭三秦。",
     "prompt_extra":"Han Xin the military genius, tall commanding general in full Han dynasty bronze lamellar armor, holding commander seal, standing on hilltop overlooking battlefield, wind blowing his red cape"},
    {"seq":6, "type_code":"P", "type":"人物", "name":"萧何", "level":2, "rarity":"R",
     "tags":["丞相","后勤","汉初三杰"], "kp":"萧何，汉初三杰之一，丞相之首，刘邦的后勤总管家。",
     "prompt_extra":"Xiao He Han dynasty prime minister, older scholarly official in formal court robes, holding accounting scrolls and brush, standing in orderly granary and treasury, meticulous expression"},
    {"seq":7, "type_code":"P", "type":"人物", "name":"吕雉", "level":3, "rarity":"SR",
     "tags":["皇后","女政治家","吕后"], "kp":"吕雉，刘邦之妻，中国历史上第一位临朝称制的女性统治者。",
     "prompt_extra":"Empress Lu Zhi of Han dynasty, elegant yet imposing middle-aged woman in luxurious Han palace robes, phoenix hairpin crown, sitting on throne beside emperor, calculating and powerful gaze"},
    {"seq":8, "type_code":"P", "type":"人物", "name":"蒙恬", "level":2, "rarity":"R",
     "tags":["名将","长城","秦朝"], "kp":"蒙恬，秦朝名将，率三十万大军北击匈奴，修筑万里长城。",
     "prompt_extra":"Meng Tian Qin dynasty general, strong warrior in black Qin armor, standing on Great Wall construction site, holding sword, overseeing soldiers and workers, northern mountain landscape"},
    {"seq":9, "type_code":"P", "type":"人物", "name":"扶苏", "level":2, "rarity":"R",
     "tags":["公子","仁德","悲剧"], "kp":"扶苏，秦始皇长子，仁德宽厚，因赵高篡改遗诏而被迫自尽。",
     "prompt_extra":"Prince Fu Su of Qin dynasty, noble young man in white Qin robes, gentle scholarly face, standing in frontier garrison looking toward distant capital, melancholy expression, snowy landscape"},
    {"seq":10, "type_code":"P", "type":"人物", "name":"赵高", "level":1, "rarity":"N",
     "tags":["宦官","权臣","反派"], "kp":"赵高，秦朝宦官，秦始皇死后篡改遗诏扶立胡亥，加速秦朝灭亡。",
     "prompt_extra":"Zhao Gao Qin dynasty eunuch official, cunning middle-aged man in court robes, sly expression, holding brush at imperial desk, dark palace corridor, scheming atmosphere"},
    {"seq":11, "type_code":"P", "type":"人物", "name":"范增", "level":2, "rarity":"R",
     "tags":["谋士","亚父","楚汉"], "kp":"范增，项羽首席谋士，被尊为亚父，鸿门宴力主杀刘邦未果。",
     "prompt_extra":"Fan Zeng elderly advisor to Xiang Yu, white-bearded wise elder in simple Chu scholar robes, stern expression, pointing at map during military council, candlelit tent"},
    {"seq":12, "type_code":"P", "type":"人物", "name":"虞姬", "level":2, "rarity":"R",
     "tags":["美人","楚汉","爱情"], "kp":"虞姬，项羽宠姬，垓下之围时自刎殉情，与霸王演绎千古爱情悲剧。",
     "prompt_extra":"Yu Ji the Beauty, elegant young woman in flowing white Han dynasty silk robes, long black hair with simple jade hairpin, sorrowful beauty expression, in military tent at night, candlelight"},
    {"seq":13, "type_code":"P", "type":"人物", "name":"樊哙", "level":2, "rarity":"R",
     "tags":["猛将","鸿门宴","忠勇"], "kp":"樊哙，刘邦爱将，鸿门宴上直面项羽护主脱险的勇猛武将。",
     "prompt_extra":"Fan Kuai Han dynasty fierce general, burly muscular warrior with thick beard, wearing armor, aggressive stance with shield and sword, bursting into grand feast hall, intimidating presence"},
    {"seq":14, "type_code":"P", "type":"人物", "name":"章邯", "level":2, "rarity":"R",
     "tags":["秦将","降将","名将"], "kp":"章邯，秦末最后一位名将，先败于项羽后降楚，最终兵败自杀。",
     "prompt_extra":"Zhang Han Qin dynasty veteran general, weathered older warrior with graying beard, in black Qin armor, leading troops from horseback, determined but weary expression, battlefield sunset"},

    # 事件 (7)
    {"seq":15, "type_code":"E", "type":"事件", "name":"焚书坑儒", "level":2, "rarity":"R",
     "tags":["秦朝","文化","争议"], "kp":"秦始皇为统一思想，焚烧儒家经典坑杀儒生的重大历史事件。",
     "prompt_extra":"burning books and burying scholars scene, ancient Chinese officials throwing scrolls into fire pit, smoke rising, scholars being led away, dark oppressive atmosphere, Qin dynasty palace courtyard"},
    {"seq":16, "type_code":"E", "type":"事件", "name":"大泽乡起义", "level":2, "rarity":"R",
     "tags":["起义","陈胜","秦末"], "kp":"陈胜吴广在大泽乡揭竿而起，打响秦末农民起义第一枪。",
     "prompt_extra":"Daze Village uprising scene, Chinese farmers raising hoes and bamboo poles as weapons, heavy rain and muddy road, torches at night, angry determined peasants, dramatic revolutionary atmosphere"},
    {"seq":17, "type_code":"E", "type":"事件", "name":"鸿门宴", "level":3, "rarity":"SR",
     "tags":["楚汉","宴会","刺杀"], "kp":"项羽设宴鸿门欲杀刘邦，刘邦在张良樊哙帮助下化险为夷。",
     "prompt_extra":"Hongmen banquet scene, grand military tent interior, Xiang Yu and Liu Bang facing each other across feast table, swordsman performing sword dance, candlelight and shadows, tense atmosphere"},
    {"seq":18, "type_code":"E", "type":"事件", "name":"暗度陈仓", "level":2, "rarity":"R",
     "tags":["楚汉","韩信","战略"], "kp":"韩信明修栈道暗度陈仓，出其不意还定三秦的经典战例。",
     "prompt_extra":"secret passage through Chencang, Chinese soldiers marching quietly through mountain path at night, torches in distance, wooden plank road being repaired above, sneaky military maneuver"},
    {"seq":19, "type_code":"E", "type":"事件", "name":"垓下之围", "level":3, "rarity":"SR",
     "tags":["楚汉","决战","四面楚歌"], "kp":"垓下之战项羽被刘邦大军包围，四面楚歌，霸王别姬。",
     "prompt_extra":"Gaixia siege night scene, isolated Chu camp in valley surrounded by distant Han campfires, Xiang Yu in tent with Yu Ji, Han soldiers singing Chu songs on hillsides, tragic atmosphere"},
    {"seq":20, "type_code":"E", "type":"事件", "name":"约法三章", "level":1, "rarity":"N",
     "tags":["刘邦","关中","法度"], "kp":"刘邦入关中后与百姓约法三章，废除秦朝苛法赢得民心。",
     "prompt_extra":"Liu Bang announcing three laws to gathered common people, simple decree being read in public square, grateful citizens kneeling, ancient Chinese city gate background, peaceful atmosphere"},
    {"seq":21, "type_code":"E", "type":"事件", "name":"韩信点兵", "level":2, "rarity":"R",
     "tags":["韩信","兵法","多多益善"], "kp":"刘邦问韩信能带多少兵，韩信答多多益善的著名典故。",
     "prompt_extra":"Han Xin reviewing troops on vast parade ground, thousands of soldiers in formation, general on platform with command flags, Han dynasty military camp with red banners, grand scale"},
    # 补充更多事件
    {"seq":22, "type_code":"E", "type":"事件", "name":"指鹿为马", "level":1, "rarity":"N",
     "tags":["赵高","秦朝","阴谋"], "kp":"赵高在朝堂上指鹿为马试探大臣立场，铲除异己的著名典故。",
     "prompt_extra":"Zhao Gao pointing at deer in Qin palace court, calling it a horse, confused ministers watching, deer standing in grand hall, tense political atmosphere"},
    {"seq":23, "type_code":"E", "type":"事件", "name":"萧何月下追韩信", "level":2, "rarity":"R",
     "tags":["人才","楚汉","知遇之恩"], "kp":"韩信因不受重用离开汉营，萧何连夜追赶劝回，成就汉家天下。",
     "prompt_extra":"Xiao He riding horse under full moon chasing Han Xin along mountain path, two figures on horseback in night landscape, urgent pursuit, misty mountains in moonlight"},

    # 兵器 (4)
    {"seq":24, "type_code":"W", "type":"兵器", "name":"秦弩", "level":1, "rarity":"N",
     "tags":["秦朝","远程","军工"], "kp":"秦弩是秦军制式远程武器，标准化生产使秦军战力碾压六国。",
     "prompt_extra":"Qin dynasty crossbow, detailed bronze trigger mechanism, polished wood stock, displayed on dark silk with Qin army background, ancient Chinese weapon craftsmanship"},
    {"seq":25, "type_code":"W", "type":"兵器", "name":"天子剑", "level":3, "rarity":"SR",
     "tags":["帝王","宝剑","象征"], "kp":"天子剑象征皇权至高无上，秦始皇佩剑为太阿剑的传说。",
     "prompt_extra":"Imperial sword of Chinese emperor, ornate golden hilt with dragon carving, jade inlaid scabbard, blade reflecting light, displayed on imperial throne, majestic atmosphere"},
    {"seq":26, "type_code":"W", "type":"兵器", "name":"项羽戟", "level":2, "rarity":"R",
     "tags":["霸王","兵器","勇武"], "kp":"项羽善使长戟，据说其戟重达百斤，万夫不当之勇。",
     "prompt_extra":"Xiang Yu's Chinese halberd, massive long weapon with ornate blade, dragon engraving on shaft, leaning against throne in military tent, heroic warrior weapon"},
    {"seq":27, "type_code":"W", "type":"兵器", "name":"秦剑", "level":1, "rarity":"N",
     "tags":["秦朝","冷兵器","标准化"], "kp":"秦剑是秦军标准化冷兵器的代表，比六国长剑更长更锋利。",
     "prompt_extra":"Qin dynasty bronze long sword, sleek straight blade with inscriptions, displayed with Qin armor and shield, museum quality lighting, ancient weapon"},

    # 典籍 (3)
    {"seq":28, "type_code":"B", "type":"典籍", "name":"秦律", "level":2, "rarity":"R",
     "tags":["法律","秦朝","法家"], "kp":"秦律是秦朝以法家思想制定的严密法律体系，影响中国两千年法制。",
     "prompt_extra":"Qin dynasty law code bamboo slips, rows of ancient bamboo strips with ink writing, scroll with Qin legal texts, displayed on dark wooden desk with brush and ink stone"},
    {"seq":29, "type_code":"B", "type":"典籍", "name":"九章算术", "level":3, "rarity":"SR",
     "tags":["数学","汉代","科学"], "kp":"九章算术是汉代最终成书的中国古代最重要的数学经典。",
     "prompt_extra":"ancient Chinese mathematics text Nine Chapters, old scrolls with diagrams and calculations, abacus, compass and ruler on wooden desk, scholarly study atmosphere"},
    {"seq":30, "type_code":"B", "type":"典籍", "name":"黄帝内经", "level":3, "rarity":"SR",
     "tags":["医学","养生","中医经典"], "kp":"黄帝内经是汉代编定的中医理论奠基之作，阴阳五行医学体系。",
     "prompt_extra":"Yellow Emperor Inner Canon ancient medical text, scrolls with human body diagrams and acupuncture points, medicinal herbs around, traditional Chinese medicine atmosphere"},

    # 地点 (4)
    {"seq":31, "type_code":"L", "type":"地点", "name":"阿房宫", "level":2, "rarity":"R",
     "tags":["宫殿","秦朝","奢华"], "kp":"阿房宫是秦始皇修建的超级宫殿，覆压三百余里隔离天日。",
     "prompt_extra":"Epang Palace grand Qin imperial palace complex, massive golden roof oriental architecture, sweeping curved eaves, mountain backdrop, misty atmosphere, monumental scale"},
    {"seq":32, "type_code":"L", "type":"地点", "name":"未央宫", "level":2, "rarity":"R",
     "tags":["宫殿","汉朝","长安"], "kp":"未央宫是西汉王朝的大朝正殿，中国历史上最著名的宫殿之一。",
     "prompt_extra":"Weiyang Palace Han dynasty imperial hall, grand wooden architecture with red pillars and golden roofs, wide marble stairs, imperial guards, blue sky, majestic atmosphere"},
    {"seq":33, "type_code":"L", "type":"地点", "name":"龙门石窟", "level":3, "rarity":"SR",
     "tags":["佛教","石刻","艺术"], "kp":"龙门石窟始建于北魏，秦汉之后的佛教艺术宝库。",
     "prompt_extra":"Longmen Grottoes, massive Buddha statues carved into limestone cliffs, ancient Chinese Buddhist cave temples, river flowing in front, golden light, majestic religious site"},
    {"seq":34, "type_code":"L", "type":"地点", "name":"祁连山", "level":2, "rarity":"R",
     "tags":["山脉","匈奴","汉匈战争"], "kp":"祁连山是汉匈战争的战略要地，霍去病在此大破匈奴。",
     "prompt_extra":"Qilian Mountains grand landscape, snow-capped peaks with green grasslands below, Han dynasty cavalry riding across plains, eagles soaring, majestic Chinese northern mountains"},

    # 朝代 (1)
    {"seq":35, "type_code":"D", "type":"朝代", "name":"大秦帝国", "level":5, "rarity":"UR",
     "tags":["秦朝","帝国","统一"], "kp":"大秦帝国是中国历史上第一个大一统王朝，奠定了中国两千年帝制基础。",
     "prompt_extra":"Qin Empire symbol, black dragon flag with gold embroidery, imperial seal of China, Great Wall silhouette, terracotta warriors formation, majestic imperial Chinese atmosphere"},
])

# ======================== 三国 (SG) - 33张 ========================
add_cards("SG", [
    # 人物 (14)
    {"seq":1, "type_code":"P", "type":"人物", "name":"诸葛亮", "level":5, "rarity":"UR",
     "tags":["蜀汉","丞相","智慧","传奇"], "kp":"诸葛亮，三国蜀汉丞相，鞠躬尽瘁死而后已的千古名相。",
     "prompt_extra":"Zhuge Liang Three Kingdoms legendary strategist, refined scholar in white Taoist robes, holding feather fan, wearing headscarf with wisdom, standing before battle map with candlelit strategy, serene knowing expression"},
    {"seq":2, "type_code":"P", "type":"人物", "name":"关羽", "level":4, "rarity":"SSR",
     "tags":["蜀汉","五虎将","忠义","武圣"], "kp":"关羽，蜀汉五虎将之首，被后世尊为武圣关帝，忠义化身。",
     "prompt_extra":"Guan Yu Three Kingdoms warrior saint, tall imposing figure with red face, long magnificent black beard, Green Dragon Crescent Blade in hand, green battle robe over golden armor, heroic stance"},
    {"seq":3, "type_code":"P", "type":"人物", "name":"曹操", "level":4, "rarity":"SSR",
     "tags":["魏","枭雄","权臣","诗人"], "kp":"曹操，三国曹魏奠基人，挟天子以令诸侯的乱世枭雄。",
     "prompt_extra":"Cao Cao Three Kingdoms warlord, imposing middle-aged man in dark blue and gold battle robe, short beard, shrewd calculating eyes, standing before war council map, holding sword, commanding presence"},
    {"seq":4, "type_code":"P", "type":"人物", "name":"刘备", "level":3, "rarity":"SR",
     "tags":["蜀汉","仁君","织席贩履"], "kp":"刘备，蜀汉开国皇帝，以仁德立身，桃园三结义的带头大哥。",
     "prompt_extra":"Liu Bei Shu Han founder, dignified middle-aged man in light colored Han robes, kind face with determined eyes, double swords at waist, hands clasped in respectful gesture, peach blossom trees behind"},
    {"seq":5, "type_code":"P", "type":"人物", "name":"赵云", "level":3, "rarity":"SR",
     "tags":["蜀汉","五虎将","长坂坡","银枪"], "kp":"赵云，蜀汉五虎将，长坂坡七进七出救阿斗的常胜将军。",
     "prompt_extra":"Zhao Yun Three Kingdoms warrior, handsome young general in silver-white armor, holding long spear, riding white horse through battlefield, wind blowing his white cape, heroic charging pose"},
    {"seq":6, "type_code":"P", "type":"人物", "name":"周瑜", "level":3, "rarity":"SR",
     "tags":["东吴","都督","赤壁","儒将"], "kp":"周瑜，东吴大都督，赤壁之战中以少胜多火烧曹营的美周郎。",
     "prompt_extra":"Zhou Yu Wu kingdom grand commander, handsome refined young general in elegant blue and white robes, playing guqin zither on warship deck, river wind blowing, artistic warrior atmosphere"},
    {"seq":7, "type_code":"P", "type":"人物", "name":"吕布", "level":3, "rarity":"SR",
     "tags":["猛将","方天画戟","赤兔马"], "kp":"吕布，三国第一猛将，人中吕布马中赤兔的飞将。",
     "prompt_extra":"Lu Bu Three Kingdoms mightiest warrior, tall muscular man in ornate golden and red armor, holding Fangtian halberd, riding Red Hare horse, fierce charging pose, dramatic battlefield"},
    {"seq":8, "type_code":"P", "type":"人物", "name":"孙权", "level":3, "rarity":"SR",
     "tags":["东吴","帝王","紫髯碧眼"], "kp":"孙权，东吴开国皇帝，继承父兄基业坐断东南的守成之主。",
     "prompt_extra":"Sun Quan Wu kingdom ruler, regal young man with purple-tinted beard and striking eyes, sitting on throne in grand Wu palace hall, wearing imperial green and gold dragon robes, commanding dignity"},
    {"seq":9, "type_code":"P", "type":"人物", "name":"司马懿", "level":3, "rarity":"SR",
     "tags":["魏","权臣","隐忍","篡魏"], "kp":"司马懿，三国曹魏权臣，隐忍数十载终为晋朝奠基。",
     "prompt_extra":"Sima Yi Wei kingdom strategist, older man with sharp clever eyes hiding schemes, in dark court robes, pretending frailty while hiding ruthless ambition, lurking wolf demeanor"},
    {"seq":10, "type_code":"P", "type":"人物", "name":"典韦", "level":2, "rarity":"R",
     "tags":["魏","猛将","宛城之战"], "kp":"典韦，曹操帐下第一猛将，宛城之战中为保曹操脱逃力战而死。",
     "prompt_extra":"Dian Wei Wei kingdom fierce bodyguard, massive muscular warrior with bull-like strength, wielding twin halberds, standing at gate holding back enemies alone, bleeding but defiant, last stand"},
    {"seq":11, "type_code":"P", "type":"人物", "name":"黄忠", "level":2, "rarity":"R",
     "tags":["蜀汉","五虎将","老当益壮"], "kp":"黄忠，蜀汉五虎将中最年长者，老当益壮箭术无双。",
     "prompt_extra":"Huang Zhong Shu Han veteran general, robust elderly warrior with white beard, drawing powerful longbow, wearing brown and green armor, standing on city wall, vigorous old age"},
    {"seq":12, "type_code":"P", "type":"人物", "name":"陆逊", "level":2, "rarity":"R",
     "tags":["东吴","儒将","夷陵之战"], "kp":"陆逊，东吴大都督，夷陵之战中火烧连营大败刘备的年轻儒将。",
     "prompt_extra":"Lu Xun Wu kingdom young commander, refined scholarly face in white and green robes, holding commander seal, watching flames across river valley, strategic calm expression"},
    {"seq":13, "type_code":"P", "type":"人物", "name":"董卓", "level":1, "rarity":"N",
     "tags":["军阀","残暴","乱世"], "kp":"董卓，东汉末年权臣，废少帝立献帝的残暴军阀。",
     "prompt_extra":"Dong Zhuo Han dynasty tyrannical warlord, obese imposing figure in lavish golden armor, cruel arrogant expression, sitting on imperial throne illegally, dark palace atmosphere"},
    {"seq":14, "type_code":"P", "type":"人物", "name":"貂蝉", "level":2, "rarity":"R",
     "tags":["美人","连环计","三国"], "kp":"貂蝉，三国第一美人，王允以连环计离间董卓吕布的绝色女子。",
     "prompt_extra":"Diao Chan Three Kingdoms legendary beauty, breathtaking young woman in flowing pink silk Han robes, elaborate hair ornaments, dancing gracefully under moonlight in courtyard, melancholic beauty"},

    # 事件 (7)
    {"seq":15, "type_code":"E", "type":"事件", "name":"桃园三结义", "level":2, "rarity":"R",
     "tags":["蜀汉","结义","兄弟情"], "kp":"刘备关羽张飞在桃园结为异姓兄弟，不求同生但求同死。",
     "prompt_extra":"peach garden oath scene, Liu Bei Guan Yu Zhang Fei three men kneeling before altar with incense, peach blossoms falling around, cups of wine, brotherhood ceremony, dramatic sunset light"},
    {"seq":16, "type_code":"E", "type":"事件", "name":"草船借箭", "level":2, "rarity":"R",
     "tags":["赤壁","诸葛","谋略"], "kp":"诸葛亮利用大雾以草船诱使曹操放箭，一夜之间借到十万支箭。",
     "prompt_extra":"straw boats borrowing arrows scene, foggy river at dawn, boats with straw bundles approaching enemy camp, arrows raining down sticking into straw, Zhuge Liang on boat in white robes calm"},
    {"seq":17, "type_code":"E", "type":"事件", "name":"空城计", "level":3, "rarity":"SR",
     "tags":["诸葛","司马懿","西城"], "kp":"诸葛亮以空城计退司马懿大军，一人抚琴城楼吓退数万雄兵。",
     "prompt_extra":"empty city strategy, Zhuge Liang sitting alone on city gate tower playing guqin, city gate wide open behind with sweepers, distant army hesitant to advance, intense psychological warfare scene"},
    {"seq":18, "type_code":"E", "type":"事件", "name":"赤壁之战", "level":4, "rarity":"SSR",
     "tags":["三国","火攻","周瑜","东风"], "kp":"赤壁之战孙刘联军火烧曹船，奠定三国鼎立格局的决定性战役。",
     "prompt_extra":"Red Cliffs naval battle, massive warships on fire on river, flames and black smoke filling sky, soldiers jumping into water, dramatic firestorm, wind blowing from east, epic ancient Chinese naval warfare"},
    {"seq":19, "type_code":"E", "type":"事件", "name":"七擒孟获", "level":2, "rarity":"R",
     "tags":["蜀汉","诸葛","南征"], "kp":"诸葛亮七次擒获南中首领孟获七次释放，以攻心为上平定南中。",
     "prompt_extra":"Zhuge Liang releasing captured tribal leader Meng Huo, southern jungle landscape, tribal warriors watching, Chinese soldiers standing by, reconciliation atmosphere, bamboo forest"},
    {"seq":20, "type_code":"E", "type":"事件", "name":"水淹七军", "level":2, "rarity":"R",
     "tags":["关羽","荆州","于禁"], "kp":"关羽利用汉水暴涨水淹于禁七军，威震华夏的经典战术。",
     "prompt_extra":"flooding seven armies, Guan Yu on high ground watching flood waters engulf enemy camp below, soldiers and horses struggling in water, dramatic rain and lightning, nature weapon"},
    {"seq":21, "type_code":"E", "type":"事件", "name":"六出祁山", "level":3, "rarity":"SR",
     "tags":["北伐","诸葛","蜀汉"], "kp":"诸葛亮六次北伐中原，出祁山伐曹魏直到五丈原星落。",
     "prompt_extra":"sixth expedition from Qishan, Zhuge Liang in commander tent at Wuzhang Plain, oil lamp about to go out, old age but determined expression, maps and star charts, sunset mountains"},

    # 事件补充
    {"seq":22, "type_code":"E", "type":"事件", "name":"青梅煮酒论英雄", "level":1, "rarity":"N",
     "tags":["曹操","刘备","双雄"], "kp":"曹操与刘备在许昌梅园煮酒论英雄的经典对话场景。",
     "prompt_extra":"Cao Cao and Liu Bei drinking warm wine in plum garden, green plums on plate, thunder in sky, two men at stone table, tension beneath calm surface"},

    # 兵器 (4)
    {"seq":23, "type_code":"W", "type":"兵器", "name":"青龙偃月刀", "level":3, "rarity":"SR",
     "tags":["关羽","兵器","传奇"], "kp":"青龙偃月刀是关羽的标志性兵器，重八十二斤的冷艳锯。",
     "prompt_extra":"Green Dragon Crescent Blade, massive Chinese glaive with dragon design on blade, green shaft, golden fittings, displayed in shrine setting with incense and candles, legendary weapon"},
    {"seq":24, "type_code":"W", "type":"兵器", "name":"丈八蛇矛", "level":2, "rarity":"R",
     "tags":["张飞","兵器","丈八"], "kp":"丈八蛇矛是张飞的标志性兵器，矛身如蛇形弯曲丈八其长。",
     "prompt_extra":"Zhang Fei's serpent spear, long curved spear blade like snake tongue, black shaft, displayed with warrior armor, fierce weapon design"},
    {"seq":25, "type_code":"W", "type":"兵器", "name":"方天画戟", "level":2, "rarity":"R",
     "tags":["吕布","兵器","方天"], "kp":"方天画戟是吕布的专属兵器，两侧月牙刃的华丽长戟。",
     "prompt_extra":"Fangtian painted halberd, ornate double crescent blade halberd, red tassels, golden shaft engravings, displayed dramatically against dark background, supreme warrior weapon"},
    {"seq":26, "type_code":"W", "type":"兵器", "name":"诸葛连弩", "level":2, "rarity":"R",
     "tags":["诸葛亮","发明","远程"], "kp":"诸葛亮改良的连弩可连续发射十支箭矢，蜀汉军事科技代表。",
     "prompt_extra":"Zhuge Liang repeating crossbow, wooden mechanism with multiple arrow slots, intricate design, displayed with technical scrolls, ancient Chinese military innovation"},

    # 典籍 (3)
    {"seq":27, "type_code":"B", "type":"典籍", "name":"出师表", "level":3, "rarity":"SR",
     "tags":["诸葛亮","文学","忠义"], "kp":"出师表是诸葛亮北伐前写给后主刘禅的奏表，千古忠臣之绝唱。",
     "prompt_extra":"Chu Shi Biao memorial text, ancient scroll with elegant calligraphy, brush and ink stone, tears stains on paper, dim candlelight, old man writing at desk at night"},
    {"seq":28, "type_code":"B", "type":"典籍", "name":"伤寒杂病论", "level":3, "rarity":"SR",
     "tags":["医学","张仲景","医圣"], "kp":"伤寒杂病论是东汉张仲景所著，中医临床医学奠基之作。",
     "prompt_extra":"Treatise on Cold Damage ancient medical book, scrolls with herbal formulas, dried herbs, pulse diagnosis tools, scholarly Chinese medical study room"},
    {"seq":29, "type_code":"B", "type":"典籍", "name":"隆中对", "level":2, "rarity":"R",
     "tags":["策略","刘备","诸葛"], "kp":"诸葛亮在隆中对中为刘备规划三分天下的战略蓝图。",
     "prompt_extra":"Longzhong strategy discussion, Zhuge Liang pointing at map on wall, Liu Bei listening intently, humble thatched cottage, simple tea cups, candlelit wisdom"},

    # 地点 (4)
    {"seq":30, "type_code":"L", "type":"地点", "name":"五丈原", "level":2, "rarity":"R",
     "tags":["诸葛亮","北伐","落星"], "kp":"五丈原是诸葛亮第六次北伐病逝之地，出师未捷身先死。",
     "prompt_extra":"Wuzhang Plain at sunset, military camp on plateau, commander tent with dim light, falling star in twilight sky, autumn wind blowing yellow leaves, melancholic atmosphere"},
    {"seq":31, "type_code":"L", "type":"地点", "name":"长坂坡", "level":2, "rarity":"R",
     "tags":["赵云","战场","当阳"], "kp":"长坂坡是赵云单骑救阿斗血战曹军的传奇战场。",
     "prompt_extra":"Changban slope battlefield, dust and chaos, abandoned items scattered, Zhao Yun on white horse charging through enemies holding infant, dramatic canyon setting"},
    {"seq":32, "type_code":"L", "type":"地点", "name":"白帝城", "level":2, "rarity":"R",
     "tags":["刘备","托孤","蜀汉"], "kp":"白帝城是刘备夷陵之败后病逝托孤诸葛亮的历史遗址。",
     "prompt_extra":"White Emperor City on cliff by Yangtze River, misty river gorge, ancient fortress on hilltop, candlelit chamber where emperor entrusts heir to minister, solemn atmosphere"},
    {"seq":33, "type_code":"L", "type":"地点", "name":"定军山", "level":1, "rarity":"N",
     "tags":["蜀汉","战场","黄忠"], "kp":"定军山是黄忠斩杀夏侯渊之地，蜀汉北伐的重要战略据点。",
     "prompt_extra":"Dingjun Mountain battlefield, mountain terrain with military camp, Chinese soldiers clashing on slope, dramatic mountain landscape with battle smoke"},

    # 朝代 (1)
    {"seq":34, "type_code":"D", "type":"朝代", "name":"三国鼎立", "level":5, "rarity":"UR",
     "tags":["三国","对峙","历史格局"], "kp":"三国鼎立是魏蜀吴三分天下的历史格局，中国历史上最著名的分裂时期。",
     "prompt_extra":"Three Kingdoms tripartite balance, three colored flags representing Wei blue, Shu green, Wu red, divided map of China, three distinctive crowns and symbols, epic historical tableau"},
])

# ======================== 两晋南北朝 (LJ) - 33张 ========================
add_cards("LJ", [
    # 人物 (14)
    {"seq":1, "type_code":"P", "type":"人物", "name":"王羲之", "level":4, "rarity":"SSR",
     "tags":["书法","东晋","书圣","兰亭"], "kp":"王羲之，东晋书圣，兰亭序被誉为天下第一行书。",
     "prompt_extra":"Wang Xizhi legendary calligrapher, refined middle-aged scholar in flowing white robes, holding brush over paper, orchid pavilion outdoor setting with winding stream, elegant free spirit"},
    {"seq":2, "type_code":"P", "type":"人物", "name":"谢安", "level":3, "rarity":"SR",
     "tags":["东晋","宰相","淝水之战"], "kp":"谢安，东晋名相，淝水之战中以少胜多的战略大师。",
     "prompt_extra":"Xie An Eastern Jin prime minister, calm composed elderly scholar in formal robes, playing Go while receiving battle report, serene garden pavilion, pine trees and rocks"},
    {"seq":3, "type_code":"P", "type":"人物", "name":"陶渊明", "level":3, "rarity":"SR",
     "tags":["诗人","隐士","田园","魏晋"], "kp":"陶渊明，东晋田园诗人，不为五斗米折腰的隐逸之宗。",
     "prompt_extra":"Tao Yuanming pastoral poet, simple dressed elderly man with bamboo hat, picking chrysanthemums by eastern fence, thatched cottage, distant mountains, peaceful rural landscape"},
    {"seq":4, "type_code":"P", "type":"人物", "name":"祖逖", "level":2, "rarity":"R",
     "tags":["东晋","北伐","闻鸡起舞"], "kp":"祖逖，东晋北伐名将，闻鸡起舞志复中原的爱国英雄。",
     "prompt_extra":"Zu Ti Eastern Jin general, middle-aged warrior rising at rooster crow drawing sword for practice, pre-dawn light, simple barrack setting, determined expression to reclaim homeland"},
    {"seq":5, "type_code":"P", "type":"人物", "name":"顾恺之", "level":2, "rarity":"R",
     "tags":["绘画","东晋","艺术"], "kp":"顾恺之，东晋画圣，以洛神赋图等传世名作代表六朝艺术高峰。",
     "prompt_extra":"Gu Kaizhi Eastern Jin master painter, elegant scholar in flowing robes, painting on silk scroll, delicate brush strokes, artistic studio with hanging scrolls, classical Chinese painting"},
    {"seq":6, "type_code":"P", "type":"人物", "name":"嵇康", "level":3, "rarity":"SR",
     "tags":["竹林七贤","琴艺","傲骨"], "kp":"嵇康，竹林七贤之首，广陵散绝响于刑场的不屈文人。",
     "prompt_extra":"Ji Kang leader of Seven Sages, handsome tall scholar in loose robes, playing guqin under bamboo grove, iron forge nearby, aloof free spirit, dappled sunlight through bamboo leaves"},
    {"seq":7, "type_code":"P", "type":"人物", "name":"花木兰", "level":3, "rarity":"SR",
     "tags":["女英雄","北魏","代父从军"], "kp":"花木兰，北魏时期代父从军的传奇女英雄，巾帼不让须眉。",
     "prompt_extra":"Hua Mulan legendary female warrior, young woman in traditional Chinese armor, removing helmet to reveal long black hair, sword in hand, horse nearby, returning home from war"},
    {"seq":8, "type_code":"P", "type":"人物", "name":"阮籍", "level":2, "rarity":"R",
     "tags":["竹林七贤","诗人","旷达"], "kp":"阮籍，竹林七贤之一，以青白眼表达好恶的不羁诗人。",
     "prompt_extra":"Ruan Ji Seven Sages poet, eccentric scholar in loose robes riding donkey, wine flask in hand, walking toward horizon, misty landscape, free wandering spirit"},
    {"seq":9, "type_code":"P", "type":"人物", "name":"苻坚", "level":2, "rarity":"R",
     "tags":["前秦","帝王","淝水之战"], "kp":"苻坚，前秦皇帝，统一北方后在淝水之战中惨败的前秦雄主。",
     "prompt_extra":"Fu Jian Former Qin emperor, imposing northern barbarian ruler in fur-trimmed robes, leading massive army on horseback, blowing winds on river plain, hubris before fall"},
    {"seq":10, "type_code":"P", "type":"人物", "name":"谢道韫", "level":2, "rarity":"R",
     "tags":["才女","东晋","咏絮之才"], "kp":"谢道韫，东晋才女，咏絮之才形容女子的文学天赋。",
     "prompt_extra":"Xie Daoyun Eastern Jin talented lady, elegant young woman in refined robes, composing poetry under willow tree with snow-like catkins floating, scholarly garden setting"},
    {"seq":11, "type_code":"P", "type":"人物", "name":"刘裕", "level":3, "rarity":"SR",
     "tags":["南朝宋","开国","寒门"], "kp":"刘裕，南朝宋开国皇帝，出身寒门的气吞万里如虎的雄主。",
     "prompt_extra":"Liu Yu Song dynasty founder, rugged masculine warrior emperor in golden armor, rising from humble origins, leading cavalry charge, dramatic northern campaign landscape"},
    {"seq":12, "type_code":"P", "type":"人物", "name":"潘岳", "level":1, "rarity":"N",
     "tags":["美男子","西晋","文采"], "kp":"潘岳，西晋美男子与文学家，掷果盈车的古代第一美男。",
     "prompt_extra":"Pan Yue Western Jin famously handsome scholar, beautiful young man in elegant robes walking through street, women throwing fruits at his carriage, charming refined appearance"},
    {"seq":13, "type_code":"P", "type":"人物", "name":"贾思勰", "level":2, "rarity":"R",
     "tags":["农学家","北朝","齐民要术"], "kp":"贾思勰，北朝农学家，著齐民要术是中国现存最早的完整农书。",
     "prompt_extra":"Jia Sixie Northern Dynasty agricultural scientist, middle-aged scholar in practical robes, examining crops in field, writing notes, rural farming landscape"},
    {"seq":14, "type_code":"P", "type":"人物", "name":"石勒", "level":1, "rarity":"N",
     "tags":["后赵","羯族","奴隶皇帝"], "kp":"石勒，后赵开国皇帝，从奴隶到皇帝的传奇羯族首领。",
     "prompt_extra":"Shi Le Later Zhao barbarian emperor, fierce tribal chieftain in fur and leather armor, rising from slavery to throne, nomadic camp with banners, northern steppe landscape"},

    # 事件 (7)
    {"seq":15, "type_code":"E", "type":"事件", "name":"淝水之战", "level":3, "rarity":"SR",
     "tags":["东晋","前秦","以少胜多"], "kp":"淝水之战东晋以八万北府兵大破前秦八十万大军。",
     "prompt_extra":"Fei River battle, smaller Jin army facing massive Qin forces across river, war drums, banners, chaos as retreat begins when someone shouts Qin is defeated, dramatic ancient battle scene"},
    {"seq":16, "type_code":"E", "type":"事件", "name":"永嘉之乱", "level":2, "rarity":"R",
     "tags":["西晋","匈奴","亡国"], "kp":"永嘉之乱匈奴攻破洛阳掳走晋怀帝，西晋走向灭亡。",
     "prompt_extra":"Yongjia chaos, barbarian cavalry breaking into Luoyang city gates, burning buildings, fleeing civilians, smoke and fire, fall of civilization, dramatic historical catastrophe"},
    {"seq":17, "type_code":"E", "type":"事件", "name":"闻鸡起舞", "level":1, "rarity":"N",
     "tags":["祖逖","勤奋","成语"], "kp":"祖逖与刘琨闻鸡鸣即起练剑，立志收复中原的励志典故。",
     "prompt_extra":"hearing rooster crow and rising to dance with sword, two young men practicing sword forms in early morning mist, rooster on fence, pre-dawn sky, inspiring atmosphere"},
    {"seq":18, "type_code":"E", "type":"事件", "name":"衣冠南渡", "level":2, "rarity":"R",
     "tags":["东晋","移民","文化传承"], "kp":"西晋灭亡后中原士族南迁江南，中国文化中心首次大规模南移。",
     "prompt_extra":"southern migration of noble families, long procession of scholars and officials with belongings crossing Yangtze River by boat, elegant refugees, misty river landscape, sad departure"},
    {"seq":19, "type_code":"E", "type":"事件", "name":"八王之乱", "level":1, "rarity":"N",
     "tags":["西晋","内乱","宗室"], "kp":"西晋八位宗王为争夺皇位进行的十六年内乱，严重削弱了西晋国力。",
     "prompt_extra":"Eight Princes rebellion, chaos in palace corridors, multiple armed factions fighting, imperial seal contested, dark corridors with torches, political chaos"},
    {"seq":20, "type_code":"E", "type":"事件", "name":"孝文帝改革", "level":2, "rarity":"R",
     "tags":["北魏","汉化","改革"], "kp":"北魏孝文帝迁都洛阳推行全面汉化改革，促进民族融合。",
     "prompt_extra":"Emperor Xiaowen reform ceremony, young northern emperor in Chinese style robes announcing reforms at new capital Luoyang, Xianbei nobles in traditional then Han clothing, cultural fusion"},
    {"seq":21, "type_code":"E", "type":"事件", "name":"侯景之乱", "level":1, "rarity":"N",
     "tags":["南朝","梁","叛将"], "kp":"侯景之乱摧毁了南朝梁的繁荣，建康城从百万人口降至废墟。",
     "prompt_extra":"Hou Jing rebellion, warlord leading troops breaching Jiankang city walls, burning palaces, collapsing towers, devastation of southern capital"},

    # 兵器 (4)
    {"seq":22, "type_code":"W", "type":"兵器", "name":"北府矛", "level":1, "rarity":"N",
     "tags":["东晋","北府兵","长兵器"], "kp":"北府矛是东晋精锐北府兵的制式长矛，在淝水之战中威震天下。",
     "prompt_extra":"Northern Army spear, long wooden shaft iron tip polearm, displayed with Jin dynasty armor, military camp setting"},
    {"seq":23, "type_code":"W", "type":"兵器", "name":"环首刀", "level":1, "rarity":"N",
     "tags":["汉末","直刀","冷兵器"], "kp":"环首刀是汉末至南北朝时期最普遍的实战直刀。",
     "prompt_extra":"Ring-pommel straight sword, single edged steel blade with circular ring on handle end, Han dynasty style weapon"},
    {"seq":24, "type_code":"W", "type":"兵器", "name":"马镫", "level":2, "rarity":"R",
     "tags":["骑兵","南北朝","军事革命"], "kp":"马镫的发明使骑兵真正成为战场主力，改变了世界军事格局。",
     "prompt_extra":"ancient Chinese stirrups, leather and bronze horse riding equipment, displayed on saddle, mounted warrior silhouettes in background"},
    {"seq":25, "type_code":"W", "type":"兵器", "name":"明光铠", "level":2, "rarity":"R",
     "tags":["南北朝","铠甲","铁甲"], "kp":"明光铠是南北朝时期最精良的铁质铠甲，胸甲如镜反光。",
     "prompt_extra":"Mingguang shining armor, polished iron plate armor with mirror-like chest plate, displayed on stand, reflecting sunlight, ornate Chinese helmet"},

    # 典籍 (3)
    {"seq":26, "type_code":"B", "type":"典籍", "name":"齐民要术", "level":2, "rarity":"R",
     "tags":["农学","北朝","实用"], "kp":"齐民要术是贾思勰所著中国现存最早的完整农业百科全书。",
     "prompt_extra":"Qi Min Yao Shu agricultural encyclopedia, old book with farming illustrations, seeds and wheat ears around, farming tools nearby"},
    {"seq":27, "type_code":"B", "type":"典籍", "name":"世说新语", "level":2, "rarity":"R",
     "tags":["南朝","笔记","魏晋风度"], "kp":"世说新语记录魏晋名士言行轶事，是了解魏晋风度的重要文献。",
     "prompt_extra":"Shi Shuo Xin Yu anecdote collection, elegant book with scholars conversing in bamboo grove illustrations, ink painting style cover"},
    {"seq":28, "type_code":"B", "type":"典籍", "name":"水经注", "level":3, "rarity":"SR",
     "tags":["地理","北魏","郦道元"], "kp":"水经注是郦道元著的中国古代最全面的水文地理巨著。",
     "prompt_extra":"Commentary on Water Classic, ancient geographical text with river maps, mountain illustrations, old scholar writing at desk with landscape paintings around"},

    # 地点 (4)
    {"seq":29, "type_code":"L", "type":"地点", "name":"兰亭", "level":2, "rarity":"R",
     "tags":["东晋","书法","绍兴"], "kp":"兰亭是王羲之举办兰亭雅集书写兰亭序的千古文化圣地。",
     "prompt_extra":"Orchid Pavilion in Shaoxing, elegant outdoor pavilion by winding stream, bamboo grove, scholars sitting along water for poetry gathering, spring atmosphere"},
    {"seq":30, "type_code":"L", "type":"地点", "name":"云冈石窟", "level":3, "rarity":"SR",
     "tags":["北魏","佛教","大同"], "kp":"云冈石窟是北魏皇家开凿的佛教石窟艺术宝库。",
     "prompt_extra":"Yungang Grottoes, massive Buddha statues carved into sandstone cliffs, ancient Buddhist art, morning light casting golden glow on statues"},
    {"seq":31, "type_code":"L", "type":"地点", "name":"洛阳城", "level":2, "rarity":"R",
     "tags":["都城","北魏","汉魏"], "kp":"洛阳是汉魏至北魏多朝都城，白马寺和永宁寺塔的所在地。",
     "prompt_extra":"ancient Luoyang city panorama, grand city walls and gates, White Horse Temple pagoda, Luo River flowing through, imperial palace district"},
    {"seq":32, "type_code":"L", "type":"地点", "name":"石头城", "level":1, "rarity":"N",
     "tags":["建康","防御","长江"], "kp":"石头城是建康的江防要塞，地势险要虎踞龙盘。",
     "prompt_extra":"Stone City fortress on Yangtze riverbank, massive stone walls built into cliff, warships on river, ancient Chinese defensive architecture"},

    # 朝代 (1)
    {"seq":33, "type_code":"D", "type":"朝代", "name":"六朝金粉", "level":4, "rarity":"SSR",
     "tags":["六朝","繁华","金陵"], "kp":"六朝金粉形容建康（南京）作为六朝都城时的繁华和风雅文化。",
     "prompt_extra":"Six Dynasties golden splendor, prosperous ancient Nanjing city with grand palaces and temples, Qinhuai river with pleasure boats, scholars and beauties, poetic atmosphere"},
])

# ======================== 隋唐 (ST) - 33张 ========================
add_cards("ST", [
    # 人物 (14)
    {"seq":1, "type_code":"P", "type":"人物", "name":"李世民", "level":5, "rarity":"UR",
     "tags":["唐朝","帝王","贞观之治"], "kp":"唐太宗李世民，贞观之治开创大唐盛世的一代明君。",
     "prompt_extra":"Tang Taizong Li Shimin, majestic emperor in golden dragon robe, sitting on dragon throne, wise and commanding presence, behind him the grand Tang palace, prosperous golden age atmosphere"},
    {"seq":2, "type_code":"P", "type":"人物", "name":"武则天", "level":5, "rarity":"UR",
     "tags":["唐朝","女皇","无字碑"], "kp":"武则天是中国历史上唯一的女皇帝，改唐为周统治近半个世纪。",
     "prompt_extra":"Wu Zetian China's only female emperor, magnificent middle-aged empress in golden phoenix crown and dragon robe, sitting on dragon throne alone, powerful commanding presence, Tang palace"},
    {"seq":3, "type_code":"P", "type":"人物", "name":"李白", "level":4, "rarity":"SSR",
     "tags":["唐诗","诗仙","浪漫"], "kp":"李白，唐代诗仙，天生我材必有用的浪漫主义诗人。",
     "prompt_extra":"Li Bai Tang dynasty immortal poet, handsome carefree scholar in flowing white robes, holding wine cup, reciting poetry under moonlight, hair flowing in wind, mountain landscape"},
    {"seq":4, "type_code":"P", "type":"人物", "name":"杜甫", "level":4, "rarity":"SSR",
     "tags":["唐诗","诗圣","现实主义"], "kp":"杜甫，唐代诗圣，安得广厦千万间的忧国忧民诗人。",
     "prompt_extra":"Du Fu Tang dynasty sage poet, weathered older scholar in simple brown robes, looking at distant horizon with concern, autumn wind blowing, thatched cottage behind"},
    {"seq":5, "type_code":"P", "type":"人物", "name":"杨玉环", "level":3, "rarity":"SR",
     "tags":["唐朝","贵妃","四大美女"], "kp":"杨玉环，唐玄宗宠妃，中国古代四大美女之一的羞花。",
     "prompt_extra":"Yang Guifei Tang dynasty imperial consort, voluptuous beauty in luxurious silk robes, elaborate golden hair ornaments, dancing with flowing sleeves, peony garden palace"},
    {"seq":6, "type_code":"P", "type":"人物", "name":"魏征", "level":2, "rarity":"R",
     "tags":["唐朝","谏臣","镜子"], "kp":"魏征，唐太宗最信任的谏臣，以人为镜可以明得失。",
     "prompt_extra":"Wei Zheng Tang dynasty upright advisor, stern elderly official in formal court robes, bowing while presenting memorial to emperor, honest and direct expression"},
    {"seq":7, "type_code":"P", "type":"人物", "name":"白居易", "level":3, "rarity":"SR",
     "tags":["唐诗","诗人","新乐府"], "kp":"白居易，唐代大诗人，长恨歌琵琶行的千古绝唱。",
     "prompt_extra":"Bai Juyi Tang dynasty poet, middle-aged scholar in simple robes, composing poetry by river with pipa music drifting, autumn leaves, melancholic beauty"},
    {"seq":8, "type_code":"P", "type":"人物", "name":"玄奘", "level":3, "rarity":"SR",
     "tags":["唐朝","佛教","西行"], "kp":"玄奘法师西行印度取经，翻译大量佛经的佛教高僧。",
     "prompt_extra":"Xuanzang Tang dynasty Buddhist monk, bald monk in simple kasaya robe, holding staff and scripture scroll, walking through desert landscape, determined spiritual journey"},
    {"seq":9, "type_code":"P", "type":"人物", "name":"王维", "level":2, "rarity":"R",
     "tags":["唐诗","画家","诗佛"], "kp":"王维，唐代诗人兼画家，诗中有画画中有诗的诗佛。",
     "prompt_extra":"Wang Wei Tang dynasty poet-painter, elegant scholar painting landscape on silk, bamboo grove studio, ink and brush, serene artistic atmosphere"},
    {"seq":10, "type_code":"P", "type":"人物", "name":"李靖", "level":2, "rarity":"R",
     "tags":["唐朝","名将","军神"], "kp":"李靖，唐初第一名将，灭东突厥破吐谷浑的大唐军神。",
     "prompt_extra":"Li Jing Tang dynasty military god, veteran general in full Tang golden armor, holding commander seal, overlooking strategic map, northern campaign setting"},
    {"seq":11, "type_code":"P", "type":"人物", "name":"孙思邈", "level":2, "rarity":"R",
     "tags":["唐朝","医学","药王"], "kp":"孙思邈，唐代药王，千金方是中国最早的临床医学百科全书。",
     "prompt_extra":"Sun Simiao Tang dynasty medicine king, elderly white-haired doctor in simple robes, holding herbs and medical text, mountain hermitage with medicinal plants"},
    {"seq":12, "type_code":"P", "type":"人物", "name":"吴道子", "level":2, "rarity":"R",
     "tags":["唐朝","画家","画圣"], "kp":"吴道子，唐代画圣，吴带当风的佛教壁画大师。",
     "prompt_extra":"Wu Daozi Tang dynasty painting saint, middle-aged artist in flowing robes, painting mural on temple wall with dynamic strokes, disciples watching in awe"},
    {"seq":13, "type_code":"P", "type":"人物", "name":"秦琼", "level":2, "rarity":"R",
     "tags":["唐朝","名将","门神"], "kp":"秦琼，唐初名将，后来被民间奉为门神的传奇武将。",
     "prompt_extra":"Qin Qiong Tang dynasty gate god general, powerful warrior in golden Tang armor, wielding paired iron maces, standing guard at palace gate, protective stance"},
    {"seq":14, "type_code":"P", "type":"人物", "name":"杜牧", "level":2, "rarity":"R",
     "tags":["晚唐","诗人","阿房宫赋"], "kp":"杜牧，晚唐诗人，阿房宫赋借古讽今的才子。",
     "prompt_extra":"Du Mu late Tang poet, refined scholar in elegant robes, gazing at ancient palace ruins, composing poetry, autumn scene with red leaves"},

    # 事件 (7)
    {"seq":15, "type_code":"E", "type":"事件", "name":"玄武门之变", "level":3, "rarity":"SR",
     "tags":["唐朝","政变","李世民"], "kp":"玄武门之变李世民射杀太子建成，开启了贞观之治的序幕。",
     "prompt_extra":"Xuanwu Gate incident, two princes facing off at palace gate, archery and sword fighting, dawn light, tense political assassination scene, Tang palace architecture"},
    {"seq":16, "type_code":"E", "type":"事件", "name":"贞观之治", "level":4, "rarity":"SSR",
     "tags":["唐朝","盛世","李世民"], "kp":"贞观之治是唐太宗开创的盛世，路不拾遗夜不闭户的黄金时代。",
     "prompt_extra":"Zhenguan golden age, prosperous Tang capital Chang'an streets, merchants from silk road, happy citizens, grand imperial palace in background, peace and prosperity"},
    {"seq":17, "type_code":"E", "type":"事件", "name":"安史之乱", "level":3, "rarity":"SR",
     "tags":["唐朝","叛乱","转折"], "kp":"安史之乱是唐朝由盛转衰的转折点，八年战乱改变中国历史。",
     "prompt_extra":"An Lushan rebellion, barbarian general leading cavalry into burning Chang'an city, Tang soldiers defending, imperial family fleeing, dramatic fall of golden age"},
    {"seq":18, "type_code":"E", "type":"事件", "name":"玄奘取经", "level":2, "rarity":"R",
     "tags":["唐朝","佛教","丝绸之路"], "kp":"玄奘法师从长安出发，经丝绸之路前往印度那烂陀寺取经。",
     "prompt_extra":"Xuanzang journey to west, lone monk crossing desert with camel caravan, distant snow mountains, Buddhist stupa on horizon, spiritual pilgrimage"},
    {"seq":19, "type_code":"E", "type":"事件", "name":"文成公主入藏", "level":2, "rarity":"R",
     "tags":["唐朝","吐蕃","和亲"], "kp":"文成公主嫁给吐蕃赞普松赞干布，促进汉藏文化交流。",
     "prompt_extra":"Princess Wencheng marriage procession to Tibet, Tang princess in red wedding robes on horseback crossing snowy plateau, Tibetan king welcoming, yak caravans"},
    {"seq":20, "type_code":"E", "type":"事件", "name":"马嵬驿兵变", "level":2, "rarity":"R",
     "tags":["安史之乱","杨贵妃","悲剧"], "kp":"马嵬驿兵变中杨贵妃被赐死，成为千古爱情悲剧。",
     "prompt_extra":"Mawei post station mutiny, soldiers surrounding驿站, Yang Guifei walking toward白绫, Tang Xuanzong turning away in grief, dramatic sunset, tragedy"},
    {"seq":21, "type_code":"E", "type":"事件", "name":"饮中八仙", "level":1, "rarity":"N",
     "tags":["唐诗","醉酒","文人"], "kp":"饮中八仙是唐代八位以饮酒豪放闻名的文人群体的雅号。",
     "prompt_extra":"Eight Immortals of Wine, eight Tang scholars drinking and composing poetry in garden,李白 waving brush while drinking, joyful artistic gathering"},

    # 兵器 (4)
    {"seq":22, "type_code":"W", "type":"兵器", "name":"唐刀", "level":2, "rarity":"R",
     "tags":["唐朝","兵器","仪刀"], "kp":"唐刀是唐朝制式军刀，对后世日本刀和东亚刀剑影响深远。",
     "prompt_extra":"Tang dynasty straight sword, elegant curved steel blade with ornate golden guard and handle, displayed on dark silk, refined craftsmanship"},
    {"seq":23, "type_code":"W", "type":"兵器", "name":"陌刀", "level":1, "rarity":"N",
     "tags":["唐朝","步兵","长刀"], "kp":"陌刀是唐代步兵专克骑兵的长柄大刀，一刀可斩人马俱碎。",
     "prompt_extra":"Modao long-handled infantry sword, massive long blade on pole shaft, Tang infantry weapon, displayed vertically with soldier silhouette"},
    {"seq":24, "type_code":"W", "type":"兵器", "name":"北斗七星剑", "level":2, "rarity":"R",
     "tags":["唐代","法剑","道教"], "kp":"北斗七星剑是唐代道教法师使用的法器，剑身刻七星图案。",
     "prompt_extra":"Big Dipper Seven Star sword, straight double-edged blade with seven star constellation engraved in gold, Taoist talisman handle, displayed with incense"},
    {"seq":25, "type_code":"W", "type":"兵器", "name":"凤翅镏金镋", "level":2, "rarity":"R",
     "tags":["隋唐","兵器","宇文成都"], "kp":"凤翅镏金镋是隋唐演义中天宝大将宇文成都的标志性兵器。",
     "prompt_extra":"Phoenix wing golden trident, ornate three-pronged weapon with phoenix wing decorations, gold finish, displayed dramatically as hero weapon"},

    # 典籍 (3)
    {"seq":26, "type_code":"B", "type":"典籍", "name":"大唐西域记", "level":2, "rarity":"R",
     "tags":["唐朝","地理","玄奘"], "kp":"大唐西域记是玄奘口述的西域旅行记录，研究古代中亚南亚的珍贵资料。",
     "prompt_extra":"Great Tang Records on Western Regions, ancient book with maps of silk road countries, desert and oasis illustrations"},
    {"seq":27, "type_code":"B", "type":"典籍", "name":"全唐诗", "level":4, "rarity":"SSR",
     "tags":["唐诗","汇编","文学"], "kp":"全唐诗收录了唐代近五万首诗歌，是中国诗歌的巅峰总集。",
     "prompt_extra":"Complete Tang Poems collection, thick ancient book set with elegant covers, brush-written poems visible, ink stone and brush nearby"},
    {"seq":28, "type_code":"B", "type":"典籍", "name":"千金方", "level":2, "rarity":"R",
     "tags":["医学","孙思邈","药方"], "kp":"千金方是孙思邈著的中国最早的临床医学百科全书。",
     "prompt_extra":"Thousand Gold Prescriptions medical book, ancient text with herb illustrations and formulas, medicinal herbs drying nearby"},

    # 地点 (4)
    {"seq":29, "type_code":"L", "type":"地点", "name":"大明宫", "level":3, "rarity":"SR",
     "tags":["唐朝","宫殿","长安"], "kp":"大明宫是唐朝大朝正殿，世界最大宫殿建筑群。",
     "prompt_extra":"Daming Palace Tang imperial complex, grand golden roof halls with red pillars, massive marble stairs, imperial guards, blue sky, majestic scale"},
    {"seq":30, "type_code":"L", "type":"地点", "name":"大雁塔", "level":2, "rarity":"R",
     "tags":["唐朝","佛塔","长安"], "kp":"大雁塔是玄奘为保存从印度带回的佛经而建造的。",
     "prompt_extra":"Great Wild Goose Pagoda in Chang'an, tall elegant brick pagoda with multiple tiers, ancient Chinese Buddhist architecture, sunset silhouette"},
    {"seq":31, "type_code":"L", "type":"地点", "name":"华清宫", "level":2, "rarity":"R",
     "tags":["唐朝","浴池","骊山"], "kp":"华清宫是唐玄宗与杨贵妃沐浴避暑的行宫。",
     "prompt_extra":"Huaqing Palace hot spring, Tang dynasty mountain resort with pools, peony flowers, palace architecture on骊山slope, steam rising from hot spring"},
    {"seq":32, "type_code":"L", "type":"地点", "name":"滕王阁", "level":2, "rarity":"R",
     "tags":["唐朝","建筑","南昌"], "kp":"滕王阁因王勃滕王阁序而闻名天下，落霞与孤鹜齐飞。",
     "prompt_extra":"Tengwang Pavilion by river, grand multi-story Chinese tower with curved eaves, sunset with lone wild goose flying, autumn river landscape"},

    # 朝代 (1)
    {"seq":33, "type_code":"D", "type":"朝代", "name":"大唐盛世", "level":5, "rarity":"UR",
     "tags":["唐朝","盛世","万国来朝"], "kp":"大唐盛世是中国封建社会的巅峰，长安是当时世界最大城市。",
     "prompt_extra":"Great Tang golden age, grand Chang'an city panorama, merchants from all nations on streets, blooming peonies, imperial palace in sunlight, prosperity peak of Chinese civilization"},
])

# ======================== 宋元 (SY) - 33张 ========================
add_cards("SY", [
    # 人物 (14)
    {"seq":1, "type_code":"P", "type":"人物", "name":"苏轼", "level":5, "rarity":"UR",
     "tags":["北宋","词人","全才","东坡"], "kp":"苏轼，北宋文豪，诗文书画全能的千古第一文人。",
     "prompt_extra":"Su Shi Song dynasty literary giant, middle-aged scholar in simple robes, writing calligraphy with brush, wine cup nearby,赤壁river landscape background, carefree and wise expression"},
    {"seq":2, "type_code":"P", "type":"人物", "name":"岳飞", "level":4, "rarity":"SSR",
     "tags":["南宋","抗金","民族英雄"], "kp":"岳飞，南宋抗金名将，精忠报国最终被秦桧以莫须有杀害。",
     "prompt_extra":"Yue Fei Song dynasty patriotic general, strong warrior in golden Song armor, four characters Jing Zhong Bao Guo tattoo on back visible, leading cavalry charge, fierce justice expression"},
    {"seq":3, "type_code":"P", "type":"人物", "name":"赵匡胤", "level":4, "rarity":"SSR",
     "tags":["北宋","开国","杯酒释兵权"], "kp":"宋太祖赵匡胤，陈桥兵变黄袍加身建立北宋。",
     "prompt_extra":"Zhao Kuangyin Song dynasty founder, dignified warrior emperor in yellow imperial robe being draped over him by soldiers,陳橋at dawn, dramatic founding moment"},
    {"seq":4, "type_code":"P", "type":"人物", "name":"文天祥", "level":3, "rarity":"SR",
     "tags":["南宋","忠臣","正气歌"], "kp":"文天祥，南宋末年的民族英雄，人生自古谁无死留取丹心照汗青。",
     "prompt_extra":"Wen Tianxiang Song loyal minister, determined scholar in prison writing poem with brush, chains on wrist, window with moonlight, unbroken spirit"},
    {"seq":5, "type_code":"P", "type":"人物", "name":"包拯", "level":3, "rarity":"SR",
     "tags":["北宋","清官","铁面无私"], "kp":"包拯，北宋著名清官，铁面无私执法如山的包青天。",
     "prompt_extra":"Bao Zheng Song dynasty incorruptible judge, dark-faced official in black court robe and judge hat, crescent moon mark on forehead, holding judge tablet, courtroom setting"},
    {"seq":6, "type_code":"P", "type":"人物", "name":"辛弃疾", "level":3, "rarity":"SR",
     "tags":["南宋","词人","将领"], "kp":"辛弃疾，南宋词人兼将领，醉里挑灯看剑的豪放词人。",
     "prompt_extra":"Xin Qiji Song dynasty warrior-poet, middle-aged man in armor writing poetry by lamplight with sword nearby, military tent setting, passionate expression"},
    {"seq":7, "type_code":"P", "type":"人物", "name":"李清照", "level":3, "rarity":"SR",
     "tags":["南宋","女词人","婉约"], "kp":"李清照，宋代最伟大的女词人，寻寻觅觅冷冷清清的婉约之宗。",
     "prompt_extra":"Li Qingzhao Song dynasty female poet, elegant thin woman in simple robes, writing by window with chrysanthemums, autumn leaves falling, melancholic beauty"},
    {"seq":8, "type_code":"P", "type":"人物", "name":"成吉思汗", "level":4, "rarity":"SSR",
     "tags":["元朝","蒙古","征服"], "kp":"成吉思汗铁木真，建立蒙古帝国，征服欧亚大陆的一代天骄。",
     "prompt_extra":"Genghis Khan Mongol conqueror, powerful middle-aged nomadic leader in fur and leather armor, sitting on horse on steppe, vast grassland and sky, fierce hawk eyes"},
    {"seq":9, "type_code":"P", "type":"人物", "name":"忽必烈", "level":3, "rarity":"SR",
     "tags":["元朝","皇帝","大都"], "kp":"忽必烈，元朝开国皇帝，定都大都建立中国历史上第一个少数民族大一统王朝。",
     "prompt_extra":"Kublai Khan Yuan dynasty emperor, older nomadic ruler in Chinese-Mongol fusion imperial robes, sitting on dragon throne in Dadu palace, cultural fusion atmosphere"},
    {"seq":10, "type_code":"P", "type":"人物", "name":"沈括", "level":2, "rarity":"R",
     "tags":["北宋","科学家","梦溪笔谈"], "kp":"沈括，北宋科学家，梦溪笔谈是中国科学史的里程碑式著作。",
     "prompt_extra":"Shen Kuo Song dynasty scientist, scholarly man examining compass and fossils, study room with instruments, curious scientific expression"},
    {"seq":11, "type_code":"P", "type":"人物", "name":"毕升", "level":2, "rarity":"R",
     "tags":["北宋","发明","活字印刷"], "kp":"毕升发明活字印刷术，是中国四大发明之一的重要贡献者。",
     "prompt_extra":"Bi Sheng Song dynasty inventor, artisan arranging clay movable type characters on tray, printing workshop with paper and ink, innovative atmosphere"},
    {"seq":12, "type_code":"P", "type":"人物", "name":"王安石", "level":3, "rarity":"SR",
     "tags":["北宋","变法","改革"], "kp":"王安石推行熙宁变法，是北宋最著名的变法改革家。",
     "prompt_extra":"Wang Anshi Song dynasty reformer, stern official presenting reform proposal at court, intense debate atmosphere, court officials divided"},
    {"seq":13, "type_code":"P", "type":"人物", "name":"宋江", "level":1, "rarity":"N",
     "tags":["北宋","水浒","起义"], "kp":"宋江是水浒传中梁山起义的领袖，替天行道的江湖豪杰。",
     "prompt_extra":"Song Jiang Water Margin hero leader, middle-aged man in dark robes with sword, standing at Liangshan marsh fortress, loyal righteous expression"},
    {"seq":14, "type_code":"P", "type":"人物", "name":"关汉卿", "level":2, "rarity":"R",
     "tags":["元朝","戏剧","窦娥冤"], "kp":"关汉卿，元代最伟大的杂剧作家，元代曲圣。",
     "prompt_extra":"Guan Hanqing Yuan dynasty playwright, older scholar composing script with brush, theatrical masks and musical instruments nearby, stage setting"},

    # 事件 (7)
    {"seq":15, "type_code":"E", "type":"事件", "name":"陈桥兵变", "level":2, "rarity":"R",
     "tags":["北宋","开国","黄袍加身"], "kp":"陈桥兵变中赵匡胤被部下黄袍加身，兵不血刃建立宋朝。",
     "prompt_extra":"Chen Bridge mutiny, soldiers draping yellow imperial robe on Zhao Kuangyin at dawn, bridge and camp setting, dramatic historical founding moment"},
    {"seq":16, "type_code":"E", "type":"事件", "name":"靖康之变", "level":3, "rarity":"SR",
     "tags":["北宋","灭亡","靖康耻"], "kp":"靖康之变金兵攻破汴京掳走徽钦二帝，北宋灭亡的国耻。",
     "prompt_extra":"Jingkang incident, Jin barbarian cavalry breaching Bianjing city gates, imperial family being taken captive, burning palace, national humiliation scene"},
    {"seq":17, "type_code":"E", "type":"事件", "name":"岳飞北伐", "level":3, "rarity":"SR",
     "tags":["南宋","抗金","十二道金牌"], "kp":"岳飞北伐连战连捷，却被十二道金牌召回冤杀风波亭。",
     "prompt_extra":"Yue Fei northern campaign, Song army advancing victoriously, then messenger delivering golden recall plaque, general turning back with frustration, tragic hero"},
    {"seq":18, "type_code":"E", "type":"事件", "name":"崖山海战", "level":3, "rarity":"SR",
     "tags":["南宋","灭亡","崖山"], "kp":"崖山海战南宋最后的抵抗，陆秀夫背幼帝投海十万军民殉国。",
     "prompt_extra":"Yashan naval battle, final Song fleet being surrounded by Yuan navy, minister carrying child emperor jumping into sea, dramatic final stand, tragic sunset"},
    {"seq":19, "type_code":"E", "type":"事件", "name":"杯酒释兵权", "level":2, "rarity":"R",
     "tags":["北宋","政治","赵匡胤"], "kp":"赵匡胤以杯酒宴请众将，劝其交出兵权颐养天年。",
     "prompt_extra":"releasing military power over wine, Zhao Kuangyin hosting banquet for generals, cups of wine on table, peaceful but tense political dinner"},
    {"seq":20, "type_code":"E", "type":"事件", "name":"马可波罗游记", "level":2, "rarity":"R",
     "tags":["元朝","西方","交流"], "kp":"意大利旅行家马可波罗在元朝中国旅行，其游记激发了欧洲对东方的向往。",
     "prompt_extra":"Marco Polo at Yuan court, European traveler in Western clothes presenting to Kublai Khan, cultural exchange scene, exotic atmosphere"},
    {"seq":21, "type_code":"E", "type":"事件", "name":"清明上河", "level":2, "rarity":"R",
     "tags":["北宋","风俗","画卷"], "kp":"清明上河图描绘了北宋汴京的繁华市井生活。",
     "prompt_extra":"Qingming riverside scene, bustling Song dynasty Bianjing city with merchants, boats on canal, crowded market, scroll-like panoramic view"},

    # 兵器 (4)
    {"seq":22, "type_code":"W", "type":"兵器", "name":"神臂弓", "level":2, "rarity":"R",
     "tags":["宋朝","弩","远程"], "kp":"神臂弓是宋代最强大的单兵弩，射程达三百步穿甲能力极强。",
     "prompt_extra":"Divine Arm crossbow, powerful recurve crossbow with elaborate trigger mechanism, Song dynasty advanced weapon, displayed with bolts"},
    {"seq":23, "type_code":"W", "type":"兵器", "name":"沥泉枪", "level":2, "rarity":"R",
     "tags":["岳飞","兵器","传说"], "kp":"沥泉枪是岳飞使用的神枪，相传从神泉中取得的兵器。",
     "prompt_extra":"Li Quan spear of Yue Fei, ornate spear with coiled dragon design on shaft, silver tip, hero weapon displayed with golden armor"},
    {"seq":24, "type_code":"W", "type":"兵器", "name":"蒙古弓", "level":1, "rarity":"N",
     "tags":["元朝","蒙古","骑兵"], "kp":"蒙古弓是蒙古骑兵横扫欧亚的主力武器，短小而强劲的复合弓。",
     "prompt_extra":"Mongol composite bow, compact powerful recurve bow with horn and sinew,草原nomadic weapon, displayed with arrows in quiver"},
    {"seq":25, "type_code":"W", "type":"兵器", "name":"突火枪", "level":2, "rarity":"R",
     "tags":["宋朝","火器","发明"], "kp":"突火枪是最早的火药武器之一，以竹筒装火药喷射弹丸。",
     "prompt_extra":"fire lance early gunpowder weapon, bamboo tube on pole spraying flame and projectiles, Song dynasty military innovation, smoke and fire"},

    # 典籍 (3)
    {"seq":26, "type_code":"B", "type":"典籍", "name":"资治通鉴", "level":4, "rarity":"SSR",
     "tags":["北宋","史学","司马光"], "kp":"资治通鉴是司马光主编的编年体通史，涵盖1362年历史。",
     "prompt_extra":"Zizhi Tongjian comprehensive history book, thick ancient volumes with chronological records, brush and ink, scholarly library setting"},
    {"seq":27, "type_code":"B", "type":"典籍", "name":"梦溪笔谈", "level":2, "rarity":"R",
     "tags":["北宋","科学","沈括"], "kp":"梦溪笔谈是沈括的科学笔记，涵盖天文地理数学等众多领域。",
     "prompt_extra":"Dream Pool Essays science notebook, open book with astronomy diagrams and compass illustration, scientific instruments nearby"},
    {"seq":28, "type_code":"B", "type":"典籍", "name":"永乐大典", "level":4, "rarity":"SSR",
     "tags":["明朝","类书","百科全书"], "kp":"永乐大典是明成祖编纂的世界最大的古代百科全书。",
     "prompt_extra":"Yongle Encyclopedia, massive collection of thick ancient books with red silk covers, grand library hall, scholarly treasure"},

    # 地点 (4)
    {"seq":29, "type_code":"L", "type":"地点", "name":"清明上河园", "level":2, "rarity":"R",
     "tags":["北宋","汴京","市井"], "kp":"汴京是北宋都城，清明上河图描写的世界第一大都市。",
     "prompt_extra":"Qingming Shanghe garden, Song dynasty Bianjing city skyline with Rainbow Bridge spanning river, boats, shops, crowds, prosperous urban landscape"},
    {"seq":30, "type_code":"L", "type":"地点", "name":"元大都", "level":2, "rarity":"R",
     "tags":["元朝","都城","北京"], "kp":"元大都是忽必烈建立的元代都城，北京城的前身。",
     "prompt_extra":"Khanbaliq Yuan dynasty capital, Mongol-Chinese fusion city with pagodas and草原nomadic tents, grand imperial palace, diverse international city"},
    {"seq":31, "type_code":"L", "type":"地点", "name":"临安城", "level":2, "rarity":"R",
     "tags":["南宋","都城","西湖"], "kp":"临安是南宋行在，西湖边的繁华帝都。",
     "prompt_extra":"Lin'an Southern Song capital, beautiful city by West Lake, pleasure boats on water, temples on hillside, misty江南atmosphere"},
    {"seq":32, "type_code":"L", "type":"地点", "name":"钓鱼城", "level":1, "rarity":"N",
     "tags":["南宋","要塞","抗元"], "kp":"钓鱼城是南宋抗元的最后要塞，坚守36年蒙古大汗蒙哥战死城下。",
     "prompt_extra":"Diaoyu Fortress, mountain-top castle with strong walls, overlooking river, Song banners flying, stubborn resistance"},

    # 朝代 (1)
    {"seq":33, "type_code":"D", "type":"朝代", "name":"大宋风华", "level":5, "rarity":"UR",
     "tags":["宋朝","文化","经济"], "kp":"大宋风华代表中国经济文化达到封建时代巅峰的黄金时期。",
     "prompt_extra":"Song Dynasty cultural golden age, elegant scholars and artists, painting and calligraphy, porcelain and silk, prosperous cities, refined civilization peak"},
])

# ======================== 明清 (MQ) - 35张 ========================
add_cards("MQ", [
    # 人物 (14)
    {"seq":1, "type_code":"P", "type":"人物", "name":"朱元璋", "level":4, "rarity":"SSR",
     "tags":["明朝","开国","布衣"], "kp":"朱元璋，明太祖，从乞丐到皇帝的传奇开国之君。",
     "prompt_extra":"Zhu Yuanzhang Ming dynasty founder, older emperor with distinctive long face in golden dragon robe, sitting on dragon throne, from beggar to emperor story, commanding presence"},
    {"seq":2, "type_code":"P", "type":"人物", "name":"郑和", "level":4, "rarity":"SSR",
     "tags":["明朝","航海","宝船"], "kp":"郑和七下西洋率领当时世界最大舰队远航至东非。",
     "prompt_extra":"Zheng He Ming dynasty admiral, tall eunuch commander in blue official robes standing on treasure ship deck, vast ocean behind, huge fleet, nautical instruments in hand"},
    {"seq":3, "type_code":"P", "type":"人物", "name":"朱棣", "level":4, "rarity":"SSR",
     "tags":["明朝","永乐","紫禁城"], "kp":"永乐帝朱棣迁都北京修建紫禁城，开创永乐盛世。",
     "prompt_extra":"Yongle Emperor Zhu Di, powerful middle-aged emperor in golden armor over dragon robe, standing before newly built Forbidden City, ambitious conqueror expression"},
    {"seq":4, "type_code":"P", "type":"人物", "name":"康熙", "level":4, "rarity":"SSR",
     "tags":["清朝","圣祖","统一"], "kp":"康熙帝，清朝入关后最伟大的皇帝，平三藩收台湾定蒙古。",
     "prompt_extra":"Kangxi Emperor Qing dynasty, dignified emperor in yellow dragon robe with Manchurian style, studying map at desk, wise and capable ruler, palace study"},
    {"seq":5, "type_code":"P", "type":"人物", "name":"王阳明", "level":3, "rarity":"SR",
     "tags":["明朝","哲学","心学"], "kp":"王阳明，明代心学大师，知行合一的思想家与军事家。",
     "prompt_extra":"Wang Yangming Ming philosopher, middle-aged scholar in simple blue robes, teaching students in mountain academy, bamboo grove, enlightenment expression"},
    {"seq":6, "type_code":"P", "type":"人物", "name":"李时珍", "level":3, "rarity":"SR",
     "tags":["明朝","医学","本草纲目"], "kp":"李时珍著本草纲目，集中国药学大成的医药学家。",
     "prompt_extra":"Li Shizhen Ming dynasty herbalist, elderly doctor in simple clothes, examining herb in mountain forest, carrying medicine basket, scholarly nature explorer"},
    {"seq":7, "type_code":"P", "type":"人物", "name":"乾隆", "level":3, "rarity":"SR",
     "tags":["清朝","盛世","十全老人"], "kp":"乾隆帝，清朝全盛时期的皇帝，自称十全老人。",
     "prompt_extra":"Qianlong Emperor Qing dynasty, elegant elderly emperor in yellow dragon robe, holding calligraphy brush, enjoying arts and poetry, refined imperial taste"},
    {"seq":8, "type_code":"P", "type":"人物", "name":"徐霞客", "level":2, "rarity":"R",
     "tags":["明朝","旅行","地理"], "kp":"徐霞客，明代旅行家，徐霞客游记是中国最早的旅行文学。",
     "prompt_extra":"Xu Xiake Ming dynasty explorer, middle-aged scholar in travel robes with walking staff, climbing mountain path, panoramic landscape behind, adventurous spirit"},
    {"seq":9, "type_code":"P", "type":"人物", "name":"曹雪芹", "level":3, "rarity":"SR",
     "tags":["清朝","文学","红楼梦"], "kp":"曹雪芹著红楼梦，中国古典小说的巅峰之作。",
     "prompt_extra":"Cao Xueqin Qing dynasty novelist, poor but refined scholar writing in humble cottage, dream-like scenes from his novel floating in background, artistic genius"},
    {"seq":10, "type_code":"P", "type":"人物", "name":"林则徐", "level":2, "rarity":"R",
     "tags":["清朝","禁烟","民族英雄"], "kp":"林则徐虎门销烟，抵抗英国鸦片侵略的民族英雄。",
     "prompt_extra":"Lin Zexu Qing dynasty official, determined middle-aged mandarin in blue court robe, overseeing opium destruction at Humen beach, patriotic stance"},
    {"seq":11, "type_code":"P", "type":"人物", "name":"蒲松龄", "level":2, "rarity":"R",
     "tags":["清朝","文学","聊斋"], "kp":"蒲松龄著聊斋志异，中国最著名的鬼怪小说集。",
     "prompt_extra":"Pu Songling Qing dynasty writer, older scholar serving tea to travelers at roadside booth, collecting ghost stories, mysterious night atmosphere"},
    {"seq":12, "type_code":"P", "type":"人物", "name":"袁崇焕", "level":2, "rarity":"R",
     "tags":["明朝","抗清","悲剧"], "kp":"袁崇焕，明末抗清名将，宁远大捷后反被凌迟处死的悲剧英雄。",
     "prompt_extra":"Yuan Chonghuan Ming dynasty general, determined warrior in armor defending city wall against Manchu siege, cannon fire, tragic hero atmosphere"},
    {"seq":13, "type_code":"P", "type":"人物", "name":"张居正", "level":3, "rarity":"SR",
     "tags":["明朝","改革","首辅"], "kp":"张居正推行万历新政，一条鞭法改革使明朝一度中兴。",
     "prompt_extra":"Zhang Juzheng Ming dynasty reformer, stern prime minister in formal red court robe, holding memorial to throne, standing before imperial palace, reform atmosphere"},
    {"seq":14, "type_code":"P", "type":"人物", "name":"戚继光", "level":2, "rarity":"R",
     "tags":["明朝","抗倭","军事"], "kp":"戚继光组建戚家军抗击倭寇，著纪效新书的军事家。",
     "prompt_extra":"Qi Jiguang Ming dynasty general, strong warrior in armor leading distinctive戚家军soldiers with unique formation against Japanese pirates, coastal battlefield"},

    # 事件 (7)
    {"seq":15, "type_code":"E", "type":"事件", "name":"郑和下西洋", "level":3, "rarity":"SR",
     "tags":["明朝","航海","宝船"], "kp":"郑和率领当时世界最庞大的舰队七次远航西洋，展示明朝国力。",
     "prompt_extra":"Zheng He treasure fleet sailing, massive Chinese junk ships with red sails on blue ocean, exotic foreign ports in distance, peaceful maritime expedition"},
    {"seq":16, "type_code":"E", "type":"事件", "name":"土木堡之变", "level":2, "rarity":"R",
     "tags":["明朝","皇帝被俘","转折"], "kp":"土木堡之变明英宗被瓦剌俘虏，明朝由盛转衰的关键事件。",
     "prompt_extra":"Tumu crisis, Ming army surrounded in barren northern plain, emperor's tent being overrun by Mongol cavalry, dramatic disaster scene"},
    {"seq":17, "type_code":"E", "type":"事件", "name":"虎门销烟", "level":2, "rarity":"R",
     "tags":["清朝","禁烟","民族"], "kp":"林则徐在虎门海滩销毁鸦片，引发第一次鸦片战争的导火索。",
     "prompt_extra":"Humen opium destruction, beach with large pools of lime dissolving opium chests, Lin Zexu supervising, Chinese officials watching, patriotic public event"},
    {"seq":18, "type_code":"E", "type":"事件", "name":"雍正夺嫡", "level":2, "rarity":"R",
     "tags":["清朝","皇位争夺","九子夺嫡"], "kp":"康熙九子争夺皇位，最终四阿哥胤禛胜出成为雍正帝。",
     "prompt_extra":"Yongzheng succession struggle, multiple princes scheming in palace corridors, secret memorials, intense political intrigue in Forbidden City"},
    {"seq":19, "type_code":"E", "type":"事件", "name":"永乐大典编纂", "level":2, "rarity":"R",
     "tags":["明朝","文化","类书"], "kp":"永乐帝命解缙等人编纂永乐大典，世界最大的古代百科全书。",
     "prompt_extra":"Yongle Encyclopedia compilation, thousands of scholars copying and editing texts in grand hall, mountains of books, cultural project"},
    {"seq":20, "type_code":"E", "type":"事件", "name":"闯王进京", "level":2, "rarity":"R",
     "tags":["明朝","灭亡","李自成"], "kp":"李自成攻入北京崇祯帝自缢煤山，明朝灭亡的悲壮时刻。",
     "prompt_extra":"Li Zicheng entering Beijing, peasant rebel army marching through city gate, last Ming emperor hanging on煤山tree in background, dynasty fall"},
    {"seq":21, "type_code":"E", "type":"事件", "name":"鸦片战争", "level":3, "rarity":"SR",
     "tags":["清朝","近代","屈辱"], "kp":"第一次鸦片战争英国以坚船利炮打开中国国门，签订南京条约。",
     "prompt_extra":"Opium War, British warships firing on Chinese coastal forts, Qing soldiers with outdated weapons defending, smoke and fire, clash of civilizations"},

    # 兵器 (4)
    {"seq":22, "type_code":"W", "type":"兵器", "name":"绣春刀", "level":2, "rarity":"R",
     "tags":["明朝","锦衣卫","佩刀"], "kp":"绣春刀是明朝锦衣卫的制式佩刀，以绣春为名寓意美好。",
     "prompt_extra":"Xiuchun sword, elegant curved blade with spring flower engravings,锦衣卫imperial guard weapon, displayed on dark silk with badge"},
    {"seq":23, "type_code":"W", "type":"兵器", "name":"三眼铳", "level":1, "rarity":"N",
     "tags":["明朝","火器","多管"], "kp":"三眼铳是明代火器，三根铳管同时发射的火门枪。",
     "prompt_extra":"three-barrel hand cannon, Ming dynasty firearm with three iron barrels bound together, gunpowder weapon, smoke emerging"},
    {"seq":24, "type_code":"W", "type":"兵器", "name":"雁翎刀", "level":1, "rarity":"N",
     "tags":["明清","腰刀","冷兵器"], "kp":"雁翎刀是明清时期最普遍的雁翎形腰刀。",
     "prompt_extra":"goose-feather saber, curved single-edged sword with goose quill pattern, Ming-Qing era common military sidearm"},
    {"seq":25, "type_code":"W", "type":"兵器", "name":"红衣大炮", "level":2, "rarity":"R",
     "tags":["明清","火炮","西式"], "kp":"红衣大炮是明清时期引进的西洋火炮，成为城防和战场主力。",
     "prompt_extra":"red-coated cannon, large bronze cannon on fortress wall facing sea, smoke, Ming-Qing era artillery, defensive weapon"},

    # 典籍 (3)
    {"seq":26, "type_code":"B", "type":"典籍", "name":"本草纲目", "level":3, "rarity":"SR",
     "tags":["明朝","医学","李时珍"], "kp":"本草纲目是李时珍著的中国古代最伟大的药学巨著。",
     "prompt_extra":"Bencao Gangmu herbal medicine encyclopedia, thick ancient book with detailed plant and animal illustrations, medicinal herbs around"},
    {"seq":27, "type_code":"B", "type":"典籍", "name":"红楼梦", "level":4, "rarity":"SSR",
     "tags":["清朝","小说","四大名著"], "kp":"红楼梦是曹雪芹著的中国古典小说巅峰，贾史王薛四大家族的故事。",
     "prompt_extra":"Dream of Red Chamber novel, elegant ancient book with dreamy garden scene cover, jade pendant, peony flowers, literary masterpiece"},
    {"seq":28, "type_code":"B", "type":"典籍", "name":"天工开物", "level":2, "rarity":"R",
     "tags":["明朝","科技","宋应星"], "kp":"天工开物是宋应星著的中国古代综合性的科学技术著作。",
     "prompt_extra":"Tiangong Kaiwu technology encyclopedia, open book with farming and handicraft illustrations, tools and machines drawings"},

    # 地点 (4)
    {"seq":29, "type_code":"L", "type":"地点", "name":"紫禁城", "level":4, "rarity":"SSR",
     "tags":["明清","宫殿","北京"], "kp":"紫禁城是明清两代的皇家宫殿，世界最大的木结构建筑群。",
     "prompt_extra":"Forbidden City, majestic red walled palace complex with golden roofs stretching to horizon, marble bridges and courtyards, imperial guards, grand Chinese architectural masterpiece"},
    {"seq":30, "type_code":"L", "type":"地点", "name":"颐和园", "level":3, "rarity":"SR",
     "tags":["清朝","园林","北京"], "kp":"颐和园是清代皇家园林，以昆明湖万寿山为核心的园林杰作。",
     "prompt_extra":"Summer Palace, Kunming Lake with Seventeen-Arch Bridge, Longevity Hill with Buddhist pagoda, classical Chinese imperial garden"},
    {"seq":31, "type_code":"L", "type":"地点", "name":"拙政园", "level":2, "rarity":"R",
     "tags":["明朝","园林","苏州"], "kp":"拙政园是苏州园林的代表作，明代文人园林的极致。",
     "prompt_extra":"Humble Administrator's Garden, classical Suzhou garden with lotus pond, elegant pavilions, rock formations, scholar garden atmosphere"},
    {"seq":32, "type_code":"L", "type":"地点", "name":"避暑山庄", "level":2, "rarity":"R",
     "tags":["清朝","行宫","承德"], "kp":"避暑山庄是清代皇帝的夏宫，世界最大的皇家园林。",
     "prompt_extra":"Chengde Mountain Resort, vast imperial summer palace with lakes, grasslands and temples, Mongolian yurts nearby, cool northern landscape"},

    # 额外地点和事件 (扩充至35张)
    {"seq":33, "type_code":"L", "type":"地点", "name":"天坛", "level":2, "rarity":"R",
     "tags":["明朝","祭祀","北京"], "kp":"天坛是明清皇帝祭天的神圣场所，祈年殿为标志建筑。",
     "prompt_extra":"Temple of Heaven, circular Hall of Prayer for Good Harvests with three-tiered blue roof, marble altar, sacred ceremonial atmosphere"},
    {"seq":34, "type_code":"E", "type":"事件", "name":"戊戌变法", "level":2, "rarity":"R",
     "tags":["清朝","改良","百日维新"], "kp":"康有为梁启超主导的戊戌变法仅持续103天被慈禧太后镇压。",
     "prompt_extra":"Hundred Days Reform, young Guangxu Emperor and reform scholars in tense palace meeting, conservative empress dowager overlooking, dramatic political change"},
    {"seq":35, "type_code":"D", "type":"朝代", "name":"大清帝国", "level":5, "rarity":"UR",
     "tags":["清朝","帝国","封建末代"], "kp":"大清帝国是中国最后一个封建王朝，从康乾盛世到鸦片战争的巨变。",
     "prompt_extra":"Qing Empire, golden dragon flag with red sun, Manchurian emperor in dragon robe, Great Wall and Forbidden City silhouette, last dynasty atmosphere"},
])

# ======================== 生成引擎 ========================

def log(msg):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def load_progress():
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed": [], "failed": {}, "current_index": 0, "total": len(ALL_CARDS)}

def save_progress(prog):
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(prog, f, ensure_ascii=False, indent=2)

def check_comfyui():
    """检查 ComfyUI 是否在线"""
    try:
        req = urllib.request.Request(f"{COMFY_URL}/system_stats", method="GET")
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            return True, data.get("system", {}).get("python_version", "unknown")
    except Exception as e:
        return False, str(e)

def queue_prompt(workflow, client_id):
    """向 ComfyUI 提交生成任务"""
    data = json.dumps({"prompt": workflow, "client_id": client_id}).encode()
    req = urllib.request.Request(f"{COMFY_URL}/prompt", data=data)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def get_history(prompt_id):
    """获取任务执行历史和输出"""
    req = urllib.request.Request(f"{COMFY_URL}/history/{prompt_id}")
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def wait_for_completion(prompt_id, timeout=900):
    """等待生成完成，返回输出图片路径列表。
    关键：ComfyUI history 在 prompt 排队时就会创建条目(无outputs)，
    必须等到 outputs 实际出现才能返回。"""
    start = time.time()
    last_log = start
    while time.time() - start < timeout:
        try:
            hist = get_history(prompt_id)
            if prompt_id in hist:
                entry = hist[prompt_id]
                outputs_data = entry.get("outputs", {})
                # 有输出 → 提取图片路径
                if outputs_data:
                    outputs = []
                    for node_id, output in outputs_data.items():
                        for img in output.get("images", []):
                            src = os.path.join(
                                r"C:\Users\Administrator\ComfyUI-Installs\Comfly\ComfyUI\output",
                                img.get("subfolder", ""),
                                img["filename"]
                            )
                            if os.path.exists(src):
                                outputs.append(src)
                    if outputs:
                        return outputs
                # prompt 在队列/执行中，继续等待（不管 status 消息）
            # 每30秒输出等待状态
            if time.time() - last_log > 30:
                elapsed = int(time.time() - start)
                log(f"  ⏳ 等待生成中... (已等待 {elapsed}s/{timeout}s)")
                last_log = time.time()
        except Exception as e:
            if time.time() - last_log > 60:
                elapsed = int(time.time() - start)
                log(f"  ⏳ 网络波动等待中... (已等待 {elapsed}s)")
                last_log = time.time()
        time.sleep(5)
    return []  # 超时

def search_card_knowledge(card):
    """通过网络搜索为卡牌获取辅助知识作为副提示词"""
    # 使用预置知识库 + 提示词扩展
    prompt_extra = card.get("prompt_extra", "")
    
    # 构建完整的正向提示词
    dynasty_tag = DYNASTY_TAGS.get(card["dynasty"], "Chinese historical")
    
    # 类型特定标签
    type_tags = {
        "人物": "solo, 1person, detailed traditional Chinese clothing, historical figure portrait",
        "事件": "historical event scene, multiple figures, dramatic historical moment",
        "兵器": "detailed weapon, displayed object, museum quality, still life, traditional craftsmanship",
        "典籍": "ancient book, scrolls, scholarly objects, still life, ink and paper",
        "地点": "landscape, no humans, ancient Chinese architecture, scenic historical site",
        "朝代": "symbolic imagery, national emblem, abstract historical representation",
    }
    
    type_tag = type_tags.get(card["type"], "")
    
    # 稀有度视觉标签
    rarity_tags = {
        "N": "simple composition, basic quality",
        "R": "good quality, detailed",
        "SR": "great quality, highly detailed, dramatic lighting",
        "SSR": "exceptional quality, masterpiece level, golden light, epic atmosphere",
        "UR": "supreme quality, legendary, divine radiance, ultimate artistry",
    }
    rarity_tag = rarity_tags.get(card["rarity"], "")
    
    # 组装完整正向提示词
    full_positive = (
        f"{QUALITY_TAGS}, "
        f"{dynasty_tag} illustration, "
        f"{card['name']}, {card['type']}, "
        f"{prompt_extra}, "
        f"{type_tag}, "
        f"{rarity_tag}, "
        f"traditional Chinese painting style, (illustration:1.2), "
        f"semi-realistic, year 2018"
    )
    
    return full_positive

def build_workflow(card):
    """为指定卡牌构建 ComfyUI workflow"""
    positive_prompt = search_card_knowledge(card)
    seed = int(time.time() * 1000) % (2**32)
    
    return {
        "1": {"inputs": {"ckpt_name": CKPT_NAME}, "class_type": "CheckpointLoaderSimple"},
        "2": {"inputs": {"text": positive_prompt, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "3": {"inputs": {"text": NEG_PROMPT, "clip": ["1", 1]}, "class_type": "CLIPTextEncode"},
        "4": {"inputs": {"width": WIDTH, "height": HEIGHT, "batch_size": 1}, "class_type": "EmptyLatentImage"},
        "5": {"inputs": {
            "seed": seed, "steps": 25, "cfg": 6.0,
            "sampler_name": "euler", "scheduler": "normal",
            "denoise": 1.0,
            "model": ["1", 0], "positive": ["2", 0], "negative": ["3", 0], "latent_image": ["4", 0]
        }, "class_type": "KSampler"},
        "6": {"inputs": {"samples": ["5", 0], "vae": ["1", 2]}, "class_type": "VAEDecode"},
        "7": {"inputs": {"images": ["6", 0], "filename_prefix": f"batch200/{card['card_id']}"}, "class_type": "SaveImage"}
    }

def generate_card(card, client_id, prog):
    """生成单张卡牌"""
    card_id = card["card_id"]
    
    # 跳过已完成的
    if card_id in prog["completed"]:
        return True
    
    log(f"开始生成: {card_id} {card['name']} ({card['type']}/{card['rarity']}) [进度: {len(prog['completed'])}/{prog['total']}]")
    
    try:
        wf = build_workflow(card)
        result = queue_prompt(wf, client_id)
        prompt_id = result.get("prompt_id", "")
        
        if not prompt_id:
            log(f"  ❌ {card_id} 提交失败: 无 prompt_id")
            prog["failed"][card_id] = prog["failed"].get(card_id, 0) + 1
            return False
        
        log(f"  📤 {card_id} 已提交, prompt_id={prompt_id}")
        
        # 等待完成
        outputs = wait_for_completion(prompt_id, timeout=900)
        
        if outputs:
            # 复制到输出目录
            dst = ORIGINALS_DIR / f"{card_id}.png"
            os.makedirs(ORIGINALS_DIR, exist_ok=True)
            try:
                shutil.copy2(outputs[0], dst)
                log(f"  ✅ {card_id} 生成成功 -> {dst}")
                prog["completed"].append(card_id)
                if card_id in prog["failed"]:
                    del prog["failed"][card_id]
                return True
            except Exception as e:
                log(f"  ⚠️ {card_id} 复制失败: {e}")
                prog["failed"][card_id] = prog["failed"].get(card_id, 0) + 1
                return False
        else:
            log(f"  ⏰ {card_id} 生成超时")
            prog["failed"][card_id] = prog["failed"].get(card_id, 0) + 1
            return False
    except Exception as e:
        log(f"  ❌ {card_id} 异常: {e}")
        prog["failed"][card_id] = prog["failed"].get(card_id, 0) + 1
        return False

def wait_for_comfyui_ready(max_wait=120):
    """等待 ComfyUI 就绪"""
    log("等待 ComfyUI 就绪...")
    for i in range(max_wait):
        ok, info = check_comfyui()
        if ok:
            log(f"ComfyUI 已就绪 (Python {info})")
            return True
        time.sleep(2)
    log("ComfyUI 启动超时!")
    return False

def main():
    os.makedirs(ORIGINALS_DIR, exist_ok=True)
    os.makedirs(MODEL_TESTS_DIR, exist_ok=True)
    
    log(f"=" * 60)
    log(f"国风炼金卡牌 · 批量生成 200 张 v2（含失败重试）")
    log(f"总卡牌数: {len(ALL_CARDS)}")
    log(f"输出目录: {ORIGINALS_DIR}")
    log(f"=" * 60)
    
    # 等待 ComfyUI
    if not wait_for_comfyui_ready():
        log("❌ ComfyUI 未就绪，退出")
        return
    
    # 加载进度
    prog = load_progress()
    prog["total"] = len(ALL_CARDS)
    client_id = f"batch200-{uuid.uuid4().hex[:8]}"
    
    log(f"客户端ID: {client_id}")
    log(f"已完成: {len(prog['completed'])}, 失败: {len(prog['failed'].get('pending_retry',[]))}, 待处理: {prog['total'] - len(prog['completed'])}")
    
    # 构建待处理列表（跳过已完成的，包含失败需重试的）
    MAX_RETRIES = 3
    
    def get_pending_cards():
        """获取待处理的卡牌列表：未完成 + 失败但可重试的"""
        pending = []
        for card in ALL_CARDS:
            cid = card["card_id"]
            if cid in prog["completed"]:
                continue
            retry_count = prog["failed"].get(cid, 0)
            if retry_count >= MAX_RETRIES:
                continue  # 超过重试次数，跳过
            pending.append(card)
        return pending
    
    # 主循环：反复处理直到全部完成或无法继续
    round_num = 0
    while True:
        round_num += 1
        pending = get_pending_cards()
        
        if not pending:
            log(f"🎉 所有卡牌处理完毕!")
            break
        
        log(f"\n{'='*50}")
        log(f"🔄 第 {round_num} 轮 — 待处理: {len(pending)} 张")
        log(f"{'='*50}")
        
        consecutive_errors = 0
        for idx, card in enumerate(pending):
            cid = card["card_id"]
            retry_count = prog["failed"].get(cid, 0)
            
            if retry_count > 0:
                log(f"  🔄 重试 ({retry_count}/{MAX_RETRIES}): {cid} {card['name']}")
            
            save_progress(prog)
            success = generate_card(card, client_id, prog)
            
            if success:
                consecutive_errors = 0
            else:
                consecutive_errors += 1
                if consecutive_errors >= 3:
                    log(f"⚠️ 连续失败 {consecutive_errors} 次，检查 ComfyUI 状态...")
                    ok, info = check_comfyui()
                    if not ok:
                        log(f"❌ ComfyUI 掉线: {info}")
                        log("尝试重新连接...")
                        if wait_for_comfyui_ready(max_wait=300):
                            consecutive_errors = 0
                            log("✅ ComfyUI 重连成功")
                        else:
                            log("❌ 重连失败，保存进度退出")
                            save_progress(prog)
                            return
                    else:
                        log(f"ComfyUI 在线，继续...")
            
            time.sleep(2)
        
        # 检查是否有卡牌本轮全部失败
        remaining = get_pending_cards()
        if len(remaining) == len(pending) and round_num > 1:
            log(f"⚠️ 本轮无新进展，可能卡住了。稍等后继续...")
            time.sleep(30)
    
    # 最终保存
    save_progress(prog)
    
    # 统计
    final_pending = get_pending_cards()
    log(f"=" * 60)
    log(f"批量生成结束!")
    log(f"✅ 成功: {len(prog['completed'])}/{prog['total']}")
    log(f"❌ 最终失败: {len(final_pending)}")
    if final_pending:
        log(f"失败列表: {[c['card_id'] + ' ' + c['name'] for c in final_pending]}")
    log(f"=" * 60)

if __name__ == "__main__":
    main()

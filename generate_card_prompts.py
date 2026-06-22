"""
国风炼金 · 卡牌提示词预生成工具
为 100 张卡牌计算结构化主提示词 & 副提示词，输出到 config/card_prompts_100.json
运行: python generate_card_prompts.py
"""
import json
import os

BASE = os.path.dirname(os.path.abspath(__file__))

# ═══════════════════════════════════════════
# 提示词构建器（与 card_server.py 保持一致）
# ═══════════════════════════════════════════

NEG_BASE = (
    "lowres, bad anatomy, bad hands, text, error, missing fingers, "
    "extra digits, fewer digits, cropped, worst quality, low quality, "
    "normal quality, jpeg artifacts, signature, watermark, username, "
    "blurry, 3d, realistic, photorealistic, photo, "
    "western, european, caucasian, knight, crusader, blonde, "
    "modern, gun, xianxia, fantasy magic, deformed, "
    "anime, chibi, cartoon, nsfw, nude"
)
NEG_ANTI_FEM = (
    "female, woman, girl, 1girl, feminine, effeminate, "
    "soft face, pretty boy, bishounen, androgynous, "
    "makeup, lipstick, blush, eyeliner, groomed eyebrows, "
    "delicate features, cute, kawaii, moe, waifu, "
    "slender, slim, narrow shoulders, cross-dressing, trap"
)
NEG_ANTI_MASC = (
    "masculine, manly, rugged, muscular, beard, facial hair, "
    "bodybuilder, hulk, testosterone, male"
)
NEG_NO_FIGURE = (
    "1girl, 1boy, solo, character focus, portrait, close-up, "
    "anime girl, waifu, person, people, crowd, face, looking at viewer"
)

ERAS = {"QH":"秦汉","SG":"三国","LJ":"两晋南北朝","ST":"隋唐","SY":"宋元","MQ":"明清"}
ERA_VISUALS = {
    "QH": "black Qin dynasty robes and bronze lamellar armor, Great Wall silhouette, terracotta warriors, Qin imperial solemnity, bronze and black color palette",
    "SG": "Three Kingdoms warring chaos, red cliff bluffs, ancient Chinese battlefields, heroic warriors in colorful armor, Han dynasty military banners",
    "LJ": "flowing Wei-Jin robes, bamboo groves, calligraphy and poetry, Buddhist grotto art, Six Dynasties refined elegance, ink painting aesthetics",
    "ST": "Tang dynasty golden age, Chang'an cosmopolitan markets, silk road caravans, peony flowers, grand palace halls, tri-color glazed pottery",
    "SY": "Song dynasty refined aesthetics, ink wash landscape painting, celadon porcelain, bustling canal cities, scholar-garden pavilions",
    "MQ": "Ming-Qing imperial grandeur, Forbidden City vermilion walls and golden roofs, dragon and phoenix motifs, blue-and-white porcelain, elaborate court robes"
}

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

def detect_gender(name, tags, kp):
    if name in FEMALE_NAMES: return "female"
    if name in MALE_NAMES: return "male"
    combined = name + " " + " ".join(tags) + " " + (kp or "")
    f_kw = ["女","皇后","妃","姬","公主","美人","夫人","后","贵妃","太后","才女","女皇"]
    m_kw = ["男","帝","帝王","皇帝","王","将","帅","臣","子","皇","宗","祖","圣","霸","君","侯","相"]
    f_score = sum(1 for w in f_kw if w in combined)
    m_score = sum(1 for w in m_kw if w in combined)
    if "武则天" in name or "女皇" in combined or "女帝" in combined: return "female"
    return "male" if m_score >= f_score else "female"

QUALITY = "masterpiece, best quality, high score, great score, absurdres"

def build_person_prompt(card):
    name, era_cn, era_visual, kp, tags = card["name"], ERAS[card["era"]], ERA_VISUALS[card["era"]], card.get("kp",""), card.get("tags",[])
    gender = detect_gender(name, tags, kp)
    if gender == "female":
        persona = f"dignified East Asian woman, classical Chinese beauty, elegant refined facial features, authentic {era_cn} dynasty appearance, wearing elaborate traditional {era_cn} hanfu robes with period-correct patterns, ornate historical Chinese hair ornaments and jewelry, graceful poised posture, historical figure portrait"
        neg_add = NEG_ANTI_MASC
    else:
        persona = f"masculine rugged East Asian man, strong angular jaw, piercing intense dark eyes, short black beard or mustache, weathered mature masculine face, broad shoulders, powerful commanding stance, wearing period-correct {era_cn} dynasty robes or historical Chinese armor, dignified historical figure, authentic {era_cn} appearance"
        neg_add = NEG_ANTI_FEM
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    pos = f"{QUALITY}, Chinese historical figure {name}, {era_cn} dynasty, {persona}, {'Context: ' + tag_ctx + ', ' if tag_ctx else ''}historical background: {era_visual}, semi-realistic Chinese historical portrait illustration, ancient Chinese scroll painting aesthetic with ink and mineral pigment texture, vertical composition, historical accuracy, museum-quality artwork, solemn dignified atmosphere, no modern elements"
    neg = NEG_BASE + ", " + neg_add
    return pos, neg

def build_place_prompt(card):
    name, era_cn, era_visual, kp, tags = card["name"], ERAS[card["era"]], ERA_VISUALS[card["era"]], card.get("kp",""), card.get("tags",[])
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    arch = "architecture and landscape" if any(w in (tag_ctx + name) for w in ["宫殿","城","关","陵","寺","塔","宫"]) else "landscape scenery"
    pos = f"{QUALITY}, Chinese historical site {name}, {era_cn} dynasty, ancient Chinese {arch}, {tag_ctx}, {kp[:150]}, historical atmosphere: {era_visual}, traditional Chinese ink wash landscape painting aesthetic, semi-realistic Chinese historical illustration, vertical composition, atmospheric lighting, no people in foreground, museum-quality historical artwork"
    neg = NEG_BASE + ", " + NEG_NO_FIGURE
    return pos, neg

def build_event_prompt(card):
    name, era_cn, era_visual, kp, tags = card["name"], ERAS[card["era"]], ERA_VISUALS[card["era"]], card.get("kp",""), card.get("tags",[])
    tag_ctx = ", ".join(tags[:4]) if tags else ""
    pos = f"{QUALITY}, Chinese historical event: {name}, {era_cn} dynasty, dramatic historical scene depicting {kp[:150]}, key elements: {tag_ctx}, historical atmosphere: {era_visual}, epic Chinese historical painting, semi-realistic illustration, ancient Chinese scroll painting composition, vertical format, dramatic lighting and atmosphere, historical accuracy, museum-quality epic artwork"
    neg = NEG_BASE + ", " + NEG_NO_FIGURE
    return pos, neg

def build_weapon_prompt(card):
    name, era_cn, kp, tags = card["name"], ERAS[card["era"]], card.get("kp",""), card.get("tags",[])
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    pos = f"{QUALITY}, ancient Chinese weapon: {name}, {era_cn} dynasty, {kp[:120]}, detailed craftsmanship: {tag_ctx}, materials: forged steel, bronze fittings, wood shaft, displayed on dark silk background with dramatic museum lighting, artifact photography style, semi-realistic illustration, vertical composition, historical accuracy, museum-quality artifact presentation"
    neg = NEG_BASE + ", " + NEG_NO_FIGURE
    return pos, neg

def build_book_prompt(card):
    name, era_cn, kp, tags = card["name"], ERAS[card["era"]], card.get("kp",""), card.get("tags",[])
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    pos = f"{QUALITY}, ancient Chinese classic text: {name}, {era_cn} dynasty, {kp[:120]}, displayed as ancient Chinese bound book or scroll on dark wooden desk, with ink brush, inkstone, and candlelight, scholarly study atmosphere, {tag_ctx}, traditional Chinese literati aesthetic, semi-realistic illustration, vertical composition, warm atmospheric lighting, museum-quality artifact presentation"
    neg = NEG_BASE + ", " + NEG_NO_FIGURE
    return pos, neg

def build_dynasty_prompt(card):
    name, era_cn, era_visual, kp, tags = card["name"], ERAS[card["era"]], ERA_VISUALS[card["era"]], card.get("kp",""), card.get("tags",[])
    tag_ctx = ", ".join(tags[:3]) if tags else ""
    pos = f"{QUALITY}, Chinese imperial dynasty symbol: {name}, {kp[:120]}, iconic elements: {tag_ctx}, visual aesthetic: {era_visual}, grand imperial scale, majestic atmosphere, semi-realistic Chinese historical painting, vertical composition, golden age imperial splendor, museum-quality epic artwork"
    neg = NEG_BASE + ", " + NEG_NO_FIGURE
    return pos, neg

BUILDERS = {
    "人物": build_person_prompt, "地点": build_place_prompt,
    "事件": build_event_prompt, "兵器": build_weapon_prompt,
    "典籍": build_book_prompt, "朝代": build_dynasty_prompt,
}

# ═══════════════════════════════════════════
# 100 张卡牌定义（策划案 v2.0 规格）
# ═══════════════════════════════════════════

CARDS = []

def add(era, type_code, seq, name, card_type, level, rarity, tags, kp, prompt_extra=""):
    card_id = f"{era}-{type_code}-{seq:04d}-L{level:02d}"
    CARDS.append({
        "card_id": card_id, "era": era, "name": name, "type": card_type,
        "level": level, "rarity": rarity, "tags": tags, "kp": kp,
        "prompt_extra": prompt_extra
    })

# ── 秦汉 QH (35张) ──
add("QH","P",1,"秦始皇","人物",5,"UR",["帝王","秦朝","统一","长城"],"秦始皇嬴政，中国历史上第一位皇帝，统一六国，建立中央集权制度。")
add("QH","P",2,"刘邦","人物",4,"SSR",["帝王","汉朝","开国","布衣"],"汉高祖刘邦，出身布衣，秦末起义建立汉朝。")
add("QH","P",3,"项羽","人物",4,"SSR",["霸王","西楚","武力","悲剧"],"西楚霸王项羽，力能扛鼎的绝世猛将，楚汉之争的核心人物。")
add("QH","P",4,"张良","人物",3,"SR",["谋士","运筹帷幄","汉初三杰"],"张良，汉初三杰之一，运筹帷幄之中决胜千里之外的顶级谋士。")
add("QH","P",5,"韩信","人物",3,"SR",["兵仙","统帅","汉初三杰"],"韩信，汉初三杰之一，被后世尊为兵仙，暗度陈仓灭三秦。")
add("QH","P",6,"萧何","人物",2,"R",["丞相","后勤","汉初三杰"],"萧何，汉初三杰之一，丞相之首，刘邦的后勤总管家。")
add("QH","P",7,"吕雉","人物",3,"SR",["皇后","女政治家","吕后"],"吕雉，刘邦之妻，中国历史上第一位临朝称制的女性统治者。")
add("QH","P",8,"蒙恬","人物",2,"R",["名将","长城","秦朝"],"蒙恬，秦朝名将，率三十万大军北击匈奴，修筑万里长城。")
add("QH","P",9,"扶苏","人物",2,"R",["公子","仁德","悲剧"],"扶苏，秦始皇长子，仁德宽厚，因赵高篡改遗诏而被迫自尽。")
add("QH","P",10,"赵高","人物",1,"N",["宦官","权臣","反派"],"赵高，秦朝宦官，秦始皇死后篡改遗诏扶立胡亥，加速秦朝灭亡。")
add("QH","P",11,"范增","人物",2,"R",["谋士","亚父","楚汉"],"范增，项羽首席谋士，被尊为亚父，鸿门宴力主杀刘邦未果。")
add("QH","P",12,"虞姬","人物",2,"R",["美人","楚汉","爱情"],"虞姬，项羽宠姬，垓下之围时自刎殉情，与霸王演绎千古爱情悲剧。")
add("QH","P",13,"樊哙","人物",2,"R",["猛将","鸿门宴","忠勇"],"樊哙，刘邦爱将，鸿门宴上直面项羽护主脱险的勇猛武将。")
add("QH","P",14,"章邯","人物",2,"R",["秦将","降将","名将"],"章邯，秦末最后一位名将，先败于项羽后降楚，最终兵败自杀。")
add("QH","E",15,"焚书坑儒","事件",2,"R",["秦朝","文化","争议"],"秦始皇为统一思想，焚烧儒家经典坑杀儒生的重大历史事件。")
add("QH","E",16,"大泽乡起义","事件",2,"R",["起义","陈胜","秦末"],"陈胜吴广在大泽乡揭竿而起，打响秦末农民起义第一枪。")
add("QH","E",17,"鸿门宴","事件",3,"SR",["楚汉","宴会","刺杀"],"项羽设宴鸿门欲杀刘邦，刘邦在张良樊哙帮助下化险为夷。")
add("QH","E",18,"暗度陈仓","事件",2,"R",["楚汉","韩信","战略"],"韩信明修栈道暗度陈仓，出其不意还定三秦的经典战例。")
add("QH","E",19,"垓下之围","事件",3,"SR",["楚汉","决战","四面楚歌"],"垓下之战项羽被刘邦大军包围，四面楚歌，霸王别姬。")
add("QH","E",20,"约法三章","事件",1,"N",["刘邦","关中","法度"],"刘邦入关中后与百姓约法三章，废除秦朝苛法赢得民心。")
add("QH","E",21,"韩信点兵","事件",2,"R",["韩信","兵法","多多益善"],"刘邦问韩信能带多少兵，韩信答多多益善的著名典故。")
add("QH","E",22,"指鹿为马","事件",1,"N",["赵高","秦朝","阴谋"],"赵高在朝堂上指鹿为马试探大臣立场，铲除异己的著名典故。")
add("QH","E",23,"萧何月下追韩信","事件",2,"R",["人才","楚汉","知遇之恩"],"韩信因不受重用离开汉营，萧何连夜追赶劝回，成就汉家天下。")
add("QH","W",24,"秦弩","兵器",1,"N",["秦朝","远程","军工"],"秦弩是秦军制式远程武器，标准化生产使秦军战力碾压六国。")
add("QH","W",25,"天子剑","兵器",3,"SR",["帝王","宝剑","象征"],"天子剑象征皇权至高无上，秦始皇佩剑为太阿剑的传说。")
add("QH","W",26,"项羽戟","兵器",2,"R",["霸王","兵器","勇武"],"项羽善使长戟，据说其戟重达百斤，万夫不当之勇。")
add("QH","W",27,"秦剑","兵器",1,"N",["秦朝","冷兵器","标准化"],"秦剑是秦军标准化冷兵器的代表，比六国长剑更长更锋利。")
add("QH","B",28,"秦律","典籍",2,"R",["法律","秦朝","法家"],"秦律是秦朝以法家思想制定的严密法律体系，影响中国两千年法制。")
add("QH","B",29,"九章算术","典籍",3,"SR",["数学","汉代","科学"],"九章算术是汉代最终成书的中国古代最重要的数学经典。")
add("QH","B",30,"黄帝内经","典籍",3,"SR",["医学","养生","中医经典"],"黄帝内经是汉代编定的中医理论奠基之作，阴阳五行医学体系。")
add("QH","L",31,"阿房宫","地点",2,"R",["宫殿","秦朝","奢华"],"阿房宫是秦始皇修建的超级宫殿，覆压三百余里隔离天日。")
add("QH","L",32,"未央宫","地点",2,"R",["宫殿","汉朝","长安"],"未央宫是西汉王朝的大朝正殿，中国历史上最著名的宫殿之一。")
add("QH","L",33,"龙门石窟","地点",3,"SR",["佛教","石刻","艺术"],"龙门石窟始建于北魏，秦汉之后的佛教艺术宝库。")
add("QH","L",34,"祁连山","地点",2,"R",["山脉","匈奴","汉匈战争"],"祁连山是汉匈战争的战略要地，霍去病在此大破匈奴。")
add("QH","D",35,"大秦帝国","朝代",5,"UR",["秦朝","帝国","统一"],"大秦帝国是中国历史上第一个大一统王朝，奠定了中国两千年帝制基础。")

# ── 三国 SG (34张) ──
add("SG","P",1,"诸葛亮","人物",5,"UR",["蜀汉","丞相","智慧","传奇"],"诸葛亮，三国蜀汉丞相，鞠躬尽瘁死而后已的千古名相。")
add("SG","P",2,"关羽","人物",4,"SSR",["蜀汉","五虎将","忠义","武圣"],"关羽，蜀汉五虎将之首，被后世尊为武圣关帝，忠义化身。")
add("SG","P",3,"曹操","人物",4,"SSR",["魏","枭雄","权臣","诗人"],"曹操，三国曹魏奠基人，挟天子以令诸侯的乱世枭雄。")
add("SG","P",4,"刘备","人物",3,"SR",["蜀汉","仁君","织席贩履"],"刘备，蜀汉开国皇帝，以仁德立身，桃园三结义的带头大哥。")
add("SG","P",5,"赵云","人物",3,"SR",["蜀汉","五虎将","长坂坡","银枪"],"赵云，蜀汉五虎将，长坂坡七进七出救阿斗的常胜将军。")
add("SG","P",6,"周瑜","人物",3,"SR",["东吴","都督","赤壁","儒将"],"周瑜，东吴大都督，赤壁之战中以少胜多火烧曹营的美周郎。")
add("SG","P",7,"吕布","人物",3,"SR",["猛将","方天画戟","赤兔马"],"吕布，三国第一猛将，人中吕布马中赤兔的飞将。")
add("SG","P",8,"孙权","人物",3,"SR",["东吴","帝王","紫髯碧眼"],"孙权，东吴开国皇帝，继承父兄基业坐断东南的守成之主。")
add("SG","P",9,"司马懿","人物",3,"SR",["魏","权臣","隐忍","篡魏"],"司马懿，三国曹魏权臣，隐忍数十载终为晋朝奠基。")
add("SG","P",10,"典韦","人物",2,"R",["魏","猛将","宛城之战"],"典韦，曹操帐下第一猛将，宛城之战中为保曹操脱逃力战而死。")
add("SG","P",11,"黄忠","人物",2,"R",["蜀汉","五虎将","老当益壮"],"黄忠，蜀汉五虎将中最年长者，老当益壮箭术无双。")
add("SG","P",12,"陆逊","人物",2,"R",["东吴","儒将","夷陵之战"],"陆逊，东吴大都督，夷陵之战中火烧连营大败刘备的年轻儒将。")
add("SG","P",13,"董卓","人物",1,"N",["军阀","残暴","乱世"],"董卓，东汉末年权臣，废少帝立献帝的残暴军阀。")
add("SG","P",14,"貂蝉","人物",2,"R",["美人","连环计","三国"],"貂蝉，三国第一美人，王允以连环计离间董卓吕布的绝色女子。")
add("SG","E",15,"桃园三结义","事件",2,"R",["蜀汉","结义","兄弟情"],"刘备关羽张飞在桃园结为异姓兄弟，不求同生但求同死。")
add("SG","E",16,"草船借箭","事件",2,"R",["赤壁","诸葛","谋略"],"诸葛亮利用大雾以草船诱使曹操放箭，一夜之间借到十万支箭。")
add("SG","E",17,"空城计","事件",3,"SR",["诸葛","司马懿","西城"],"诸葛亮以空城计退司马懿大军，一人抚琴城楼吓退数万雄兵。")
add("SG","E",18,"赤壁之战","事件",4,"SSR",["三国","火攻","周瑜","东风"],"赤壁之战孙刘联军火烧曹船，奠定三国鼎立格局的决定性战役。")
add("SG","E",19,"七擒孟获","事件",2,"R",["蜀汉","诸葛","南征"],"诸葛亮七次擒获南中首领孟获七次释放，以攻心为上平定南中。")
add("SG","E",20,"水淹七军","事件",2,"R",["关羽","荆州","于禁"],"关羽利用汉水暴涨水淹于禁七军，威震华夏的经典战术。")
add("SG","E",21,"六出祁山","事件",3,"SR",["北伐","诸葛","蜀汉"],"诸葛亮六次北伐中原，出祁山伐曹魏直到五丈原星落。")
add("SG","E",22,"青梅煮酒论英雄","事件",1,"N",["曹操","刘备","双雄"],"曹操与刘备在许昌梅园煮酒论英雄的经典对话场景。")
add("SG","W",23,"青龙偃月刀","兵器",3,"SR",["关羽","兵器","传奇"],"青龙偃月刀是关羽的标志性兵器，重八十二斤的冷艳锯。")
add("SG","W",24,"丈八蛇矛","兵器",2,"R",["张飞","兵器","丈八"],"丈八蛇矛是张飞的标志性兵器，矛身如蛇形弯曲丈八其长。")
add("SG","W",25,"方天画戟","兵器",2,"R",["吕布","兵器","方天"],"方天画戟是吕布的专属兵器，两侧月牙刃的华丽长戟。")
add("SG","W",26,"诸葛连弩","兵器",2,"R",["诸葛亮","发明","远程"],"诸葛亮改良的连弩可连续发射十支箭矢，蜀汉军事科技代表。")
add("SG","B",27,"出师表","典籍",3,"SR",["诸葛亮","文学","忠义"],"出师表是诸葛亮北伐前写给后主刘禅的奏表，千古忠臣之绝唱。")
add("SG","B",28,"伤寒杂病论","典籍",3,"SR",["医学","张仲景","医圣"],"伤寒杂病论是东汉张仲景所著，中医临床医学奠基之作。")
add("SG","B",29,"隆中对","典籍",2,"R",["策略","刘备","诸葛"],"诸葛亮在隆中对中为刘备规划三分天下的战略蓝图。")
add("SG","L",30,"五丈原","地点",2,"R",["诸葛亮","北伐","落星"],"五丈原是诸葛亮第六次北伐病逝之地，出师未捷身先死。")
add("SG","L",31,"长坂坡","地点",2,"R",["赵云","战场","当阳"],"长坂坡是赵云单骑救阿斗血战曹军的传奇战场。")
add("SG","L",32,"白帝城","地点",2,"R",["刘备","托孤","蜀汉"],"白帝城是刘备夷陵之败后病逝托孤诸葛亮的历史遗址。")
add("SG","L",33,"定军山","地点",1,"N",["蜀汉","战场","黄忠"],"定军山是黄忠斩杀夏侯渊之地，蜀汉北伐的重要战略据点。")
add("SG","D",34,"三国鼎立","朝代",5,"UR",["三国","对峙","历史格局"],"三国鼎立是魏蜀吴三分天下的历史格局，中国历史上最著名的分裂时期。")

# ── 两晋 LJ (31张) ──
add("LJ","P",1,"王羲之","人物",4,"SSR",["书法","东晋","书圣","兰亭"],"王羲之，东晋书圣，兰亭序被誉为天下第一行书。")
add("LJ","P",2,"谢安","人物",3,"SR",["东晋","宰相","淝水之战"],"谢安，东晋名相，淝水之战中以少胜多的战略大师。")
add("LJ","P",3,"陶渊明","人物",3,"SR",["诗人","隐士","田园","魏晋"],"陶渊明，东晋田园诗人，不为五斗米折腰的隐逸之宗。")
add("LJ","P",4,"祖逖","人物",2,"R",["东晋","北伐","闻鸡起舞"],"祖逖，东晋北伐名将，闻鸡起舞志复中原的爱国英雄。")
add("LJ","P",5,"顾恺之","人物",2,"R",["绘画","东晋","艺术"],"顾恺之，东晋画圣，以洛神赋图等传世名作代表六朝艺术高峰。")
add("LJ","P",6,"嵇康","人物",3,"SR",["竹林七贤","琴艺","傲骨"],"嵇康，竹林七贤之首，广陵散绝响于刑场的不屈文人。")
add("LJ","P",7,"花木兰","人物",3,"SR",["女英雄","北魏","代父从军"],"花木兰，北魏时期代父从军的传奇女英雄，巾帼不让须眉。")
add("LJ","P",8,"阮籍","人物",2,"R",["竹林七贤","诗人","旷达"],"阮籍，竹林七贤之一，以青白眼表达好恶的不羁诗人。")
add("LJ","P",9,"苻坚","人物",2,"R",["前秦","帝王","淝水之战"],"苻坚，前秦皇帝，统一北方后在淝水之战中惨败的前秦雄主。")
add("LJ","P",10,"谢道韫","人物",2,"R",["才女","东晋","咏絮之才"],"谢道韫，东晋才女，咏絮之才形容女子的文学天赋。")
add("LJ","P",11,"刘裕","人物",3,"SR",["南朝宋","开国","寒门"],"刘裕，南朝宋开国皇帝，出身寒门的气吞万里如虎的雄主。")
add("LJ","P",12,"潘岳","人物",1,"N",["美男子","西晋","文采"],"潘岳，西晋美男子与文学家，掷果盈车的古代第一美男。")
add("LJ","P",13,"贾思勰","人物",2,"R",["农学家","北朝","齐民要术"],"贾思勰，北朝农学家，著齐民要术是中国现存最早的完整农书。")
add("LJ","P",14,"石勒","人物",1,"N",["后赵","羯族","奴隶皇帝"],"石勒，后赵开国皇帝，从奴隶到皇帝的传奇羯族首领。")
add("LJ","E",15,"淝水之战","事件",3,"SR",["东晋","前秦","以少胜多"],"淝水之战东晋以八万北府兵大破前秦八十万大军。")
add("LJ","E",16,"永嘉之乱","事件",2,"R",["西晋","匈奴","亡国"],"永嘉之乱匈奴攻破洛阳掳走晋怀帝，西晋走向灭亡。")
add("LJ","E",17,"闻鸡起舞","事件",1,"N",["祖逖","勤奋","成语"],"祖逖与刘琨闻鸡鸣即起练剑，立志收复中原的励志典故。")
add("LJ","E",18,"衣冠南渡","事件",2,"R",["东晋","移民","文化传承"],"西晋灭亡后中原士族南迁江南，中国文化中心首次大规模南移。")
add("LJ","E",19,"八王之乱","事件",1,"N",["西晋","内乱","宗室"],"西晋八位宗王为争夺皇位进行的十六年内乱，严重削弱了西晋国力。")
add("LJ","E",20,"孝文帝改革","事件",2,"R",["北魏","汉化","改革"],"北魏孝文帝迁都洛阳推行全面汉化改革，促进民族融合。")
add("LJ","E",21,"侯景之乱","事件",1,"N",["南朝","梁","叛将"],"侯景之乱摧毁了南朝梁的繁荣，建康城从百万人口降至废墟。")
add("LJ","W",22,"北府矛","兵器",1,"N",["东晋","北府兵","长兵器"],"北府矛是东晋精锐北府兵的制式长矛，在淝水之战中威震天下。")
add("LJ","W",23,"环首刀","兵器",1,"N",["汉末","直刀","冷兵器"],"环首刀是汉末至南北朝时期最普遍的实战直刀。")
add("LJ","W",24,"马镫","兵器",2,"R",["骑兵","南北朝","军事革命"],"马镫的发明使骑兵真正成为战场主力，改变了世界军事格局。")
add("LJ","W",25,"明光铠","兵器",2,"R",["南北朝","铠甲","铁甲"],"明光铠是南北朝时期最精良的铁质铠甲，胸甲如镜反光。")
add("LJ","B",26,"齐民要术","典籍",2,"R",["农学","北朝","实用"],"齐民要术是贾思勰所著中国现存最早的完整农业百科全书。")
add("LJ","B",27,"世说新语","典籍",2,"R",["南朝","笔记","魏晋风度"],"世说新语记录魏晋名士言行轶事，是了解魏晋风度的重要文献。")
add("LJ","B",28,"水经注","典籍",3,"SR",["地理","北魏","郦道元"],"水经注是郦道元著的中国古代最全面的水文地理巨著。")
add("LJ","L",29,"兰亭","地点",2,"R",["东晋","书法","绍兴"],"兰亭是王羲之举办兰亭雅集书写兰亭序的千古文化圣地。")
add("LJ","L",30,"云冈石窟","地点",3,"SR",["北魏","佛教","大同"],"云冈石窟是北魏皇家开凿的佛教石窟艺术宝库。")
add("LJ","L",31,"洛阳城","地点",2,"R",["都城","北魏","汉魏"],"洛阳是汉魏至北魏多朝都城，白马寺和永宁寺塔的所在地。")

# ═══════════════════════════════════════════
# 生成提示词 & 输出 JSON
# ═══════════════════════════════════════════

CN_NUMS = {1:"壹",2:"贰",3:"叁",4:"肆",5:"伍",6:"陆",7:"柒",8:"捌",9:"玖",10:"拾",11:"拾壹",12:"拾贰"}

def generate():
    results = []
    for c in CARDS:
        builder = BUILDERS.get(c["type"])
        if builder:
            pos, neg = builder(c)
        else:
            pos = f"masterpiece, best quality, {c['name']}, {ERAS[c['era']]} era Chinese historical illustration, {c.get('kp','')[:120]}, semi-realistic Chinese historical art, vertical composition"
            neg = NEG_BASE + ", " + NEG_NO_FIGURE
        
        results.append({
            "card_id": c["card_id"],
            "era": c["era"],
            "name": c["name"],
            "type": c["type"],
            "rarity": c["rarity"],
            "level": c["level"],
            "level_cn": CN_NUMS.get(c["level"], str(c["level"])),
            "knowledge": c["kp"],
            "tags": c["tags"],
            "prompt_positive": pos,
            "prompt_negative": neg,
            "framed": False,
            "framed_path": None,
            "thumb": None,
        })
    
    out_path = os.path.join(BASE, "config", "card_prompts_100.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 已生成 {len(results)} 张卡牌的提示词 → {out_path}")
    
    # 统计各类型数量
    from collections import Counter
    type_counts = Counter(r["type"] for r in results)
    era_counts = Counter(r["era"] for r in results)
    print(f"   类型分布: {dict(type_counts)}")
    print(f"   板块分布: {dict(era_counts)}")
    
    # 打印前3张卡牌的提示词样本
    print("\n── 样本预览（前3张）──")
    for r in results[:3]:
        print(f"\n📋 {r['card_id']} {r['name']} ({r['type']} Lv{r['level']})")
        print(f"   主提示词: {r['prompt_positive'][:200]}...")
        print(f"   副提示词: {r['prompt_negative'][:150]}...")

if __name__ == "__main__":
    generate()

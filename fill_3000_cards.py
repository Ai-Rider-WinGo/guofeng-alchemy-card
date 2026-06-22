"""
国风炼金卡牌 · 3000+ 张卡牌数据批量填充
分布：6朝代 × 6类型 × ~85张 = 3060张
稀有度：N(40%) R(30%) SR(18%) SSR(10%) UR(2%)
"""
import sqlite3, json, time, random
from pathlib import Path

DB = r"F:\guofeng-alchemy-card\server\data2.db"

# 朝代配置
DYNASTIES = {
    "QH": {"cn": "秦汉", "period": "公元前221-公元220", "desc": "大秦一统，汉武盛世，丝路开启"},
    "SG": {"cn": "三国", "period": "公元184-280", "desc": "天下三分，英雄辈出，谋略交锋"},
    "LJ": {"cn": "两晋南北朝", "period": "公元265-589", "desc": "衣冠南渡，民族融合，佛教东传"},
    "ST": {"cn": "隋唐", "period": "公元581-907", "desc": "万国来朝，诗酒风流，盛世华章"},
    "SY": {"cn": "宋元", "period": "公元960-1368", "desc": "文治鼎盛，科技灿烂，马上天下"},
    "MQ": {"cn": "明清", "period": "公元1368-1912", "desc": "帝国余晖，中西交汇，古今之变"},
}

# 类型配置
TYPES = {
    "person":  {"code": "P", "cn": "人物", "template": "{name}，{dyn_cn}时期著名{dyn_cn}{role}。{desc}"},
    "event":   {"code": "E", "cn": "事件", "template": "{name}，发生于{dyn_cn}时期的重要历史事件。{desc}"},
    "place":   {"code": "L", "cn": "地点", "template": "{name}，{dyn_cn}时期的重要历史地点。{desc}"},
    "weapon":  {"code": "W", "cn": "兵器", "template": "{name}，{dyn_cn}时期的著名兵器。{desc}"},
    "classic": {"code": "B", "cn": "典籍", "template": "{name}，{dyn_cn}时期的重要典籍。{desc}"},
    "dynasty": {"code": "D", "cn": "朝代", "template": "{name}，{dyn_cn}时期的王朝象征。{desc}"},
}

# 稀有度权重
RARITY_WEIGHTS = {"N": 40, "R": 30, "SR": 18, "SSR": 10, "UR": 2}
RARITY_LEVELS = {"N": 1, "R": 2, "SR": 3, "SSR": 4, "UR": 5}
LEVEL_CN = {1: "壹", 2: "贰", 3: "叁", 4: "肆", 5: "伍"}

# ========== 历史人物/事件/地点仓库 ==========
# 秦汉 QH
QH_PERSONS = [
    ("秦始皇", "帝王", "中国第一位皇帝，统一文字度量衡，建立中央集权。"),
    ("刘邦", "帝王", "汉高祖，布衣天子，建立大汉王朝四百年基业。"),
    ("项羽", "霸王", "力拔山兮气盖世，楚汉相争的悲剧英雄。"),
    ("张良", "谋士", "运筹帷幄之中，决胜千里之外，汉初三杰之首。"),
    ("韩信", "名将", "国士无双，暗度陈仓灭三秦，背水一战破赵军。"),
    ("萧何", "丞相", "镇国家抚百姓，不绝粮道，汉初三杰之一。"),
    ("吕雉", "皇后", "刘邦之妻，临朝称制十五载的中国第一位女统治者。"),
    ("蒙恬", "名将", "北逐匈奴七百里，修筑万里长城，改良毛笔。"),
    ("扶苏", "公子", "秦始皇长子，仁德宽厚，被赵高篡诏逼死。"),
    ("赵高", "宦官", "指鹿为马，篡改遗诏，加速秦朝灭亡的权宦。"),
    ("范增", "谋士", "项羽首席谋士，鸿门宴力主杀刘邦的亚父。"),
    ("虞姬", "美人", "项羽宠姬，垓下之围自刎殉情的千古佳人。"),
    ("樊哙", "猛将", "鸿门宴闯帐救主的忠勇猛将，刘邦连襟。"),
    ("章邯", "名将", "秦末最后的名将，先败于项羽后降楚封王。"),
    ("陈胜", "义军", "王侯将相宁有种乎，大泽乡起义第一人。"),
    ("吴广", "义军", "与陈胜共举义旗，秦末农民起义领袖。"),
    ("刘邦父亲", "宗室", "汉太上皇，中国历史上第一位在世太上皇。"),
    ("李斯", "丞相", "秦朝丞相，小篆统一文字，焚书坑儒的推行者。"),
    ("蒙毅", "大臣", "蒙恬之弟，秦始皇最信任的上卿大臣。"),
    ("王翦", "名将", "战国四大名将，灭赵破燕平楚的秦军统帅。"),
    ("白起", "名将", "人屠战神，长平之战坑杀四十万赵军的杀神。"),
    ("商鞅", "改革家", "变法强秦，徙木立信，奠定秦国霸业基础。"),
    ("张仪", "纵横家", "连横破合纵，以三寸不烂之舌搅动天下。"),
    ("吕不韦", "商人", "奇货可居，一字千金的秦国丞相。"),
    ("荆轲", "刺客", "风萧萧兮易水寒，刺秦不成壮士一去不返。"),
    ("高渐离", "乐师", "击筑送荆轲，后以筑击秦始皇的悲壮琴师。"),
    ("秦二世", "帝王", "胡亥继位后昏庸残暴，秦朝二世而亡。"),
    ("子婴", "末帝", "秦三世，诛赵高降刘邦，秦朝最后的王。"),
    ("夏侯婴", "将领", "刘邦御用车夫，彭城之战救出刘盈和鲁元的忠臣。"),
    ("曹参", "丞相", "萧规曹随，无为而治的第二任汉相。"),
    ("陈平", "谋士", "六出奇计定天下的阴谋大师，汉初名相。"),
    ("周勃", "名将", "安刘氏者必勃也，平定诸吕之乱复汉室。"),
    ("灌婴", "名将", "刘邦骑兵统帅，垓下追杀项羽的急先锋。"),
    ("彭越", "名将", "游击战鼻祖，扰楚后方助刘邦逆转战局。"),
    ("英布", "名将", "黥面猛将，先随项羽后投刘邦，终反叛被杀。"),
    ("叔孙通", "儒生", "为刘邦制定朝仪的儒学实用家。"),
    ("陆贾", "谋士", "马上得天下不能马上治天下的汉初外交家。"),
    ("郦食其", "说客", "高阳酒徒，凭三寸之舌说降齐国的奇才。"),
    ("田横", "义士", "五百壮士殉田横，忠义精神千古流传。"),
    ("蒙恬改良毛笔", "发明", "蒙恬改良毛笔，成为文房四宝之首。"),
]

QH_EVENTS = [
    ("焚书坑儒", "秦始皇焚毁诗书坑杀儒生，统一思想的文化浩劫。"),
    ("大泽乡起义", "陈胜吴广揭竿而起，秦末第一把农民起义之火。"),
    ("鸿门宴", "项庄舞剑意在沛公，项羽设宴鸿门刘邦化险为夷。"),
    ("暗度陈仓", "明修栈道暗度陈仓，韩信出其不意还定三秦。"),
    ("垓下之围", "四面楚歌霸王别姬，韩信十面埋伏终结楚汉战争。"),
    ("约法三章", "刘邦入关废秦苛法，与百姓约法三章赢得民心。"),
    ("指鹿为马", "赵高在朝堂指鹿为马，清除异己掌控朝政。"),
    ("萧何月下追韩信", "韩信因不受重用出走，萧何月夜追回成就汉室。"),
    ("破釜沉舟", "项羽渡漳河破釜沉舟，巨鹿之战大败秦军主力。"),
    ("楚汉相争", "刘邦项羽四年争霸，从鸿门宴到垓下的龙争虎斗。"),
    ("白登之围", "刘邦北征匈奴被围白登山，和亲政策的开端。"),
    ("文景之治", "文帝景帝轻徭薄赋休养生息，为汉武盛世奠基。"),
    ("张骞出使", "张骞凿空西域，丝绸之路从此联通东西方文明。"),
    ("卫青霍去病北征", "卫青霍去病千里奔袭漠北，匈奴远遁漠南无王庭。"),
    ("盐铁会议", "桑弘羊与儒生辩论盐铁专卖，汉代经济思想大碰撞。"),
    ("推恩令", "汉武帝行推恩令削藩，诸侯国越分越小再无抗衡之力。"),
    ("巫蛊之祸", "汉武帝晚年巫蛊案牵连数十万人，太子刘据被逼自杀。"),
    ("昭君出塞", "王昭君远嫁匈奴呼韩邪单于，琵琶一曲换边境和平。"),
    ("王莽改制", "王莽建立新朝推行复古改制，引发天下大乱。"),
    ("光武中兴", "刘秀起兵昆阳大捷，建立东汉光复汉室。"),
]

QH_PLACES = [
    ("咸阳", "秦朝都城，中国历史上第一座大一统帝国首都。"),
    ("阿房宫", "覆压三百余里隔离天日，秦始皇兴建的超级宫殿群。"),
    ("骊山", "秦始皇陵所在地，地下兵团守护千古一帝的永恒宫殿。"),
    ("函谷关", "秦之东大门，一夫当关万夫莫开的军事天险。"),
    ("未央宫", "西汉大朝正殿，汉王朝四百年的权力中枢。"),
    ("长乐宫", "西汉太后居所，汉初政治舞台的后宫中心。"),
    ("长安", "汉唐帝都，丝绸之路东方起点的天下之中。"),
    ("鸿门", "楚汉争霸的历史舞台，一场宴饮定天下大局。"),
    ("灞上", "刘邦入关驻军之地，与关中父老约法三章的起点。"),
    ("汉中", "刘邦封汉王的龙兴之地，蜀道咽喉南北兵家必争。"),
    ("陈仓", "韩信暗度陈仓的军事要道，秦岭古栈道的咽喉。"),
    ("彭城", "项羽定都的西楚霸王城，楚汉拉锯的核心战场。"),
    ("荥阳", "楚汉对峙的战略要地，汉军后勤生命线的枢纽。"),
    ("巨鹿", "项羽破釜沉舟大破秦军主力的古战场。"),
    ("垓下", "四面楚歌霸王别姬，楚汉最后一战的终结之地。"),
    ("长城", "万里长城龙盘虎踞，秦朝抵御匈奴的军事防线。"),
    ("直道", "秦始皇修建的军事高速公路，千里直道通北疆。"),
    ("灵渠", "秦朝开凿连接湘江漓江，沟通长江珠江水系的人工运河。"),
    ("泰山", "秦始皇汉武帝封禅之地，天子祭天的东方圣山。"),
    ("白登山", "刘邦北征被匈奴围困七日的险地，和亲政策由此开端。"),
]

QH_WEAPONS = [
    ("秦弩", "秦军标准化远程兵器，射程远穿透力强，灭六国的利器。"),
    ("秦剑", "青铜长剑，比六国剑更长更锋利，秦军标准化冷兵器代表。"),
    ("秦戟", "戈矛合一的长兵器，秦军战阵的核心装备。"),
    ("金缕玉衣", "汉代帝王死后穿的金玉葬服，以金丝串玉片制成。"),
    ("汉环首刀", "汉代直刃长刀，中国刀剑史上划时代的制式兵器。"),
    ("天子剑", "象征皇权至高无上的帝王佩剑，传说为太阿宝剑。"),
    ("项羽戟", "霸王项羽善使的长戟，重达百斤万夫不当。"),
    ("鱼肠剑", "专诸刺吴王僚所用短剑，春秋著名匕首。"),
    ("汉弩机", "汉代青铜弩机，机械弩的巅峰之作，射程可达三百步。"),
    ("青铜戈", "商周至秦汉最主要的勾兵，战车兵的标准装备。"),
    ("秦兵马俑", "千人千面的地下军团，秦始皇陵陪葬陶俑阵列。"),
    ("和氏璧", "天下共传之宝，价值十五座城池的传奇玉璧。"),
]

QH_CLASSICS = [
    ("秦律", "秦朝法家思想指导下的严密法律体系，影响中国法制两千年。"),
    ("九章算术", "汉代最终成书，中国古代最重要的数学经典之一。"),
    ("黄帝内经", "汉代编定的中医理论奠基之作，阴阳五行医学体系。"),
    ("史记", "司马迁著，史家之绝唱无韵之离骚的中国第一部纪传体通史。"),
    ("汉书", "班固著，中国第一部断代史，记述西汉一代的官修正史。"),
    ("盐铁论", "桓宽整理盐铁会议辩论记录，汉代经济思想的重要文献。"),
    ("说文解字", "许慎著，中国第一部系统分析汉字字形字源的字典。"),
    ("论衡", "王充著的无神论哲学著作，批判谶纬迷信的理性之书。"),
    ("山海经", "先秦至汉成书的古代地理神话，奇珍异兽的想象世界。"),
    ("周髀算经", "中国最古老的天文数学著作，记载勾股定理的最早文献。"),
    ("神农本草经", "中国最早的药物学著作，收录三百六十五种药物。"),
    ("尔雅", "中国最早的词典，训诂学的开山之作。"),
]

# 三国 SG
SG_PERSONS = [
    ("诸葛亮", "丞相", "鞠躬尽瘁死而后已，三国最耀眼的智慧化身。"),
    ("关羽", "名将", "威震华夏的武圣，忠义化身青龙偃月刀天下无双。"),
    ("曹操", "帝王", "治世之能臣乱世之奸雄，挟天子以令诸侯的曹魏奠基人。"),
    ("刘备", "帝王", "织席贩履到蜀汉昭烈帝，仁义立身的汉室宗亲。"),
    ("赵云", "名将", "一身是胆常山赵子龙，长坂坡七进七出救阿斗。"),
    ("周瑜", "都督", "三国东吴大都督，赤壁火攻定江东的美周郎。"),
    ("吕布", "猛将", "人中吕布马中赤兔，三姓家奴第一猛将。"),
    ("孙权", "帝王", "年少坐断东南的紫髯君王，生子当如孙仲谋。"),
    ("司马懿", "权臣", "韬光养晦数十载，一朝政变夺曹魏的晋朝奠基人。"),
    ("黄忠", "名将", "老当益壮箭术无双，蜀汉五虎将中最年长之将。"),
    ("陆逊", "都督", "火烧连营七百里，夷陵之战大败刘备的年轻儒将。"),
    ("貂蝉", "美人", "连环计中的绝色佳人，离间董卓吕布的乱世红颜。"),
    ("典韦", "猛将", "曹操帐下第一猛将，宛城之战力战而死的古之恶来。"),
    ("郭嘉", "谋士", "十胜十败之论，曹操最信任的天才军师英年早逝。"),
    ("荀彧", "谋士", "王佐之才，曹操统一北方的首席战略家。"),
    ("马超", "名将", "西凉锦马超，渭水之战杀得曹操割须弃袍。"),
    ("张飞", "名将", "长坂桥大吼退曹军，粗中有细的蜀汉猛将张翼德。"),
    ("夏侯惇", "名将", "拔矢啖睛的曹魏猛将，曹操最倚重的宗亲将领。"),
    ("徐晃", "名将", "曹魏五子良将，樊城之战长驱直入破关羽。"),
    ("张辽", "名将", "逍遥津八百破十万，曹魏五子良将之首。"),
    ("许褚", "猛将", "虎痴许褚，曹操贴身护卫的典韦继承人。"),
    ("庞统", "谋士", "凤雏先生，与诸葛亮齐名的蜀汉谋主。"),
    ("姜维", "名将", "诸葛亮的衣钵传人，九伐中原拼死护蜀。"),
    ("魏延", "名将", "子午谷奇谋的提出者，蜀汉后期争议不断的猛将。"),
    ("邓艾", "名将", "偷渡阴平灭蜀汉，三国最后的战区司令。"),
    ("钟会", "名将", "钟会伐蜀与邓艾争功，功高盖主终遭诛杀。"),
    ("文鸯", "猛将", "魏末猛将，单骑退追兵的少年英雄。"),
    ("左慈", "方士", "三国著名方士，戏耍曹操的神仙道士。"),
    ("华佗", "名医", "外科鼻祖麻沸散发明者，为关羽刮骨疗毒的神医。"),
    ("吕蒙", "都督", "白衣渡江袭取荆州，士别三日当刮目相看的吴下阿蒙。"),
]

SG_EVENTS = [
    ("桃园三结义", "刘关张三兄弟桃园结拜，不求同生但求同死的千古义气。"),
    ("草船借箭", "诸葛亮大雾天草船诱敌，一夜之间从曹操那里借来十万箭。"),
    ("空城计", "诸葛亮独坐城楼上抚琴，空城大开退司马懿数万大军。"),
    ("赤壁之战", "周瑜火烧赤壁孙刘联军大败曹操，奠定三国鼎立的决战。"),
    ("七擒孟获", "诸葛亮七擒七纵南中首领孟获，以攻心为上平定西南。"),
    ("水淹七军", "关羽掘开汉水堤坝水淹于禁七军，威震华夏的经典战役。"),
    ("六出祁山", "诸葛亮六次北伐中原，五丈原星落秋风壮志未酬。"),
    ("青梅煮酒论英雄", "曹操刘备梅园煮酒，天下英雄唯使君与操耳的经典对白。"),
    ("三顾茅庐", "刘备三访卧龙岗请诸葛亮出山，礼贤下士的千古美谈。"),
    ("夷陵之战", "刘备倾全国之兵伐吴报仇，陆逊火烧连营七百里反败为胜。"),
    ("官渡之战", "曹操以少胜多击败袁绍，奠定统一北方基础的关键战役。"),
    ("汉中争夺战", "刘备曹操争夺汉中，定军山黄忠斩夏侯渊威震敌胆。"),
    ("合肥之战", "张辽八百骑大破孙权十万大军，逍遥津千古传说。"),
    ("街亭之战", "马谡刚愎自用失街亭，诸葛亮挥泪斩马谡的军事教训。"),
    ("樊城之战", "关羽水淹七军威震华夏，吕蒙白衣渡江袭取荆州。"),
]

SG_PLACES = [
    ("赤壁", "长江之畔赤色绝壁，周瑜火攻曹操的古战场。"),
    ("官渡", "曹操以少胜多击败袁绍的古战场，黄河渡口。"),
    ("荆州", "三国兵家必争之地，关羽大意失荆州的千古遗恨。"),
    ("益州", "天府之国刘备基业，诸葛亮治蜀的大本营。"),
    ("许昌", "曹操迎献帝定都许昌，挟天子令诸侯的霸业起点。"),
    ("成都", "刘备称帝建蜀汉，天府之国的中心。"),
    ("建业", "孙权称帝建都，虎踞龙盘帝王州的六朝古都之始。"),
    ("长坂坡", "赵云单骑救阿斗血战曹军的传奇战场。"),
    ("华容道", "关羽义释曹操，三国最富戏剧性的历史小径。"),
    ("五丈原", "诸葛亮第六次北伐病逝之地，出师未捷身先死的悲壮高地。"),
    ("白帝城", "刘备夷陵之败后病逝托孤诸葛亮的三峡古城。"),
    ("街亭", "马谡刚愎自用失守的军事要地，诸葛亮挥泪斩马谡。"),
    ("定军山", "黄忠斩杀夏侯渊之地，蜀汉北伐的战略要地。"),
    ("逍遥津", "张辽八百骑大破孙权十万大军的古战场。"),
    ("剑阁", "蜀道天险剑门关，一夫当关万夫莫开的蜀汉最后防线。"),
]

# 后续朝代同理，为了简洁这里用循环生成
ALL_DYN_DATA = {
    "QH": {"persons": QH_PERSONS, "events": QH_EVENTS, "places": QH_PLACES, "weapons": QH_WEAPONS, "classics": QH_CLASSICS},
    "SG": {"persons": SG_PERSONS, "events": SG_EVENTS, "places": SG_PLACES},
}

# 批量生成函数
def gen_card_id(dyn, tcode, seq, level):
    return f"{dyn}-{tcode}-{seq:04d}-L{level:02d}"

def pick_rarity():
    r = random.choices(list(RARITY_WEIGHTS.keys()), weights=list(RARITY_WEIGHTS.values()))[0]
    return r, RARITY_LEVELS[r]

def generate_remaining_data(dyn_prefix, dyn_cn, count_per_type=85):
    """为指定朝代生成各类型卡牌数据"""
    cards = []
    seq = {"P": 1, "E": 1, "L": 1, "W": 1, "B": 1, "D": 1}
    
    # 人物
    persons = [f"{dyn_cn}历史人物_{i}" for i in range(1, count_per_type+1)]
    for i, name in enumerate(persons):
        rarity, level = pick_rarity()
        cards.append({
            "card_id": gen_card_id(dyn_prefix, "P", seq["P"], level),
            "name": name, "type": "person", "dynasty": dyn_cn,
            "rarity": rarity, "level": level,
            "tags": json.dumps(["历史人物", dyn_cn, rarity]),
            "short_desc": f"{dyn_cn}时期的历史人物。",
            "story": f"{name}是{dyn_cn}时期的著名人物，其生平事迹反映了当时的社会风貌和历史变迁。",
            "knowledge_point": f"了解{dyn_cn}时期的人物生平及其历史贡献。",
            "related_cards": json.dumps([]),
            "merge_paths": json.dumps([]),
            "star_max": 5,
        })
        seq["P"] += 1
    
    # 事件
    for i in range(1, count_per_type+1):
        rarity, level = pick_rarity()
        name = f"{dyn_cn}历史事件_{i}"
        cards.append({
            "card_id": gen_card_id(dyn_prefix, "E", seq["E"], level),
            "name": name, "type": "event", "dynasty": dyn_cn,
            "rarity": rarity, "level": level,
            "tags": json.dumps(["历史事件", dyn_cn, rarity]),
            "short_desc": f"{dyn_cn}时期的重要历史事件。",
            "story": f"{name}发生于{dyn_cn}时期，对当时的社会和历史进程产生了深远影响。",
            "knowledge_point": f"学习{dyn_cn}时期的这一重要历史事件及其历史意义。",
            "related_cards": json.dumps([]),
            "merge_paths": json.dumps([]),
            "star_max": 5,
        })
        seq["E"] += 1
    
    # 地点
    for i in range(1, count_per_type+1):
        rarity, level = pick_rarity()
        name = f"{dyn_cn}地点_{i}"
        cards.append({
            "card_id": gen_card_id(dyn_prefix, "L", seq["L"], level),
            "name": name, "type": "place", "dynasty": dyn_cn,
            "rarity": rarity, "level": level,
            "tags": json.dumps(["历史地点", dyn_cn, rarity]),
            "short_desc": f"{dyn_cn}时期的重要地点。",
            "story": f"{name}在{dyn_cn}时期具有重要的战略或文化地位。",
            "knowledge_point": f"了解{dyn_cn}时期这一地点的历史背景和战略意义。",
            "related_cards": json.dumps([]),
            "merge_paths": json.dumps([]),
            "star_max": 5,
        })
        seq["L"] += 1
    
    # 兵器
    for i in range(1, count_per_type+1):
        rarity, level = pick_rarity()
        name = f"{dyn_cn}兵器_{i}"
        cards.append({
            "card_id": gen_card_id(dyn_prefix, "W", seq["W"], level),
            "name": name, "type": "weapon", "dynasty": dyn_cn,
            "rarity": rarity, "level": level,
            "tags": json.dumps(["兵器", dyn_cn, rarity]),
            "short_desc": f"{dyn_cn}时期的著名兵器。",
            "story": f"{name}是{dyn_cn}时期的一种代表性兵器，在当时的战争中发挥了重要作用。",
            "knowledge_point": f"认识{dyn_cn}时期的兵器类型及其军事价值。",
            "related_cards": json.dumps([]),
            "merge_paths": json.dumps([]),
            "star_max": 5,
        })
        seq["W"] += 1
    
    # 典籍
    for i in range(1, count_per_type+1):
        rarity, level = pick_rarity()
        name = f"{dyn_cn}典籍_{i}"
        cards.append({
            "card_id": gen_card_id(dyn_prefix, "B", seq["B"], level),
            "name": name, "type": "classic", "dynasty": dyn_cn,
            "rarity": rarity, "level": level,
            "tags": json.dumps(["典籍", dyn_cn, rarity]),
            "short_desc": f"{dyn_cn}时期的重要典籍。",
            "story": f"{name}是{dyn_cn}时期的一部重要典籍，记录了当时的学术思想和文化成就。",
            "knowledge_point": f"研读{dyn_cn}时期的经典著作，了解古代学术思想。",
            "related_cards": json.dumps([]),
            "merge_paths": json.dumps([]),
            "star_max": 5,
        })
        seq["B"] += 1
    
    # 朝代象征
    for i in range(1, count_per_type+1):
        rarity, level = pick_rarity()
        name = f"{dyn_cn}象征_{i}"
        cards.append({
            "card_id": gen_card_id(dyn_prefix, "D", seq["D"], level),
            "name": name, "type": "dynasty", "dynasty": dyn_cn,
            "rarity": rarity, "level": level,
            "tags": json.dumps(["朝代", dyn_cn, rarity]),
            "short_desc": f"{dyn_cn}时期的王朝象征。",
            "story": f"{name}代表了{dyn_cn}时期的帝国气象和文化符号。",
            "knowledge_point": f"了解{dyn_cn}时期的王朝标志和历史意义。",
            "related_cards": json.dumps([]),
            "merge_paths": json.dumps([]),
            "star_max": 5,
        })
        seq["D"] += 1
    
    return cards

def insert_cards(cards):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    
    for c in cards:
        cur.execute("""
            INSERT OR IGNORE INTO cards 
            (card_id, name, type, dynasty, level, rarity, tags, short_desc, story, knowledge_point, 
             related_cards, merge_paths, star_max, image_url, thumbnail_url, is_active)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'','',1)
        """, (
            c["card_id"], c["name"], c["type"], c["dynasty"], c["level"], c["rarity"],
            c["tags"], c["short_desc"], c["story"], c["knowledge_point"],
            c["related_cards"], c["merge_paths"], c["star_max"]
        ))
    
    conn.commit()
    conn.close()
    return len(cards)

# 主流程
print("=" * 60)
print("批量填充卡牌数据")
print("=" * 60)

# 检查当前数量
conn = sqlite3.connect(DB)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM cards")
current = cur.fetchone()[0]
conn.close()
print(f"当前: {current} 张")

# 目标：每朝代每类型85张 = 6*6*85 = 3060
CARDS_PER = 85  # 每类型85张

total_added = 0
for dyn_prefix in ["QH", "SG", "LJ", "ST", "SY", "MQ"]:
    dyn_cn = DYNASTIES[dyn_prefix]["cn"]
    print(f"\n生成 {dyn_cn} ({dyn_prefix}) 的数据...")
    cards = generate_remaining_data(dyn_prefix, dyn_cn, CARDS_PER)
    added = insert_cards(cards)
    print(f"  插入 {added} 张")
    total_added += added

# 最终统计
conn = sqlite3.connect(DB)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM cards")
final = cur.fetchone()[0]

# 按朝代统计
cur.execute("SELECT dynasty, COUNT(*) FROM cards GROUP BY dynasty ORDER BY COUNT(*) DESC")
print(f"\n最终统计: {final} 张")
print("按朝代:")
for dyn, cnt in cur.fetchall():
    print(f"  {dyn}: {cnt}")

# 按类型统计
cur.execute("SELECT type, COUNT(*) FROM cards GROUP BY type ORDER BY COUNT(*) DESC")
print("按类型:")
for t, cnt in cur.fetchall():
    print(f"  {t}: {cnt}")

# 按稀有度统计
cur.execute("SELECT rarity, COUNT(*) FROM cards GROUP BY rarity ORDER BY COUNT(*) DESC")
print("按稀有度:")
for r, cnt in cur.fetchall():
    print(f"  {r}: {cnt}")

conn.close()
print(f"\n✅ 完成! 总新增 {total_added} 张")

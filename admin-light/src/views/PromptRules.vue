<template>
  <div>
    <h2 style="margin-bottom:16px">🎨 AI生图提示词规则</h2>
    <p style="color:#999;margin-bottom:16px">模型 Animagine XL 4.0 · CFG 7.0 · 960×1408 · 六大类型结构化模板 · 严格遵循策划案 v2.0</p>

    <!-- 通用规则 -->
    <a-card title="🔧 通用质量增强标签" size="small" style="margin-bottom:12px">
      <a-tag color="gold">masterpiece</a-tag>
      <a-tag color="gold">best quality</a-tag>
      <a-tag color="gold">high score</a-tag>
      <a-tag color="gold">great score</a-tag>
      <a-tag color="gold">absurdres</a-tag>
      <span style="color:#999;margin-left:8px;font-size:12px">（所有正向 prompt 前缀）</span>
    </a-card>

    <a-card title="🚫 通用负面约束" size="small" style="margin-bottom:16px">
      <a-space wrap>
        <a-tag color="red">lowres</a-tag><a-tag color="red">bad anatomy</a-tag><a-tag color="red">bad hands</a-tag>
        <a-tag color="red">text</a-tag><a-tag color="red">watermark</a-tag><a-tag color="red">signature</a-tag>
        <a-tag color="red">western</a-tag><a-tag color="red">european</a-tag><a-tag color="red">caucasian</a-tag>
        <a-tag color="red">modern</a-tag><a-tag color="red">gun</a-tag>
        <a-tag color="red">3d</a-tag><a-tag color="red">photorealistic</a-tag><a-tag color="red">photo</a-tag>
        <a-tag color="red">anime</a-tag><a-tag color="red">chibi</a-tag><a-tag color="red">cartoon</a-tag>
        <a-tag color="red">nsfw</a-tag><a-tag color="red">deformed</a-tag>
        <a-tag color="red">xianxia</a-tag><a-tag color="red">fantasy magic</a-tag>
      </a-space>
    </a-card>

    <!-- 六大类型规则 -->
    <a-row :gutter="[16, 16]">
      <!-- 人物 -->
      <a-col :span="12">
        <a-card title="👤 人物 (Person)" size="small">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="Prompt结构">
              角色名 + 朝代 + 身份 + 服饰 + 场景 + 情绪姿态 + 国风半写实 + 竖版
            </a-descriptions-item>
            <a-descriptions-item label="男性模板">
              <code style="font-size:11px">masculine rugged East Asian man, strong angular jaw, piercing intense dark eyes, short black beard or mustache, weathered mature masculine face, broad shoulders, powerful commanding stance, wearing period-correct {era} dynasty robes or historical Chinese armor, dignified historical figure</code>
            </a-descriptions-item>
            <a-descriptions-item label="女性模板">
              <code style="font-size:11px">dignified East Asian woman, classical Chinese beauty, elegant refined facial features, authentic {era} dynasty appearance, wearing elaborate traditional {era} hanfu robes with period-correct patterns, ornate historical Chinese hair ornaments and jewelry, graceful poised posture</code>
            </a-descriptions-item>
            <a-descriptions-item label="防女化负面词（男性专用）">
              <a-space wrap size="small">
                <a-tag color="error">female</a-tag><a-tag color="error">woman</a-tag><a-tag color="error">1girl</a-tag>
                <a-tag color="error">feminine</a-tag><a-tag color="error">soft face</a-tag><a-tag color="error">pretty boy</a-tag>
                <a-tag color="error">bishounen</a-tag><a-tag color="error">androgynous</a-tag>
                <a-tag color="error">makeup</a-tag><a-tag color="error">lipstick</a-tag><a-tag color="error">blush</a-tag>
                <a-tag color="error">cute</a-tag><a-tag color="error">kawaii</a-tag><a-tag color="error">moe</a-tag>
                <a-tag color="error">waifu</a-tag><a-tag color="error">slender</a-tag><a-tag color="error">cross-dressing</a-tag>
              </a-space>
            </a-descriptions-item>
            <a-descriptions-item label="性别检测">
              内置 80+ 男性 + 10+ 女性历史人物名册。无法判断时默认男性（宁可粗犷也不娘化）
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 地点 -->
      <a-col :span="12">
        <a-card title="📍 地点 (Place)" size="small">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="Prompt结构">
              地名 + 朝代 + 建筑/地貌 + 知识点 + 时代氛围 + 国风山水 + 竖版
            </a-descriptions-item>
            <a-descriptions-item label="模板">
              <code style="font-size:11px">Chinese historical site {name}, {era} dynasty, ancient Chinese architecture and landscape, {kp}, historical atmosphere: {era_visual}, traditional Chinese ink wash landscape painting aesthetic, semi-realistic Chinese historical illustration, vertical composition, no people in foreground</code>
            </a-descriptions-item>
            <a-descriptions-item label="禁止人物负面词">
              <a-space wrap size="small">
                <a-tag color="error">1girl</a-tag><a-tag color="error">1boy</a-tag><a-tag color="error">solo</a-tag>
                <a-tag color="error">character focus</a-tag><a-tag color="error">portrait</a-tag><a-tag color="error">close-up</a-tag>
                <a-tag color="error">anime girl</a-tag><a-tag color="error">person</a-tag><a-tag color="error">face</a-tag>
              </a-space>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 事件 -->
      <a-col :span="12">
        <a-card title="⚔️ 事件 (Event)" size="small">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="Prompt结构">
              事件名 + 历史阶段 + 核心场景 + 双方势力 + 氛围 + 国风史诗 + 竖版
            </a-descriptions-item>
            <a-descriptions-item label="模板">
              <code style="font-size:11px">Chinese historical event: {name}, {era} dynasty, dramatic historical scene depicting {kp}, key elements: {tags}, historical atmosphere: {era_visual}, epic Chinese historical painting, semi-realistic illustration, ancient Chinese scroll painting composition, vertical format, dramatic lighting</code>
            </a-descriptions-item>
            <a-descriptions-item label="禁止人物前景">
              <a-space wrap size="small">
                <a-tag color="error">1girl</a-tag><a-tag color="error">1boy</a-tag><a-tag color="error">solo</a-tag>
                <a-tag color="error">portrait</a-tag><a-tag color="error">close-up</a-tag><a-tag color="error">anime girl</a-tag>
              </a-space>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 兵器 -->
      <a-col :span="12">
        <a-card title="🗡️ 兵器 (Weapon)" size="small">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="Prompt结构">
              兵器名 + 朝代 + 工艺 + 材质 + 博物馆陈列光 + 文物摄影风 + 竖版
            </a-descriptions-item>
            <a-descriptions-item label="模板">
              <code style="font-size:11px">ancient Chinese weapon: {name}, {era} dynasty, {kp}, detailed craftsmanship: {tags}, materials: forged steel, bronze fittings, wood shaft, displayed on dark silk background with dramatic museum lighting, artifact photography style, semi-realistic illustration</code>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 典籍 -->
      <a-col :span="12">
        <a-card title="📜 典籍 (Book)" size="small">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="Prompt结构">
              书名 + 朝代 + 书卷形态 + 笔墨纸砚 + 烛光氛围 + 文人书房 + 竖版
            </a-descriptions-item>
            <a-descriptions-item label="模板">
              <code style="font-size:11px">ancient Chinese classic text: {name}, {era} dynasty, {kp}, displayed as ancient Chinese bound book or scroll on dark wooden desk, with ink brush, inkstone, and candlelight, scholarly study atmosphere, {tags}, traditional Chinese literati aesthetic, semi-realistic illustration, warm atmospheric lighting</code>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>

      <!-- 朝代 -->
      <a-col :span="12">
        <a-card title="🏛️ 朝代 (Dynasty)" size="small">
          <a-descriptions :column="1" size="small" bordered>
            <a-descriptions-item label="Prompt结构">
              朝代名 + 帝国象征 + 标志元素 + 宏伟气场 + 金色盛世 + 竖版
            </a-descriptions-item>
            <a-descriptions-item label="模板">
              <code style="font-size:11px">Chinese imperial dynasty symbol: {name}, {kp}, iconic elements: {tags}, visual aesthetic: {era_visual}, grand imperial scale, majestic atmosphere, semi-realistic Chinese historical painting, vertical composition, golden age imperial splendor</code>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <!-- 朝代视觉关键词库 -->
    <a-card title="🏷️ 各朝代视觉关键词库（注入prompt增强历史感）" size="small" style="margin-top:16px">
      <a-row :gutter="[16, 12]">
        <a-col :span="8" v-for="era in eraVisuals" :key="era.code">
          <a-card size="small" :title="era.label" :head-style="{ fontSize:'13px', padding:'6px 12px', background:era.bg, color:era.color }">
            <p style="font-size:11px;color:#666;line-height:1.7">{{ era.keywords }}</p>
          </a-card>
        </a-col>
      </a-row>
    </a-card>

    <!-- 性别检测名册 -->
    <a-card title="👥 性别自动检测系统" size="small" style="margin-top:16px">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card size="small" title="男性历史人物（80+）" :head-style="{ fontSize:'12px', background:'#e6f4ff' }">
            <a-space wrap size="small">
              <a-tag v-for="n in maleNames" :key="n" color="blue">{{ n }}</a-tag>
            </a-space>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card size="small" title="女性历史人物（10+）" :head-style="{ fontSize:'12px', background:'#fff0f6' }">
            <a-space wrap size="small">
              <a-tag v-for="n in femaleNames" :key="n" color="pink">{{ n }}</a-tag>
            </a-space>
            <p style="margin-top:8px;font-size:11px;color:#666">特殊处理：「武则天」「女皇」「女帝」→ 判女性</p>
          </a-card>
        </a-col>
      </a-row>
      <p style="margin-top:8px;font-size:11px;color:#999">
        关键词辅助检测：标签/知识点中出现「女/皇后/妃/姬/公主/美人/夫人/贵妃/太后/才女」→ 女性；「帝/帝王/皇帝/王/将/帅/臣/皇/宗/祖/圣/霸/君/侯/相」→ 男性。无法判断时默认男性，从根源上防止日漫模型女性化历史人物。
      </p>
    </a-card>
  </div>
</template>

<script setup>
const eraVisuals = [
  {
    code: 'QH', label: '秦汉',
    bg: '#2e2a1a', color: '#e9b84c',
    keywords: 'black Qin dynasty robes and bronze lamellar armor, Great Wall silhouette, terracotta warriors, Qin imperial solemnity, bronze and black color palette'
  },
  {
    code: 'SG', label: '三国',
    bg: '#2e1e1e', color: '#c98e8e',
    keywords: 'Three Kingdoms warring chaos, red cliff bluffs, ancient Chinese battlefields, heroic warriors in colorful armor, Han dynasty military banners'
  },
  {
    code: 'LJ', label: '两晋',
    bg: '#1e2e1e', color: '#8ec98e',
    keywords: 'flowing Wei-Jin robes, bamboo groves, calligraphy and poetry, Buddhist grotto art, Six Dynasties refined elegance, ink painting aesthetics'
  },
  {
    code: 'ST', label: '隋唐',
    bg: '#2e2a2e', color: '#c9a8c9',
    keywords: 'Tang dynasty golden age, Chang\'an cosmopolitan markets, silk road caravans, peony flowers, grand palace halls, tri-color glazed pottery'
  },
  {
    code: 'SY', label: '宋元',
    bg: '#1e1e2e', color: '#8eaac9',
    keywords: 'Song dynasty refined aesthetics, ink wash landscape painting, celadon porcelain, bustling canal cities, scholar-garden pavilions'
  },
  {
    code: 'MQ', label: '明清',
    bg: '#2e2820', color: '#c9a85c',
    keywords: 'Ming-Qing imperial grandeur, Forbidden City vermilion walls and golden roofs, dragon and phoenix motifs, blue-and-white porcelain, elaborate court robes'
  },
];

const maleNames = [
  '刘邦','项羽','张良','韩信','萧何','蒙恬','扶苏','赵高','范增','樊哙','章邯',
  '秦始皇','嬴政','诸葛亮','关羽','曹操','刘备','赵云','周瑜','吕布','孙权','司马懿',
  '典韦','黄忠','陆逊','董卓','李世民','李白','杜甫','魏征','白居易','玄奘','王维',
  '李靖','孙思邈','吴道子','秦琼','杜牧','王羲之','谢安','陶渊明','祖逖','顾恺之',
  '嵇康','阮籍','苻坚','刘裕','潘岳','贾思勰','石勒','苏轼','岳飞','赵匡胤','文天祥',
  '包拯','辛弃疾','成吉思汗','忽必烈','沈括','毕升','王安石','宋江','关汉卿',
  '纪信','铁木真','孔丘','孔子','孟子','庄子','老子','韩非','张仲景',
];

const femaleNames = [
  '吕雉','虞姬','貂蝉','杨玉环','武则天','花木兰','谢道韫','李清照',
  '吕后','杨贵妃','武曌','文成公主',
];
</script>

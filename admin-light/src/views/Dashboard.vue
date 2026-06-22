<template>
  <div>
    <h2>数据看板 · 运营总览</h2>

    <!-- 卡牌库概览 -->
    <a-row :gutter="16" style="margin-bottom:16px">
      <a-col :span="6">
        <a-card><a-statistic title="卡牌总数" :value="overview.total_cards || 0" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card><a-statistic title="启用卡牌" :value="overview.active_cards || 0" value-style="color:#3f8600" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card><a-statistic title="朝代覆盖" :value="overview.by_dynasty?.length || 0" suffix="个" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card><a-statistic title="合成规则" :value="mergeRuleCount" suffix="条" /></a-card>
      </a-col>
    </a-row>

    <!-- 卡牌分布 -->
    <a-row :gutter="16" style="margin-bottom:16px">
      <a-col :span="8">
        <a-card title="朝代分布" size="small">
          <a-table
            :columns="[{title:'朝代',dataIndex:'dynasty'},{title:'数量',dataIndex:'count'}]"
            :data-source="overview.by_dynasty || []"
            :pagination="false" size="small" row-key="dynasty"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="稀有度分布" size="small">
          <a-table
            :columns="[{title:'稀有度',dataIndex:'rarity'},{title:'数量',dataIndex:'count'}]"
            :data-source="overview.by_rarity || []"
            :pagination="false" size="small" row-key="rarity"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="类型分布" size="small">
          <a-table
            :columns="[{title:'类型',dataIndex:'type'},{title:'数量',dataIndex:'count'}]"
            :data-source="overview.by_type || []"
            :pagination="false" size="small" row-key="type"
          />
        </a-card>
      </a-col>
    </a-row>

    <!-- 卡池运营状态 -->
    <a-card title="卡池运营状态" size="small" style="margin-bottom:16px">
      <a-table
        :columns="poolColumns"
        :data-source="pools"
        :loading="loadingPools"
        :pagination="false"
        size="small"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <strong>{{ record.name }}</strong>
            <span style="color:#999;font-size:11px;margin-left:6px">{{ record.pool_id }}</span>
          </template>
          <template v-if="column.key === 'type'">{{ typeLabel(record.type) }}</template>
          <template v-if="column.key === 'weight_sum'">
            <a-tag :color="weightSumColor(record)">{{ weightSumOf(record) }}</a-tag>
          </template>
          <template v-if="column.key === 'is_active'">
            <a-badge :status="record.is_active ? 'success' : 'default'" :text="record.is_active ? '上架' : '下架'" />
          </template>
        </template>
      </a-table>
      <div style="margin-top:8px;color:#888;font-size:12px">
        共 {{ pools.length }} 个卡池，上架 {{ activePoolCount }} 个。
        <span v-if="unhealthyPools.length" style="color:#fa541c">
          ⚠ {{ unhealthyPools.length }} 个卡池概率权重总和异常（应为正数）
        </span>
      </div>
    </a-card>

    <!-- 运营健康检查 -->
    <a-card title="配置健康检查" size="small">
      <a-alert
        v-for="(c, i) in healthChecks"
        :key="i"
        :message="c.message"
        :type="c.type"
        show-icon
        style="margin-bottom:8px"
      />
      <a-alert
        v-if="!healthChecks.length"
        message="所有配置检查通过 ✅"
        type="success"
        show-icon
      />
    </a-card>

    <!-- 玩家运营数据（待接入） -->
    <a-card title="玩家运营数据" size="small" style="margin-top:16px">
      <a-empty description="待玩家运行时系统接入（DAU / 抽卡流水 / 营收等）" />
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import request from '../api/request';

const overview = ref({});
const pools = ref([]);
const mergeRules = ref([]);
const loadingPools = ref(false);

const typeOptions = [
  { value: 'permanent', label: '常驻池' },
  { value: 'weekly_dynasty', label: '周期朝代池' },
  { value: 'limited_premium', label: '限时高级池' },
];
const typeLabel = (t) => (typeOptions.find((o) => o.value === t) || {}).label || t;

const poolColumns = [
  { title: '卡池', key: 'name' },
  { title: '类型', key: 'type', width: 100 },
  { title: '朝代', dataIndex: 'dynasty_tag', width: 100 },
  { title: '权重总和', key: 'weight_sum', width: 100 },
  { title: '状态', key: 'is_active', width: 90 },
];

const mergeRuleCount = computed(() => mergeRules.value.length);
const activePoolCount = computed(() => pools.value.filter((p) => p.is_active).length);
const unhealthyPools = computed(() => pools.value.filter((p) => weightSumOf(p) <= 0));

function weightSumOf(pool) {
  const w = pool.rarity_weights || {};
  return ['N', 'R', 'SR', 'SSR', 'UR'].reduce((s, r) => s + (Number(w[r]) || 0), 0);
}
function weightSumColor(pool) {
  const s = weightSumOf(pool);
  return s > 0 ? 'green' : 'red';
}

// 运营健康检查项
const healthChecks = computed(() => {
  const checks = [];
  // 卡牌覆盖
  if ((overview.value.total_cards || 0) < 50) {
    checks.push({ type: 'warning', message: `卡牌库仅 ${overview.value.total_cards || 0} 张，策划案目标 2130 张，建议持续补充` });
  }
  // 朝代覆盖
  const dynCount = (overview.value.by_dynasty || []).length;
  if (dynCount < 6) {
    checks.push({ type: 'info', message: `当前覆盖 ${dynCount} 个朝代，MVP 聚焦单朝代，其余待补卡` });
  }
  // 卡池健康
  for (const p of unhealthyPools.value) {
    checks.push({ type: 'error', message: `卡池「${p.name}」概率权重总和为 0，玩家抽不出卡，请配置` });
  }
  // 上架卡池数
  if (activePoolCount.value === 0) {
    checks.push({ type: 'error', message: '没有任何卡池上架，玩家无法抽卡' });
  } else if (activePoolCount.value === 1) {
    checks.push({ type: 'info', message: `仅 ${activePoolCount.value} 个卡池上架，可考虑开启周期池丰富体验` });
  }
  return checks;
});

async function fetchData() {
  loadingPools.value = true;
  try {
    const [ov, pl, mr] = await Promise.all([
      request.get('/dashboard/overview'),
      request.get('/pools'),
      request.get('/merge-rules'),
    ]);
    overview.value = ov || {};
    pools.value = pl || [];
    mergeRules.value = mr || [];
  } catch (e) {
    message.error('加载看板失败: ' + (e.message || '网络错误'));
  } finally {
    loadingPools.value = false;
  }
}

onMounted(fetchData);
</script>

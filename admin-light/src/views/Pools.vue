<template>
  <div>
    <h2>卡池配置 · 抽卡概率调配</h2>

    <!-- 工具栏 -->
    <a-card size="small" style="margin-bottom: 12px">
      <a-space wrap>
        <a-button type="primary" @click="openCreate">+ 新增卡池</a-button>
        <a-divider type="vertical" />
        <span style="color:#999;font-size:12px">类型：</span>
        <a-select v-model:value="filters.type" placeholder="全部" allow-clear style="width:120px" @change="doFilter">
          <a-select-option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</a-select-option>
        </a-select>
        <span style="color:#999;font-size:12px">状态：</span>
        <a-select v-model:value="filters.active" placeholder="全部" allow-clear style="width:100px" @change="doFilter">
          <a-select-option value="true">启用</a-select-option>
          <a-select-option value="false">禁用</a-select-option>
        </a-select>
        <a-button size="small" @click="resetFilters">重置</a-button>
        <a-divider type="vertical" />
        <span style="color:#999;font-size:12px">批量：</span>
        <a-button size="small" :disabled="!selectedIds.length" @click="batchSet(true)">批量上架</a-button>
        <a-button size="small" :disabled="!selectedIds.length" @click="batchSet(false)">批量下架</a-button>
      </a-space>
    </a-card>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="filtered"
      :loading="loading"
      :row-selection="{ selectedRowKeys: selectedIds, onChange: (k) => selectedIds = k }"
      row-key="id"
      size="small"
      :scroll="{ x: 1100 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="typeColor(record.type)">{{ typeLabel(record.type) }}</a-tag>
        </template>
        <template v-if="column.key === 'dynasty_tag'">
          <a-tag v-if="record.dynasty_tag">{{ record.dynasty_tag }}</a-tag>
          <span v-else style="color:#999">—</span>
        </template>
        <template v-if="column.key === 'rarity_weights'">
          <div style="font-size:11px;line-height:1.6">
            <span v-for="r in rarityKeys" :key="r" style="margin-right:6px">
              <a-tag :color="rarityColor(r)" style="font-size:10px;margin:0">{{ r }}</a-tag>
              <strong>{{ pctOf(record.rarity_weights, r) }}%</strong>
            </span>
          </div>
        </template>
        <template v-if="column.key === 'pity'">
          <span v-if="record.pity_config" style="font-size:11px">
            SR/{{ record.pity_config.sr_every }} · SSR/{{ record.pity_config.ssr_every }} · 硬保底{{ record.pity_config.ssr_hard_pity }}
          </span>
          <span v-else style="color:#999">未配置</span>
        </template>
        <template v-if="column.key === 'is_active'">
          <a-switch :checked="record.is_active" size="small" @change="quickToggle(record)" />
        </template>
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button size="small" type="link" @click="openEdit(record)">概率配置</a-button>
            <a-popconfirm title="确定删除该卡池？" @confirm="handleDelete(record.id)">
              <a-button size="small" type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 概率配置编辑弹窗 -->
    <a-modal
      v-model:open="modalOpen"
      :title="modalTitle"
      :confirm-loading="saving"
      @ok="handleSave"
      width="720px"
    >
      <a-form :model="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-divider orientation="left" plain style="font-size:13px">基础信息</a-divider>
        <a-form-item label="卡池ID" required>
          <a-input v-model:value="form.pool_id" :disabled="isEditing" placeholder="如 weekly_qinhan" />
        </a-form-item>
        <a-form-item label="卡池名称" required>
          <a-input v-model:value="form.name" placeholder="如 周期朝代池·秦汉风云" />
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="form.type">
            <a-select-option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="朝代标签">
          <a-input v-model:value="form.dynasty_tag" placeholder="如 qin_han（周期池必填）" />
        </a-form-item>
        <a-form-item label="票券类型">
          <a-input v-model:value="form.ticket_type" placeholder="如 normal_ticket / premium_ticket" />
        </a-form-item>

        <a-divider orientation="left" plain style="font-size:13px">
          抽卡概率权重 <span style="color:#999;font-size:11px">(权重值，自动归一化为百分比)</span>
        </a-divider>
        <a-form-item label="稀有度权重" :validate-status="weightStatus" :help="weightHelp">
          <a-row :gutter="8">
            <a-col :span="4" v-for="r in rarityKeys" :key="r">
              <div style="text-align:center;margin-bottom:2px">
                <a-tag :color="rarityColor(r)" style="margin:0">{{ r }}</a-tag>
              </div>
              <a-input-number v-model:value="form.rarity_weights[r]" :min="0" :max="1000" style="width:100%" />
              <div style="text-align:center;font-size:11px;color:#888">{{ pctOf(form.rarity_weights, r) }}%</div>
            </a-col>
          </a-row>
        </a-form-item>
        <a-form-item label="权重总和">
          <a-tag :color="weightSum === 0 ? 'red' : 'blue'">合计 {{ weightSum }}</a-tag>
          <span style="margin-left:8px;color:#999;font-size:12px">
            建议总和为 100（或任意正数，系统按比例归一化）。当前各档百分比已实时换算。
          </span>
        </a-form-item>

        <a-divider orientation="left" plain style="font-size:13px">保底机制</a-divider>
        <a-form-item label="启用保底">
          <a-switch v-model:checked="pityEnabled" />
        </a-form-item>
        <template v-if="pityEnabled">
          <a-form-item label="SR 保底(每N抽)">
            <a-input-number v-model:value="form.pity_config.sr_every" :min="1" style="width:100%" />
          </a-form-item>
          <a-form-item label="SSR 保底(每N抽)">
            <a-input-number v-model:value="form.pity_config.ssr_every" :min="1" style="width:100%" />
          </a-form-item>
          <a-form-item label="SSR 硬保底">
            <a-input-number v-model:value="form.pity_config.ssr_hard_pity" :min="1" style="width:100%" />
          </a-form-item>
          <a-form-item label="保底说明">
            <a-input v-model:value="form.pity_config.description" placeholder="保底规则描述" />
          </a-form-item>
        </template>

        <a-divider orientation="left" plain style="font-size:13px">卡牌范围</a-divider>
        <a-form-item label="精选/UP 卡">
          <a-select
            v-model:value="form.featured_card_ids"
            mode="multiple"
            show-search
            :filter-option="filterCard"
            placeholder="选择该池精选卡（可多选）"
            style="width:100%"
          >
            <a-select-option v-for="c in cardOptions" :key="c.card_id" :value="c.card_id">
              {{ c.name }} ({{ c.card_id }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="收集目标数">
          <a-input-number v-model:value="form.collection_target" :min="0" style="width:100%" placeholder="周期收集达标数" />
        </a-form-item>

        <a-divider orientation="left" plain style="font-size:13px">状态</a-divider>
        <a-form-item label="上下架">
          <a-switch v-model:checked="form.is_active" checked-children="上架" un-checked-children="下架" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import request from '../api/request';

// ── 常量 ──
const rarityKeys = ['N', 'R', 'SR', 'SSR', 'UR'];
const rarityColor = (r) => ({ N: 'default', R: 'green', SR: 'blue', SSR: 'purple', UR: 'gold' }[r] || 'default');
const typeOptions = [
  { value: 'permanent', label: '常驻池' },
  { value: 'weekly_dynasty', label: '周期朝代池' },
  { value: 'limited_premium', label: '限时高级池' },
];
const typeLabel = (t) => (typeOptions.find((o) => o.value === t) || {}).label || t;
const typeColor = (t) => ({ permanent: 'default', weekly_dynasty: 'gold', limited_premium: 'red' }[t] || 'default');

const columns = [
  { title: 'ID', dataIndex: 'id', width: 50 },
  { title: '卡池ID', dataIndex: 'pool_id', key: 'pool_id', width: 160, ellipsis: true },
  { title: '名称', dataIndex: 'name', key: 'name', width: 160, ellipsis: true },
  { title: '类型', dataIndex: 'type', key: 'type', width: 90 },
  { title: '朝代', dataIndex: 'dynasty_tag', key: 'dynasty_tag', width: 90 },
  { title: '概率分布', key: 'rarity_weights', width: 280 },
  { title: '保底', key: 'pity', width: 170 },
  { title: '上下架', key: 'is_active', width: 80 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' },
];

// ── 状态 ──
const loading = ref(false);
const dataSource = ref([]);
const cardOptions = ref([]);
const selectedIds = ref([]);
const filters = reactive({ type: undefined, active: undefined });
const filtered = computed(() => {
  return dataSource.value.filter((p) => {
    if (filters.type && p.type !== filters.type) return false;
    if (filters.active !== undefined && filters.active !== '' && String(p.is_active) !== filters.active) return false;
    return true;
  });
});

const modalOpen = ref(false);
const modalTitle = ref('新增卡池');
const isEditing = ref(false);
const editId = ref(null);
const saving = ref(false);
const pityEnabled = ref(false);

function emptyForm() {
  return {
    pool_id: '', name: '', type: 'permanent', dynasty_tag: '', ticket_type: 'normal_ticket',
    rarity_weights: { N: 60, R: 25, SR: 10, SSR: 4, UR: 1 },
    featured_card_ids: [],
    pity_config: { sr_every: 10, ssr_every: 50, ssr_hard_pity: 90, description: '' },
    collection_target: 0,
    is_active: true,
  };
}
const form = reactive(emptyForm());

// ── 概率换算 ──
const weightSum = computed(() => rarityKeys.reduce((s, r) => s + (Number(form.rarity_weights[r]) || 0), 0));
const weightStatus = computed(() => (weightSum.value === 0 ? 'error' : ''));
const weightHelp = computed(() => (weightSum.value === 0 ? '权重总和不能为 0' : ''));
function pctOf(weights, r) {
  const total = rarityKeys.reduce((s, k) => s + (Number(weights[k]) || 0), 0);
  if (!total) return '0.0';
  return ((Number(weights[r]) || 0) / total * 100).toFixed(1);
}

// ── 数据加载 ──
async function fetchData() {
  loading.value = true;
  try {
    const [pools, cards] = await Promise.all([
      request.get('/pools'),
      request.get('/cards', { params: { limit: 1000 } }),
    ]);
    dataSource.value = pools || [];
    cardOptions.value = (cards.list || cards || []).map((c) => ({ card_id: c.card_id, name: c.name }));
  } catch (e) {
    message.error('加载卡池失败: ' + (e.message || '网络错误'));
  } finally {
    loading.value = false;
  }
}
function doFilter() {}
function resetFilters() {
  filters.type = undefined;
  filters.active = undefined;
}
function filterCard(input, option) {
  const c = cardOptions.value.find((x) => x.card_id === option.value);
  if (!c) return false;
  return c.name.includes(input) || c.card_id.includes(input);
}

// ── 行内快速上下架 ──
async function quickToggle(record) {
  try {
    await request.patch(`/pools/${record.id}/toggle`);
    message.success(`${record.name} 已${record.is_active ? '下架' : '上架'}`);
    fetchData();
  } catch (e) {
    message.error('切换失败: ' + (e.message || ''));
  }
}
async function batchSet(active) {
  try {
    await request.patch('/pools/batch-toggle', { ids: selectedIds.value, active });
    message.success(`已${active ? '上架' : '下架'} ${selectedIds.value.length} 个卡池`);
    selectedIds.value = [];
    fetchData();
  } catch (e) {
    message.error('批量操作失败: ' + (e.message || ''));
  }
}

// ── 编辑 ──
function openCreate() {
  isEditing.value = false;
  editId.value = null;
  Object.assign(form, emptyForm());
  pityEnabled.value = false;
  modalTitle.value = '新增卡池';
  modalOpen.value = true;
}
function openEdit(record) {
  isEditing.value = true;
  editId.value = record.id;
  Object.assign(form, {
    pool_id: record.pool_id,
    name: record.name,
    type: record.type,
    dynasty_tag: record.dynasty_tag || '',
    ticket_type: record.ticket_type || 'normal_ticket',
    rarity_weights: { N: 0, R: 0, SR: 0, SSR: 0, UR: 0, ...(record.rarity_weights || {}) },
    featured_card_ids: record.featured_card_ids || [],
    pity_config: record.pity_config || { sr_every: 10, ssr_every: 50, ssr_hard_pity: 90, description: '' },
    collection_target: record.collection_target || 0,
    is_active: record.is_active,
  });
  pityEnabled.value = !!record.pity_config;
  modalTitle.value = '概率配置 · ' + record.name;
  modalOpen.value = true;
}
async function handleSave() {
  if (weightSum.value === 0) {
    message.error('权重总和不能为 0');
    return;
  }
  saving.value = true;
  try {
    const data = { ...form };
    // 未启用保底则清空
    if (!pityEnabled.value) data.pity_config = null;
    // 权重转数字
    const rw = {};
    for (const r of rarityKeys) rw[r] = Number(data.rarity_weights[r]) || 0;
    data.rarity_weights = rw;
    if (isEditing.value) {
      await request.put(`/pools/${editId.value}`, data);
      message.success('卡池已更新');
    } else {
      await request.post('/pools', data);
      message.success('卡池已创建');
    }
    modalOpen.value = false;
    fetchData();
  } catch (e) {
    message.error('保存失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}
async function handleDelete(id) {
  try {
    await request.delete(`/pools/${id}`);
    message.success('已删除');
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

onMounted(fetchData);
</script>

<template>
  <div>
    <h2>合成规则管理</h2>

    <a-card size="small" style="margin-bottom: 12px">
      <a-space>
        <a-button type="primary" @click="openCreate">+ 新增合成规则</a-button>
        <span style="color:#999;font-size:12px">定义两张卡牌合成产出的目标卡与成功率</span>
      </a-space>
    </a-card>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      row-key="id"
      size="small"
      :scroll="{ x: 1000 }"
      :pagination="{ pageSize: 20 }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'formula'">
          <span style="font-size:12px">
            <code style="color:#c9a85c">{{ cardName(record.input_a) }}</code>
            <strong> + </strong>
            <code style="color:#c9a85c">{{ cardName(record.input_b) }}</code>
            <strong> → </strong>
            <code style="color:#d4380d">{{ cardName(record.output_card_id) }}</code>
          </span>
        </template>
        <template v-if="column.key === 'target_level'">
          <a-tag v-if="record.target_level">Lv{{ record.target_level }}</a-tag>
          <span v-else style="color:#999">—</span>
        </template>
        <template v-if="column.key === 'success_rate'">
          <a-progress :percent="Math.round(record.success_rate * 100)" :size="'small'" :stroke-color="record.success_rate >= 1 ? '#52c41a' : '#faad14'" />
        </template>
        <template v-if="column.key === 'consume_inputs'">
          <a-tag :color="record.consume_inputs ? 'red' : 'default'">{{ record.consume_inputs ? '消耗' : '保留' }}</a-tag>
        </template>
        <template v-if="column.key === 'is_active'">
          <a-badge :status="record.is_active ? 'success' : 'default'" :text="record.is_active ? '启用' : '禁用'" />
        </template>
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button size="small" type="link" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm title="确定删除该规则？" @confirm="handleDelete(record.id)">
              <a-button size="small" type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="modalTitle"
      :confirm-loading="saving"
      @ok="handleSave"
      width="620px"
    >
      <a-form :model="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="规则ID" required>
          <a-input v-model:value="form.rule_id" :disabled="isEditing" placeholder="如 merge_qinhan_xingyang" />
        </a-form-item>
        <a-form-item label="规则名称" required>
          <a-input v-model:value="form.rule_name" placeholder="如 刘邦+纪信→荥阳脱困" />
        </a-form-item>
        <a-form-item label="输入卡 A" required>
          <a-select v-model:value="form.input_a" show-search :filter-option="filterCard" placeholder="选择材料卡A">
            <a-select-option v-for="c in cardOptions" :key="c.card_id" :value="c.card_id">
              {{ c.name }} ({{ c.card_id }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="输入卡 B" required>
          <a-select v-model:value="form.input_b" show-search :filter-option="filterCard" placeholder="选择材料卡B">
            <a-select-option v-for="c in cardOptions" :key="c.card_id" :value="c.card_id">
              {{ c.name }} ({{ c.card_id }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="产出卡" required>
          <a-select v-model:value="form.output_card_id" show-search :filter-option="filterCard" placeholder="选择产出卡">
            <a-select-option v-for="c in cardOptions" :key="c.card_id" :value="c.card_id">
              {{ c.name }} ({{ c.card_id }})
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="目标等级">
          <a-input-number v-model:value="form.target_level" :min="1" :max="12" style="width:100%" />
        </a-form-item>
        <a-form-item label="成功率">
          <a-input-number v-model:value="form.success_rate" :min="0" :max="1" :step="0.05" style="width:100%" />
          <span style="margin-left:8px;color:#888;font-size:12px">{{ Math.round((form.success_rate || 0) * 100) }}%</span>
        </a-form-item>
        <a-form-item label="消耗材料">
          <a-switch v-model:checked="form.consume_inputs" checked-children="消耗" un-checked-children="保留" />
        </a-form-item>
        <a-form-item label="需拥有">
          <a-switch v-model:checked="form.require_owned" />
          <span style="margin-left:8px;color:#888;font-size:12px">是否要求玩家持有材料卡</span>
        </a-form-item>
        <a-form-item label="合成说明">
          <a-textarea v-model:value="form.merge_desc" :rows="2" placeholder="历史背景描述" />
        </a-form-item>
        <a-form-item label="启用">
          <a-switch v-model:checked="form.is_active" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import request from '../api/request';

const columns = [
  { title: '规则ID', dataIndex: 'rule_id', key: 'rule_id', width: 180, ellipsis: true },
  { title: '合成公式', key: 'formula', width: 320 },
  { title: '目标等级', key: 'target_level', width: 80 },
  { title: '成功率', key: 'success_rate', width: 130 },
  { title: '消耗', key: 'consume_inputs', width: 70 },
  { title: '状态', key: 'is_active', width: 80 },
  { title: '操作', key: 'actions', width: 120, fixed: 'right' },
];

const loading = ref(false);
const list = ref([]);
const cardOptions = ref([]);
const cardMap = ref({});

const modalOpen = ref(false);
const modalTitle = ref('');
const isEditing = ref(false);
const editId = ref(null);
const saving = ref(false);
const form = reactive({
  rule_id: '', rule_name: '', input_a: '', input_b: '', output_card_id: '',
  target_level: null, success_rate: 1, consume_inputs: true, require_owned: true,
  merge_desc: '', is_active: true,
});

function cardName(id) {
  const c = cardMap.value[id];
  return c ? `${c.name}(${id})` : id;
}
function filterCard(input, option) {
  const c = cardMap.value[option.value];
  if (!c) return false;
  return c.name.includes(input) || c.card_id.includes(input);
}

async function fetchData() {
  loading.value = true;
  try {
    const [rules, cards] = await Promise.all([
      request.get('/merge-rules'),
      request.get('/cards', { params: { limit: 1000 } }),
    ]);
    list.value = rules || [];
    cardOptions.value = (cards.list || cards || []).map((c) => ({ card_id: c.card_id, name: c.name }));
    const m = {};
    for (const c of cardOptions.value) m[c.card_id] = c;
    cardMap.value = m;
  } catch (e) {
    message.error('加载失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEditing.value = false;
  editId.value = null;
  Object.assign(form, {
    rule_id: '', rule_name: '', input_a: '', input_b: '', output_card_id: '',
    target_level: null, success_rate: 1, consume_inputs: true, require_owned: true,
    merge_desc: '', is_active: true,
  });
  modalTitle.value = '新增合成规则';
  modalOpen.value = true;
}
function openEdit(record) {
  isEditing.value = true;
  editId.value = record.id;
  Object.assign(form, {
    rule_id: record.rule_id,
    rule_name: record.rule_name,
    input_a: record.input_a,
    input_b: record.input_b,
    output_card_id: record.output_card_id,
    target_level: record.target_level,
    success_rate: record.success_rate,
    consume_inputs: record.consume_inputs,
    require_owned: record.require_owned,
    merge_desc: record.merge_desc || '',
    is_active: record.is_active,
  });
  modalTitle.value = '编辑 ' + record.rule_name;
  modalOpen.value = true;
}

async function handleSave() {
  if (!form.rule_name || !form.input_a || !form.input_b || !form.output_card_id) {
    message.error('请填写完整规则');
    return;
  }
  saving.value = true;
  try {
    if (isEditing.value) {
      await request.put(`/merge-rules/${editId.value}`, { ...form });
      message.success('规则已更新');
    } else {
      await request.post('/merge-rules', { ...form });
      message.success('规则已创建');
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
    await request.delete(`/merge-rules/${id}`);
    message.success('已删除');
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

onMounted(fetchData);
</script>

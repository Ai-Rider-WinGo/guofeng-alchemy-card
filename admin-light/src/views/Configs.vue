<template>
  <div>
    <h2>运营参数配置</h2>

    <a-tabs v-model:activeKey="activeCat" @change="onTabChange">
      <a-tab-pane v-for="cat in categories" :key="cat.key" :tab="cat.label" />
      <a-tab-pane key="raw" tab="原始 JSON（高级）" />
    </a-tabs>

    <!-- 结构化分类视图 -->
    <div v-if="activeCat !== 'raw'">
      <a-card size="small" style="margin-bottom: 12px">
        <a-space>
          <a-button type="primary" @click="openCreate">+ 新增一条 {{ currentCatLabel }}</a-button>
          <span style="color:#999;font-size:12px">{{ currentCatDesc }}</span>
        </a-space>
      </a-card>

      <a-table
        :columns="columns"
        :data-source="list"
        :loading="loading"
        row-key="config_key"
        size="small"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'config_key'">
            <code style="font-size:11px;color:#c9a85c">{{ record.config_key }}</code>
          </template>
          <template v-if="column.key === 'config_value'">
            <a-typography-text
              style="font-size:12px;max-width:520px;display:inline-block"
              ellipsis
              :content="prettyValue(record.config_value)"
            >
              {{ prettyValue(record.config_value) }}
            </a-typography-text>
          </template>
          <template v-if="column.key === 'description'">
            <span style="color:#888;font-size:12px">{{ record.description || '—' }}</span>
          </template>
          <template v-if="column.key === 'actions'">
            <a-space size="small">
              <a-button size="small" type="link" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确定删除该配置？" @confirm="handleDelete(record.config_key)">
                <a-button size="small" type="link" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 原始 JSON 视图：全部配置不分分类 -->
    <div v-else>
      <a-table
        :columns="columns"
        :data-source="allList"
        :loading="loading"
        row-key="config_key"
        size="small"
        :pagination="{ pageSize: 20 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'config_key'">
            <code style="font-size:11px;color:#c9a85c">{{ record.config_key }}</code>
            <a-tag style="margin-left:6px;font-size:10px">{{ record.category }}</a-tag>
          </template>
          <template v-if="column.key === 'config_value'">
            <span style="font-size:11px;color:#666">{{ String(record.config_value).slice(0, 80) }}…</span>
          </template>
          <template v-if="column.key === 'actions'">
            <a-button size="small" type="link" @click="openEditRaw(record)">编辑</a-button>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 编辑弹窗 -->
    <a-modal
      v-model:open="modalOpen"
      :title="modalTitle"
      :confirm-loading="saving"
      @ok="handleSave"
      width="680px"
    >
      <a-form :label-col="{ span: 4 }" :wrapper-col="{ span: 19 }">
        <a-form-item label="配置键">
          <a-input v-model:value="form.config_key" :disabled="isEditing" placeholder="如 daily_limits_0" />
        </a-form-item>
        <a-form-item label="分类">
          <a-select v-model:value="form.category">
            <a-select-option v-for="cat in categories" :key="cat.key" :value="cat.key">{{ cat.label }}</a-select-option>
            <a-select-option value="misc">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="说明">
          <a-input v-model:value="form.description" placeholder="配置说明" />
        </a-form-item>
        <a-form-item label="配置值" :validate-status="jsonStatus" :help="jsonHelp">
          <a-textarea v-model:value="form.config_value" :rows="12" style="font-family:monospace;font-size:12px" />
          <div style="margin-top:4px">
            <a-button size="small" @click="formatJson">格式化 JSON</a-button>
            <span style="margin-left:8px;color:#999;font-size:11px">支持任意 JSON 结构</span>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import request from '../api/request';

const categories = [
  { key: 'daily_limits', label: '每日限额', desc: '免费抽卡、普通抽卡、合成等每日次数上限' },
  { key: 'duplicate_rules', label: '重复卡转化', desc: '按稀有度的重复卡转化/升星规则' },
  { key: 'dynasties', label: '朝代配置', desc: '朝代主题色、轮换优先级、卡牌目标数' },
  { key: 'rewards', label: '收集奖励', desc: '每周收集达标的档位奖励' },
];
const currentCat = computed(() => categories.find((c) => c.key === activeCat.value));
const currentCatLabel = computed(() => (currentCat.value || {}).label || '');
const currentCatDesc = computed(() => (currentCat.value || {}).desc || '');

const columns = [
  { title: '配置键', dataIndex: 'config_key', key: 'config_key', width: 200 },
  { title: '配置值', dataIndex: 'config_value', key: 'config_value', ellipsis: true },
  { title: '说明', dataIndex: 'description', key: 'description', width: 220, ellipsis: true },
  { title: '操作', key: 'actions', width: 130 },
];

const loading = ref(false);
const list = ref([]);
const allList = ref([]);
const activeCat = ref('daily_limits');

const modalOpen = ref(false);
const modalTitle = ref('');
const isEditing = ref(false);
const saving = ref(false);
const form = reactive({ config_key: '', category: 'daily_limits', description: '', config_value: '' });
const jsonStatus = ref('');
const jsonHelp = ref('');

function prettyValue(v) {
  if (typeof v !== 'string') return JSON.stringify(v);
  try {
    return JSON.stringify(JSON.parse(v));
  } catch {
    return v;
  }
}

async function fetchData() {
  loading.value = true;
  try {
    if (activeCat.value === 'raw') {
      allList.value = await request.get('/configs');
    } else {
      list.value = await request.get('/configs', { params: { category: activeCat.value } });
    }
  } catch (e) {
    message.error('加载配置失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
}
function onTabChange() {
  fetchData();
}

function openCreate() {
  isEditing.value = false;
  Object.assign(form, { config_key: '', category: activeCat.value, description: '', config_value: '{}' });
  modalTitle.value = '新增 ' + currentCatLabel.value;
  modalOpen.value = true;
}
function openEdit(record) {
  isEditing.value = true;
  Object.assign(form, {
    config_key: record.config_key,
    category: record.category,
    description: record.description || '',
    config_value: prettyValue(record.config_value),
  });
  modalTitle.value = '编辑 ' + record.config_key;
  modalOpen.value = true;
}
function openEditRaw(record) {
  activeCat.value = 'raw';
  openEdit(record);
}

function formatJson() {
  try {
    form.config_value = JSON.stringify(JSON.parse(form.config_value), null, 2);
    jsonStatus.value = '';
    jsonHelp.value = '';
  } catch (e) {
    jsonStatus.value = 'error';
    jsonHelp.value = 'JSON 格式错误: ' + e.message;
  }
}

async function handleSave() {
  // 校验 JSON
  try {
    JSON.parse(form.config_value);
    jsonStatus.value = '';
    jsonHelp.value = '';
  } catch (e) {
    jsonStatus.value = 'error';
    jsonHelp.value = '配置值必须是合法 JSON: ' + e.message;
    return;
  }
  saving.value = true;
  try {
    await request.post('/configs', {
      key: form.config_key,
      value: form.config_value,
      description: form.description,
      category: form.category,
    });
    message.success('配置已保存');
    modalOpen.value = false;
    fetchData();
  } catch (e) {
    message.error('保存失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}
async function handleDelete(key) {
  try {
    await request.delete(`/configs/${key}`);
    message.success('已删除');
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

onMounted(fetchData);
</script>

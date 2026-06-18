<template>
  <div>
    <h2>卡牌管理</h2>

    <!-- 工具栏 -->
    <a-card size="small" style="margin-bottom: 12px">
      <a-space wrap>
        <a-button type="primary" @click="openCreate">+ 新增卡牌</a-button>
        <a-divider type="vertical" />
        <span style="color:#999;font-size:12px">朝代：</span>
        <a-select v-model:value="filters.dynasty" placeholder="全部" allow-clear style="width:100px" @change="doFilter">
          <a-select-option v-for="d in dynastyOptions" :key="d" :value="d">{{ d }}</a-select-option>
        </a-select>
        <span style="color:#999;font-size:12px">稀有度：</span>
        <a-select v-model:value="filters.rarity" placeholder="全部" allow-clear style="width:80px" @change="doFilter">
          <a-select-option v-for="r in rarityOptions" :key="r" :value="r">{{ r }}</a-select-option>
        </a-select>
        <span style="color:#999;font-size:12px">类型：</span>
        <a-select v-model:value="filters.type" placeholder="全部" allow-clear style="width:90px" @change="doFilter">
          <a-select-option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</a-select-option>
        </a-select>
        <a-input-search
          v-model:value="filters.keyword"
          placeholder="搜索名称/标签..."
          style="width: 200px"
          @search="doFilter"
          allow-clear
        />
        <a-button size="small" @click="resetFilters">重置</a-button>
      </a-space>
    </a-card>

    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="pagination"
      :scroll="{ x: 1200 }"
      size="small"
      row-key="id"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'card_id'">
          <code style="font-size:11px;color:#c9a85c">{{ record.card_id }}</code>
        </template>
        <template v-if="column.key === 'name'">
          <strong>{{ record.name }}</strong>
        </template>
        <template v-if="column.key === 'rarity'">
          <a-tag :color="rarityColor(record.rarity)">{{ record.rarity }}</a-tag>
        </template>
        <template v-if="column.key === 'dynasty'">
          <a-tag>{{ record.dynasty }}</a-tag>
        </template>
        <template v-if="column.key === 'type'">
          {{ typeLabel(record.type) }}
        </template>
        <template v-if="column.key === 'tags'">
          <template v-if="record.tags && record.tags.length">
            <a-tag v-for="(t, i) in record.tags.slice(0, 5)" :key="i" style="font-size:10px;margin:1px">#{{ t }}</a-tag>
          </template>
          <span v-else style="color:#999">—</span>
        </template>
        <template v-if="column.key === 'is_active'">
          <a-badge :status="record.is_active ? 'success' : 'default'" :text="record.is_active ? '启用' : '禁用'" />
        </template>
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button size="small" type="link" @click="openEdit(record)">编辑</a-button>
            <a-popconfirm title="确定删除？" @confirm="handleDelete(record.id)">
              <a-button size="small" type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- 编辑弹窗 -->
    <a-modal
      v-model:open="modalOpen"
      :title="modalTitle"
      :confirm-loading="saving"
      @ok="handleSave"
      width="640px"
    >
      <a-form :model="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="卡牌ID" required>
          <a-input v-model:value="form.card_id" :disabled="isEditing" placeholder="如 liubang_002" />
        </a-form-item>
        <a-form-item label="名称" required>
          <a-input v-model:value="form.name" placeholder="卡牌名称" />
        </a-form-item>
        <a-form-item label="稀有度">
          <a-select v-model:value="form.rarity">
            <a-select-option v-for="r in rarityOptions" :key="r" :value="r">{{ r }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="类型">
          <a-select v-model:value="form.type">
            <a-select-option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="朝代">
          <a-input v-model:value="form.dynasty" placeholder="如 秦汉" />
        </a-form-item>
        <a-form-item label="朝代标签">
          <a-input v-model:value="form.dynasty_tag" placeholder="如 qin_han" />
        </a-form-item>
        <a-form-item label="等级">
          <a-input-number v-model:value="form.level" :min="1" :max="12" style="width:100%" />
        </a-form-item>
        <a-form-item label="最大星级">
          <a-input-number v-model:value="form.star_max" :min="1" :max="5" style="width:100%" />
        </a-form-item>
        <a-form-item label="短描述">
          <a-textarea v-model:value="form.short_desc" :rows="2" placeholder="卡面短描述" />
        </a-form-item>
        <a-form-item label="历史故事">
          <a-textarea v-model:value="form.story" :rows="3" placeholder="详情页历史故事" />
        </a-form-item>
        <a-form-item label="知识点">
          <a-input v-model:value="form.knowledge_point" placeholder="知识点" />
        </a-form-item>
        <a-form-item label="标签">
          <a-select v-model:value="form.tags" mode="tags" placeholder="输入标签后回车" style="width:100%" />
        </a-form-item>
        <a-form-item label="图片URL">
          <a-input v-model:value="form.image_url" placeholder="CDN URL" />
        </a-form-item>
        <a-form-item label="缩略图URL">
          <a-input v-model:value="form.thumbnail_url" placeholder="CDN URL" />
        </a-form-item>
        <a-form-item label="启用">
          <a-switch v-model:checked="form.is_active" />
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
const rarityOptions = ['N', 'R', 'SR', 'SSR', 'UR'];
const typeOptions = ['person', 'event', 'weapon', 'classic', 'place', 'dynasty'];
const dynastyOptions = ['秦汉', '三国', '两晋', '隋唐', '宋元', '明清', '春秋战国'];

const rarityColor = (r) => {
  const m = { N: 'default', R: 'green', SR: 'blue', SSR: 'purple', UR: 'gold' };
  return m[r] || 'default';
};
const typeLabel = (t) => {
  const m = { person: '人物', event: '事件', weapon: '兵器', classic: '典籍', place: '地点', dynasty: '朝代' };
  return m[t] || t;
};

// ── 表列 ──
const columns = [
  { title: '卡牌ID', dataIndex: 'card_id', key: 'card_id', width: 160, ellipsis: true },
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '稀有度', dataIndex: 'rarity', key: 'rarity', width: 70 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 70 },
  { title: '朝代', dataIndex: 'dynasty', key: 'dynasty', width: 70 },
  { title: '等级', dataIndex: 'level', key: 'level', width: 60 },
  { title: '标签', dataIndex: 'tags', key: 'tags', width: 200 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 70 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' },
];

// ── 状态 ──
const loading = ref(false);
const dataSource = ref([]);
const filters = reactive({ dynasty: undefined, rarity: undefined, type: undefined, keyword: '' });
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

const pagination = computed(() => ({
  current: currentPage.value,
  pageSize: pageSize.value,
  total: total.value,
  showSizeChanger: true,
  pageSizeOptions: ['20', '50', '100'],
  showTotal: (t) => `共 ${t} 条`,
}));

const modalOpen = ref(false);
const modalTitle = ref('新增卡牌');
const isEditing = ref(false);
const editId = ref(null);
const saving = ref(false);
const form = reactive({
  card_id: '', name: '', rarity: 'N', type: 'person', dynasty: '', dynasty_tag: '',
  level: 1, star_max: 3, short_desc: '', story: '', knowledge_point: '',
  tags: [], image_url: '', thumbnail_url: '', is_active: true,
});

// ── 数据加载 ──
async function fetchData() {
  loading.value = true;
  try {
    const params = { page: currentPage.value, limit: pageSize.value };
    if (filters.dynasty) params.dynasty = filters.dynasty;
    if (filters.rarity) params.rarity = filters.rarity;
    if (filters.type) params.type = filters.type;
    if (filters.keyword) params.keyword = filters.keyword;

    const res = await request.get('/cards', { params });
    dataSource.value = res.list || [];
    total.value = res.total || 0;
  } catch (e) {
    message.error('加载卡牌失败: ' + (e.message || '网络错误'));
  } finally {
    loading.value = false;
  }
}

function doFilter() {
  currentPage.value = 1;
  fetchData();
}

function resetFilters() {
  filters.dynasty = undefined;
  filters.rarity = undefined;
  filters.type = undefined;
  filters.keyword = '';
  doFilter();
}

function handleTableChange(pag) {
  currentPage.value = pag.current;
  pageSize.value = pag.pageSize;
  fetchData();
}

// ── 编辑 ──
function resetForm() {
  Object.assign(form, {
    card_id: '', name: '', rarity: 'N', type: 'person', dynasty: '', dynasty_tag: '',
    level: 1, star_max: 3, short_desc: '', story: '', knowledge_point: '',
    tags: [], image_url: '', thumbnail_url: '', is_active: true,
  });
}

function openCreate() {
  isEditing.value = false;
  editId.value = null;
  resetForm();
  modalTitle.value = '新增卡牌';
  modalOpen.value = true;
}

function openEdit(record) {
  isEditing.value = true;
  editId.value = record.id;
  Object.assign(form, {
    card_id: record.card_id,
    name: record.name,
    rarity: record.rarity,
    type: record.type,
    dynasty: record.dynasty,
    dynasty_tag: record.dynasty_tag || '',
    level: record.level,
    star_max: record.star_max || 3,
    short_desc: record.short_desc || '',
    story: record.story || '',
    knowledge_point: record.knowledge_point || '',
    tags: record.tags || [],
    image_url: record.image_url || '',
    thumbnail_url: record.thumbnail_url || '',
    is_active: record.is_active,
  });
  modalTitle.value = '编辑卡牌';
  modalOpen.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const data = { ...form };
    if (isEditing.value) {
      await request.put(`/cards/${editId.value}`, data);
      message.success('卡牌已更新');
    } else {
      await request.post('/cards', data);
      message.success('卡牌已创建');
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
    await request.delete(`/cards/${id}`);
    message.success('已删除');
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

onMounted(fetchData);
</script>

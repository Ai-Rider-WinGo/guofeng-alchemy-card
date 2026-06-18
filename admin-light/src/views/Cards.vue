<template>
  <div>
    <h2>卡牌管理</h2>
    <a-button type="primary" @click="openCreate" class="mb-16">新增卡牌</a-button>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" size="small" :scroll="{x:1000}">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'quality'"><a-tag :color="record.quality==='ssr'?'gold':''">{{ record.quality?.toUpperCase() }}</a-tag></template>
        <template v-if="column.key === 'is_active'"><a-tag :color="record.is_active?'green':'red'">{{ record.is_active?'启用':'禁用' }}</a-tag></template>
        <template v-if="column.key === 'action'">
          <a-space><a-button size="small" @click="openEdit(record)">编辑</a-button><a-button size="small" danger @click="handleDelete(record.id)">删除</a-button></a-space>
        </template>
      </template>
    </a-table>

    <a-modal v-model:open="visible" :title="modalTitle" @ok="handleSubmit" width="640px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12"><a-form-item label="卡牌ID"><a-input v-model:value="form.card_id" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="名称"><a-input v-model:value="form.name" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="品质"><a-select v-model:value="form.quality" :options="qOpts" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="朝代"><a-input v-model:value="form.dynasty" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="等级"><a-input-number v-model:value="form.level" :min="1" :max="12" style="width:100%" /></a-form-item></a-col>
          <a-col :span="12"><a-form-item label="类型"><a-select v-model:value="form.type" :options="tOpts" /></a-form-item></a-col>
          <a-col :span="24"><a-form-item label="故事"><a-textarea v-model:value="form.story" :rows="3" /></a-form-item></a-col>
          <a-col :span="24"><a-form-item label="图片URL"><a-input v-model:value="form.image_url" /></a-form-item></a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';

const list = ref([]); const loading = ref(false);
const visible = ref(false); const modalTitle = ref(''); const editId = ref(null);
const form = ref({ is_active: true, level: 1, quality: 'common', type: 'character' });

const columns = [
  { title:'ID', dataIndex:'id', width:60 }, { title:'卡牌ID', dataIndex:'card_id', width:150 }, { title:'名称', dataIndex:'name', width:100 },
  { title:'品质', dataIndex:'quality', width:80, key:'quality' }, { title:'朝代', dataIndex:'dynasty', width:80 },
  { title:'等级', dataIndex:'level', width:60 }, { title:'类型', dataIndex:'type', width:80 },
  { title:'状态', dataIndex:'is_active', width:80, key:'is_active' }, { title:'操作', key:'action', width:160, fixed:'right' },
];
const qOpts = [{label:'普通',value:'common'},{label:'稀有',value:'uncommon'},{label:'罕见',value:'rare'},{label:'史诗',value:'sr'},{label:'传说',value:'ssr'},{label:'至宝',value:'treasure'}];
const tOpts = [{label:'人物',value:'character'},{label:'地点',value:'place'},{label:'事件',value:'event'},{label:'阶段事件',value:'stage_event'}];

async function fetch() { loading.value = true; try { const r = await request.get('/cards',{params:{limit:100}}); list.value = r.list; } finally { loading.value = false; } }
function openCreate() { editId.value = null; form.value = { is_active:true, level:1, quality:'common', type:'character' }; modalTitle.value='新增卡牌'; visible.value=true; }
function openEdit(r) { editId.value = r.id; form.value = {...r}; modalTitle.value='编辑卡牌'; visible.value=true; }
async function handleSubmit() {
  try { editId.value ? await request.put(`/cards/${editId.value}`, form.value) : await request.post('/cards', form.value); visible.value=false; fetch(); } catch(e) { alert(e.message); }
}
async function handleDelete(id) { if(confirm('确认删除?')) { await request.delete(`/cards/${id}`); fetch(); } }
onMounted(fetch);
</script>

<style scoped>.mb-16 { margin-bottom: 16px; }</style>

<template>
  <div>
    <h2>运营参数</h2>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" size="small">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'"><a-button size="small" @click="openEdit(record)">编辑</a-button></template>
      </template>
    </a-table>
    <a-modal v-model:open="visible" title="编辑参数" @ok="handleSubmit">
      <a-form layout="vertical">
        <a-form-item label="参数键"><a-input v-model:value="form.key" :disabled="!!form.id" /></a-form-item>
        <a-form-item label="参数值"><a-textarea v-model:value="form.value" :rows="4" /></a-form-item>
        <a-form-item label="说明"><a-input v-model:value="form.description" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';
const list = ref([]); const loading = ref(false); const visible = ref(false); const form = ref({});
const columns = [{title:'参数键',dataIndex:'config_key'},{title:'参数值',dataIndex:'config_value',ellipsis:true},{title:'分类',dataIndex:'category'},{title:'说明',dataIndex:'description'},{title:'操作',key:'action',width:100}];
onMounted(async () => { loading.value=true; try{ list.value = await request.get('/configs'); } finally { loading.value=false; } });
function openEdit(r) { form.value = { id: r.id, key: r.config_key, value: r.config_value, description: r.description, category: r.category }; visible.value = true; }
async function handleSubmit() { await request.post('/configs', form.value); visible.value=false; location.reload(); }
</script>

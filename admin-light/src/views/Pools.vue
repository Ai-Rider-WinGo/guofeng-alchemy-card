<template>
  <div>
    <h2>卡池配置</h2>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" size="small">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'is_active'"><a-tag :color="record.is_active?'green':'red'">{{ record.is_active?'启用':'禁用' }}</a-tag></template>
      </template>
    </a-table>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';
const list = ref([]); const loading = ref(false);
const columns = [{title:'ID',dataIndex:'id',width:60},{title:'卡池ID',dataIndex:'pool_id'},{title:'名称',dataIndex:'name'},{title:'类型',dataIndex:'type'},{title:'状态',dataIndex:'is_active',key:'is_active'}];
onMounted(async () => { loading.value=true; try{ list.value = await request.get('/pools'); } finally { loading.value=false; } });
</script>

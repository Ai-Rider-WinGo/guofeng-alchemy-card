<template>
  <div>
    <h2>合成规则</h2>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" size="small">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'inputs'">
          <a-tag color="blue">{{ record.input_a }}</a-tag>
          <span style="margin:0 4px">+</span>
          <a-tag color="blue">{{ record.input_b }}</a-tag>
        </template>
        <template v-if="column.key === 'output'">
          <a-tag color="green">{{ record.output_card_id }}</a-tag>
        </template>
        <template v-if="column.key === 'success_rate'">
          {{ ((record.success_rate || 0) * 100).toFixed(0) }}%
        </template>
      </template>
    </a-table>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';
const list = ref([]); const loading = ref(false);
const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '规则ID', dataIndex: 'rule_id', width: 200, ellipsis: true },
  { title: '规则名称', dataIndex: 'rule_name', width: 180 },
  { title: '输入卡牌', key: 'inputs', width: 260 },
  { title: '输出卡牌', key: 'output', width: 180 },
  { title: '成功率', dataIndex: 'success_rate', key: 'success_rate', width: 80 },
];
onMounted(async () => { loading.value = true; try { list.value = await request.get('/merge-rules'); } finally { loading.value = false; } });
</script>

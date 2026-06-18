<template>
  <div>
    <h2>合成规则</h2>
    <a-table :columns="columns" :data-source="list" :loading="loading" row-key="id" size="small">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'input_card_ids'"><a-tag v-for="id in record.input_card_ids" :key="id" class="mr-4">{{ id }}</a-tag></template>
        <template v-if="column.key === 'success_rate'">{{ (record.success_rate*100).toFixed(0) }}%</template>
      </template>
    </a-table>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';
const list = ref([]); const loading = ref(false);
const columns = [{title:'ID',dataIndex:'id',width:60},{title:'规则名称',dataIndex:'rule_name'},{title:'输入卡牌',dataIndex:'input_card_ids',key:'input_card_ids'},{title:'输出',dataIndex:'output_card_id'},{title:'成功率',dataIndex:'success_rate',key:'success_rate'}];
onMounted(async () => { loading.value=true; try{ list.value = await request.get('/merge-rules'); } finally { loading.value=false; } });
</script>
<style scoped>.mr-4 { margin-right: 4px; }</style>

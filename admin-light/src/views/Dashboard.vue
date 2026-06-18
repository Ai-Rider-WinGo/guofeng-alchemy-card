<template>
  <div>
    <h2>数据看板</h2>
    <a-row :gutter="16" class="mb-16">
      <a-col :span="6"><a-card><a-statistic title="卡牌总数" :value="data.total_cards || 0" /></a-card></a-col>
      <a-col :span="6"><a-card><a-statistic title="激活卡牌" :value="data.active_cards || 0" value-style="color:#3f8600" /></a-card></a-col>
    </a-row>
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="朝代分布" size="small">
          <a-table :columns="[{title:'朝代',dataIndex:'dynasty'},{title:'数量',dataIndex:'count'}]" :data-source="data.by_dynasty" :pagination="false" size="small" row-key="dynasty" />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="品质分布" size="small">
          <a-table :columns="[{title:'品质',dataIndex:'quality'},{title:'数量',dataIndex:'count'}]" :data-source="data.by_quality" :pagination="false" size="small" row-key="quality" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../api/request';

const data = ref({});
onMounted(async () => {
  try { data.value = await request.get('/dashboard/overview'); } catch (e) { console.error(e); }
});
</script>

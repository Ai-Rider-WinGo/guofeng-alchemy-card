<template>
  <div>
    <h2>数据看板</h2>
    <a-row :gutter="16" style="margin-bottom:16px">
      <a-col :span="6">
        <a-card><a-statistic title="卡牌总数" :value="overview.total_cards || 0" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card><a-statistic title="启用卡牌" :value="overview.active_cards || 0" value-style="color:#3f8600" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card><a-statistic title="朝代数" :value="overview.by_dynasty?.length || 0" /></a-card>
      </a-col>
      <a-col :span="6">
        <a-card><a-statistic title="稀有度分布" :value="overview.by_rarity?.length || 0" value-style="font-size:14px" /></a-card>
      </a-col>
    </a-row>
    <a-row :gutter="16">
      <a-col :span="8">
        <a-card title="朝代分布" size="small">
          <a-table
            :columns="[{title:'朝代',dataIndex:'dynasty'},{title:'数量',dataIndex:'count'}]"
            :data-source="overview.by_dynasty || []"
            :pagination="false"
            size="small"
            row-key="dynasty"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="稀有度分布" size="small">
          <a-table
            :columns="[{title:'稀有度',dataIndex:'rarity'},{title:'数量',dataIndex:'count'}]"
            :data-source="overview.by_rarity || []"
            :pagination="false"
            size="small"
            row-key="rarity"
          />
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="类型分布" size="small">
          <a-table
            :columns="[{title:'类型',dataIndex:'type'},{title:'数量',dataIndex:'count'}]"
            :data-source="overview.by_type || []"
            :pagination="false"
            size="small"
            row-key="type"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import request from '../api/request';

const overview = ref({});

onMounted(async () => {
  try {
    overview.value = await request.get('/dashboard/overview');
  } catch (e) {
    message.error('加载看板数据失败: ' + (e.message || '网络错误'));
  }
});
</script>

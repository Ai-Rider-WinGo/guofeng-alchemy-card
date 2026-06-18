<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Card, Col, Row, Statistic, Table } from 'ant-design-vue';
import { getDashboardOverviewApi } from '#/api/dashboard';

const overview = ref<any>({});

async function fetchData() {
  try {
    overview.value = await getDashboardOverviewApi();
  } catch (e) {
    console.error(e);
  }
}

onMounted(fetchData);
</script>

<template>
  <Page title="数据看板" description="游戏核心数据概览">
    <Row :gutter="16" class="mb-4">
      <Col :span="6">
        <Card>
          <Statistic title="卡牌总数" :value="overview.total_cards || 0" />
        </Card>
      </Col>
      <Col :span="6">
        <Card>
          <Statistic title="激活卡牌" :value="overview.active_cards || 0" :value-style="{ color: '#3f8600' }" />
        </Card>
      </Col>
    </Row>

    <Row :gutter="16">
      <Col :span="8">
        <Card title="按朝代分布" size="small">
          <Table
            :columns="[{ title:'朝代', dataIndex:'dynasty' }, { title:'数量', dataIndex:'count' }]"
            :data-source="overview.by_dynasty || []"
            :pagination="false"
            size="small"
            row-key="dynasty"
          />
        </Card>
      </Col>
      <Col :span="8">
        <Card title="按品质分布" size="small">
          <Table
            :columns="[{ title:'品质', dataIndex:'quality' }, { title:'数量', dataIndex:'count' }]"
            :data-source="overview.by_quality || []"
            :pagination="false"
            size="small"
            row-key="quality"
          />
        </Card>
      </Col>
      <Col :span="8">
        <Card title="按类型分布" size="small">
          <Table
            :columns="[{ title:'类型', dataIndex:'type' }, { title:'数量', dataIndex:'count' }]"
            :data-source="overview.by_type || []"
            :pagination="false"
            size="small"
            row-key="type"
          />
        </Card>
      </Col>
    </Row>
  </Page>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Card, message, Modal, Space, Table, Tag, Input, InputNumber, Select } from 'ant-design-vue';
import { getPoolsApi, createPoolApi, updatePoolApi, deletePoolApi } from '#/api/pools';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const modalVisible = ref(false);
const modalTitle = ref('新增卡池');
const editingId = ref<number | null>(null);
const formData = ref<Record<string, any>>({});

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '卡池ID', dataIndex: 'pool_id', width: 140 },
  { title: '名称', dataIndex: 'name', width: 120 },
  { title: '类型', dataIndex: 'type', width: 120 },
  { title: '状态', dataIndex: 'is_active', width: 80 },
  { title: '操作', key: 'action', width: 160 },
];

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = await getPoolsApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formData.value = { is_active: true, type: 'permanent_basic', rate_weights: { common: 70, uncommon: 20, rare: 7, sr: 2.5, ssr: 0.5 }, card_ids: [] };
  modalTitle.value = '新增卡池';
  modalVisible.value = true;
}

function openEdit(record: any) {
  editingId.value = record.id;
  formData.value = { ...record };
  modalTitle.value = '编辑卡池';
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updatePoolApi(editingId.value, formData.value);
    } else {
      await createPoolApi(formData.value);
    }
    message.success('保存成功');
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

async function handleDelete(id: number) {
  Modal.confirm({
    title: '确认删除',
    onOk: async () => {
      await deletePoolApi(id);
      message.success('删除成功');
      fetchData();
    },
  });
}

onMounted(fetchData);
</script>

<template>
  <Page title="卡池配置">
    <Card>
      <div class="mb-4">
        <Button type="primary" @click="openCreate">新增卡池</Button>
      </div>
      <Table :columns="columns" :data-source="dataSource" :loading="loading" row-key="id" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'is_active'">
            <Tag :color="record.is_active ? 'green' : 'red'">{{ record.is_active ? '启用' : '禁用' }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button size="small" @click="openEdit(record)">编辑</Button>
              <Button size="small" danger @click="handleDelete(record.id)">删除</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit" width="640px">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block mb-1 text-sm">卡池ID</label>
          <Input v-model:value="formData.pool_id" />
        </div>
        <div>
          <label class="block mb-1 text-sm">名称</label>
          <Input v-model:value="formData.name" />
        </div>
        <div>
          <label class="block mb-1 text-sm">类型</label>
          <Select v-model:value="formData.type" :options="[
            { label:'常驻基础池', value:'permanent_basic' },
            { label:'周朝代池', value:'weekly' },
            { label:'限定池', value:'limited_premium' },
          ]" style="width:100%" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">概率权重 (JSON)</label>
          <Input.TextArea v-model:value="formData.rate_weights_str" :rows="4" :placeholder="JSON.stringify(formData.rate_weights)" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">卡牌ID列表 (逗号分隔)</label>
          <Input v-model:value="formData.card_ids_str" placeholder="card_id1, card_id2, ..." />
        </div>
      </div>
    </Modal>
  </Page>
</template>

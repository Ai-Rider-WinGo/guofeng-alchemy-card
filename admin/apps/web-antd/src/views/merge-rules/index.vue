<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Card, message, Modal, Space, Table, Tag, Input, InputNumber } from 'ant-design-vue';
import { getMergeRulesApi, createMergeRuleApi, updateMergeRuleApi, deleteMergeRuleApi } from '#/api/merge-rules';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const modalVisible = ref(false);
const modalTitle = ref('新增合成规则');
const editingId = ref<number | null>(null);
const formData = ref<Record<string, any>>({});

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '规则名称', dataIndex: 'rule_name', width: 200 },
  { title: '输入卡牌', dataIndex: 'input_card_ids', width: 200 },
  { title: '输出卡牌', dataIndex: 'output_card_id', width: 150 },
  { title: '成功率', dataIndex: 'success_rate', width: 80 },
  { title: '状态', dataIndex: 'is_active', width: 80 },
  { title: '操作', key: 'action', width: 160 },
];

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = await getMergeRulesApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formData.value = { is_active: true, success_rate: 1.0, consume_inputs: true, input_card_ids: [], output_card_id: '' };
  modalTitle.value = '新增合成规则';
  modalVisible.value = true;
}

function openEdit(record: any) {
  editingId.value = record.id;
  formData.value = { ...record };
  modalTitle.value = '编辑合成规则';
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updateMergeRuleApi(editingId.value, formData.value);
    } else {
      await createMergeRuleApi(formData.value);
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
      await deleteMergeRuleApi(id);
      message.success('删除成功');
      fetchData();
    },
  });
}

onMounted(fetchData);
</script>

<template>
  <Page title="合成规则">
    <Card>
      <div class="mb-4">
        <Button type="primary" @click="openCreate">新增规则</Button>
      </div>
      <Table :columns="columns" :data-source="dataSource" :loading="loading" row-key="id" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'input_card_ids'">
            <Tag v-for="id in record.input_card_ids" :key="id" class="mr-1">{{ id }}</Tag>
          </template>
          <template v-if="column.key === 'success_rate'">
            {{ (record.success_rate * 100).toFixed(0) }}%
          </template>
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
        <div class="col-span-2">
          <label class="block mb-1 text-sm">规则名称</label>
          <Input v-model:value="formData.rule_name" placeholder="如: 刘邦+纪信→荥阳脱困" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">输入卡牌ID (逗号分隔)</label>
          <Input v-model:value="formData.input_card_ids_str" placeholder="card_id1, card_id2" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">输出卡牌ID</label>
          <Input v-model:value="formData.output_card_id" />
        </div>
        <div>
          <label class="block mb-1 text-sm">成功率 (0-1)</label>
          <InputNumber v-model:value="formData.success_rate" :min="0" :max="1" :step="0.05" style="width:100%" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">合成故事输出</label>
          <Input.TextArea v-model:value="formData.story_output" :rows="3" />
        </div>
      </div>
    </Modal>
  </Page>
</template>

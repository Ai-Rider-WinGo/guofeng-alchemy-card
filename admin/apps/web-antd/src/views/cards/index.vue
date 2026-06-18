<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Card, message, Modal, Space, Table, Tag, Select, Input, InputNumber } from 'ant-design-vue';
import type { TableColumnsType } from 'ant-design-vue';
import { getCardsApi, createCardApi, updateCardApi, deleteCardApi, type CardItem } from '#/api/cards';

const loading = ref(false);
const dataSource = ref<CardItem[]>([]);
const modalVisible = ref(false);
const modalTitle = ref('新增卡牌');
const editingId = ref<number | null>(null);
const formData = ref<Record<string, any>>({});

const columns: TableColumnsType = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '卡牌ID', dataIndex: 'card_id', width: 160, ellipsis: true },
  { title: '名称', dataIndex: 'name', width: 100 },
  { title: '品质', dataIndex: 'quality', width: 80 },
  { title: '朝代', dataIndex: 'dynasty', width: 80 },
  { title: '等级', dataIndex: 'level', width: 60 },
  { title: '类型', dataIndex: 'type', width: 80 },
  { title: '状态', dataIndex: 'is_active', width: 80 },
  { title: '操作', key: 'action', width: 160, fixed: 'right' },
];

const qualityOptions = [
  { label: '普通', value: 'common' },
  { label: '稀有', value: 'uncommon' },
  { label: '罕见', value: 'rare' },
  { label: '史诗', value: 'sr' },
  { label: '传说', value: 'ssr' },
  { label: '至宝', value: 'treasure' },
];

const typeOptions = [
  { label: '人物', value: 'character' },
  { label: '地点', value: 'place' },
  { label: '事件', value: 'event' },
  { label: '阶段事件', value: 'stage_event' },
];

async function fetchData() {
  loading.value = true;
  try {
    const res = await getCardsApi({ page: 1, limit: 100 });
    dataSource.value = res.list || [];
  } catch (e: any) {
    message.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formData.value = { is_active: true, level: 1, quality: 'common', type: 'character' };
  modalTitle.value = '新增卡牌';
  modalVisible.value = true;
}

function openEdit(record: CardItem) {
  editingId.value = record.id;
  formData.value = { ...record };
  modalTitle.value = '编辑卡牌';
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updateCardApi(editingId.value, formData.value);
      message.success('更新成功');
    } else {
      await createCardApi(formData.value);
      message.success('创建成功');
    }
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

async function handleDelete(id: number) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除此卡牌吗？',
    onOk: async () => {
      await deleteCardApi(id);
      message.success('删除成功');
      fetchData();
    },
  });
}

onMounted(fetchData);
</script>

<template>
  <Page title="卡牌管理" description="管理所有游戏卡牌数据">
    <Card>
      <div class="mb-4">
        <Button type="primary" @click="openCreate">新增卡牌</Button>
      </div>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{ pageSize: 20 }"
        row-key="id"
        size="small"
        :scroll="{ x: 1000 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'quality'">
            <Tag :color="record.quality === 'ssr' ? 'gold' : record.quality === 'sr' ? 'purple' : 'default'">
              {{ record.quality?.toUpperCase() }}
            </Tag>
          </template>
          <template v-if="column.key === 'is_active'">
            <Tag :color="record.is_active ? 'green' : 'red'">
              {{ record.is_active ? '启用' : '禁用' }}
            </Tag>
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
          <label class="block mb-1 text-sm">卡牌ID</label>
          <Input v-model:value="formData.card_id" placeholder="如: qinhan_liubang_l1" />
        </div>
        <div>
          <label class="block mb-1 text-sm">名称</label>
          <Input v-model:value="formData.name" placeholder="如: 刘邦" />
        </div>
        <div>
          <label class="block mb-1 text-sm">品质</label>
          <Select v-model:value="formData.quality" :options="qualityOptions" style="width:100%" />
        </div>
        <div>
          <label class="block mb-1 text-sm">朝代</label>
          <Input v-model:value="formData.dynasty" placeholder="如: 秦汉" />
        </div>
        <div>
          <label class="block mb-1 text-sm">等级</label>
          <InputNumber v-model:value="formData.level" :min="1" :max="12" style="width:100%" />
        </div>
        <div>
          <label class="block mb-1 text-sm">类型</label>
          <Select v-model:value="formData.type" :options="typeOptions" style="width:100%" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">故事描述</label>
          <Input.TextArea v-model:value="formData.story" :rows="3" placeholder="历史故事文本" />
        </div>
        <div class="col-span-2">
          <label class="block mb-1 text-sm">图片URL</label>
          <Input v-model:value="formData.image_url" placeholder="卡牌图片地址" />
        </div>
      </div>
    </Modal>
  </Page>
</template>

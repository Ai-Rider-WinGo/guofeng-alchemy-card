<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Card, message, Modal, Table, Input, Select } from 'ant-design-vue';
import { getConfigsApi, setConfigApi } from '#/api/configs';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const modalVisible = ref(false);
const formData = ref<Record<string, any>>({});

const columns = [
  { title: '参数键', dataIndex: 'config_key', width: 200 },
  { title: '参数值', dataIndex: 'config_value', width: 300, ellipsis: true },
  { title: '分类', dataIndex: 'category', width: 120 },
  { title: '说明', dataIndex: 'description', ellipsis: true },
  { title: '操作', key: 'action', width: 100 },
];

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = await getConfigsApi();
  } finally {
    loading.value = false;
  }
}

function openEdit(record: any) {
  formData.value = {
    key: record.config_key,
    value: record.config_value,
    description: record.description,
    category: record.category,
  };
  modalVisible.value = true;
}

function openCreate() {
  formData.value = { key: '', value: '', description: '', category: 'daily_limits' };
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    await setConfigApi({
      key: formData.value.key,
      value: formData.value.value,
      description: formData.value.description,
      category: formData.value.category,
    });
    message.success('保存成功');
    modalVisible.value = false;
    fetchData();
  } catch (e: any) {
    message.error(e.message || '操作失败');
  }
}

onMounted(fetchData);
</script>

<template>
  <Page title="运营参数">
    <Card>
      <div class="mb-4">
        <Button type="primary" @click="openCreate">新增参数</Button>
      </div>
      <Table :columns="columns" :data-source="dataSource" :loading="loading" row-key="id" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button size="small" @click="openEdit(record)">编辑</Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="modalVisible" title="编辑参数" @ok="handleSubmit">
      <div class="grid gap-4">
        <div>
          <label class="block mb-1 text-sm">参数键</label>
          <Input v-model:value="formData.key" placeholder="如: daily_free_draws" />
        </div>
        <div>
          <label class="block mb-1 text-sm">参数值</label>
          <Input.TextArea v-model:value="formData.value" :rows="4" />
        </div>
        <div>
          <label class="block mb-1 text-sm">分类</label>
          <Select v-model:value="formData.category" :options="[
            { label:'每日限制', value:'daily_limits' },
            { label:'奖励', value:'rewards' },
            { label:'重复卡规则', value:'duplicate_rules' },
          ]" style="width:100%" />
        </div>
        <div>
          <label class="block mb-1 text-sm">说明</label>
          <Input v-model:value="formData.description" />
        </div>
      </div>
    </Modal>
  </Page>
</template>

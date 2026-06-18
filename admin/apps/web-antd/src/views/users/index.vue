<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Page } from '@vben/common-ui';
import { Button, Card, message, Modal, Space, Table, Tag, Input, Select } from 'ant-design-vue';
import { getUsersApi, createUserApi, updateUserApi, deleteUserApi } from '#/api/users';

const loading = ref(false);
const dataSource = ref<any[]>([]);
const modalVisible = ref(false);
const modalTitle = ref('新增用户');
const editingId = ref<number | null>(null);
const formData = ref<Record<string, any>>({});

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '用户名', dataIndex: 'username', width: 120 },
  { title: '显示名', dataIndex: 'display_name', width: 120 },
  { title: '角色', dataIndex: 'role', width: 100 },
  { title: '状态', dataIndex: 'is_active', width: 80 },
  { title: '创建时间', dataIndex: 'created_at', width: 160 },
  { title: '操作', key: 'action', width: 160 },
];

const roleOptions = [
  { label: '超级管理员', value: 'super_admin' },
  { label: '管理员', value: 'admin' },
  { label: '运营', value: 'operator' },
  { label: '观察者', value: 'viewer' },
];

async function fetchData() {
  loading.value = true;
  try {
    dataSource.value = await getUsersApi();
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formData.value = { role: 'viewer' };
  modalTitle.value = '新增用户';
  modalVisible.value = true;
}

function openEdit(record: any) {
  editingId.value = record.id;
  formData.value = { display_name: record.display_name, role: record.role, is_active: record.is_active };
  modalTitle.value = '编辑用户';
  modalVisible.value = true;
}

async function handleSubmit() {
  try {
    if (editingId.value) {
      await updateUserApi(editingId.value, formData.value);
    } else {
      await createUserApi(formData.value);
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
    title: '确认禁用此用户？',
    onOk: async () => {
      await deleteUserApi(id);
      message.success('已禁用');
      fetchData();
    },
  });
}

onMounted(fetchData);
</script>

<template>
  <Page title="用户管理">
    <Card>
      <div class="mb-4">
        <Button type="primary" @click="openCreate">新增用户</Button>
      </div>
      <Table :columns="columns" :data-source="dataSource" :loading="loading" row-key="id" size="small">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'role'">
            <Tag>{{ record.role }}</Tag>
          </template>
          <template v-if="column.key === 'is_active'">
            <Tag :color="record.is_active ? 'green' : 'red'">{{ record.is_active ? '启用' : '禁用' }}</Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button size="small" @click="openEdit(record)">编辑</Button>
              <Button size="small" danger @click="handleDelete(record.id)">禁用</Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal v-model:open="modalVisible" :title="modalTitle" @ok="handleSubmit">
      <div class="grid gap-4">
        <div v-if="!editingId">
          <label class="block mb-1 text-sm">用户名</label>
          <Input v-model:value="formData.username" />
        </div>
        <div v-if="!editingId">
          <label class="block mb-1 text-sm">密码</label>
          <Input.Password v-model:value="formData.password" />
        </div>
        <div>
          <label class="block mb-1 text-sm">显示名</label>
          <Input v-model:value="formData.display_name" />
        </div>
        <div>
          <label class="block mb-1 text-sm">角色</label>
          <Select v-model:value="formData.role" :options="roleOptions" style="width:100%" />
        </div>
      </div>
    </Modal>
  </Page>
</template>

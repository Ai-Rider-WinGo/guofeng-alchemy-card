<template>
  <div>
    <h2>后台账号管理</h2>

    <a-card size="small" style="margin-bottom: 12px">
      <a-space>
        <a-button type="primary" @click="openCreate">+ 新增账号</a-button>
        <span style="color:#999;font-size:12px">
          管理后台运营人员账号。玩家账号体系待后端玩家运行时接入后单独管理。
        </span>
      </a-space>
    </a-card>

    <a-table
      :columns="columns"
      :data-source="list"
      :loading="loading"
      row-key="id"
      size="small"
      :pagination="false"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'username'">
          <strong>{{ record.username }}</strong>
        </template>
        <template v-if="column.key === 'role'">
          <a-tag :color="roleColor(record.role)">{{ roleLabel(record.role) }}</a-tag>
        </template>
        <template v-if="column.key === 'is_active'">
          <a-badge :status="record.is_active ? 'success' : 'default'" :text="record.is_active ? '启用' : '禁用'" />
        </template>
        <template v-if="column.key === 'actions'">
          <a-space size="small">
            <a-button size="small" type="link" @click="openEdit(record)">编辑</a-button>
            <a-button size="small" type="link" @click="toggleActive(record)">
              {{ record.is_active ? '禁用' : '启用' }}
            </a-button>
            <a-popconfirm
              v-if="record.id !== currentUserId"
              title="确定删除（将禁用）该账号？"
              @confirm="handleDelete(record.id)"
            >
              <a-button size="small" type="link" danger>删除</a-button>
            </a-popconfirm>
            <span v-else style="color:#ccc;font-size:11px">（当前账号）</span>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      v-model:open="modalOpen"
      :title="modalTitle"
      :confirm-loading="saving"
      @ok="handleSave"
      width="520px"
    >
      <a-form :model="form" :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <a-form-item label="用户名" required>
          <a-input v-model:value="form.username" :disabled="isEditing" placeholder="登录用户名" />
        </a-form-item>
        <a-form-item :label="isEditing ? '新密码' : '密码'" :required="!isEditing">
          <a-input-password v-model:value="form.password" :placeholder="isEditing ? '留空则不修改' : '登录密码'" />
        </a-form-item>
        <a-form-item label="显示名">
          <a-input v-model:value="form.display_name" placeholder="昵称" />
        </a-form-item>
        <a-form-item label="角色">
          <a-select v-model:value="form.role">
            <a-select-option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.label }}</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import request from '../api/request';

const roleOptions = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '管理员' },
  { value: 'operator', label: '运营' },
  { value: 'viewer', label: '只读' },
];
const roleLabel = (r) => (roleOptions.find((o) => o.value === r) || {}).label || r;
const roleColor = (r) => ({ super_admin: 'gold', admin: 'purple', operator: 'blue', viewer: 'default' }[r] || 'default');

const columns = [
  { title: 'ID', dataIndex: 'id', width: 50 },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 140 },
  { title: '显示名', dataIndex: 'display_name', width: 140 },
  { title: '角色', dataIndex: 'role', key: 'role', width: 110 },
  { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 90 },
  { title: '创建时间', dataIndex: 'created_at', width: 170, customRender: ({ text }) => text ? new Date(text).toLocaleString('zh-CN') : '—' },
  { title: '操作', key: 'actions', width: 220 },
];

const loading = ref(false);
const list = ref([]);
const currentUserId = computed(() => {
  try {
    const token = localStorage.getItem('admin_token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return null;
  }
});

const modalOpen = ref(false);
const modalTitle = ref('');
const isEditing = ref(false);
const editId = ref(null);
const saving = ref(false);
const form = reactive({ username: '', password: '', display_name: '', role: 'viewer' });

async function fetchData() {
  loading.value = true;
  try {
    list.value = await request.get('/users');
  } catch (e) {
    message.error('加载用户失败: ' + (e.message || ''));
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEditing.value = false;
  editId.value = null;
  Object.assign(form, { username: '', password: '', display_name: '', role: 'viewer' });
  modalTitle.value = '新增账号';
  modalOpen.value = true;
}
function openEdit(record) {
  isEditing.value = true;
  editId.value = record.id;
  Object.assign(form, {
    username: record.username,
    password: '',
    display_name: record.display_name || '',
    role: record.role,
  });
  modalTitle.value = '编辑 ' + record.username;
  modalOpen.value = true;
}

async function handleSave() {
  if (!isEditing.value && !form.password) {
    message.error('请输入密码');
    return;
  }
  saving.value = true;
  try {
    if (isEditing.value) {
      const data = { display_name: form.display_name, role: form.role };
      if (form.password) data.password = form.password;
      await request.put(`/users/${editId.value}`, data);
      message.success('账号已更新');
    } else {
      await request.post('/users', {
        username: form.username,
        password: form.password,
        display_name: form.display_name,
        role: form.role,
      });
      message.success('账号已创建');
    }
    modalOpen.value = false;
    fetchData();
  } catch (e) {
    message.error('保存失败: ' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}

async function toggleActive(record) {
  try {
    await request.put(`/users/${record.id}`, { is_active: !record.is_active });
    message.success(`${record.username} 已${record.is_active ? '禁用' : '启用'}`);
    fetchData();
  } catch (e) {
    message.error('操作失败: ' + (e.message || ''));
  }
}

async function handleDelete(id) {
  try {
    await request.delete(`/users/${id}`);
    message.success('已禁用');
    fetchData();
  } catch (e) {
    message.error('删除失败: ' + (e.message || ''));
  }
}

onMounted(fetchData);
</script>

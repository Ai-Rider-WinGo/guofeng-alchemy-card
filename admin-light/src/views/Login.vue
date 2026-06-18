<template>
  <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #001529;">
    <a-card title="国风炼金 · 后台管理" style="width: 400px;">
      <a-form :model="form" @finish="handleLogin">
        <a-form-item name="username" :rules="[{ required: true, message: '请输入用户名' }]">
          <a-input v-model:value="form.username" placeholder="用户名" size="large" />
        </a-form-item>
        <a-form-item name="password" :rules="[{ required: true, message: '请输入密码' }]">
          <a-input-password v-model:value="form.password" placeholder="密码" size="large" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit" block size="large" :loading="loading">登录</a-button>
        </a-form-item>
      </a-form>
      <div style="text-align: center; color: #888; font-size: 12px;">默认账号: admin / admin123</div>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import request from '../api/request';

const form = ref({ username: 'admin', password: 'admin123' });
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  try {
    const data = await request.post('/auth/login', form.value);
    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_user', JSON.stringify(data.user));
    window.location.href = '/';
  } catch (e) {
    alert('登录失败: ' + (e.response?.data?.message || e.message));
  } finally {
    loading.value = false;
  }
}
</script>

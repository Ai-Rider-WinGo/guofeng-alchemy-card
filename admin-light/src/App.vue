<template>
  <!-- Login page: no sidebar -->
  <div v-if="isLoginPage">
    <router-view />
  </div>

  <!-- Authenticated layout -->
  <a-layout v-else style="min-height: 100vh">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div style="color: #fff; text-align: center; padding: 16px; font-weight: bold; white-space: nowrap;">
        🏯 {{ collapsed ? '' : '国风炼金后台' }}
      </div>
      <a-menu
        v-model:selectedKeys="selectedKeys"
        theme="dark"
        mode="inline"
        @click="handleMenuClick"
      >
        <a-menu-item key="dashboard">
          <dashboard-outlined /><span>数据看板</span>
        </a-menu-item>
        <a-menu-item key="cards">
          <appstore-outlined /><span>卡牌总表</span>
        </a-menu-item>
        <a-menu-item key="prompt-rules">
          <bulb-outlined /><span>提示词规则</span>
        </a-menu-item>
        <a-menu-item key="pools">
          <gold-outlined /><span>卡池配置</span>
        </a-menu-item>
        <a-menu-item key="merge-rules">
          <merge-cells-outlined /><span>合成规则</span>
        </a-menu-item>
        <a-menu-item key="configs">
          <setting-outlined /><span>运营参数</span>
        </a-menu-item>
        <a-menu-item key="users">
          <team-outlined /><span>用户管理</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 24px; display: flex; justify-content: space-between; align-items: center;">
        <span></span>
        <span>
          👤 {{ username }}
          <a-button type="link" @click="handleLogout">退出</a-button>
        </span>
      </a-layout-header>
      <a-layout-content style="margin: 16px;">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  DashboardOutlined,
  AppstoreOutlined,
  BulbOutlined,
  GoldOutlined,
  MergeCellsOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);
const selectedKeys = ref(['dashboard']);

const isLoginPage = computed(() => route.path === '/login');

const username = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('admin_user') || '{}');
    return user.display_name || user.username || 'admin';
  } catch { return 'admin'; }
});

function handleMenuClick({ key }) {
  router.push(`/${key}`);
}

function handleLogout() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
  router.push('/login');
}
</script>

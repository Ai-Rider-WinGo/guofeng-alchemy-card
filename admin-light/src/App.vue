<template>
  <a-layout style="min-height: 100vh">
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
          <appstore-outlined /><span>卡牌管理</span>
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
      <a-layout-header style="background: #fff; padding: 0 24px; display: flex; justify-content: flex-end; align-items: center;">
        <span>👤 admin</span>
      </a-layout-header>
      <a-layout-content style="margin: 16px;">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  DashboardOutlined,
  AppstoreOutlined,
  GoldOutlined,
  MergeCellsOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';

const router = useRouter();
const collapsed = ref(false);
const selectedKeys = ref(['dashboard']);

function handleMenuClick({ key }) {
  router.push(`/${key}`);
}
</script>

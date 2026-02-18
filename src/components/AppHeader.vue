<template>
  <header class="app-header">
    <div class="header-inner">
      <router-link to="/" class="logo">FOHOW Exchange</router-link>

      <nav class="nav-links">
        <router-link to="/">Каталог</router-link>
        <template v-if="authStore.isAuthenticated">
          <router-link to="/listings/create">+ Объявление</router-link>
          <router-link to="/my/listings">Мои объявления</router-link>
          <router-link to="/my/deals">Сделки</router-link>
          <router-link to="/profile">Профиль</router-link>
          <button class="btn-logout" @click="handleLogout">Выход</button>
        </template>
        <template v-else>
          <router-link to="/login">Войти</router-link>
          <router-link to="/register">Регистрация</router-link>
        </template>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-header {
  background: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
  text-decoration: none;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.nav-links a {
  font-size: 14px;
  color: var(--gray-700);
  text-decoration: none;
}
.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--primary);
}
.btn-logout {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--gray-500);
}
.btn-logout:hover {
  color: var(--danger);
}
</style>

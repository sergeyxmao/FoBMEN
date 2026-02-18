<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1 class="page-title">Вход</h1>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" required placeholder="your@email.com" />
        </div>
        <div class="form-group">
          <label>Пароль</label>
          <input v-model="password" type="password" required placeholder="Введите пароль" />
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading" style="width: 100%">
          {{ loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
      <p style="margin-top: 16px; text-align: center">
        Нет аккаунта? <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  padding-top: 60px;
}
.auth-card {
  max-width: 400px;
  width: 100%;
}
</style>

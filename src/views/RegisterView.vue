<template>
  <div class="auth-page">
    <div class="auth-card card">
      <h1 class="page-title">Регистрация</h1>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Email *</label>
          <input v-model="form.email" type="email" required placeholder="your@email.com" />
        </div>
        <div class="form-group">
          <label>Пароль *</label>
          <input v-model="form.password" type="password" required minlength="6" placeholder="Минимум 6 символов" />
        </div>
        <div class="form-group">
          <label>Полное имя *</label>
          <input v-model="form.full_name" type="text" required placeholder="Иван Иванов" />
        </div>
        <div class="form-group">
          <label>Город</label>
          <input v-model="form.city" type="text" placeholder="Москва" />
        </div>
        <div class="form-group">
          <label>Телефон</label>
          <input v-model="form.phone" type="tel" placeholder="+7 (999) 123-45-67" />
        </div>
        <p v-if="error" class="error-message">{{ error }}</p>
        <button type="submit" class="btn btn-primary" :disabled="loading" style="width: 100%">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>
      <p style="margin-top: 16px; text-align: center">
        Уже есть аккаунт? <router-link to="/login">Войти</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: '',
  full_name: '',
  city: '',
  phone: ''
})
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    await authStore.register(form)
    router.push('/')
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
  padding-top: 40px;
}
.auth-card {
  max-width: 400px;
  width: 100%;
}
</style>

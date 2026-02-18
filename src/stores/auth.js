import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '../composables/useApi'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const api = useApi()

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    return data
  }

  async function register(userData) {
    const data = await api.post('/auth/register', userData)
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    return data
  }

  async function fetchMe() {
    try {
      const data = await api.get('/auth/me')
      user.value = data
    } catch (err) {
      logout()
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  return { user, token, isAuthenticated, isAdmin, login, register, fetchMe, logout }
})

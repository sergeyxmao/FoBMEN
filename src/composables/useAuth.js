import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

export function useAuth() {
  const store = useAuthStore()

  const isAuthenticated = computed(() => store.isAuthenticated)
  const isAdmin = computed(() => store.isAdmin)
  const currentUser = computed(() => store.user)

  function requireAuth() {
    if (!store.isAuthenticated) {
      window.location.href = '/login'
      return false
    }
    return true
  }

  return { isAuthenticated, isAdmin, currentUser, requireAuth }
}

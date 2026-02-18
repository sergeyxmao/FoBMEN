import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationsStore = defineStore('notifications', () => {
  const messages = ref([])

  function addNotification(message, type = 'info') {
    const id = Date.now()
    messages.value.push({ id, message, type })
    setTimeout(() => {
      removeNotification(id)
    }, 5000)
  }

  function removeNotification(id) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  function success(message) {
    addNotification(message, 'success')
  }

  function error(message) {
    addNotification(message, 'error')
  }

  return { messages, addNotification, removeNotification, success, error }
})

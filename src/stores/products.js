import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '../composables/useApi'

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const loading = ref(false)

  const api = useApi()

  async function fetchProducts(params = {}) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (params.category) query.set('category', params.category)
      if (params.search) query.set('search', params.search)

      const qs = query.toString()
      products.value = await api.get(`/products${qs ? '?' + qs : ''}`)
    } finally {
      loading.value = false
    }
  }

  async function fetchProduct(id) {
    return await api.get(`/products/${id}`)
  }

  return { products, loading, fetchProducts, fetchProduct }
})

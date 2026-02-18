import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useApi } from '../composables/useApi'

export const useListingsStore = defineStore('listings', () => {
  const listings = ref([])
  const myListings = ref([])
  const total = ref(0)
  const loading = ref(false)

  const api = useApi()

  async function fetchListings(params = {}) {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (params.city) query.set('city', params.city)
      if (params.category) query.set('category', params.category)
      if (params.product_id) query.set('product_id', params.product_id)
      if (params.page) query.set('page', params.page)

      const qs = query.toString()
      const data = await api.get(`/listings${qs ? '?' + qs : ''}`)
      listings.value = data.items
      total.value = data.total
      return data
    } finally {
      loading.value = false
    }
  }

  async function fetchListing(id) {
    return await api.get(`/listings/${id}`)
  }

  async function fetchMyListings() {
    loading.value = true
    try {
      myListings.value = await api.get('/listings/my')
    } finally {
      loading.value = false
    }
  }

  async function createListing(data) {
    return await api.post('/listings', data)
  }

  async function updateListing(id, data) {
    return await api.put(`/listings/${id}`, data)
  }

  async function deleteListing(id) {
    return await api.del(`/listings/${id}`)
  }

  return { listings, myListings, total, loading, fetchListings, fetchListing, fetchMyListings, createListing, updateListing, deleteListing }
})

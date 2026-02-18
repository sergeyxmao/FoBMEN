<template>
  <div>
    <h1 class="page-title">Каталог обменов</h1>

    <div class="filters">
      <input v-model="filters.city" placeholder="Город" @input="loadListings" />
      <select v-model="filters.category" @change="loadListings">
        <option value="">Все категории</option>
        <option value="supplements">БАДы</option>
        <option value="cosmetics">Косметика</option>
        <option value="food">Питание</option>
        <option value="devices">Приборы</option>
        <option value="other">Другое</option>
      </select>
      <router-link v-if="authStore.isAuthenticated" to="/listings/create" class="btn btn-primary">
        + Создать объявление
      </router-link>
    </div>

    <div v-if="loading" class="empty-state">Загрузка...</div>

    <div v-else-if="listings.length === 0" class="empty-state">
      <p>Объявлений пока нет</p>
    </div>

    <div v-else class="grid">
      <ListingCard
        v-for="listing in listings"
        :key="listing.id"
        :listing="listing"
      />
    </div>

    <div v-if="total > 20" class="pagination">
      <button
        class="btn btn-secondary btn-sm"
        :disabled="page <= 1"
        @click="changePage(page - 1)"
      >
        Назад
      </button>
      <span>Страница {{ page }}</span>
      <button
        class="btn btn-secondary btn-sm"
        :disabled="listings.length < 20"
        @click="changePage(page + 1)"
      >
        Далее
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useListingsStore } from '../stores/listings'
import { useAuthStore } from '../stores/auth'
import ListingCard from '../components/ListingCard.vue'

const listingsStore = useListingsStore()
const authStore = useAuthStore()

const listings = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const filters = reactive({ city: '', category: '' })

async function loadListings() {
  loading.value = true
  try {
    const data = await listingsStore.fetchListings({ ...filters, page: page.value })
    listings.value = data.items
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function changePage(newPage) {
  page.value = newPage
  loadListings()
}

onMounted(loadListings)
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}
</style>

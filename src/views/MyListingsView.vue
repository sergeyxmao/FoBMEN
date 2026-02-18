<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px">
      <h1 class="page-title">Мои объявления</h1>
      <router-link to="/listings/create" class="btn btn-primary">+ Создать</router-link>
    </div>

    <div v-if="loading" class="empty-state">Загрузка...</div>

    <div v-else-if="listings.length === 0" class="empty-state">
      <p>У вас пока нет объявлений</p>
      <router-link to="/listings/create" class="btn btn-primary" style="margin-top: 16px">Создать первое</router-link>
    </div>

    <div v-else>
      <div v-for="listing in listings" :key="listing.id" class="card listing-item">
        <div class="listing-row">
          <div class="listing-main">
            <router-link :to="`/listing/${listing.id}`" class="listing-title">
              {{ listing.product_name }}
            </router-link>
            <span :class="'badge badge-' + listing.status">{{ statusLabel(listing.status) }}</span>
            <span v-if="listing.offers_count > 0" class="badge badge-pending">
              {{ listing.offers_count }} предложений
            </span>
          </div>
          <div class="listing-meta">
            {{ listing.quantity }} шт. &middot; {{ conditionLabel(listing.condition) }} &middot; {{ listing.views_count }} просмотров
          </div>
        </div>
        <div class="listing-actions">
          <router-link :to="`/listing/${listing.id}`" class="btn btn-secondary btn-sm">Открыть</router-link>
          <button
            v-if="listing.status === 'active'"
            class="btn btn-danger btn-sm"
            @click="cancelListing(listing.id)"
          >
            Отменить
          </button>
        </div>
      </div>
    </div>

    <h2 v-if="incomingOffers.length > 0" style="margin-top: 32px; margin-bottom: 16px">Входящие предложения</h2>
    <div v-for="offer in incomingOffers" :key="offer.id" class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px">
        <div>
          <strong>{{ offer.from_user_name }}</strong> предлагает обмен на <strong>{{ offer.product_name }}</strong>
          <p v-if="offer.message" style="color: var(--gray-700); margin-top: 4px">{{ offer.message }}</p>
        </div>
        <div v-if="offer.status === 'pending'" style="display: flex; gap: 8px">
          <button class="btn btn-primary btn-sm" @click="acceptOffer(offer.id)">Принять</button>
          <button class="btn btn-danger btn-sm" @click="rejectOffer(offer.id)">Отклонить</button>
        </div>
        <span v-else :class="'badge badge-' + offer.status">{{ offer.status }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useListingsStore } from '../stores/listings'
import { useApi } from '../composables/useApi'

const listingsStore = useListingsStore()
const api = useApi()

const listings = ref([])
const incomingOffers = ref([])
const loading = ref(true)

function statusLabel(s) {
  const map = { active: 'Активно', paused: 'На паузе', completed: 'Завершено', cancelled: 'Отменено' }
  return map[s] || s
}

function conditionLabel(c) {
  const map = { new: 'Новый', opened: 'Вскрытый', used: 'Б/У' }
  return map[c] || c
}

async function load() {
  loading.value = true
  try {
    await listingsStore.fetchMyListings()
    listings.value = listingsStore.myListings
    incomingOffers.value = await api.get('/offers/incoming')
  } finally {
    loading.value = false
  }
}

async function cancelListing(id) {
  if (confirm('Отменить объявление?')) {
    await listingsStore.deleteListing(id)
    await load()
  }
}

async function acceptOffer(id) {
  await api.put(`/offers/${id}/accept`)
  await load()
}

async function rejectOffer(id) {
  await api.put(`/offers/${id}/reject`)
  await load()
}

onMounted(load)
</script>

<style scoped>
.listing-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}
.listing-title {
  font-weight: 600;
  font-size: 16px;
}
.listing-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.listing-meta {
  font-size: 13px;
  color: var(--gray-500);
  margin-top: 4px;
}
.listing-actions {
  display: flex;
  gap: 8px;
}
</style>

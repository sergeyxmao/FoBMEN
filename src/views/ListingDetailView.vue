<template>
  <div v-if="loading" class="empty-state">Загрузка...</div>

  <div v-else-if="listing" class="listing-detail">
    <router-link to="/" class="back-link">&larr; Назад к каталогу</router-link>

    <div class="card" style="margin-top: 12px">
      <div class="listing-header">
        <h1 class="page-title">{{ listing.product_name }}</h1>
        <span :class="'badge badge-' + listing.status">{{ statusLabel(listing.status) }}</span>
      </div>

      <div class="listing-info">
        <div class="info-row">
          <span class="label">Категория:</span>
          <span>{{ categoryLabel(listing.product_category) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Количество:</span>
          <span>{{ listing.quantity }} шт.</span>
        </div>
        <div class="info-row">
          <span class="label">Состояние:</span>
          <span>{{ conditionLabel(listing.condition) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Город:</span>
          <span>{{ listing.city || listing.user_city || 'Не указан' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Автор:</span>
          <span>{{ listing.user_name }}</span>
        </div>
        <div class="info-row">
          <span class="label">Просмотры:</span>
          <span>{{ listing.views_count }}</span>
        </div>
      </div>

      <div v-if="listing.description" class="description">
        <h3>Описание</h3>
        <p>{{ listing.description }}</p>
      </div>

      <div v-if="listing.wanted_description" class="description">
        <h3>Что хочу взамен</h3>
        <p>{{ listing.wanted_description }}</p>
      </div>

      <div v-if="authStore.isAuthenticated && listing.user_id !== authStore.user?.id && listing.status === 'active'" style="margin-top: 20px">
        <button class="btn btn-primary" @click="showOffer = true">Предложить обмен</button>
      </div>
    </div>

    <OfferModal
      v-if="showOffer"
      :listing-id="listing.id"
      @close="showOffer = false"
      @sent="onOfferSent"
    />
  </div>

  <div v-else class="empty-state">Объявление не найдено</div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useListingsStore } from '../stores/listings'
import { useAuthStore } from '../stores/auth'
import OfferModal from '../components/OfferModal.vue'

const route = useRoute()
const listingsStore = useListingsStore()
const authStore = useAuthStore()

const listing = ref(null)
const loading = ref(true)
const showOffer = ref(false)

function statusLabel(s) {
  const map = { active: 'Активно', paused: 'На паузе', completed: 'Завершено', cancelled: 'Отменено' }
  return map[s] || s
}

function categoryLabel(c) {
  const map = { supplements: 'БАДы', cosmetics: 'Косметика', food: 'Питание', devices: 'Приборы', other: 'Другое' }
  return map[c] || c
}

function conditionLabel(c) {
  const map = { new: 'Новый', opened: 'Вскрытый', used: 'Б/У' }
  return map[c] || c
}

function onOfferSent() {
  showOffer.value = false
  alert('Предложение отправлено!')
}

onMounted(async () => {
  try {
    listing.value = await listingsStore.fetchListing(route.params.id)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.back-link {
  color: var(--gray-700);
  font-size: 14px;
}
.listing-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.listing-info {
  margin-top: 16px;
}
.info-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-200);
}
.info-row .label {
  font-weight: 500;
  width: 140px;
  flex-shrink: 0;
  color: var(--gray-700);
}
.description {
  margin-top: 16px;
}
.description h3 {
  font-size: 16px;
  margin-bottom: 8px;
}
</style>

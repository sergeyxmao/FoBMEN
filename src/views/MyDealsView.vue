<template>
  <div>
    <h1 class="page-title">Мои сделки</h1>

    <div v-if="loading" class="empty-state">Загрузка...</div>

    <div v-else-if="deals.length === 0" class="empty-state">
      <p>У вас пока нет сделок</p>
    </div>

    <div v-else>
      <div v-for="deal in deals" :key="deal.id" class="card deal-item">
        <div class="deal-info">
          <div class="deal-header">
            <strong>{{ deal.product_name }}</strong>
            <span :class="'badge badge-' + deal.status">{{ statusLabel(deal.status) }}</span>
          </div>
          <div class="deal-parties">
            <span>Продавец: {{ deal.seller_name }}</span>
            <span>Покупатель: {{ deal.buyer_name }}</span>
          </div>
          <div class="deal-confirmations">
            <span :class="deal.seller_confirmed ? 'confirmed' : 'pending'">
              Продавец: {{ deal.seller_confirmed ? 'Подтвердил' : 'Ожидает' }}
            </span>
            <span :class="deal.buyer_confirmed ? 'confirmed' : 'pending'">
              Покупатель: {{ deal.buyer_confirmed ? 'Подтвердил' : 'Ожидает' }}
            </span>
          </div>
        </div>
        <div v-if="deal.status === 'in_progress'" class="deal-actions">
          <button
            v-if="!isConfirmed(deal)"
            class="btn btn-primary btn-sm"
            @click="confirmDeal(deal.id)"
          >
            Подтвердить
          </button>
          <button class="btn btn-danger btn-sm" @click="cancelDeal(deal.id)">Отменить</button>
        </div>
        <div v-if="deal.status === 'completed' && !deal.reviewed" class="deal-actions">
          <button class="btn btn-primary btn-sm" @click="openReview(deal)">Оставить отзыв</button>
        </div>
      </div>
    </div>

    <!-- Review modal -->
    <div v-if="reviewDeal" class="modal-overlay" @click.self="reviewDeal = null">
      <div class="modal">
        <h3>Отзыв о сделке</h3>
        <div class="form-group">
          <label>Оценка</label>
          <div class="rating-select">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              :class="{ active: reviewRating >= n }"
              @click="reviewRating = n"
            >
              {{ n <= reviewRating ? '\u2605' : '\u2606' }}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="reviewComment" placeholder="Ваш отзыв"></textarea>
        </div>
        <div style="display: flex; gap: 8px">
          <button class="btn btn-primary" @click="submitReview">Отправить</button>
          <button class="btn btn-secondary" @click="reviewDeal = null">Отмена</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import { useAuthStore } from '../stores/auth'

const api = useApi()
const authStore = useAuthStore()

const deals = ref([])
const loading = ref(true)
const reviewDeal = ref(null)
const reviewRating = ref(5)
const reviewComment = ref('')

function statusLabel(s) {
  const map = { in_progress: 'В процессе', completed: 'Завершена', disputed: 'Спор', cancelled: 'Отменена' }
  return map[s] || s
}

function isConfirmed(deal) {
  const userId = authStore.user?.id
  if (deal.seller_id === userId) return deal.seller_confirmed
  if (deal.buyer_id === userId) return deal.buyer_confirmed
  return false
}

async function load() {
  loading.value = true
  try {
    deals.value = await api.get('/deals/my')
  } finally {
    loading.value = false
  }
}

async function confirmDeal(id) {
  await api.put(`/deals/${id}/confirm`)
  await load()
}

async function cancelDeal(id) {
  if (confirm('Отменить сделку?')) {
    await api.put(`/deals/${id}/cancel`)
    await load()
  }
}

function openReview(deal) {
  reviewDeal.value = deal
  reviewRating.value = 5
  reviewComment.value = ''
}

async function submitReview() {
  await api.post('/reviews', {
    deal_id: reviewDeal.value.id,
    rating: reviewRating.value,
    comment: reviewComment.value || undefined
  })
  reviewDeal.value = null
  await load()
}

onMounted(load)
</script>

<style scoped>
.deal-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
}
.deal-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.deal-parties {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--gray-700);
  margin-top: 4px;
}
.deal-confirmations {
  display: flex;
  gap: 16px;
  font-size: 13px;
  margin-top: 4px;
}
.confirmed { color: var(--success); }
.pending { color: var(--gray-500); }
.deal-actions {
  display: flex;
  gap: 8px;
}
.rating-select button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--warning);
}
</style>

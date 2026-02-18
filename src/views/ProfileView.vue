<template>
  <div>
    <h1 class="page-title">Профиль</h1>

    <div v-if="user" class="card" style="max-width: 600px">
      <div class="profile-info">
        <div class="info-row">
          <span class="label">Имя:</span>
          <span>{{ user.full_name || 'Не указано' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span>{{ user.email }}</span>
        </div>
        <div class="info-row">
          <span class="label">Город:</span>
          <span>{{ user.city || 'Не указан' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Телефон:</span>
          <span>{{ user.phone || 'Не указан' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Telegram:</span>
          <span>{{ user.telegram_user || 'Не указан' }}</span>
        </div>
        <div class="info-row">
          <span class="label">Роль:</span>
          <span>{{ user.role }}</span>
        </div>
      </div>

      <h3 style="margin-top: 24px; margin-bottom: 12px">Отзывы обо мне</h3>

      <div v-if="reviewsData">
        <div style="margin-bottom: 12px">
          <span class="stars">{{ '\u2605'.repeat(Math.round(reviewsData.average_rating || 0)) }}</span>
          <span v-if="reviewsData.average_rating"> {{ reviewsData.average_rating }} / 5</span>
          <span style="color: var(--gray-500)"> ({{ reviewsData.total_reviews }} отзывов)</span>
        </div>

        <div v-for="review in reviewsData.reviews" :key="review.id" class="review-item">
          <div class="review-header">
            <span class="stars">{{ '\u2605'.repeat(review.rating) }}{{ '\u2606'.repeat(5 - review.rating) }}</span>
            <span class="review-author">{{ review.from_user_name }}</span>
          </div>
          <p v-if="review.comment">{{ review.comment }}</p>
        </div>

        <div v-if="reviewsData.reviews.length === 0" class="empty-state" style="padding: 20px">
          Отзывов пока нет
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useApi } from '../composables/useApi'

const authStore = useAuthStore()
const api = useApi()

const user = ref(null)
const reviewsData = ref(null)

onMounted(async () => {
  await authStore.fetchMe()
  user.value = authStore.user

  if (user.value) {
    reviewsData.value = await api.get(`/reviews/user/${user.value.id}`)
  }
})
</script>

<style scoped>
.info-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-200);
}
.info-row .label {
  font-weight: 500;
  width: 120px;
  flex-shrink: 0;
  color: var(--gray-700);
}
.review-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--gray-200);
}
.review-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.review-author {
  font-size: 13px;
  color: var(--gray-500);
}
</style>

<template>
  <router-link :to="`/listing/${listing.id}`" class="card listing-card">
    <div class="card-header">
      <span class="product-name">{{ listing.product_name }}</span>
      <span :class="'badge badge-' + listing.product_category">{{ categoryLabel(listing.product_category) }}</span>
    </div>
    <div class="card-body">
      <div class="detail">{{ listing.quantity }} шт. &middot; {{ conditionLabel(listing.condition) }}</div>
      <div v-if="listing.city" class="detail">{{ listing.city }}</div>
      <div v-if="listing.wanted_description" class="wanted">
        Хочу: {{ listing.wanted_description }}
      </div>
    </div>
    <div class="card-footer">
      <span class="author">{{ listing.user_name }}</span>
      <span class="views">{{ listing.views_count }} просм.</span>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  listing: { type: Object, required: true }
})

function categoryLabel(c) {
  const map = { supplements: 'БАДы', cosmetics: 'Косметика', food: 'Питание', devices: 'Приборы', other: 'Другое' }
  return map[c] || c
}

function conditionLabel(c) {
  const map = { new: 'Новый', opened: 'Вскрытый', used: 'Б/У' }
  return map[c] || c
}
</script>

<style scoped>
.listing-card {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
  cursor: pointer;
}
.listing-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  text-decoration: none;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.product-name {
  font-weight: 600;
  font-size: 16px;
}
.card-body {
  margin-bottom: 12px;
}
.detail {
  font-size: 14px;
  color: var(--gray-700);
  margin-bottom: 4px;
}
.wanted {
  font-size: 13px;
  color: var(--primary);
  margin-top: 8px;
  font-style: italic;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--gray-500);
  border-top: 1px solid var(--gray-200);
  padding-top: 8px;
}
</style>

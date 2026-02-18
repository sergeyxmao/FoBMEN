<template>
  <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
    <option value="">Выберите продукт</option>
    <optgroup v-for="(items, cat) in grouped" :key="cat" :label="categoryLabel(cat)">
      <option v-for="p in items" :key="p.id" :value="p.id">
        {{ p.name }}{{ p.retail_price ? ` (${p.retail_price} руб.)` : '' }}
      </option>
    </optgroup>
  </select>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useProductsStore } from '../stores/products'

defineProps({
  modelValue: { type: [String, Number], default: '' }
})
defineEmits(['update:modelValue'])

const productsStore = useProductsStore()

const grouped = computed(() => {
  const groups = {}
  for (const p of productsStore.products) {
    if (!groups[p.category]) groups[p.category] = []
    groups[p.category].push(p)
  }
  return groups
})

function categoryLabel(c) {
  const map = { supplements: 'БАДы', cosmetics: 'Косметика', food: 'Питание', devices: 'Приборы', other: 'Другое' }
  return map[c] || c
}

onMounted(() => {
  if (productsStore.products.length === 0) {
    productsStore.fetchProducts()
  }
})
</script>

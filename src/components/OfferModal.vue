<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h3>Предложить обмен</h3>

      <div class="form-group">
        <label>Что вы предлагаете</label>
        <div v-for="(item, index) in items" :key="index" class="offer-item">
          <ProductSelect v-model="item.product_id" />
          <input v-model.number="item.quantity" type="number" min="1" placeholder="Кол-во" style="width: 80px" />
          <select v-model="item.condition">
            <option value="new">Новый</option>
            <option value="opened">Вскрытый</option>
            <option value="used">Б/У</option>
          </select>
          <button v-if="items.length > 1" type="button" class="btn btn-danger btn-sm" @click="removeItem(index)">X</button>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" @click="addItem" style="margin-top: 8px">
          + Добавить позицию
        </button>
      </div>

      <div class="form-group">
        <label>Сообщение</label>
        <textarea v-model="message" placeholder="Комментарий к предложению"></textarea>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>

      <div style="display: flex; gap: 8px">
        <button class="btn btn-primary" :disabled="loading" @click="submit">
          {{ loading ? 'Отправка...' : 'Отправить предложение' }}
        </button>
        <button class="btn btn-secondary" @click="$emit('close')">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useApi } from '../composables/useApi'
import ProductSelect from './ProductSelect.vue'

const props = defineProps({
  listingId: { type: Number, required: true }
})
const emit = defineEmits(['close', 'sent'])

const api = useApi()
const message = ref('')
const error = ref('')
const loading = ref(false)

const items = reactive([
  { product_id: '', quantity: 1, condition: 'new' }
])

function addItem() {
  items.push({ product_id: '', quantity: 1, condition: 'new' })
}

function removeItem(index) {
  items.splice(index, 1)
}

async function submit() {
  const validItems = items.filter(i => i.product_id)
  if (validItems.length === 0) {
    error.value = 'Выберите хотя бы один продукт'
    return
  }

  error.value = ''
  loading.value = true
  try {
    await api.post('/offers', {
      listing_id: props.listingId,
      message: message.value || undefined,
      items: validItems.map(i => ({
        product_id: parseInt(i.product_id),
        quantity: i.quantity,
        condition: i.condition
      }))
    })
    emit('sent')
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.offer-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.offer-item select,
.offer-item input {
  padding: 6px 8px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius);
  font-size: 14px;
}
</style>

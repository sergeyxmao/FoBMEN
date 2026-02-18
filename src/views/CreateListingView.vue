<template>
  <div>
    <h1 class="page-title">Создать объявление</h1>

    <div class="card" style="max-width: 600px">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Продукт *</label>
          <ProductSelect v-model="form.product_id" />
        </div>
        <div class="form-group">
          <label>Количество *</label>
          <input v-model.number="form.quantity" type="number" min="1" required />
        </div>
        <div class="form-group">
          <label>Состояние *</label>
          <select v-model="form.condition" required>
            <option value="">Выберите</option>
            <option value="new">Новый (запечатанный)</option>
            <option value="opened">Вскрытый</option>
            <option value="used">Б/У</option>
          </select>
        </div>
        <div class="form-group">
          <label>Город</label>
          <input v-model="form.city" type="text" placeholder="Москва" />
        </div>
        <div class="form-group">
          <label>Описание</label>
          <textarea v-model="form.description" placeholder="Дополнительная информация о товаре"></textarea>
        </div>
        <div class="form-group">
          <label>Что хочу взамен</label>
          <textarea v-model="form.wanted_description" placeholder="Опишите, что вы хотели бы получить в обмен"></textarea>
        </div>

        <p v-if="error" class="error-message">{{ error }}</p>

        <div style="display: flex; gap: 12px">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Создание...' : 'Создать объявление' }}
          </button>
          <router-link to="/" class="btn btn-secondary">Отмена</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useListingsStore } from '../stores/listings'
import ProductSelect from '../components/ProductSelect.vue'

const router = useRouter()
const listingsStore = useListingsStore()

const form = reactive({
  product_id: '',
  quantity: 1,
  condition: '',
  city: '',
  description: '',
  wanted_description: ''
})
const error = ref('')
const loading = ref(false)

async function handleSubmit() {
  if (!form.product_id || !form.condition) {
    error.value = 'Заполните обязательные поля'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const result = await listingsStore.createListing({
      ...form,
      product_id: parseInt(form.product_id)
    })
    router.push(`/listing/${result.id}`)
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}
</script>

import { useRouter } from 'vue-router'

const BASE_URL = '/api'

export function useApi() {
  async function request(method, url, body = null) {
    const token = localStorage.getItem('token')
    const headers = { 'Content-Type': 'application/json' }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const options = { method, headers }
    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${url}`, options)

    if (response.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      throw new Error('Unauthorized')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  return {
    get: (url) => request('GET', url),
    post: (url, body) => request('POST', url, body),
    put: (url, body) => request('PUT', url, body),
    del: (url) => request('DELETE', url)
  }
}

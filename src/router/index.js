import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/',
    name: 'catalog',
    component: () => import('../views/CatalogView.vue')
  },
  {
    path: '/listing/:id',
    name: 'listing-detail',
    component: () => import('../views/ListingDetailView.vue')
  },
  {
    path: '/listings/create',
    name: 'create-listing',
    component: () => import('../views/CreateListingView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/listings',
    name: 'my-listings',
    component: () => import('../views/MyListingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/my/deals',
    name: 'my-deals',
    component: () => import('../views/MyDealsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.token) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router

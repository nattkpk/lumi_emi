import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import './style.css'
import App from './App.vue'
const routes = [
  { path: '/', component: () => import('./views/Dashboard.vue') },
  { path: '/manage', component: () => import('./views/ManageData.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)
app.mount('#app')

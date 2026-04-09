import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Manejo global de errores
app.config.errorHandler = (err, instance, info) => {
  console.error('❌ Error global de Vue:', err)
  console.error('Info:', info)
  console.error('Component:', instance)
}

// Manejo de errores no capturados
window.addEventListener('error', (event) => {
  console.error('❌ Error no capturado:', event.error)
  console.error('URL:', event.filename, 'Línea:', event.lineno)
})

// Manejo de promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesa rechazada no manejada:', event.reason)
})

// Inicializar autenticación después de crear Pinia
import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.initializeAuth()

// Verificar que el router esté listo antes de montar
router.isReady().then(() => {
  console.log('✅ Router listo, montando app...')
  console.log('📍 Ruta actual:', router.currentRoute.value.path)
  console.log('📍 Base URL:', import.meta.env.BASE_URL)
  app.mount('#app')
}).catch((error) => {
  console.error('❌ Error inicializando router:', error)
  app.mount('#app') // Montar de todas formas
})

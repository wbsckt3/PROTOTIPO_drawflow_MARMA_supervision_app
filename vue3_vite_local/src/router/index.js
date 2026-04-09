
import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import BitacoraForm from '../views/BitacoraForm.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import ProviderDashboard from '../views/ProviderDashboard.vue'
import ProviderAuth from '../views/ProviderAuth.vue'
import ProfileSelector from '../components/ProfileSelector.vue'
import AuthOverlay from '../components/AuthOverlay.vue'
import { useAuthStore } from '../stores/auth'
import { useAdminStore } from '../stores/admin'

const routes = [
  {
    path: '/',
    redirect: '/auth' // Redirigir a /auth por defecto, el guard manejará la lógica
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthOverlay
  },
  {
    path: '/proveedor-servicios',
    name: 'provider-auth',
    component: ProviderAuth
  },
  {
    path: '/profile-selector',
    name: 'ProfileSelector',
    component: ProfileSelector
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: Dashboard
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboard,
    meta: { requiresAdmin: true }
  },
  {
    path: '/provider',
    name: 'provider',
    component: ProviderDashboard
  },
  {
    path: '/bitacora/:id',
    name: 'bitacora',
    component: BitacoraForm,
    props: true
  }
]

// Obtener el base URL correcto
const baseUrl = import.meta.env.BASE_URL || '/orbix/'
console.log('🔧 Router configurado con base URL:', baseUrl)

const router = createRouter({
  history: createWebHistory(baseUrl),
  routes
})

// Guard de navegación para proteger rutas autenticadas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const adminStore = useAdminStore()
  
  // Verificar que estamos en el dominio correcto (no cambiar www)
  const currentHost = window.location.hostname
  console.log('🔍 Router beforeEach:', {
    to: to.path,
    from: from.path,
    base: baseUrl,
    fullPath: to.fullPath,
    matched: to.matched.length,
    currentHost: currentHost,
    currentUrl: window.location.href
  })
  
  // Si accede directamente a index.html o la ruta está vacía, redirigir a /
  if (to.path.includes('index.html') || to.path === '' || to.path === '/index.html') {
    console.log('🔄 Redirigiendo desde index.html o ruta vacía a /')
    // Usar next() con ruta relativa para mantener el host actual
    next('/')
    return
  }
  
  // Si no hay rutas coincidentes, puede ser un problema con el base path
  if (to.matched.length === 0 && to.path !== '/') {
    console.warn('⚠️ No se encontró ruta para:', to.path)
    console.warn('⚠️ Intentando redirigir a /')
    // Usar next() con ruta relativa para mantener el host actual
    next('/')
    return
  }
  
  // Rutas que requieren autenticación
  const protectedRoutes = ['/profile-selector', '/dashboard', '/admin', '/provider', '/bitacora']
  
  if (protectedRoutes.some(route => to.path.startsWith(route))) {
    if (!authStore.isAuthenticated) {
      console.log('🔒 Redirigiendo a login - usuario no autenticado')
      // Si es la ruta de proveedor, redirigir al login de proveedores
      if (to.path.startsWith('/provider')) {
        next('/proveedor-servicios')
      } else {
        // Usar next() con ruta relativa para mantener el host actual
        next('/auth')
      }
      return
    }
  }
  
  // Si está autenticado y trata de ir a /proveedor-servicios, redirigir al dashboard
  if (to.path === '/proveedor-servicios' && authStore.isAuthenticated) {
    console.log('✅ Usuario autenticado, redirigiendo a provider dashboard')
    next('/provider')
    return
  }
  
  // Verificar acceso de admin para rutas que lo requieren
  if (to.meta.requiresAdmin) {
    if (!adminStore.isAdmin) {
      console.log('🔒 Acceso denegado - no es administrador')
      alert('Acceso denegado. Solo administradores pueden acceder a este panel.')
      // Usar next() con ruta relativa para mantener el host actual
      next('/dashboard')
      return
    }
  }
  
  // Si está autenticado y trata de ir a /auth, redirigir a profile-selector
  if (to.path === '/auth' && authStore.isAuthenticated) {
    console.log('✅ Usuario autenticado, redirigiendo a profile-selector')
    // Usar next() con ruta relativa para mantener el host actual
    next('/profile-selector')
    return
  }
  
  // Si accede a / (raíz) y está autenticado, redirigir directamente a profile-selector
  // Esto evita la doble redirección: / -> /auth -> /profile-selector
  if (to.path === '/' && authStore.isAuthenticated) {
    console.log('✅ Usuario autenticado accediendo a raíz, redirigiendo a profile-selector')
    next('/profile-selector')
    return
  }
  
  // Si accede a / (raíz) y NO está autenticado, redirigir a /auth
  if (to.path === '/' && !authStore.isAuthenticated) {
    console.log('🔒 Usuario no autenticado accediendo a raíz, redirigiendo a /auth')
    next('/auth')
    return
  }
  
  // Asegurar que todas las redirecciones mantengan el host actual
  next()
})

// Logging después de cada navegación
router.afterEach((to, from) => {
  console.log('✅ Navegación completada:', {
    from: from.path,
    to: to.path,
    name: to.name
  })
})

export default router
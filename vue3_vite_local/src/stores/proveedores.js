import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { API_BASE_URL } from '../config/api.js'

export const useProveedoresStore = defineStore('proveedores', () => {
  const oportunidades = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const userLocation = ref(null) // { latitude, longitude }
  
  const authStore = useAuthStore()

  /**
   * Obtener ubicación del usuario
   */
  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada por el navegador'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          }
          userLocation.value = location
          console.log('✅ Ubicación obtenida:', location)
          resolve(location)
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  /**
   * Cargar oportunidades cercanas
   */
  const loadOportunidadesCercanas = async (latitude, longitude, radius = 10) => {
    isLoading.value = true
    error.value = null

    try {
      const url = `${API_BASE_URL}/proveedores/oportunidades?latitude=${latitude}&longitude=${longitude}&radius=${radius}`
      
      console.log('🔍 Cargando oportunidades cercanas desde:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-user-email': authStore.userEmail
        },
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Oportunidades obtenidas:', result)

      if (result.success && result.data) {
        oportunidades.value = result.data
        console.log(`✅ ${result.count} oportunidades cargadas`)
      } else {
        oportunidades.value = []
      }

    } catch (err) {
      console.error('❌ Error cargando oportunidades:', err)
      error.value = err.message
      oportunidades.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Crear propuesta de servicio
   */
  const crearPropuesta = async (propuestaData) => {
    isLoading.value = true
    error.value = null

    try {
      const url = `${API_BASE_URL}/proveedores/propuestas`
      
      console.log('📤 Creando propuesta:', propuestaData)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'x-user-email': authStore.userEmail
        },
        credentials: 'include',
        body: JSON.stringify(propuestaData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ Propuesta creada:', result)

      return result.data

    } catch (err) {
      console.error('❌ Error creando propuesta:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    oportunidades,
    isLoading,
    error,
    userLocation,
    obtenerUbicacion,
    loadOportunidadesCercanas,
    crearPropuesta
  }
})

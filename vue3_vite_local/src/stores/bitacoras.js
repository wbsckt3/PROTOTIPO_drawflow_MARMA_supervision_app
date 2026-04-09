import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { API_BASE_URL } from '../config/api.js'

export const useBitacorasStore = defineStore('bitacoras', () => {
  const bitacoras = ref([])
  const currentBitacora = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const isDemoMode = ref(false)
  
  const authStore = useAuthStore()

  const loadBitacoras = async () => {
    isLoading.value = true
    error.value = null
    
    // Declarar timeoutId fuera del try para que esté disponible en el catch
    let timeoutId = null
    
    try {
      // Validar que tenemos el email del usuario
      if (!authStore.userEmail) {
        console.error('❌ No hay email de usuario disponible')
        error.value = 'No hay usuario autenticado. Por favor, inicia sesión nuevamente.'
        isDemoMode.value = false
        return
      }
      
      console.log('🔍 Cargando bitácoras para supervisor:', authStore.userEmail)
      console.log('🔍 URL:', `${API_BASE_URL}/bitacoras-supervision`)
      
      // Verificar que tenemos el email antes de hacer la petición
      if (!authStore.userEmail) {
        console.error('❌ ERROR: No hay userEmail disponible en authStore')
        console.error('   authStore:', authStore)
        error.value = 'No hay usuario autenticado. Por favor, inicia sesión nuevamente.'
        isDemoMode.value = false
        return
      }
      
      const headers = {
        'Accept': 'application/json',
        'x-user-email': authStore.userEmail
      }
      
      console.log('🔍 Headers que se enviarán:', headers)
      console.log('🔍 Tipo de userEmail:', typeof authStore.userEmail)
      console.log('🔍 Valor de userEmail:', authStore.userEmail)
      
      // Crear un AbortController para timeout (aumentado a 30 segundos para peticiones grandes)
      const controller = new AbortController()
      timeoutId = setTimeout(() => {
        console.warn('⚠️ Timeout alcanzado, abortando petición...')
        controller.abort()
      }, 30000) // 30 segundos timeout (aumentado desde 10)
      
      try {
        const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
          method: 'GET',
          headers: headers,
          credentials: 'include', // 👈 CRÍTICO: Incluir credenciales (cookies, etc.)
          signal: controller.signal
        })
        
        // Limpiar timeout solo si la petición fue exitosa
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
      
        console.log('✅ Respuesta recibida:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('✅ Respuesta del servidor:', result)
      
        // Verificar si la respuesta tiene la estructura esperada
        if (result.success && result.data) {
          let bitacorasData = []
          
          // Si data es un array, usarlo directamente
          if (Array.isArray(result.data)) {
            bitacorasData = result.data
          } 
          // Si data es un objeto único, convertirlo a array
          else if (result.data._id) {
            bitacorasData = [result.data]
          }
          
          // Función auxiliar para convertir fechas de forma segura
          const safeDate = (dateValue) => {
            if (!dateValue) return null
            // Si ya es un Date, verificar que sea válido
            if (dateValue instanceof Date) {
              return isNaN(dateValue.getTime()) ? null : dateValue
            }
            // Si es un objeto con $date (formato MongoDB)
            if (typeof dateValue === 'object' && dateValue.$date) {
              const dateObj = new Date(dateValue.$date)
              return isNaN(dateObj.getTime()) ? null : dateObj
            }
            // Si es un string, intentar parsearlo
            if (typeof dateValue === 'string') {
              const dateObj = new Date(dateValue)
              return isNaN(dateObj.getTime()) ? null : dateObj
            }
            // Intentar convertir directamente
            const dateObj = new Date(dateValue)
            return isNaN(dateObj.getTime()) ? null : dateObj
          }
          
          // Mapear los datos de la API a nuestro formato
          bitacoras.value = bitacorasData.map(bitacora => ({
            _id: bitacora._id,
            unidadNombre: bitacora.unidadResidencial?.nombre || bitacora.cliente || 'Unidad sin nombre',
            supervisor: bitacora.supervisor || bitacora.supervisorEmail,
            cliente: bitacora.cliente,
            fecha: safeDate(bitacora.fecha || bitacora.fechaProgramada),
            estado: bitacora.estado,
            observaciones: bitacora.observaciones || '',
            unidadResidencial: bitacora.unidadResidencial,
            companyId: bitacora.companyId,
            unidadResidencialId: bitacora.unidadResidencialId,
            resumen: bitacora.resumen,
            metadata: bitacora.metadata,
            areas: bitacora.areas || {},
            comentarios: bitacora.comentarios || {},
            evidencias: bitacora.evidencias || {},
            deshabilitadas: bitacora.deshabilitadas || {},
            isActive: bitacora.isActive,
            createdAt: bitacora.createdAt,
            updatedAt: bitacora.updatedAt
          }))
          isDemoMode.value = false
          console.log('✅ Bitácoras cargadas desde BD:', bitacoras.value.length)
        } else if (Array.isArray(result)) {
          // Función auxiliar para convertir fechas de forma segura
          const safeDate = (dateValue) => {
            if (!dateValue) return null
            // Si ya es un Date, verificar que sea válido
            if (dateValue instanceof Date) {
              return isNaN(dateValue.getTime()) ? null : dateValue
            }
            // Si es un objeto con $date (formato MongoDB)
            if (typeof dateValue === 'object' && dateValue.$date) {
              const dateObj = new Date(dateValue.$date)
              return isNaN(dateObj.getTime()) ? null : dateObj
            }
            // Si es un string, intentar parsearlo
            if (typeof dateValue === 'string') {
              const dateObj = new Date(dateValue)
              return isNaN(dateObj.getTime()) ? null : dateObj
            }
            // Intentar convertir directamente
            const dateObj = new Date(dateValue)
            return isNaN(dateObj.getTime()) ? null : dateObj
          }
          
          // Si la respuesta es directamente un array
          bitacoras.value = result.map(bitacora => ({
            _id: bitacora._id,
            unidadNombre: bitacora.unidadResidencial?.nombre || bitacora.cliente || 'Unidad sin nombre',
            supervisor: bitacora.supervisor || bitacora.supervisorEmail,
            cliente: bitacora.cliente,
            fecha: safeDate(bitacora.fecha || bitacora.fechaProgramada),
            estado: bitacora.estado,
            observaciones: bitacora.observaciones || '',
            unidadResidencial: bitacora.unidadResidencial,
            companyId: bitacora.companyId,
            unidadResidencialId: bitacora.unidadResidencialId,
            resumen: bitacora.resumen,
            metadata: bitacora.metadata,
            areas: bitacora.areas || {},
            comentarios: bitacora.comentarios || {},
            evidencias: bitacora.evidencias || {},
            deshabilitadas: bitacora.deshabilitadas || {},
            isActive: bitacora.isActive,
            createdAt: bitacora.createdAt,
            updatedAt: bitacora.updatedAt
          }))
          isDemoMode.value = false
          console.log('✅ Bitácoras cargadas desde BD (formato array):', bitacoras.value.length)
        } else {
          throw new Error('Formato de respuesta no reconocido')
        }
      } catch (fetchError) {
        // Limpiar timeout en caso de error
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        throw fetchError
      }
      
    } catch (err) {
      // Limpiar timeout si aún está activo
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      console.error('❌ Error cargando bitácoras:', err)
      console.error('🔍 URL intentada:', `${API_BASE_URL}/bitacoras-supervision`)
      console.error('🔍 Error completo:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      })
      
      if (err.name === 'AbortError') {
        error.value = 'Timeout: El servidor no responde después de 30 segundos. Verifica la conectividad o intenta de nuevo.'
      } else if (err.message.includes('Failed to fetch')) {
        error.value = `Error de conectividad: No se puede conectar al servidor ${API_BASE_URL}. Verifica que el servidor esté corriendo y accesible.`
      } else {
        error.value = `Error: ${err.message}`
      }
      
      isDemoMode.value = false
    } finally {
      isLoading.value = false
    }
  }

  const loadBitacoraById = async (bitacoraId) => {
    isLoading.value = true
    error.value = null
    
    // Limpiar la bitácora anterior antes de cargar una nueva
    // Esto previene que se muestren datos de una bitácora anterior
    currentBitacora.value = null
    
    try {
      console.log('🔍 Cargando bitácora específica:', bitacoraId)
      console.log('🔍 Limpiando bitácora anterior del store')
      
      const response = await fetch(`${API_BASE_URL}/bitacoras-supervision/${bitacoraId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-user-email': authStore.userEmail
        },
        credentials: 'include' // 👈 CRÍTICO: Incluir credenciales (cookies, etc.)
      })
      
      if (!response.ok) {
        // Intentar leer el mensaje de error del backend
        let errorMessage = `Error HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('❌ Error del backend:', errorMessage)
        } catch (parseError) {
          console.error('❌ No se pudo parsear el error del backend:', parseError)
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('✅ Respuesta completa de la API:', result)
      
      // Extraer datos del objeto result (puede venir envuelto en data o directamente)
      const bitacoraData = result.data || result
      console.log('✅ Datos de bitácora extraídos:', bitacoraData)
      console.log('🔍 Estructura de áreas:', bitacoraData.areas)
      console.log('🔍 Estructura de comentarios:', bitacoraData.comentarios)
      console.log('🔍 Estructura de evidencias:', bitacoraData.evidencias)
      
      // Función auxiliar para convertir fechas de forma segura
      const safeDate = (dateValue) => {
        if (!dateValue) return null
        // Si ya es un Date, verificar que sea válido
        if (dateValue instanceof Date) {
          return isNaN(dateValue.getTime()) ? null : dateValue
        }
        // Si es un objeto con $date (formato MongoDB)
        if (typeof dateValue === 'object' && dateValue.$date) {
          const dateObj = new Date(dateValue.$date)
          return isNaN(dateObj.getTime()) ? null : dateObj
        }
        // Si es un string, intentar parsearlo
        if (typeof dateValue === 'string') {
          const dateObj = new Date(dateValue)
          return isNaN(dateObj.getTime()) ? null : dateObj
        }
        // Intentar convertir directamente
        const dateObj = new Date(dateValue)
        return isNaN(dateObj.getTime()) ? null : dateObj
      }
      
      // Mapear los datos de la API a nuestro formato
      currentBitacora.value = {
        _id: bitacoraData._id || bitacoraData.id,
        unidadNombre: bitacoraData.unidadResidencial?.nombre || bitacoraData.unidadNombre || bitacoraData.cliente || 'Unidad sin nombre',
        supervisor: bitacoraData.supervisor || bitacoraData.supervisorEmail,
        cliente: bitacoraData.cliente,
        fecha: safeDate(bitacoraData.fecha || bitacoraData.fechaProgramada),
        estado: bitacoraData.estado,
        observaciones: bitacoraData.observaciones || '',
        areas: bitacoraData.areas || {},
        comentarios: bitacoraData.comentarios || {},
        evidencias: bitacoraData.evidencias || {},
        unidadResidencial: bitacoraData.unidadResidencial,
        nombreCompania: bitacoraData.nombreCompania || '',
        nombreSupervisor: bitacoraData.nombreSupervisor || '',
        supervisorEmail: bitacoraData.supervisorEmail || '',
        companyId: bitacoraData.companyId,
        unidadResidencialId: bitacoraData.unidadResidencialId,
        resumen: bitacoraData.resumen,
        metadata: bitacoraData.metadata,
        deshabilitadas: bitacoraData.deshabilitadas || {},
        isActive: bitacoraData.isActive,
        createdAt: bitacoraData.createdAt,
        updatedAt: bitacoraData.updatedAt,
        fechaInicio: safeDate(bitacoraData.fechaInicio),
        fechaFin: safeDate(bitacoraData.fechaFin)
      }
      
      console.log('✅ Bitácora mapeada al store:', currentBitacora.value)
      
      isDemoMode.value = false
      console.log('✅ Bitácora específica cargada desde BD')
      
    } catch (err) {
      console.error('❌ Error cargando bitácora específica:', err.message)
      
      // Si es un error 404 o de acceso, mostrar el error y NO activar modo demo
      if (err.message.includes('no encontrada') || err.message.includes('no accesible') || err.message.includes('404')) {
        error.value = err.message
        currentBitacora.value = null
        isDemoMode.value = false
        console.error('❌ Bitácora no encontrada o no accesible. No se activará modo demo.')
      } else {
        // Para otros errores (red, etc.), activar modo demo como fallback
        console.log('🔄 Modo demo activo: cargando bitácora de ejemplo')
        error.value = null // No mostrar error en modo demo
        isDemoMode.value = true
        
        // Datos demo para detalle
        currentBitacora.value = {
          _id: bitacoraId,
          unidadNombre: 'Unidad Residencial Demo',
          nombreCompania: 'Empresa Demo',
          nombreSupervisor: 'Supervisor Demo',
          supervisorEmail: 'demo@example.com',
          supervisor: 'Supervisor Demo',
          cliente: 'Cliente Demo',
          fecha: new Date(),
          estado: 'en_progreso',
          observaciones: 'Esta es una bitácora de ejemplo en modo demo.',
          areas: {
            piscinas: { 'BAÑOS': 'E', 'ROMPE OLAS': 'B' },
            zonas_comunes: { 'GIMNASIO': 'R' }
          },
          comentarios: {
            piscinas: { 'BAÑOS': 'Todo limpio', 'ROMPE OLAS': 'Necesita limpieza' },
            zonas_comunes: { 'GIMNASIO': 'Máquinas viejas' }
          },
          evidencias: {
            zonas_comunes: { 'GIMNASIO': 'data:image/png;base64,...' }
          }
        }
      }
    } finally {
      isLoading.value = false
    }
  }

  const saveBitacora = async (bitacoraData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': authStore.userEmail
        },
        credentials: 'include', // 👈 CRÍTICO: Incluir credenciales (cookies, etc.)
        body: JSON.stringify(bitacoraData)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (err) {
      console.error('❌ Error guardando bitácora:', err)
      console.error('🔍 URL intentada:', `${API_BASE_URL}/bitacoras-supervision`)
      console.error('🔍 Error completo:', err)
      throw err
    }
  }

  const llenarBitacora = async (bitacoraId, bitacoraData) => {
    try {
      console.log('💾 Llenando bitácora:', bitacoraId)
      console.log('🔍 userEmail del authStore:', authStore.userEmail)
      console.log('🔍 Tipo de userEmail:', typeof authStore.userEmail)
      
      if (!authStore.userEmail) {
        throw new Error('No hay email de usuario en el authStore')
      }
      
      // Verificar fotos en los datos
      let totalPhotos = 0
      let photosDetails = []
      if (bitacoraData.areas) {
        Object.entries(bitacoraData.areas).forEach(([areaKey, areaData]) => {
          if (areaData.photos) {
            const photosCount = Object.keys(areaData.photos).length
            totalPhotos += photosCount
            Object.entries(areaData.photos).forEach(([itemKey, photoData]) => {
              const isBase64 = photoData && photoData.startsWith('data:image')
              const photoSize = photoData ? photoData.length : 0
              photosDetails.push({
                area: areaKey,
                item: itemKey,
                isBase64,
                size: photoSize
              })
            })
          }
        })
      }
      
      console.log(`📷 Total de fotos a enviar: ${totalPhotos}`)
      if (photosDetails.length > 0) {
        console.log('📷 Detalles de fotos:', photosDetails)
      }
      
      // Preparar JSON para enviar
      const jsonData = JSON.stringify(bitacoraData)
      const jsonSize = jsonData.length
      console.log(`📦 Tamaño del JSON a enviar: ${jsonSize} caracteres (${(jsonSize / 1024).toFixed(2)} KB)`)
      
      // Mostrar preview del JSON (primeros 1000 caracteres)
      console.log('📋 Preview del JSON:', jsonData.substring(0, 1000) + (jsonSize > 1000 ? '...' : ''))
      
      // Asegurar que bitacoraId es un string (no un objeto ref)
      const bitacoraIdString = typeof bitacoraId === 'object' && bitacoraId?.value ? bitacoraId.value : String(bitacoraId)
      
      console.log('🔍 bitacoraId recibido:', bitacoraId)
      console.log('🔍 bitacoraId (tipo):', typeof bitacoraId)
      console.log('🔍 bitacoraId (string):', bitacoraIdString)
      console.log('🔍 userEmail:', authStore.userEmail)
      
      const url = `${API_BASE_URL}/bitacoras-supervision/${bitacoraIdString}/llenar`
      console.log('🔍 URL completa:', url)
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-email': authStore.userEmail
      }
      
      console.log('🔍 Headers que se enviarán:', headers)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        credentials: 'include', // 👈 CRÍTICO: Incluir credenciales (cookies, etc.)
        body: jsonData
      })
      
      console.log('🔍 Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      if (!response.ok) {
        // Leer el cuerpo de la respuesta una sola vez
        let errorMessage = `HTTP error! status: ${response.status}`
        const contentType = response.headers.get('content-type')
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json()
            console.error('❌ Error response body:', errorData)
            errorMessage = errorData.error || errorData.message || errorData.details || errorMessage
          } else {
            const errorText = await response.text()
            console.error('❌ Error response text:', errorText)
            if (errorText) {
              errorMessage = errorText
            }
          }
        } catch (readError) {
          console.error('❌ No se pudo leer el cuerpo de la respuesta de error:', readError)
          // Usar el mensaje de error por defecto basado en el status
          if (response.status === 500) {
            errorMessage = 'Error interno del servidor. Por favor, intenta de nuevo.'
          } else if (response.status === 401) {
            errorMessage = 'Token de Dropbox expirado. Por favor, contacta al administrador.'
          } else if (response.status === 404) {
            errorMessage = 'Bitácora no encontrada o no accesible.'
          }
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('✅ Bitácora llenada exitosamente:', result)
      
      // Recargar las bitácoras para actualizar la lista
      await loadBitacoras()
      
      return result
    } catch (err) {
      console.error('❌ Error llenando bitácora:', err)
      console.error('🔍 URL intentada:', `${API_BASE_URL}/bitacoras-supervision/${bitacoraId}/llenar`)
      console.error('🔍 Error completo:', err)
      throw err
    }
  }

  return {
    bitacoras,
    currentBitacora,
    isLoading,
    error,
    isDemoMode,
    loadBitacoras,
    loadBitacoraById,
    saveBitacora,
    llenarBitacora
  }
})




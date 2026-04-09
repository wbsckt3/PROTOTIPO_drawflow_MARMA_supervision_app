import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { API_BASE_URL } from '../config/api.js'

export const useAdminStore = defineStore('admin', () => {
  const usuarios = ref([])
  const unidades = ref([])
  const bitacoras = ref([])
  const company = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  
  const authStore = useAuthStore()
  
  // Lista de emails autorizados como admin
  const ADMIN_EMAILS = [
    'techguardtenant@gmail.com',
    'marma.soluciones@gmail.com'
  ]
  
  const isAdmin = computed(() => {
    if (!authStore.userEmail) return false
    return ADMIN_EMAILS.includes(authStore.userEmail.toLowerCase())
  })
  
  // Obtener empresa del admin
  const loadCompany = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/companies`, {
        headers: {
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Error obteniendo empresa')
      }
      
      const companies = await response.json()
      if (companies && companies.length > 0) {
        company.value = companies[0]
        return companies[0]
      }
      
      return null
    } catch (err) {
      console.error('Error cargando empresa:', err)
      error.value = err.message
      return null
    } finally {
      isLoading.value = false
    }
  }
  
  // CRUD Usuarios
  const loadUsuarios = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      if (!company.value) {
        await loadCompany()
      }
      
      if (!company.value?._id) {
        throw new Error('No hay empresa disponible')
      }
      
      const response = await fetch(`${API_BASE_URL}/companies/${company.value._id}/supervisores`, {
        headers: {
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Error obteniendo supervisores')
      }
      
      const result = await response.json()
      usuarios.value = result.data || result || []
      return usuarios.value
    } catch (err) {
      console.error('Error cargando usuarios:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  const crearUsuario = async (userData) => {
    isLoading.value = true
    error.value = null
    
    try {
      if (!company.value) {
        await loadCompany()
      }
      
      const payload = {
        companyId: company.value._id,
        role: userData.role || 'editor'
      }
      
      // Primero crear el usuario en GoogleSigninUser si no existe
      const googleUserData = {
        FullName: userData.name,
        GivenName: userData.name.split(' ')[0],
        FamilyName: userData.name.split(' ').slice(1).join(' ') || '',
        Email: userData.email,
        ImageURL: userData.imageUrl || ''
      }
      
      // Intentar crear usuario en auth/google-signin
      try {
        await fetch(`${API_BASE_URL}/auth/google-signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(googleUserData)
        })
      } catch (e) {
        console.warn('Usuario puede que ya exista:', e)
      }
      
      // Relacionar usuario con empresa
      const response = await fetch(`${API_BASE_URL}/companies/relate-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userData.email,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error creando usuario')
      }
      
      const result = await response.json()
      await loadUsuarios()
      return result
    } catch (err) {
      console.error('Error creando usuario:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // CRUD Unidades Residenciales
  const loadUnidades = async (filters = {}) => {
    isLoading.value = true
    error.value = null
    
    try {
      let url = `${API_BASE_URL}/unidades-residenciales`
      const params = new URLSearchParams()
      
      if (filters.isActive !== undefined && filters.isActive !== '') {
        params.append('isActive', filters.isActive)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      const response = await fetch(url, {
        headers: {
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Error obteniendo unidades')
      }
      
      const result = await response.json()
      unidades.value = result.data || result || []
      return unidades.value
    } catch (err) {
      console.error('Error cargando unidades:', err)
      error.value = err.message
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  const actualizarEstadoUnidad = async (unidadId, isActive) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/unidades-residenciales/${unidadId}/estado`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ isActive })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error actualizando estado de unidad')
      }
      
      const result = await response.json()
      // Actualizar la unidad en el array local
      const index = unidades.value.findIndex(u => u._id === unidadId)
      if (index !== -1) {
        unidades.value[index].isActive = isActive
        unidades.value[index].updatedAt = new Date()
      }
      return result
    } catch (err) {
      console.error('Error actualizando estado de unidad:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const actualizarUnidad = async (unidadId, unidadData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/unidades-residenciales/${unidadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        },
        body: JSON.stringify(unidadData)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error actualizando unidad')
      }
      
      const result = await response.json()
      // Actualizar la unidad en el array local
      const index = unidades.value.findIndex(u => u._id === unidadId)
      if (index !== -1) {
        unidades.value[index] = { ...unidades.value[index], ...result.data }
      }
      return result
    } catch (err) {
      console.error('Error actualizando unidad:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const crearUnidad = async (unidadData) => {
    isLoading.value = true
    error.value = null
    
    try {
      if (!company.value) {
        await loadCompany()
      }
      
      const payload = {
        nombre: unidadData.nombre,
        direccion: unidadData.direccion,
        correo: unidadData.correo || '',
        tipo: unidadData.tipo,
        companyId: company.value._id,
        ordenConsecutivo: unidadData.ordenConsecutivo || '',
        razonSocial: unidadData.razonSocial || '',
        nit: unidadData.nit || '',
        puntoReferencia: unidadData.puntoReferencia || '',
        numeroPorteria: unidadData.numeroPorteria || '',
        nombreRepresentanteLegal: unidadData.nombreRepresentanteLegal || '',
        cedulaRepresentanteLegal: unidadData.cedulaRepresentanteLegal || '',
        celularRepresentanteLegal: unidadData.celularRepresentanteLegal || '',
        nombreAdministradorDelegado: unidadData.nombreAdministradorDelegado || '',
        celularAdministradorDelegado: unidadData.celularAdministradorDelegado || '',
        perfilesContratados: unidadData.perfilesContratados || '',
        numeroOperarios: unidadData.numeroOperarios || 0,
        horarios: unidadData.horarios || '',
        jornada: unidadData.jornada || '',
        fechaInicio: unidadData.fechaInicio || null,
        fechaTerminacion: unidadData.fechaTerminacion || '',
        correoCartas: unidadData.correoCartas || '',
        correoFacturacion: unidadData.correoFacturacion || '',
        valoresAgregados: unidadData.valoresAgregados || '',
        frecuenciaSupervision: unidadData.frecuenciaSupervision || '',
        valorContratoConIva: unidadData.valorContratoConIva || 0,
        observacionesContrato: unidadData.observacionesContrato || '',
        areas: unidadData.areas || {
          piscinas: {
            name: 'PISCINAS',
            color: '#3b82f6',
            items: ['BAÑOS', 'ROMPE OLAS', 'ANDENES', 'LAVA PIES - DUCHA', 'SAUNA', 'JACUZZI', 'TURCO', 'COLOR VISUAL', 'PH', 'CLORO', 'CUARTO DE MÁQUINAS', 'HALL']
          },
          zonas_comunes: {
            name: 'ZONAS COMUNES',
            color: '#22c55e',
            items: ['GIMNASIO', 'SALÓN SOCIAL', 'SALÓN DE JUEGOS', 'ANDENES', 'PORTERÍA', 'PARQUEADERO']
          },
          zonas_externas: {
            name: 'ZONAS EXTERNAS',
            color: '#f59e0b',
            items: ['ZONA VERDES', 'CAÑUELAS', 'PARQUE INFANTIL', 'PAREDES', 'VIDRIOS - VENTANAS', 'PASAMANOS', 'TAPAS SHUT', 'GABINETES - EXTINTORES', 'BARRIO - TRAPEADO', 'ASCENSORES', 'TUBERÍA VOLÁTIL', 'ESCALAS', 'PISOS', 'SHUT BASURAS']
          },
          oficinas: {
            name: 'OFICINAS',
            color: '#8b5cf6',
            items: ['ESCRITORIOS', 'PAPELERAS', 'SALA DE JUNTAS', 'AULAS', 'BAÑOS', 'RECEPCIÓN', 'COMPUTADORES', 'PAREDES', 'CIELO RASO', 'COCINETA', 'ENTRADAS PRINCIPAL']
          },
          operario: {
            name: 'OPERARIO',
            color: '#ec4899',
            items: ['PRODUCTIVIDAD', 'PRESENTACIÓN', 'CARNET', 'ELEMENTOS EPP', 'CONTROL DE HORARIO', 'ACTITUD']
          }
        }
      }
      
      const response = await fetch(`${API_BASE_URL}/unidades-residenciales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error creando unidad')
      }
      
      const result = await response.json()
      await loadUnidades()
      return result
    } catch (err) {
      console.error('Error creando unidad:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  // CRUD Bitácoras
  const loadBitacoras = async (filters = {}) => {
    isLoading.value = true
    error.value = null
    
    try {
      let url = `${API_BASE_URL}/bitacoras-supervision`
      const params = new URLSearchParams()
      
      if (filters.unidadResidencialId) {
        params.append('unidadResidencialId', filters.unidadResidencialId)
      }
      if (filters.supervisorEmail) {
        params.append('supervisorEmail', filters.supervisorEmail)
      }
      if (filters.fechaDesde) {
        params.append('fechaDesde', filters.fechaDesde)
      }
      if (filters.fechaHasta) {
        params.append('fechaHasta', filters.fechaHasta)
      }
      if (filters.estado) {
        params.append('estado', filters.estado)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }
      
      console.log('🔍 loadBitacoras - URL:', url)
      console.log('🔍 loadBitacoras - userEmail:', authStore.userEmail)
      
      // Crear AbortController con timeout de 30 segundos
      const controller = new AbortController()
      let timeoutId = setTimeout(() => {
        console.warn('⚠️ Timeout alcanzado en loadBitacoras después de 30 segundos')
        controller.abort()
      }, 30000)
      
      try {
        const response = await fetch(url, {
          headers: {
            'x-user-email': authStore.userEmail,
            'Accept': 'application/json'
          },
          credentials: 'include',
          signal: controller.signal
        })
        
        // Limpiar timeout si la petición fue exitosa
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        console.log('🔍 loadBitacoras - Response status:', response.status)
        console.log('🔍 loadBitacoras - Response ok:', response.ok)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ loadBitacoras - Error response:', errorData)
          throw new Error(errorData.error || errorData.message || `Error obteniendo bitácoras (${response.status})`)
        }
        
        const result = await response.json()
        console.log('✅ loadBitacoras - Result:', result)
        bitacoras.value = result.data || result || []
        console.log('✅ loadBitacoras - Bitácoras cargadas:', bitacoras.value.length)
        return bitacoras.value
      } catch (fetchError) {
        // Limpiar timeout en caso de error
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        throw fetchError
      }
    } catch (err) {
      console.error('❌ Error cargando bitácoras:', err)
      if (err.name === 'AbortError') {
        error.value = 'Timeout: El servidor no responde después de 30 segundos. Verifica la conectividad o intenta de nuevo.'
      } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        error.value = 'Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.'
      } else {
        error.value = err.message || 'Error desconocido al cargar bitácoras'
      }
      bitacoras.value = []
      return []
    } finally {
      isLoading.value = false
    }
  }
  
  const crearBitacora = async (bitacoraData) => {
    isLoading.value = true
    error.value = null
    
    try {
      console.log('🔍 crearBitacora - bitacoraData recibido:', bitacoraData)
      console.log('🔍 crearBitacora - fecha recibida:', bitacoraData.fecha)
      console.log('🔍 crearBitacora - tipo de fecha:', typeof bitacoraData.fecha)
      
      const payload = {
        unidadResidencialId: bitacoraData.unidadResidencialId,
        fecha: bitacoraData.fecha,
        observaciones: bitacoraData.observaciones || ''
      }
      
      console.log('🔍 crearBitacora - payload a enviar:', JSON.stringify(payload, null, 2))
      
      const headers = {
        'Content-Type': 'application/json',
        'x-user-email': authStore.userEmail,
        'x-editor-email': bitacoraData.supervisorEmail,
        'Accept': 'application/json'
      }
      
      console.log('🔍 crearBitacora - headers:', headers)
      console.log('🔍 crearBitacora - URL:', `${API_BASE_URL}/bitacoras-supervision`)
      
      const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error creando bitácora')
      }
      
      const result = await response.json()
      await loadBitacoras()
      return result
    } catch (err) {
      console.error('Error creando bitácora:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const getBitacoraById = async (bitacoraId) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/bitacoras-supervision/${bitacoraId}`, {
        headers: {
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Error obteniendo bitácora')
      }
      
      const result = await response.json()
      return result.data || result
    } catch (err) {
      console.error('Error obteniendo bitácora:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const getBitacorasByUnidad = async (unidadId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/unidades-residenciales/${unidadId}/bitacoras`, {
        headers: {
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Error obteniendo bitácoras de la unidad')
      }
      
      const result = await response.json()
      return result.data || result || []
    } catch (err) {
      console.error('Error obteniendo bitácoras por unidad:', err)
      return []
    }
  }
  
  const actualizarBitacora = async (bitacoraId, bitacoraData) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/bitacoras-supervision/${bitacoraId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': authStore.userEmail,
          'x-editor-email': bitacoraData.supervisorEmail || '',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          unidadResidencialId: bitacoraData.unidadResidencialId,
          supervisorEmail: bitacoraData.supervisorEmail,
          fecha: bitacoraData.fecha,
          observaciones: bitacoraData.observaciones
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error actualizando bitácora')
      }
      
      const result = await response.json()
      // No recargar bitácoras aquí, se hará en el componente para evitar doble loading
      return result
    } catch (err) {
      console.error('Error actualizando bitácora:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const eliminarBitacora = async (bitacoraId) => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${API_BASE_URL}/bitacoras-supervision/${bitacoraId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': authStore.userEmail,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Error eliminando bitácora')
      }
      
      const result = await response.json()
      // Recargar bitácoras para reflejar el cambio
      await loadBitacoras()
      return result
    } catch (err) {
      console.error('Error eliminando bitácora:', err)
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }
  
  const getBitacorasBySupervisor = async (supervisorEmail) => {
    try {
      console.log('🔍 getBitacorasBySupervisor - supervisorEmail:', supervisorEmail)
      console.log('🔍 getBitacorasBySupervisor - authStore.userEmail:', authStore.userEmail)
      
      const url = `${API_BASE_URL}/bitacoras-supervision/supervisor`
      console.log('🔍 getBitacorasBySupervisor - URL:', url)
      
      const headers = {
        'x-user-email': authStore.userEmail,
        'x-editor-email': supervisorEmail,
        'Accept': 'application/json'
      }
      console.log('🔍 getBitacorasBySupervisor - Headers:', headers)
      
      // Crear AbortController con timeout de 30 segundos
      const controller = new AbortController()
      let timeoutId = setTimeout(() => {
        console.warn('⚠️ Timeout alcanzado en getBitacorasBySupervisor después de 30 segundos')
        controller.abort()
      }, 30000)
      
      try {
        const response = await fetch(url, { 
          headers,
          credentials: 'include',
          signal: controller.signal
        })
        
        // Limpiar timeout si la petición fue exitosa
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        console.log('🔍 getBitacorasBySupervisor - Response status:', response.status)
        console.log('🔍 getBitacorasBySupervisor - Response ok:', response.ok)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('❌ getBitacorasBySupervisor - Error response:', errorData)
          throw new Error(errorData.error || `Error obteniendo bitácoras del supervisor (${response.status})`)
        }
        
        const result = await response.json()
        console.log('✅ getBitacorasBySupervisor - Result:', result)
        const bitacoras = result.data || result || []
        console.log('✅ getBitacorasBySupervisor - Bitácoras encontradas:', bitacoras.length)
        return bitacoras
      } catch (fetchError) {
        // Limpiar timeout en caso de error
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        throw fetchError
      }
    } catch (err) {
      console.error('❌ Error obteniendo bitácoras por supervisor:', err)
      if (err.name === 'AbortError') {
        throw new Error('Timeout: El servidor no responde después de 30 segundos. Verifica la conectividad o intenta de nuevo.')
      }
      throw err
    }
  }
  
  return {
    usuarios,
    unidades,
    bitacoras,
    company,
    isLoading,
    error,
    isAdmin,
    loadCompany,
    loadUsuarios,
    crearUsuario,
    loadUnidades,
    crearUnidad,
    actualizarEstadoUnidad,
    actualizarUnidad,
    loadBitacoras,
    crearBitacora,
    actualizarBitacora,
    eliminarBitacora,
    getBitacoraById,
    getBitacorasByUnidad,
    getBitacorasBySupervisor
  }
})


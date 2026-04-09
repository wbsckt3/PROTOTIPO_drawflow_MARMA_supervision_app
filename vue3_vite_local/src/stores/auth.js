import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_BASE_URL } from '../config/api.js'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(false)
  const user = ref(null)
  const userEmail = ref('')

  const handleCredentialResponse = async (response) => {
    try {
      console.log('🔐 Iniciando autenticación con Google...')
      console.log('Respuesta de Google:', response)
      
      // Decodificar el JWT token
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      console.log('Payload decodificado:', payload)
      
      // Crear objeto de usuario
      const userData = {
        FullName: payload.name,
        GivenName: payload.given_name,
        FamilyName: payload.family_name,
        ImageURL: payload.picture,
        Email: payload.email
      }
      
      // Intentar enviar datos al backend
      try {
        // Usar la misma URL base que el resto de la aplicación
        const backendResponse = await fetch(`${API_BASE_URL}/auth/google-signin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        })
        
        if (!backendResponse.ok) {
          console.warn(`⚠️ Error del servidor (${backendResponse.status}), continuando con autenticación local`)
        } else {
          const backendData = await backendResponse.json()
          console.log('✅ Resultado de autenticación:', backendData)
        }
      } catch (serverError) {
        console.warn('⚠️ Servidor no disponible, continuando con autenticación local:', serverError.message)
      }
      
      // Guardar datos del usuario (funciona aunque el servidor falle)
      user.value = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name
      }
      
      userEmail.value = payload.email
      isAuthenticated.value = true
      
      // Guardar en localStorage (igual que el auth.js original)
      localStorage.setItem('refactorii_token', response.credential)
      localStorage.setItem('token_expiry', (Date.now() + (24 * 60 * 60 * 1000)).toString())
      localStorage.setItem('user_data', JSON.stringify(userData))
      localStorage.setItem('user', JSON.stringify(user.value))
      localStorage.setItem('userEmail', userEmail.value)
      localStorage.setItem('isAuthenticated', 'true')
      
      console.log('✅ Datos guardados en localStorage:')
      console.log('- Token:', response.credential.substring(0, 50) + '...')
      console.log('- User:', userData.FullName, userData.Email)
      console.log('✅ Usuario autenticado:', user.value)
      
    } catch (error) {
      console.error('❌ Error en autenticación:', error)
      throw error
    }
  }

  const logout = () => {
    isAuthenticated.value = false
    user.value = null
    userEmail.value = ''
    
    // Limpiar localStorage (igual que el auth.js original)
    localStorage.removeItem('refactorii_token')
    localStorage.removeItem('token_expiry')
    localStorage.removeItem('user_data')
    localStorage.removeItem('user')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('selectedProfile')
  }

  const initializeAuth = () => {
    const token = localStorage.getItem('refactorii_token')
    const expiryStr = localStorage.getItem('token_expiry')
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0
    const storedUser = localStorage.getItem('user')
    const storedEmail = localStorage.getItem('userEmail')
    const storedAuth = localStorage.getItem('isAuthenticated')
    
    console.log('🔍 Validando token...')
    console.log('- Token existe:', !!token)
    
    // Verificar si el token es válido
    if (!token || !expiry || expiry === 0) {
      console.log('ℹ️ No hay sesión activa - Usuario debe iniciar sesión')
      // Limpiar cualquier dato inconsistente
      if (!token && (storedUser || storedEmail)) {
        console.log('🧹 Limpiando datos inconsistentes de localStorage')
        logout()
      }
      return false
    }
    
    // Verificar si el token expiró
    const now = Date.now()
    const expiryDate = new Date(expiry)
    console.log('- Expiry:', expiryDate.toLocaleString())
    console.log('- Tiempo actual:', new Date(now).toLocaleString())
    
    if (now > expiry) {
      console.warn("⚠️ Token expirado: limpiando credenciales")
      logout()
      return false
    }
    
    // Token válido, restaurar usuario
    if (storedUser && storedEmail && storedAuth === 'true') {
      try {
        user.value = JSON.parse(storedUser)
        userEmail.value = storedEmail
        isAuthenticated.value = true
        console.log('✅ Usuario autenticado correctamente:', userEmail.value)
        return true
      } catch (error) {
        console.error('❌ Error parseando datos de usuario:', error)
        logout()
        return false
      }
    }
    
    console.log('⚠️ Datos de usuario incompletos en localStorage')
    return false
  }

  return {
    isAuthenticated,
    user,
    userEmail,
    handleCredentialResponse,
    logout,
    initializeAuth
  }
})

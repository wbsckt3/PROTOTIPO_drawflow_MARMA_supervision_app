<template>
  <div class="auth-overlay">
    <div class="auth-content">
      <!-- Header con logo y eslogan -->
      <div class="header-section">
        <div class="logo-section">
          <i class="ph ph-toolbox locally-icon"></i>
          <h1 class="brand-title">TECH GUARD</h1>
        </div>
        <p class="tagline">Oportunidades de Servicio</p>
      </div>
      
      <!-- Texto instructivo -->
      <p class="instruction-text">Inicia sesión con tu cuenta de Google para acceder como proveedor de servicios</p>
      
      <!-- Contenedor del botón de Google -->
      <div class="auth-container">
        <div id="googleButton"></div>
      </div>
      
      <!-- Link para volver al login principal -->
      <div class="back-link">
        <router-link to="/auth" class="back-link-text">
          <i class="ph ph-arrow-left"></i>
          Volver al login principal
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const googleClientId = '418199220487-8j37dv4m7adnc15avpiubo5c26ibbv48.apps.googleusercontent.com'

onMounted(() => {
  // Limpiar autenticación previa si existe
  authStore.logout()
  
  // Limpiar localStorage completamente
  localStorage.clear()
  
  // Inicializar Google y renderizar botón
  const initGoogle = () => {
    if (!window.google || !google.accounts || !google.accounts.id) {
      setTimeout(initGoogle, 100)
      return
    }

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async (response) => {
        try {
          await authStore.handleCredentialResponse(response)
          // Redirigir directamente al dashboard de proveedores
          router.push('/provider')
        } catch (error) {
          console.error('Error en autenticación:', error)
          alert('Error al iniciar sesión. Por favor, intenta nuevamente.')
        }
      },
      ux_mode: 'popup',
      auto_select: false,
    })

    const container = document.getElementById('googleButton')
    if (container) {
      google.accounts.id.renderButton(container, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        logo_alignment: 'left',
      })
    }

    google.accounts.id.prompt()
  }

  initGoogle()
})
</script>

<style scoped>
/* Fondo degradado naranja/amarillo para proveedores */
.auth-overlay {
  background: linear-gradient(180deg, #f59e0b 0%, #fbbf24 50%, #fcd34d 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-content {
  background: white;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 480px;
  width: 100%;
}

.header-section {
  margin-bottom: 32px;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.locally-icon {
  font-size: 48px;
  color: #f59e0b;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
}

.tagline {
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.instruction-text {
  color: #4b5563;
  font-size: 16px;
  margin-bottom: 32px;
  line-height: 1.5;
}

.auth-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.back-link {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.back-link-text {
  color: #6b7280;
  text-decoration: none;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.back-link-text:hover {
  color: #f59e0b;
}

/* Estilos para el botón de Google */
.g_id_signin {
  margin: 0 auto;
}

@media (max-width: 768px) {
  .auth-content {
    padding: 32px 24px;
  }
  
  .brand-title {
    font-size: 22px;
  }
  
  .tagline {
    font-size: 14px;
  }
  
  .instruction-text {
    font-size: 14px;
  }
}
</style>

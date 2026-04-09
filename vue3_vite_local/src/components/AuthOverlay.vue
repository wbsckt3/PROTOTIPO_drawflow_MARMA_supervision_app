<template>
  <div class="auth-overlay">
    <div class="auth-content">
      <!-- Header con logo y eslogan -->
      <div class="header-section">
        <div class="logo-section">
          <i class="ph ph-shield-check locally-icon"></i>
          <div class="brand-container">
            <h1 class="brand-title">ORBIX</h1>
            <p class="brand-subtitle">By TechGuard</p>
          </div>
        </div>
        <p class="tagline">Supervisión digital de unidades residenciales</p>
      </div>
      
      <!-- Texto instructivo -->
      <p class="instruction-text">Inicia sesión con tu cuenta de Google para acceder al sistema de supervisión</p>
      
      <!-- Contenedor del botón de Google -->
      <div class="auth-container">
        <div id="googleButton"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
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
          router.push('/profile-selector')
        } catch (error) {
          console.error('Error en autenticación:', error)
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
/* Fondo degradado morado como Locally */
.auth-overlay {
  background: linear-gradient(180deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
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

.brand-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.brand-subtitle {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  font-weight: 400;
  margin-top: -4px;
}

.locally-icon {
  font-size: 48px;
  color: #8b5cf6;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  white-space: nowrap;
}

.tagline {
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
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
}

/* Estilos para el botón de Google */
.g_id_signin {
  margin: 0 auto;
}

@media (max-width: 768px) {
  .auth-container {
    padding: 20px;
  }
  
  .auth-card {
    padding: 24px;
  }
  
  .brand-title {
    font-size: 22px;
  }
  
  .tagline {
    font-size: 16px;
  }
  
  .brand-subtitle {
    font-size: 11px;
  }
  
  .instruction-text {
    font-size: 14px;
  }
}
</style>

<template>
  <div class="profile-selector">
    <div class="profile-content">
      <!-- Header con logo y eslogan -->
      <div class="header-section">
        <div class="logo-section">
          <i class="ph ph-shield-check locally-icon"></i>
          <h1 class="brand-title">TECH GUARD</h1>
        </div>
        <p class="tagline">Supervisión digital de unidades residenciales</p>
      </div>
      
      <!-- Opciones de perfil -->
      <div class="profile-options">
        <div 
          class="profile-card"
          :class="{ selected: selectedProfile === 'supervisor' }"
          @click="selectProfile('supervisor')"
        >
          <div class="profile-icon">
            <i class="ph ph-clipboard-text"></i>
          </div>
          <div class="profile-info">
            <h3>Supervisor</h3>
            <p>Gestiona bitácoras y supervisa unidades residenciales</p>
          </div>
        </div>
        
        <!-- Administrador - solo visible para admins -->
        <div 
          v-if="adminStore.isAdmin"
          class="profile-card"
          :class="{ selected: selectedProfile === 'admin' }"
          @click="selectProfile('admin')"
        >
          <div class="profile-icon">
            <i class="ph ph-gear"></i>
          </div>
          <div class="profile-info">
            <h3>Administrador</h3>
            <p>Administra el sistema y configura reglas de negocio</p>
          </div>
        </div>

      </div>
      
      <!-- Botón continuar -->
      <button 
        @click="continueToDashboard"
        class="continue-btn"
        :disabled="!selectedProfile"
      >
        <i class="ph ph-arrow-right"></i>
        Continuar
      </button>
      
      <!-- Footer -->
      <p class="footer-text">
        Acceso para supervisores del sistema de supervisión TECH GUARD
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../stores/admin'

const router = useRouter()
const adminStore = useAdminStore()
const selectedProfile = ref('')

onMounted(() => {
  // Verificar si el usuario es admin
  if (adminStore.isAdmin) {
    console.log('✅ Usuario es administrador')
  }
})

const selectProfile = (profile) => {
  selectedProfile.value = profile
}

const continueToDashboard = () => {
  if (selectedProfile.value) {
    localStorage.setItem('selectedProfile', selectedProfile.value)
    
    if (selectedProfile.value === 'admin') {
      router.push('/admin')
    } else if (selectedProfile.value === 'proveedor') {
      router.push('/provider')
    } else {
      router.push('/dashboard')
    }
  }
}
</script>

<style scoped>
/* Fondo degradado morado como Locally */
.profile-selector {
  background: linear-gradient(180deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.profile-content {
  background: white;
  border-radius: 24px;
  padding: 48px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 600px;
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
  color: #6b7280;
  font-size: 16px;
  margin: 0;
}

.profile-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #f8fafc;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.profile-card:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.profile-card.selected {
  background: #ede9fe;
  border-color: #8b5cf6;
}

.profile-icon {
  width: 48px;
  height: 48px;
  background: #8b5cf6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.profile-info {
  text-align: left;
  flex: 1;
}

.profile-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.profile-info p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
}

.continue-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 auto 24px auto;
  transition: all 0.2s ease;
  min-width: 160px;
}

.continue-btn:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-1px);
}

.continue-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.footer-text {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .profile-container {
    padding: 20px;
  }
  
  .profile-card {
    padding: 24px;
  }
  
  .brand-title {
    font-size: 22px;
  }
  
  .tagline {
    font-size: 14px;
  }
  
  .profile-options {
    flex-direction: column;
    gap: 16px;
  }
  
  .profile-option {
    width: 100%;
  }
}
</style>




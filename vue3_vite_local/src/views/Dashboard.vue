<template>
  <div class="dashboard-container">
    <!-- Header -->
    <div class="header-section">
      <div class="logo-section">
        <div class="logo-container">
          <i class="ph ph-shield-check logo-icon"></i>
          <div class="logo-text">
            <h1 class="brand-title">TECH GUARD</h1>
            <span class="brand-subtitle">Supervisión Digital</span>
          </div>
        </div>
      </div>
      <p class="tagline">{{ getProfileTitle() }}</p>
      <div class="user-info">
        <span class="user-name">Usuario supervisor: {{ authStore.user?.name }}</span>
        <button @click="logout" class="logout-btn">
          <i class="ph ph-sign-out"></i>
          Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- Demo Mode Banner -->
    <div v-if="bitacorasStore.isDemoMode" class="demo-banner">
      <i class="ph ph-warning-circle"></i>
      Modo demo activo: mostrando bitácoras de ejemplo mientras se conecta el backend
    </div>

    <!-- Loading State -->
    <div v-if="bitacorasStore.isLoading" class="loading-container">
      <div class="loading-spinner">
        <i class="ph ph-spinner"></i>
      </div>
      <p>Cargando bitácoras...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="bitacorasStore.error" class="error-container">
      <i class="ph ph-warning"></i>
      <p>Error: {{ bitacorasStore.error }}</p>
      <button @click="loadBitacoras" class="retry-btn">
        <i class="ph ph-arrow-clockwise"></i>
        Reintentar
      </button>
    </div>

    <!-- Bitácoras List -->
    <div v-else class="bitacoras-content">
      <div class="bitacoras-header">
        <h2>Bitácoras de Supervisión</h2>
        <div class="header-actions">
          <div class="filters-row">
            <div class="filter-container">
              <label for="day-filter" class="filter-label">
                <i class="ph ph-calendar"></i>
                Filtrar por {{ currentMonthName }}:
              </label>
              <select 
                id="day-filter" 
                v-model="selectedDay" 
                class="day-filter-select"
              >
                <option value="">Todos los días</option>
                <option v-for="day in daysOfMonth" :key="day" :value="day">
                  {{ day }}
                </option>
              </select>
            </div>
            <div class="filter-container">
              <label for="status-filter" class="filter-label">
                <i class="ph ph-funnel"></i>
                Filtrar por estado:
              </label>
              <select 
                id="status-filter" 
                v-model="selectedStatus" 
                class="status-filter-select"
              >
                <option value="">Todos los estados</option>
                <option value="programada">Programada</option>
                <option value="en_progreso">En Progreso</option>
                <option value="completada">Completada</option>
                <option value="con_novedad">Con Novedad</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
          </div>
          <button @click="clearFilters" class="clear-filters-btn">
            <i class="ph ph-x-circle"></i>
            Limpiar filtros
          </button>
        </div>
      </div>
      
      <div class="bitacoras-grid">
        <div 
          v-for="bitacora in filteredBitacoras" 
          :key="bitacora._id"
          class="bitacora-card"
        >
          <div class="card-header">
            <div class="card-icon">
              <i class="ph ph-clipboard-text"></i>
            </div>
            <div class="card-title">
              <h3>{{ bitacora.unidadNombre }}</h3>
              <span class="status" :class="bitacora.estado">{{ getStatusText(bitacora.estado) }}</span>
            </div>
          </div>
          
          <div class="card-content">
            <div class="info-row">
              <i class="ph ph-user"></i>
              <span><strong>Supervisor:</strong> <strong>{{ bitacora.supervisor }}</strong></span>
            </div>
            <div class="info-row">
              <i class="ph ph-calendar"></i>
              <span><strong>Fecha programada:</strong> {{ formatDate(bitacora.fecha || bitacora.fechaProgramada) }}</span>
            </div>
            <div v-if="bitacora.observaciones" class="info-row">
              <i class="ph ph-note"></i>
              <span>{{ bitacora.observaciones }}</span>
            </div>
          </div>
          
          <div class="card-footer">
            <button 
              v-if="bitacora.estado === 'completada' || bitacora.estado === 'con_novedad'" 
              @click="downloadPDF(bitacora)" 
              class="open-btn download-btn"
            >
              <i class="ph ph-download"></i>
              Descargar PDF
            </button>
            <button 
              v-else 
              @click="openBitacora(bitacora._id)" 
              class="open-btn"
            >
              <i class="ph ph-arrow-right"></i>
              Abrir bitácora
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useBitacorasStore } from '../stores/bitacoras'

const router = useRouter()
const authStore = useAuthStore()
const bitacorasStore = useBitacorasStore()

// Filtros
const selectedDay = ref('')
const selectedStatus = ref('')

// Generar array de días del mes (1-31)
const daysOfMonth = Array.from({ length: 31 }, (_, i) => i + 1)

// Obtener el nombre del mes actual
const currentMonthName = computed(() => {
  const months = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]
  return months[new Date().getMonth()]
})

// Filtrar bitácoras por día y estado seleccionados
const filteredBitacoras = computed(() => {
  let filtered = bitacorasStore.bitacoras
  
  // Filtrar por día
  if (selectedDay.value) {
    const day = parseInt(selectedDay.value)
    filtered = filtered.filter(bitacora => {
      if (!bitacora.fecha) return false
      const fecha = new Date(bitacora.fecha)
      return fecha.getDate() === day
    })
  }
  
  // Filtrar por estado
  if (selectedStatus.value) {
    filtered = filtered.filter(bitacora => {
      return bitacora.estado === selectedStatus.value
    })
  }
  
  return filtered
})

// Función para limpiar todos los filtros
const clearFilters = () => {
  selectedDay.value = ''
  selectedStatus.value = ''
}

const getProfileTitle = () => {
  const profile = localStorage.getItem('selectedProfile')
  if (profile === 'admin') {
    return 'Panel de Administración'
  }
  return 'Supervisión de unidades residenciales'
}

const getStatusText = (status) => {
  const statusMap = {
    'programada': 'Programada',
    'en_progreso': 'En Progreso',
    'completada': 'Completada',
    'con_novedad': 'Con Novedad',
    'cancelada': 'Cancelada'
  }
  return statusMap[status] || status
}

const loadBitacoras = async () => {
  try {
    await bitacorasStore.loadBitacoras()
  } catch (error) {
    console.error('Error cargando bitácoras:', error)
  }
}

const openBitacora = (bitacoraId) => {
  router.push(`/bitacora/${bitacoraId}`)
}

const logout = () => {
  authStore.logout()
  router.push('/auth')
}

const formatDate = (date) => {
  if (!date) return 'N/A'
  
  // Si ya es un objeto Date, usarlo directamente
  if (date instanceof Date) {
    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida'
    }
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Si es un string, intentar parsearlo
  if (typeof date === 'string') {
    const dateObj = new Date(date)
    // Verificar que sea una fecha válida
    if (isNaN(dateObj.getTime())) {
      console.warn('⚠️ Fecha inválida recibida:', date)
      return 'Fecha inválida'
    }
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Si es un objeto con propiedades de fecha (ISO string, timestamp, etc.)
  if (typeof date === 'object' && date !== null) {
    // Intentar con $date (formato MongoDB)
    if (date.$date) {
      const dateObj = new Date(date.$date)
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    }
    // Intentar convertir directamente
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
  
  console.warn('⚠️ Formato de fecha no reconocido:', date, typeof date)
  return 'Fecha inválida'
}

const downloadPDF = (bitacora) => {
  if (!bitacora?._id) {
    alert('No se pudo identificar la bitácora para descargar el PDF.')
    return
  }
  router.push({
    name: 'bitacora',
    params: { id: bitacora._id },
    query: { autoDownloadPdf: '1' }
  })
}

onMounted(() => {
  loadBitacoras()
})
</script>

<style scoped>
/* Fondo degradado morado como Locally */
.dashboard-container {
  background: linear-gradient(180deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
  min-height: 100vh;
  padding: 20px;
}

.header-section {
  background: white;
  border-radius: 24px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-icon {
  font-size: 48px;
  color: #8b5cf6;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.logo-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
  margin-top: -2px;
}

.tagline {
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 24px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.user-name {
  color: #1f2937;
  font-weight: 700;
  font-size: 18px;
  background: linear-gradient(135deg, #8b5cf6, #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.logout-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 12px 0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(239, 68, 68, 0.3);
  margin: 0;
}

.logout-btn:hover {
  background: #dc2626;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.demo-banner {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #92400e;
  padding: 16px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

.loading-spinner i {
  display: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.error-container i {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.error-container p {
  color: #ef4444;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 24px;
}

.retry-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin: 0 auto;
}

.retry-btn:hover {
  background: #7c3aed;
}

.bitacoras-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.bitacoras-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
}

.bitacoras-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.filters-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;
}

.filter-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 200px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #6b7280;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.filter-label i {
  color: #8b5cf6;
  font-size: 16px;
}

.day-filter-select,
.status-filter-select {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #1f2937;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b5cf6' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.day-filter-select {
  max-width: 100px;
}

.day-filter-select:hover,
.status-filter-select:hover {
  border-color: #c4b5fd;
}

.day-filter-select:focus,
.status-filter-select:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.clear-filters-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(139, 92, 246, 0.3);
  margin: 0;
  width: 100%;
}

.clear-filters-btn:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.bitacoras-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.bitacora-card {
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.bitacora-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  border-color: #8b5cf6;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-icon {
  width: 40px;
  height: 40px;
  background: #8b5cf6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
}

.card-title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-title h3 {
  margin: 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.status {
  padding: 3px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
  align-self: flex-start;
}

.status.programada {
  background: #fef3c7;
  color: #92400e;
}

.status.en_progreso {
  background: #dbeafe;
  color: #1e40af;
}

.status.completada {
  background: #d1fae5;
  color: #065f46;
}

.status.con_novedad {
  background: #fce7f3;
  color: #9f1239;
}

.status.cancelada {
  background: #fee2e2;
  color: #991b1b;
}

.card-content {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 13px;
}

.info-row i {
  color: #8b5cf6;
  font-size: 16px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.card-footer {
  margin-top: 16px;
}

.open-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 12px 0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  width: 100%;
  transition: all 0.2s ease;
  box-shadow: 0 3px 10px rgba(139, 92, 246, 0.3);
  margin: 0;
}

.open-btn:hover {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.download-btn {
  background: #10b981;
}

.download-btn:hover {
  background: #059669;
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* Mobile First - Responsive Design */
@media (min-width: 768px) {
  .bitacoras-grid {
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 24px;
  }
  
  .bitacora-card {
    padding: 24px;
  }
  
  .open-btn {
    width: auto;
    padding: 10px 20px;
    font-size: 14px;
  }
  
  .card-footer {
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 768px) {
  .filters-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-container {
    min-width: 100%;
  }
  
  .day-filter-select {
    max-width: 100%;
  }
  
  .clear-filters-btn {
    width: 100%;
    margin-top: 8px;
  }
  
  .header-actions {
    gap: 12px;
  }
  .dashboard-container {
    padding: 16px;
  }
  
  .header-section {
    padding: 24px 20px;
  }
  
  .logo-container {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .logo-text {
    align-items: center;
  }
  
  .brand-title { 
    font-size: 24px; 
  }
  
  .brand-subtitle {
    font-size: 13px;
  }
  
  .bitacoras-content {
    padding: 20px;
  }
  
  .bitacoras-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .bitacoras-header h2 {
    font-size: 20px;
  }
  
  .user-info {
    flex-direction: column;
    gap: 12px;
  }
  
  .tagline {
    font-size: 18px;
  }
  
  .user-name {
    font-size: 16px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .card-title h3 {
    font-size: 16px;
  }
  
  .info-row {
    font-size: 13px;
  }
}
</style>
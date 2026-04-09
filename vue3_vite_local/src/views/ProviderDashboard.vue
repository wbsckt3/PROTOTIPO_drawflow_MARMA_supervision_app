<template>
  <div class="provider-dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="dashboard-title">
            <i class="ph ph-toolbox"></i>
            Oportunidades de Servicio
          </h1>
          <p class="dashboard-subtitle">Servicios cercanos a tu ubicación</p>
        </div>
        <div class="header-right">
          <button @click="logout" class="logout-btn">
            <i class="ph ph-sign-out"></i>
            Salir
          </button>
        </div>
      </div>
    </header>

    <!-- Controles -->
    <div class="controls-section">
      <div class="controls-content">
        <div class="location-controls">
          <button 
            @click="obtenerYActualizarUbicacion" 
            class="btn-location"
            :disabled="isLoading"
          >
            <i class="ph ph-crosshairs"></i>
            <span class="btn-location-text">{{ userLocation ? 'Actualizar' : 'Mi ubicación' }}</span>
          </button>
        </div>
        <div class="radius-control">
          <label class="radius-label">Radio:</label>
          <select v-model="searchRadius" @change="cargarOportunidades" class="radius-select">
            <option :value="5">5 km</option>
            <option :value="10">10 km</option>
            <option :value="20">20 km</option>
            <option :value="50">50 km</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando oportunidades...</p>
    </div>

    <!-- Error -->
    <div v-if="error && !isLoading" class="error-container">
      <i class="ph ph-warning"></i>
      <p>{{ error }}</p>
      <button @click="cargarOportunidades" class="btn-retry">Reintentar</button>
    </div>

    <!-- Mapa -->
    <div v-if="!isLoading && !error" class="map-container">
      <div id="map" class="map"></div>
      <div class="map-legend">
        <div class="legend-item">
          <div class="legend-marker"></div>
          <span>Oportunidad de servicio ({{ oportunidades.length }})</span>
        </div>
      </div>
    </div>

    <!-- Modal de Propuesta -->
    <div v-if="showPropuestaModal" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Enviar Propuesta de Servicio</h2>
          <button @click="cerrarModal" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div v-if="oportunidadSeleccionada" class="oportunidad-info">
            <div class="info-item">
              <strong>Área:</strong> {{ oportunidadSeleccionada.area }}
            </div>
            <div class="info-item">
              <strong>Elemento:</strong> {{ oportunidadSeleccionada.item }}
            </div>
            <div class="info-item">
              <strong>Unidad:</strong> {{ oportunidadSeleccionada.unidadResidencialNombre }}
            </div>
            <div class="info-item">
              <strong>Distancia:</strong> {{ oportunidadSeleccionada.distancia }} km
            </div>
            <div v-if="oportunidadSeleccionada.imagenUrl" class="imagen-preview">
              <img :src="oportunidadSeleccionada.imagenUrl" alt="Evidencia" />
            </div>
          </div>

          <form @submit.prevent="enviarPropuesta" class="propuesta-form">
            <div class="form-group">
              <label>Tu correo electrónico:</label>
              <input 
                type="email" 
                v-model="propuestaForm.proveedorEmail" 
                required
                disabled
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Número de WhatsApp:</label>
              <input 
                type="tel" 
                v-model="propuestaForm.whatsapp" 
                placeholder="+57 300 123 4567"
                required
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Propuesta de solución:</label>
              <textarea 
                v-model="propuestaForm.propuestaTexto" 
                placeholder="Describe tu propuesta de solución para este problema..."
                required
                rows="5"
                class="form-textarea"
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="button" @click="cerrarModal" class="btn-cancel">
                Cancelar
              </button>
              <button type="submit" :disabled="isEnviando" class="btn-submit">
                <i class="ph ph-paper-plane-tilt"></i>
                {{ isEnviando ? 'Enviando...' : 'Enviar Propuesta' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Mensaje de éxito -->
    <div v-if="showSuccess" class="success-message">
      <i class="ph ph-check-circle"></i>
      <p>¡Propuesta enviada exitosamente! El administrador la revisará pronto.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProveedoresStore } from '../stores/proveedores'
// Leaflet se carga desde CDN en index.html, usar L global
// No declarar const L aquí, usaremos window.L directamente en las funciones

const router = useRouter()
const authStore = useAuthStore()
const proveedoresStore = useProveedoresStore()

const isLoading = ref(false)
const error = ref(null)
const userLocation = ref(null)
const oportunidades = ref([])
const searchRadius = ref(10)
const map = ref(null)
const markers = ref([])
const showPropuestaModal = ref(false)
const oportunidadSeleccionada = ref(null)
const isEnviando = ref(false)
const showSuccess = ref(false)

const propuestaForm = ref({
  proveedorEmail: authStore.userEmail || '',
  whatsapp: '',
  propuestaTexto: ''
})

// Inicializar mapa (similar a useMap.js del proyecto realDB)
const inicializarMapa = async () => {
  return new Promise((resolve) => {
    // Usar L global desde window (cargado desde CDN)
    const L = window.L || window.Leaflet
    
    // Esperar a que Leaflet esté disponible
    if (typeof L === 'undefined') {
      console.log('⏳ Leaflet no disponible, esperando...')
      let attempts = 0
      const maxAttempts = 50
      
      const checkLeaflet = () => {
        attempts++
        const Leaflet = window.L || window.Leaflet
        if (typeof Leaflet !== 'undefined') {
          console.log('✅ Leaflet disponible después de', attempts, 'intentos')
          inicializarMapa().then(resolve)
        } else if (attempts < maxAttempts) {
          setTimeout(checkLeaflet, 100)
        } else {
          console.error('❌ Leaflet no se pudo cargar después de', maxAttempts, 'intentos')
          resolve(null)
        }
      }
      
      setTimeout(checkLeaflet, 100)
      return
    }

    console.log('🗺️ Inicializando mapa en: map')
    
    // Verificar que el contenedor existe - con múltiples intentos
    let containerAttempts = 0
    const maxContainerAttempts = 20
    
    const checkContainer = () => {
      const container = document.getElementById('map')
      if (container && container.offsetParent !== null) {
        console.log('✅ Contenedor del mapa encontrado y visible')
        initializeMapInstance(L, resolve)
      } else if (containerAttempts < maxContainerAttempts) {
        containerAttempts++
        console.log(`⏳ Contenedor no encontrado o no visible, intento ${containerAttempts}/${maxContainerAttempts}...`)
        setTimeout(checkContainer, 200)
      } else {
        console.error('❌ Contenedor del mapa no encontrado después de', maxContainerAttempts, 'intentos')
        resolve(null)
      }
    }
    
    checkContainer()
  })
}

// Función auxiliar para inicializar la instancia del mapa
const initializeMapInstance = (L, resolve) => {
  // Esperar un poco más para asegurar que el contenedor está completamente renderizado
  setTimeout(() => {
    try {
      console.log('🗺️ Creando instancia del mapa...')
      
      // Verificar nuevamente que el contenedor existe
      const container = document.getElementById('map')
      if (!container) {
        console.error('❌ Contenedor del mapa desapareció')
        resolve(null)
        return
      }
      
      // Crear mapa centrado en Medellín (como en realDB)
      map.value = L.map('map', {
        zoomControl: true,
        attributionControl: true
      }).setView([6.2442, -75.5812], 15)
      
      console.log('🗺️ Agregando capa de tiles...')
      
      // Agregar capa de OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map.value)
      
      // Forzar redimensionamiento del mapa
      setTimeout(() => {
        if (map.value) {
          map.value.invalidateSize()
          console.log('✅ Mapa inicializado correctamente')
          resolve(map.value)
        } else {
          console.error('❌ Mapa no se pudo crear')
          resolve(null)
        }
      }, 100)
      
      // Redimensionar mapa cuando cambie el tamaño de la ventana
      window.addEventListener('resize', () => {
        setTimeout(() => {
          if (map.value) {
            map.value.invalidateSize()
          }
        }, 100)
      })
      
    } catch (error) {
      console.error('❌ Error inicializando mapa:', error)
      console.error('❌ Stack trace:', error.stack)
      resolve(null)
    }
  }, 100)
}

// Actualizar marcadores en el mapa (similar a addDamageMarkers de realDB)
const actualizarMarcadores = async () => {
  if (!map.value) {
    console.log('⚠️ No se puede agregar marcadores - mapa no disponible')
    return
  }

  if (!oportunidades.value || oportunidades.value.length === 0) {
    console.log('⚠️ No se pueden agregar marcadores - no hay oportunidades')
    return
  }

  console.log('📍 Agregando marcadores de oportunidades:', oportunidades.value.length)
  
  // Limpiar solo marcadores de oportunidades (no el marcador del usuario)
  const userMarker = markers.value.find(m => m._isUserMarker)
  markers.value.forEach(marker => {
    if (!marker._isUserMarker) {
      try {
        map.value.removeLayer(marker)
      } catch (e) {
        console.warn('⚠️ Error removiendo marcador:', e)
      }
    }
  })
  markers.value = userMarker ? [userMarker] : []

  // Usar L global desde window
  const L = window.L || window.Leaflet
  if (!L) {
    console.error('❌ Leaflet no está disponible para agregar marcadores')
    return
  }

  // Agregar marcadores para cada oportunidad
  oportunidades.value.forEach((oportunidad, index) => {
    try {
      console.log(`📍 Procesando oportunidad ${index + 1}/${oportunidades.value.length}:`, {
        area: oportunidad.area,
        item: oportunidad.item,
        geolocation: oportunidad.geolocation
      })
      
      // Verificar que tiene geolocalización
      if (!oportunidad.geolocation || !oportunidad.geolocation.latitude || !oportunidad.geolocation.longitude) {
        console.warn(`⚠️ Oportunidad ${index + 1} no tiene geolocalización válida:`, oportunidad)
        return
      }
      
      const { latitude, longitude } = oportunidad.geolocation
      console.log(`📍 Coordenadas: ${latitude}, ${longitude}`)
      
      // Verificar si el marcador ya existe
      const existingMarker = markers.value.find(m => {
        return m._oportunidadData && 
               m._oportunidadData.bitacoraId === oportunidad.bitacoraId &&
               m._oportunidadData.area === oportunidad.area &&
               m._oportunidadData.item === oportunidad.item
      })
      
      if (existingMarker) {
        console.log(`⏭️ Marcador ya existe para ${oportunidad.area}/${oportunidad.item}, omitiendo...`)
        return
      }
      
      // Crear icono personalizado (similar a realDB)
      const color = '#ef4444' // Rojo para oportunidades
      const icon = L.divIcon({
        className: 'opportunity-marker',
        html: `<div style="background: ${color}; color: white; border-radius: 12px; width: 36px; height: 36px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border: 2px solid white; box-shadow: 0 6px 14px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2);"><i class="ph ph-warning" style="font-family: Phosphor !important; font-size:18px; color:#ffffff; line-height:1; display:inline-block;"></i><span style="font-size: 8px; margin-top: -2px;">${Math.round(oportunidad.distancia * 10) / 10}km</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      })

      console.log(`🗺️ Creando marcador en [${latitude}, ${longitude}]`)
      const marker = L.marker([latitude, longitude], { icon })
      
      // Guardar referencia a la oportunidad
      marker._oportunidadData = oportunidad
      
      // Agregar popup
      const popupContent = `
        <div style="padding: 16px; min-width: 280px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="background: ${color}; color: white; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
              <i class="ph ph-warning" style="font-size: 16px;"></i>
            </div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${oportunidad.area} - ${oportunidad.item}</h3>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">${oportunidad.unidadResidencialNombre}</p>
            </div>
          </div>
          <p style="margin: 0 0 12px 0; color: #374151; line-height: 1.5;">${oportunidad.comentario || 'Sin comentarios'}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600;">Calificación R</span>
            <span style="color: #6b7280; font-size: 12px;">${Math.round(oportunidad.distancia * 10) / 10} km</span>
          </div>
          <button onclick="window.dispatchEvent(new CustomEvent('view-opportunity', { detail: ${JSON.stringify(oportunidad).replace(/"/g, '&quot;')} }))" 
                  style="width: 100%; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
            <i class="ph ph-eye" style="font-size: 16px;"></i>
            Ver Detalles y Enviar Propuesta
          </button>
        </div>
      `
      
      marker.bindPopup(popupContent, {
        maxWidth: 320,
        className: 'custom-popup'
      })
      
      // Agregar evento de clic
      marker.on('click', () => {
        console.log('📍 Marcador clickeado:', oportunidad.area, oportunidad.item)
        abrirModalPropuesta(oportunidad)
      })
      
      console.log(`🗺️ Agregando marcador al mapa...`)
      marker.addTo(map.value)
      markers.value.push(marker)
      console.log(`✅ Marcador ${index + 1} agregado exitosamente para: ${oportunidad.area}/${oportunidad.item} en [${latitude}, ${longitude}]`)
    } catch (error) {
      console.error(`❌ Error agregando marcador ${index + 1}:`, error)
      console.error('❌ Stack:', error.stack)
      console.error('❌ Oportunidad que falló:', oportunidad)
    }
  })
  
  console.log('✅ Total marcadores en mapa:', markers.value.length)
  
  // Ajustar vista del mapa para mostrar todos los marcadores (incluyendo usuario)
  if (oportunidades.value.length > 0 && map.value) {
    try {
      const L = window.L || window.Leaflet
      if (L) {
        const allPoints = oportunidades.value.map(op => [op.geolocation.latitude, op.geolocation.longitude])
        if (userLocation.value) {
          allPoints.push([userLocation.value.latitude, userLocation.value.longitude])
        }
        const bounds = L.latLngBounds(allPoints)
        map.value.fitBounds(bounds, { padding: [50, 50] })
      }
    } catch (error) {
      console.error('❌ Error ajustando vista del mapa:', error)
    }
  }
}

// Función global para seleccionar oportunidad (llamada desde popup)
window.seleccionarOportunidad = (bitacoraId, area, item) => {
  const oportunidad = oportunidades.value.find(
    op => op.bitacoraId === bitacoraId && op.area === area && op.item === item
  )
  if (oportunidad) {
    abrirModalPropuesta(oportunidad)
  }
}

// Obtener ubicación del usuario
const obtenerYActualizarUbicacion = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    console.log('📍 Obteniendo ubicación del usuario...')
    const location = await proveedoresStore.obtenerUbicacion()
    userLocation.value = location
    console.log('✅ Ubicación obtenida:', location)
    
    // Asegurar que el mapa esté inicializado
    if (!map.value) {
      console.log('⚠️ Mapa no está inicializado, inicializando...')
      await inicializarMapa()
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    // Centrar mapa en la ubicación del usuario (zoom 15 como en realDB)
    if (map.value) {
      map.value.setView([location.latitude, location.longitude], 15)
      map.value.invalidateSize() // Forzar redimensionamiento
      
      // Remover marcador anterior si existe
      const existingUserMarker = markers.value.find(m => m._isUserMarker)
      if (existingUserMarker) {
        map.value.removeLayer(existingUserMarker)
        markers.value = markers.value.filter(m => !m._isUserMarker)
      }
      
      // Usar L global desde window
      const L = window.L || window.Leaflet
      if (!L) {
        console.error('❌ Leaflet no está disponible')
        return
      }
      
      // Agregar marcador de ubicación del usuario (similar a realDB)
      const userMarker = L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: '<div style="background: #10b981; color: white; border-radius: 12px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 18px; border: 2px solid white; box-shadow: 0 6px 14px rgba(16,185,129,0.85), 0 2px 6px rgba(5,150,105,0.65);"><i class="ph ph-navigation-arrow" style="font-family: Phosphor !important; font-size:18px; color:#ffffff; line-height:1; display:inline-block;"></i></div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      }).addTo(map.value)
      
      userMarker._isUserMarker = true
      markers.value.push(userMarker)
      console.log('✅ Mapa centrado en ubicación del usuario')
    } else {
      console.warn('⚠️ Mapa aún no está disponible')
    }
    
    // Cargar oportunidades automáticamente
    console.log('🔍 Cargando oportunidades cercanas...')
    await cargarOportunidades()
    
  } catch (err) {
    console.error('❌ Error obteniendo ubicación:', err)
    error.value = 'No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación o ingrésala manualmente.'
  } finally {
    isLoading.value = false
  }
}

// Cargar oportunidades
const cargarOportunidades = async () => {
  if (!userLocation.value) {
    error.value = 'Por favor, obtén tu ubicación primero'
    return
  }

  try {
    isLoading.value = true
    error.value = null

    console.log('🔍 Cargando oportunidades para:', {
      lat: userLocation.value.latitude,
      lon: userLocation.value.longitude,
      radius: searchRadius.value
    })

    await proveedoresStore.loadOportunidadesCercanas(
      userLocation.value.latitude,
      userLocation.value.longitude,
      searchRadius.value
    )

    oportunidades.value = proveedoresStore.oportunidades
    console.log('✅ Oportunidades cargadas:', oportunidades.value.length)
    console.log('📊 Datos de oportunidades:', oportunidades.value.map(op => ({
      area: op.area,
      item: op.item,
      geolocation: op.geolocation,
      distancia: op.distancia
    })))
    
    // Esperar a que el mapa esté listo antes de actualizar marcadores
    if (!map.value) {
      console.log('⚠️ Mapa no está inicializado, inicializando...')
      await inicializarMapa()
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Asegurar que el mapa esté listo
    if (map.value) {
      console.log('✅ Mapa listo, actualizando marcadores...')
      console.log('📊 Oportunidades antes de actualizar marcadores:', oportunidades.value.length)
      await actualizarMarcadores()
      console.log('✅ Marcadores actualizados. Total en mapa:', markers.value.length)
      console.log('📊 Marcadores desglosados:', {
        usuario: markers.value.filter(m => m._isUserMarker).length,
        oportunidades: markers.value.filter(m => !m._isUserMarker).length
      })
    } else {
      console.error('❌ Mapa aún no está disponible después de intentar inicializarlo')
    }

  } catch (err) {
    console.error('❌ Error cargando oportunidades:', err)
    error.value = err.message || 'Error cargando oportunidades'
  } finally {
    isLoading.value = false
  }
}

// Abrir modal de propuesta
const abrirModalPropuesta = (oportunidad) => {
  oportunidadSeleccionada.value = oportunidad
  propuestaForm.value = {
    proveedorEmail: authStore.userEmail || '',
    whatsapp: '',
    propuestaTexto: ''
  }
  showPropuestaModal.value = true
}

// Cerrar modal
const cerrarModal = () => {
  showPropuestaModal.value = false
  oportunidadSeleccionada.value = null
}

// Enviar propuesta
const enviarPropuesta = async () => {
  if (!oportunidadSeleccionada.value) return

  try {
    isEnviando.value = true

    const propuestaData = {
      bitacoraId: oportunidadSeleccionada.value.bitacoraId,
      area: oportunidadSeleccionada.value.area,
      item: oportunidadSeleccionada.value.item,
      propuestaTexto: propuestaForm.value.propuestaTexto,
      whatsapp: propuestaForm.value.whatsapp
    }

    await proveedoresStore.crearPropuesta(propuestaData)

    // Mostrar mensaje de éxito
    showSuccess.value = true
    cerrarModal()

    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
      showSuccess.value = false
    }, 5000)

  } catch (err) {
    console.error('❌ Error enviando propuesta:', err)
    error.value = err.message || 'Error enviando propuesta'
    alert('Error enviando propuesta: ' + (err.message || 'Error desconocido'))
  } finally {
    isEnviando.value = false
  }
}

// Logout
const logout = () => {
  authStore.logout()
  router.push('/auth')
}

// Watch para inicializar mapa cuando el contenedor esté disponible
watch([isLoading, error], async ([newIsLoading, newError]) => {
  // Solo inicializar cuando no hay loading ni error (el contenedor está visible)
  if (!newIsLoading && !newError && !map.value) {
    console.log('🔄 Condiciones cumplidas para inicializar mapa (isLoading=false, error=null)')
    
    // Esperar múltiples ciclos de renderizado para asegurar que el contenedor existe
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 300))
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))
    
    const container = document.getElementById('map')
    if (container && container.offsetParent !== null) {
      console.log('✅ Contenedor del mapa encontrado y visible, inicializando...')
      await inicializarMapa()
    } else {
      console.warn('⚠️ Contenedor del mapa aún no está disponible')
      console.warn('⚠️ Container existe:', !!container)
      console.warn('⚠️ Container visible:', container ? container.offsetParent !== null : false)
      
      // Reintentar con más intentos
      let retryAttempts = 0
      const maxRetries = 10
      
      const retryInit = async () => {
        retryAttempts++
        await nextTick()
        await new Promise(resolve => setTimeout(resolve, 300))
        
        const retryContainer = document.getElementById('map')
        if (retryContainer && retryContainer.offsetParent !== null && !map.value) {
          console.log(`✅ Contenedor encontrado en intento ${retryAttempts}, inicializando...`)
          await inicializarMapa()
        } else if (retryAttempts < maxRetries && !map.value && !isLoading.value && !error.value) {
          console.log(`⏳ Reintentando inicialización (${retryAttempts}/${maxRetries})...`)
          setTimeout(retryInit, 500)
        } else if (retryAttempts >= maxRetries) {
          console.error('❌ No se pudo inicializar el mapa después de', maxRetries, 'intentos')
        }
      }
      
      setTimeout(retryInit, 500)
    }
  }
}, { immediate: true })

// Watch para actualizar marcadores cuando cambien las oportunidades
watch(oportunidades, async (newOportunidades, oldOportunidades) => {
  console.log('🔄 Watch de oportunidades activado:', {
    nuevas: newOportunidades.length,
    anteriores: oldOportunidades?.length || 0,
    mapaDisponible: !!map.value
  })
  
  if (newOportunidades.length > 0 && map.value) {
    console.log('✅ Condiciones cumplidas: hay oportunidades y mapa disponible')
    console.log('🔄 Actualizando marcadores...')
    await actualizarMarcadores()
  } else if (newOportunidades.length > 0 && !map.value) {
    console.warn('⚠️ Hay oportunidades pero el mapa no está disponible, esperando...')
    // Esperar a que el mapa esté disponible
    let attempts = 0
    const maxAttempts = 20
    const checkMap = setInterval(() => {
      attempts++
      if (map.value) {
        clearInterval(checkMap)
        console.log(`✅ Mapa disponible después de ${attempts} intentos, actualizando marcadores...`)
        actualizarMarcadores()
      } else if (attempts >= maxAttempts) {
        clearInterval(checkMap)
        console.error('❌ Mapa no disponible después de', maxAttempts, 'intentos')
      }
    }, 500)
  } else {
    console.log('ℹ️ No hay oportunidades o condiciones no cumplidas')
  }
}, { deep: true, immediate: false })

// Lifecycle
onMounted(async () => {
  // Esperar un momento para que el componente se monte completamente
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // Intentar obtener ubicación automáticamente
  // Esto cargará las oportunidades automáticamente
  try {
    await obtenerYActualizarUbicacion()
  } catch (error) {
    console.log('⚠️ No se pudo obtener ubicación automáticamente:', error)
    // Si no se puede obtener ubicación, al menos inicializar el mapa
    isLoading.value = false
  }
})

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<style scoped>
.provider-dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.dashboard-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

@media (min-width: 768px) {
  .dashboard-header {
    padding: 20px 24px;
  }
}

@media (min-width: 1024px) {
  .dashboard-header {
    padding: 24px 32px;
  }
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 768px) {
  .header-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }
}

.dashboard-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  line-height: 1.2;
}

@media (min-width: 768px) {
  .dashboard-title {
    font-size: 24px;
    gap: 12px;
  }
}

@media (min-width: 1024px) {
  .dashboard-title {
    font-size: 28px;
  }
}

.dashboard-subtitle {
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-size: 12px;
}

@media (min-width: 768px) {
  .dashboard-subtitle {
    font-size: 14px;
  }
}

.logout-btn {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  transition: all 0.2s;
  align-self: flex-end;
}

@media (min-width: 768px) {
  .logout-btn {
    padding: 8px 16px;
    gap: 8px;
    align-self: auto;
  }
}

.logout-btn:hover {
  background: rgba(255,255,255,0.3);
}

.controls-section {
  background: white;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

@media (min-width: 768px) {
  .controls-section {
    padding: 16px 24px;
  }
}

.controls-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 768px) {
  .controls-content {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
  }
}

.location-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (min-width: 768px) {
  .location-controls {
    gap: 16px;
  }
}

.btn-location {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .btn-location {
    padding: 10px 20px;
    gap: 8px;
  }
}

.btn-location-text {
  display: inline-block;
}

.btn-location:hover:not(:disabled) {
  background: #5568d3;
}

.btn-location:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.radius-control {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .radius-control {
    gap: 12px;
  }
}

.radius-label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .radius-label {
    font-size: 13px;
  }
}

.radius-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-width: 80px;
  max-width: 100%;
  background: white;
  cursor: pointer;
}

@media (max-width: 767px) {
  .radius-select {
    padding: 8px 10px;
    font-size: 13px;
    min-width: 70px;
    flex: 1;
  }
}

.map-container {
  position: relative;
  height: calc(100vh - 180px);
  max-width: 1400px;
  margin: 12px auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

@media (min-width: 768px) {
  .map-container {
    height: calc(100vh - 200px);
    margin: 24px auto;
    border-radius: 12px;
  }
}

#map {
  width: 100%;
  height: 100%;
}

.map-legend {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 8px 10px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  z-index: 1000;
  font-size: 12px;
}

@media (min-width: 768px) {
  .map-legend {
    top: 16px;
    right: 16px;
    padding: 12px;
    border-radius: 8px;
    font-size: 14px;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.legend-marker {
  width: 20px;
  height: 20px;
  background: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.loading-container, .error-container {
  text-align: center;
  padding: 48px;
  max-width: 600px;
  margin: 48px auto;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn-retry {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 16px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-close:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 24px;
}

.oportunidad-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.info-item {
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item strong {
  color: #333;
}

.imagen-preview {
  margin-top: 12px;
}

.imagen-preview img {
  max-width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.propuesta-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-input, .form-textarea {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  font-family: inherit;
}

.form-input:disabled {
  background: #f5f5f5;
  color: #666;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-cancel {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-submit {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 400px;
}

.success-message i {
  font-size: 24px;
}

/* Estilos para marcadores personalizados */
:deep(.custom-marker) {
  background: transparent;
  border: none;
}

.marker-content {
  background: #ef4444;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 3px solid white;
  font-size: 18px;
}

.marker-distance {
  font-size: 9px;
  font-weight: bold;
  margin-top: -4px;
}

.user-location-marker {
  background: transparent;
  border: none;
}

.user-marker-content {
  background: #3b82f6;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  border: 3px solid white;
  font-size: 16px;
}

/* Estilos para popup */
:deep(.leaflet-popup-content) {
  margin: 12px;
  min-width: 200px;
}

.popup-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.popup-content p {
  margin: 4px 0;
  font-size: 13px;
  color: #666;
}

.btn-popup {
  background: #667eea;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
  width: 100%;
}

.btn-popup:hover {
  background: #5568d3;
}
</style>

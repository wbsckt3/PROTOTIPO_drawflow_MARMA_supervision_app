<template>
  <div class="bitacora-form" :class="{ submitting: isSubmitting }">
    <!-- Botón volver -->
    <div class="top-actions">
      <button type="button" class="btn back-btn" @click="goBack">
        <i class="ph ph-arrow-left"></i>
        Volver a mis bitácoras
      </button>
    </div>

    <!-- Información de la bitácora -->
    <div class="info-display">
      <div class="info-item">
        <span class="info-label">Unidad Residencial:</span>
        <span class="info-value">{{ bitacora.unidadNombre || bitacora.unidadResidencial?.nombre || 'No especificada' }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Fecha:</span>
        <span class="info-value">{{ formatDate(bitacora.fecha) }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Supervisor:</span>
        <span class="info-value">{{ bitacora.supervisor }}</span>
      </div>
      <div v-if="isReadOnly" class="info-item read-only-badge">
        <span class="read-only-indicator">
          <i class="ph ph-lock"></i>
          Modo solo lectura
        </span>
        <span class="status" :class="bitacora.estado">{{ getStatusText(bitacora.estado) }}</span>
      </div>
    </div>

    <!-- Pestañas de áreas -->
    <div class="area-tabs">
      <button 
        v-for="area in areas" 
        :key="area.key"
        :class="['area-tab', { active: activeArea === area.key }]"
        @click="setActiveArea(area.key)"
      >
        <i :class="area.icon"></i>
        {{ area.name }}
      </button>
    </div>

    <!-- Formulario por área -->
    <div class="area-content">
      <div v-for="area in areas" :key="area.key" class="area-accordion">
        <button 
          type="button"
          class="area-tab area-accordion-header"
          @click="toggleOpen(area.key)"
        >
          <div class="left">
            <i :class="area.icon"></i>
            {{ area.name }}
            <div class="progress-container-inline">
              <div class="progress-bar-inline">
                <div 
                  class="progress-fill-inline" 
                  :style="{ width: getAreaProgress(area.key) + '%' }"
                ></div>
              </div>
              <span class="progress-text-inline">{{ getAreaProgress(area.key) }}%</span>
            </div>
          </div>
          <i class="ph" :class="openAreas[area.key] ? 'ph-caret-up' : 'ph-caret-down'"></i>
        </button>

        <div v-show="openAreas[area.key]" class="area-accordion-body">
          <div class="area-header">
            <h3>{{ area.name }}</h3>
            <div class="area-toggle">
              <input 
                type="checkbox" 
                :id="`area-${area.key}`"
                v-model="formData.areas[area.key].enabled"
                @change="toggleArea(area.key)"
                :disabled="isReadOnly"
              >
              <label :for="`area-${area.key}`">Habilitar área</label>
            </div>
          </div>

          <div v-if="formData.areas[area.key].enabled" class="supervision-items">
            <div 
              v-for="(item, itemKey) in area.items" 
              :key="itemKey"
              class="supervision-item"
            >
              <label>{{ item }}</label>
              <div class="rating-badges-group">
                <label class="rating-badge rating-badge-e" :class="{ active: formData.areas[area.key].ratings[itemKey] === 'E', disabled: isReadOnly }">
                  <input type="radio" :name="`${area.key}-${itemKey}`" value="E" v-model="formData.areas[area.key].ratings[itemKey]" @change="onRatingChange(area.key, itemKey, 'E')" :disabled="isReadOnly">
                  <span class="rating-label">E</span>
                  <span class="rating-text">Excelente</span>
                </label>
                <label class="rating-badge rating-badge-b" :class="{ active: formData.areas[area.key].ratings[itemKey] === 'B', disabled: isReadOnly }">
                  <input type="radio" :name="`${area.key}-${itemKey}`" value="B" v-model="formData.areas[area.key].ratings[itemKey]" @change="onRatingChange(area.key, itemKey, 'B')" :disabled="isReadOnly">
                  <span class="rating-label">B</span>
                  <span class="rating-text">Bueno</span>
                </label>
                <label class="rating-badge rating-badge-r" :class="{ active: formData.areas[area.key].ratings[itemKey] === 'R', disabled: isReadOnly }">
                  <input type="radio" :name="`${area.key}-${itemKey}`" value="R" v-model="formData.areas[area.key].ratings[itemKey]" @change="onRatingChange(area.key, itemKey, 'R')" :disabled="isReadOnly">
                  <span class="rating-label">R</span>
                  <span class="rating-text">Regular</span>
                </label>
              </div>

              <!-- Sección de foto: máx 2 fotos por ítem -->
              <div v-if="formData.areas[area.key].ratings[itemKey]" class="photo-capture">
                <!-- Botón para tomar foto (solo si no es modo solo lectura) -->
                <button
                  v-if="!isReadOnly && getPhotosCount(area.key, itemKey) < MAX_PHOTOS_PER_ITEM"
                  type="button"
                  class="btn photo-btn"
                  @click="() => capturePhoto(area.key, itemKey)"
                >
                  <i class="ph ph-camera"></i>
                  {{
                    formData.areas[area.key].ratings[itemKey] === 'R'
                      ? `Tomar foto (requerida ${getPhotosCount(area.key, itemKey) + 1}/${MAX_PHOTOS_PER_ITEM})`
                      : `Tomar foto (opcional ${getPhotosCount(area.key, itemKey) + 1}/${MAX_PHOTOS_PER_ITEM})`
                  }}
                </button>

                <!-- Vista previa de fotos (ambos modos) -->
                <div v-if="getPhotosCount(area.key, itemKey) > 0" class="photo-preview multi-photo-preview" :class="{ 'read-only': isReadOnly }">
                  <div
                    v-for="(p, pIndex) in getPhotosArray(formData.areas[area.key].photos[itemKey])"
                    :key="pIndex"
                    class="photo-thumb"
                  >
                    <img
                      :src="getPhotoImage(p)"
                      alt="Foto capturada"
                      style="cursor: pointer;"
                      @click="() => viewPhoto(area.key, itemKey, pIndex)"
                      @error="handleImageError(area.key, itemKey)"
                    >
                    <button
                      v-if="!isReadOnly"
                      type="button"
                      class="btn remove-photo"
                      @click="removePhoto(area.key, itemKey, pIndex)"
                    >
                      <i class="ph ph-x"></i>
                    </button>
                  </div>
                </div>

                <!-- Mensaje de advertencia si es R y no hay foto -->
                <div
                  v-if="!isReadOnly && formData.areas[area.key].ratings[itemKey] === 'R' && getPhotosCount(area.key, itemKey) === 0"
                  class="photo-warning"
                >
                  <i class="ph ph-warning"></i>
                  <span>La foto es obligatoria para calificación Regular</span>
                </div>
              </div>

              <div class="comment-section">
                <button v-if="!isReadOnly" type="button" class="add-comment-btn" @click="toggleComment(area.key, itemKey)">
                  <i class="ph ph-chat-circle"></i>
                  Comentario
                  <div class="tooltip">Agregar comentario</div>
                </button>
                <!-- Mostrar comentario existente en modo solo lectura -->
                <div v-if="isReadOnly && formData.areas[area.key].comments[itemKey]" class="comment-display">
                  <i class="ph ph-chat-circle"></i>
                  <span>{{ formData.areas[area.key].comments[itemKey] }}</span>
                </div>
                <textarea v-if="!isReadOnly && formData.areas[area.key].showComment[itemKey]" v-model="formData.areas[area.key].comments[itemKey]" placeholder="Escribe tu comentario aquí..." class="comment-textarea"></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comentario Global (no se muestra en PDF) -->
    <div v-if="!isReadOnly" class="global-comment-section">
      <div class="global-comment-header">
        <i class="ph ph-note"></i>
        <h3>Comentario Global (Interno)</h3>
        <span class="global-comment-badge">No se incluye en PDF</span>
      </div>
      <textarea 
        v-model="comentarioGlobal" 
        placeholder="Agregar observación general de la bitácora (solo visible para administradores, no se incluye en el PDF entregado al cliente)..."
        class="global-comment-textarea"
        rows="4"
      ></textarea>
      <small class="global-comment-help">
        <i class="ph ph-info"></i>
        Este comentario es solo para uso interno y no aparecerá en el PDF entregado al cliente
      </small>
    </div>

    <!-- Mostrar comentario global en modo solo lectura -->
    <div v-if="isReadOnly && bitacora.comentarioGlobal" class="global-comment-section read-only">
      <div class="global-comment-header">
        <i class="ph ph-note"></i>
        <h3>Comentario Global (Interno)</h3>
        <span class="global-comment-badge">No se incluye en PDF</span>
      </div>
      <div class="global-comment-display">
        {{ bitacora.comentarioGlobal }}
      </div>
    </div>

    <!-- Footer con botones -->
    <div class="footer">
      <button v-if="bitacora.estado === 'completada' || bitacora.estado === 'con_novedad'" type="button" class="btn primary download-btn" @click="downloadPDFFromForm" :disabled="isSubmitting">
        <i class="ph ph-download"></i>
        Descargar PDF
      </button>
      <template v-else>
        <button type="button" class="btn" @click="saveDraft" :disabled="isSubmitting">
          <i class="ph ph-floppy-disk"></i>
          Guardar borrador
        </button>
        <button type="button" class="btn primary" @click="submitForm" :disabled="isSubmitting">
          <i v-if="isSubmitting" class="ph ph-spinner ph-spin"></i>
          <i v-else class="ph ph-check"></i>
          {{ isSubmitting ? 'Enviando...' : 'Enviar supervisión' }}
        </button>
      </template>
    </div>

    <!-- Overlay de carga durante el envío -->
    <div v-if="isSubmitting" class="submitting-overlay">
      <div class="submitting-content">
        <div class="loading-spinner-large"></div>
        <h3>Enviando supervisión...</h3>
        <p>Por favor espera, no cierres esta ventana</p>
        <p class="submitting-hint">Esto puede tardar unos momentos si hay fotografías</p>
      </div>
    </div>

    <!-- Modal de Cámara -->
    <div v-if="showCameraModal" class="camera-modal-overlay" @click="closeCameraModal">
      <div class="camera-modal" @click.stop>
        <div class="camera-modal-header">
          <h3>Tomar Foto</h3>
          <button type="button" class="close-btn" @click="closeCameraModal">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="camera-preview">
          <video ref="cameraVideo" autoplay playsinline></video>
          <canvas ref="cameraCanvas" style="display: none;"></canvas>
        </div>
        <div class="camera-modal-actions">
          <button type="button" class="btn cancel-btn" @click="closeCameraModal">
            <i class="ph ph-x"></i>
            Cancelar
          </button>
          <button type="button" class="btn capture-btn" @click="takePicture">
            <i class="ph ph-camera"></i>
            Capturar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para Ver Foto (solo lectura) -->
    <div v-if="showPhotoViewModal" class="photo-view-modal-overlay" @click="closePhotoViewModal">
      <div class="photo-view-modal" @click.stop>
        <div class="camera-modal-header">
          <h3>{{ viewingPhotoItemName || 'Ver Foto' }}</h3>
          <button type="button" class="close-btn" @click="closePhotoViewModal">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="camera-preview">
          <img v-if="viewingPhoto" :src="viewingPhoto" alt="Foto de evidencia" class="photo-view-image">
        </div>
        <div class="camera-modal-actions">
          <button type="button" class="btn cancel-btn" @click="closePhotoViewModal" style="width: 100%;">
            <i class="ph ph-x"></i>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router'
import { useBitacorasStore } from '../stores/bitacoras'
import { API_BASE_URL } from '../config/api'
import { jsPDF } from 'jspdf'
import encabezadoPdfUrl from '../../encabezado_para_pdf_marma.png'

const route = useRoute()
const router = useRouter()
const bitacorasStore = useBitacorasStore()
const nuevoLogoPdfUrl = `${import.meta.env.BASE_URL || '/'}logo_marma_nuevo.jpg`

// Obtener ID de la bitácora desde la ruta (como ref para que sea reactivo)
const bitacoraId = ref(route.params.id)

// Estado del modal de cámara
const showCameraModal = ref(false)
const cameraVideo = ref(null)
const cameraCanvas = ref(null)
const cameraStream = ref(null)
const currentPhotoContext = ref({ areaKey: null, itemKey: null })

// Comentario global (no se incluye en PDF)
const comentarioGlobal = ref('')

// Estado del modal para ver foto (solo lectura)
const showPhotoViewModal = ref(false)
const viewingPhoto = ref(null)
const viewingPhotoItemName = ref('')
const isSubmitting = ref(false)

// Computed para saber si está en modo solo lectura
const isReadOnly = computed(() => {
  return bitacora.value.estado === 'con_novedad' || bitacora.value.estado === 'completada'
})

// Datos de la bitácora (se cargarán desde el store)
const bitacora = ref({
  cliente: "",
  fecha: new Date(),
  supervisor: "",
  observaciones: "",
  nombreCompania: '',
  nombreSupervisor: '',
  supervisorEmail: ''
})

// Áreas de supervisión
const areas = ref([
  {
    key: 'piscinas',
    name: 'Piscinas',
    icon: 'ph ph-drop',
    items: ['BAÑOS', 'ROMPE OLAS', 'ANDENES', 'LAVA PIES - DUCHA', 'SAUNA', 'JACUZZI', 'TURCO', 'COLOR VISUAL', 'PH', 'CLORO', 'HOLL']
  },
  {
    key: 'zonas_comunes',
    name: 'Zonas Comunes',
    icon: 'ph ph-buildings',
    items: ['GIMNASIO']
  },
  {
    key: 'zonas_externas',
    name: 'Zonas Externas',
    icon: 'ph ph-tree',
    items: ['ZONA VERDES', 'CAÑUELAS', 'PARQUE INFANTIL', 'PAREDES', 'VIDRIOS - VENTANAS', 'PASAMANOS', 'TAPAS SHUT', 'GABINETES - EXTINTORES', 'BARRIO - TRAPEADO', 'ASCENSORES', 'TUBERÍA VOLÁTIL', 'ESCALAS', 'PISOS', 'SHUT BASURAS']
  },
  {
    key: 'oficinas',
    name: 'Oficinas',
    icon: 'ph ph-buildings',
    items: ['ESCRITORIOS','PAPELERAS','SALA DE JUNTAS','AULAS','BAÑOS','RECEPCIÓN','COMPUTADORES','PAREDES','CIELO RASO','COCINETA','ENTRADAS PRINCIPAL']
  },
  {
    key: 'operario',
    name: 'Operario',
    icon: 'ph ph-user',
    items: ['PRODUCTIVIDAD','PRESENTACIÓN','CARNET','ELEMENTOS EPP','CONTROL DE HORARIO','ACTITUD']
  }
])

// Agregar ítem "OTRO" a todas las áreas (si no existe) para permitir evidencias adicionales
areas.value.forEach((a) => {
  if (!a.items.includes('OTRO')) a.items.push('OTRO')
})

// Área activa (no se usa para render, mantenida por compatibilidad)
const activeArea = ref('piscinas')

// Estado de acordeón por área
const openAreas = reactive({})

// Datos del formulario
const formData = reactive({
  areas: {
    piscinas: {
      enabled: true,
      ratings: {},
      photos: {},
      comments: {},
      showComment: {}
    },
    zonas_comunes: {
      enabled: true,
      ratings: {},
      photos: {},
      comments: {},
      showComment: {}
    },
    zonas_externas: {
      enabled: true,
      ratings: {},
      photos: {},
      comments: {},
      showComment: {}
    },
    oficinas: {
      enabled: true,
      ratings: {},
      photos: {},
      comments: {},
      showComment: {}
    },
    operario: {
      enabled: true,
      ratings: {},
      photos: {},
      comments: {},
      showComment: {}
    }
  }
})

// Métodos
const setActiveArea = (areaKey) => {
  activeArea.value = areaKey
}

const toggleOpen = (areaKey) => {
  openAreas[areaKey] = !openAreas[areaKey]
}

const toggleArea = (areaKey) => {
  if (!formData.areas[areaKey].enabled) {
    // Limpiar datos si se deshabilita
    formData.areas[areaKey].ratings = {}
    formData.areas[areaKey].photos = {}
    formData.areas[areaKey].comments = {}
    formData.areas[areaKey].showComment = {}
  }
}

const onRatingChange = (areaKey, itemKey, rating) => {
  console.log(`Área: ${areaKey}, Item: ${itemKey}, Rating: ${rating}`)
}

const MAX_PHOTOS_PER_ITEM = 3

// Normaliza la estructura de fotos para permitir: string / objeto (legacy) o array (nuevo: máx 2)
const normalizePhotosArray = (photoData) => {
  if (!photoData) return []

  if (Array.isArray(photoData)) {
    return photoData.filter(Boolean)
  }

  // Variante si llega como { fotos: [...] }
  if (typeof photoData === 'object' && photoData !== null) {
    if (Array.isArray(photoData.fotos)) return photoData.fotos.filter(Boolean)

    // Foto legacy como objeto { image/url/... }
    if (photoData.image || photoData.url || photoData.base64) return [photoData]
  }

  if (typeof photoData === 'string') {
    // URL (dropbox/proxy) o base64
    if (photoData.length > 0) return [photoData]
  }

  return []
}

const getPhotosArray = (photoData) => normalizePhotosArray(photoData).slice(0, MAX_PHOTOS_PER_ITEM)

const getPhotosCount = (areaKey, itemKey) => {
  const photos = formData.areas?.[areaKey]?.photos?.[itemKey] ?? formData.areas?.[areaKey]?.photos?.[String(itemKey)]
  return getPhotosArray(photos).length
}

const getPhotoAtIndex = (areaKey, itemKey, photoIndex) => {
  const photos = formData.areas?.[areaKey]?.photos?.[itemKey] ?? formData.areas?.[areaKey]?.photos?.[String(itemKey)]
  const list = getPhotosArray(photos)
  return list[photoIndex] || null
}

const getNextPhotoSlot = (areaKey, itemKey) => {
  const photos = formData.areas?.[areaKey]?.photos?.[itemKey] ?? formData.areas?.[areaKey]?.photos?.[String(itemKey)]
  const list = getPhotosArray(photos)
  if (list.length >= MAX_PHOTOS_PER_ITEM) return null
  return list.length // guardamos consecutivo: 0, luego 1
}

const capturePhoto = async (areaKey, itemKey) => {
  console.log('📷 Iniciando captura de foto para:', areaKey, itemKey)
  
  try {
    // Guardar contexto de la foto actual
    const nextSlot = getNextPhotoSlot(areaKey, itemKey)
    if (nextSlot === null) {
      alert('Máximo 2 fotos por ítem. Elimina una foto para tomar otra.')
      return
    }
    currentPhotoContext.value = { areaKey, itemKey, photoSlot: nextSlot }
    console.log('✅ Contexto guardado:', currentPhotoContext.value)
    
    // Verificar que getUserMedia está disponible
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia no está disponible en este navegador')
    }
    
    // Solicitar acceso a la cámara
    console.log('🎥 Solicitando acceso a la cámara...')
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment', // Cámara trasera en móviles
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    
    console.log('✅ Cámara accedida, stream obtenido')
    cameraStream.value = stream
    
    // Mostrar modal primero para que el video element se renderice
    showCameraModal.value = true
    console.log('✅ Modal mostrado')
    
    // Esperar múltiples ticks para asegurar que el DOM se actualice completamente
    await nextTick()
    await nextTick()
    
    // Esperar un poco más para que el video element esté completamente renderizado
    await new Promise(resolve => setTimeout(resolve, 200))
    
    // Intentar múltiples veces encontrar el video element
    let attempts = 0
    const maxAttempts = 10
    
    while (!cameraVideo.value && attempts < maxAttempts) {
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 50))
      attempts++
      console.log(`🔄 Intento ${attempts} de encontrar video element`)
    }
    
    if (cameraVideo.value) {
      console.log('✅ Video element encontrado, asignando stream')
      cameraVideo.value.srcObject = stream
      
      // Configurar eventos del video
      cameraVideo.value.onloadedmetadata = () => {
        console.log('✅ Video metadata cargado')
        cameraVideo.value.play().catch(err => {
          console.error('Error reproduciendo video:', err)
        })
      }
      
      cameraVideo.value.oncanplay = () => {
        console.log('✅ Video puede reproducirse')
      }
      
      // Intentar reproducir inmediatamente
      try {
        await cameraVideo.value.play()
        console.log('✅ Video reproduciendo')
      } catch (playError) {
        console.warn('Advertencia al reproducir video:', playError)
        // Intentar de nuevo después de un momento
        setTimeout(() => {
          if (cameraVideo.value) {
            cameraVideo.value.play().catch(err => {
              console.error('Error en segundo intento de reproducción:', err)
            })
          }
        }, 500)
      }
    } else {
      console.error('❌ cameraVideo.value es null después de múltiples intentos')
      // Detener stream si no hay video element
      stream.getTracks().forEach(track => track.stop())
      showCameraModal.value = false
      alert('Error: No se pudo inicializar la vista previa de la cámara. Por favor, recarga la página.')
    }
  } catch (error) {
    console.error('❌ Error accediendo a la cámara:', error)
    console.error('Error completo:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    })
    
    // Detener cualquier stream que se haya iniciado
    if (cameraStream.value) {
      cameraStream.value.getTracks().forEach(track => track.stop())
      cameraStream.value = null
    }
    
    showCameraModal.value = false
    
    // Mensaje de error más específico
    let errorMessage = 'No se pudo acceder a la cámara.'
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Permiso de cámara denegado. Por favor, permite el acceso a la cámara en la configuración del navegador.'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      errorMessage = 'No se encontró ninguna cámara en el dispositivo.'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      errorMessage = 'La cámara está siendo usada por otra aplicación.'
    }
    
    alert(errorMessage)
  }
}

const takePicture = async () => {
  console.log('📸 Iniciando captura de foto...')
  
  if (!cameraVideo.value || !cameraCanvas.value) {
    console.error('❌ Video o Canvas no disponible')
    return
  }
  
  const video = cameraVideo.value
  const canvas = cameraCanvas.value
  const ctx = canvas.getContext('2d')
  
  // Configurar canvas con las dimensiones del video
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  console.log(`📐 Dimensiones del canvas: ${canvas.width}x${canvas.height}`)
  
  // Capturar frame del video
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  console.log('✅ Frame capturado en canvas')
  
  // Obtener foto como base64
  const photoData = canvas.toDataURL('image/jpeg', 0.8)
  console.log('✅ Foto convertida a base64, tamaño:', photoData.length, 'caracteres')
  
  // Obtener contexto de la foto
  const { areaKey, itemKey, photoSlot } = currentPhotoContext.value
  console.log('🔍 Contexto de foto (original):', { areaKey, itemKey, itemKeyType: typeof itemKey })
  console.log('🔍 formData.areas disponible:', Object.keys(formData.areas))
  
  if (!areaKey || itemKey === null || itemKey === undefined) {
    console.error('❌ No hay contexto válido para guardar la foto')
    alert('Error: No se pudo determinar dónde guardar la foto')
    closeCameraModal()
    return
  }
  
  // Asegurar que itemKey sea numérico (por si viene como string)
  const numericItemKey = typeof itemKey === 'string' ? parseInt(itemKey, 10) : itemKey
  console.log('🔍 itemKey convertido a número:', numericItemKey)
  
  // Verificar que el área existe
  if (!formData.areas[areaKey]) {
    console.error(`❌ Área ${areaKey} no existe en formData`)
    alert(`Error: Área ${areaKey} no encontrada`)
    closeCameraModal()
    return
  }
  
  // Verificar que photos existe
  if (!formData.areas[areaKey].photos) {
    console.log('⚠️ photos no existe, inicializando...')
    formData.areas[areaKey].photos = {}
  }
  
  // Obtener geolocalización ANTES de guardar la foto
  console.log('📍 Obteniendo geolocalización...')
  
  // Función para obtener geolocalización de forma asíncrona
  const getGeolocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('⚠️ Geolocalización no disponible en este navegador')
        resolve(null)
        return
      }
      
      // Timeout de 5 segundos para obtener la ubicación
      const timeout = setTimeout(() => {
        console.warn('⚠️ Timeout obteniendo geolocalización')
        resolve(null)
      }, 5000)
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout)
          const geolocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || null,
            altitudeAccuracy: position.coords.altitudeAccuracy || null,
            heading: position.coords.heading || null,
            speed: position.coords.speed || null,
            timestamp: new Date().toISOString()
          }
          console.log('✅ Geolocalización obtenida:', geolocation)
          resolve(geolocation)
        },
        (error) => {
          clearTimeout(timeout)
          console.warn('⚠️ No se pudo obtener geolocalización:', error.message)
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    })
  }
  
  // Obtener geolocalización y luego guardar la foto
  const geolocation = await getGeolocation()
  
  // Crear objeto de foto con geolocalización
  const photoObject = {
    image: photoData, // Base64 de la imagen
    geolocation: geolocation, // Objeto con lat, lng, etc. o null
    timestamp: new Date().toISOString()
  }
  
  // Guardar foto en el slot correcto (máx 2)
  const currentVal =
    formData.areas[areaKey].photos[numericItemKey] ??
    formData.areas[areaKey].photos[String(numericItemKey)]

  let photoList = getPhotosArray(currentVal)
  const slot = photoSlot ?? photoList.length

  if (slot < 0 || slot >= MAX_PHOTOS_PER_ITEM) {
    console.warn('⚠️ Slot de foto inválido, omitiendo:', { slot, areaKey, numericItemKey })
  } else {
    photoList[slot] = photoObject
    photoList = photoList.filter(Boolean).slice(0, MAX_PHOTOS_PER_ITEM)
    formData.areas[areaKey].photos[numericItemKey] = photoList
    formData.areas[areaKey].photos[String(numericItemKey)] = photoList // compat
  }
  
  // Cerrar modal y detener cámara
  console.log('🚪 Cerrando modal de cámara...')
  closeCameraModal()
  
  // Forzar actualización de Vue (por si acaso)
  await nextTick()
  console.log('✅ Proceso de captura completado')
}

const closeCameraModal = () => {
  console.log('🚪 Cerrando modal de cámara...')
  
  // Detener stream de cámara
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
    cameraStream.value = null
    console.log('✅ Stream de cámara detenido')
  }
  
  // Limpiar video
  if (cameraVideo.value) {
    cameraVideo.value.srcObject = null
    console.log('✅ Video limpiado')
  }
  
  // Cerrar modal
  showCameraModal.value = false
  
  // Limpiar contexto SOLO después de un pequeño delay para asegurar que la foto se guardó
  setTimeout(() => {
    currentPhotoContext.value = { areaKey: null, itemKey: null, photoSlot: null }
    console.log('✅ Contexto limpiado')
  }, 100)
}

const removePhoto = (areaKey, itemKey, photoIndex = 0) => {
  if (isReadOnly.value) return // No permitir eliminar en modo solo lectura
  const currentVal =
    formData.areas[areaKey]?.photos?.[itemKey] ??
    formData.areas[areaKey]?.photos?.[String(itemKey)]
  const photoList = getPhotosArray(currentVal)

  if (!photoList.length) return
  photoList.splice(photoIndex, 1)
  photoList.splice(MAX_PHOTOS_PER_ITEM) // por seguridad

  if (photoList.length === 0) {
    delete formData.areas[areaKey].photos[itemKey]
    delete formData.areas[areaKey].photos[String(itemKey)]
  } else {
    formData.areas[areaKey].photos[itemKey] = photoList
    formData.areas[areaKey].photos[String(itemKey)] = photoList
  }
}

// Función para extraer la imagen de un objeto de foto (compatibilidad con strings y objetos)
const getPhotoImage = (photoData) => {
  console.log('🖼️ getPhotoImage llamado con:', {
    tipo: typeof photoData,
    esObjeto: typeof photoData === 'object',
    esNull: photoData === null,
    esArray: Array.isArray(photoData),
    tieneUrl: typeof photoData === 'object' && !!photoData?.url,
    url: typeof photoData === 'object' ? photoData?.url?.substring(0, 80) + '...' : 'N/A',
    tieneImage: typeof photoData === 'object' && !!photoData?.image,
    esString: typeof photoData === 'string',
    esUrl: typeof photoData === 'string' && (photoData?.startsWith('http://') || photoData?.startsWith('https://')),
    esBase64: typeof photoData === 'string' && photoData?.startsWith('data:image')
  })
  
  if (!photoData) {
    console.log('🖼️ getPhotoImage: photoData es null/undefined, retornando vacío')
    return ''
  }

  // Nuevo formato: array de fotos
  if (Array.isArray(photoData)) {
    return photoData.length ? getPhotoImage(photoData[0]) : ''
  }

  // Variante: { fotos: [...] }
  if (typeof photoData === 'object' && photoData !== null && Array.isArray(photoData.fotos)) {
    return photoData.fotos.length ? getPhotoImage(photoData.fotos[0]) : ''
  }
  
  // Si es un objeto con propiedad url (Dropbox), devolver la URL
  if (typeof photoData === 'object' && photoData !== null) {
    // Prioridad: url (Dropbox) > image (base64)
    if (photoData.url && typeof photoData.url === 'string' && photoData.url.length > 0) {
      console.log('🖼️ getPhotoImage: Retornando URL de Dropbox:', photoData.url.substring(0, 80) + '...')
      return photoData.url
    }
    if (photoData.image && typeof photoData.image === 'string' && photoData.image.length > 0) {
      console.log('🖼️ getPhotoImage: Retornando image (base64)')
      return photoData.image
    }
    console.log('🖼️ getPhotoImage: Objeto sin url ni image válidos, retornando vacío')
    return ''
  }
  
  // Si es un string que ya es una URL (http/https), devolverla directamente
  if (typeof photoData === 'string' && photoData.length > 0) {
    if (photoData.startsWith('http://') || photoData.startsWith('https://')) {
      console.log('🖼️ getPhotoImage: Retornando URL directa:', photoData.substring(0, 80) + '...')
      return photoData
    }
    // Si es base64, devolverlo directamente (compatibilidad con datos antiguos)
    if (photoData.startsWith('data:image')) {
      console.log('🖼️ getPhotoImage: Retornando base64')
      return photoData
    }
    console.log('🖼️ getPhotoImage: String no reconocido como URL o base64, retornando vacío')
  }
  
  console.log('🖼️ getPhotoImage: No se pudo procesar photoData, retornando vacío')
  return ''
}

// Función auxiliar para verificar si hay foto
const hasPhoto = (areaKey, itemKey) => {
  return getPhotosCount(areaKey, itemKey) > 0
}

// Función para manejar errores al cargar imágenes
const handleImageError = (areaKey, itemKey) => {
  const photo = formData.areas[areaKey]?.photos?.[itemKey]
  console.error('❌ Error cargando imagen para', areaKey, itemKey, {
    photo,
    url: typeof photo === 'object' ? photo?.url : photo
  })
}

// Función para ver foto en modo solo lectura
const viewPhoto = (areaKey, itemKey, photoIndex = 0) => {
  // El modal de ver foto es solo para modo solo lectura
  if (!isReadOnly.value) return
  const photo = getPhotoAtIndex(areaKey, itemKey, photoIndex)
  if (photo) {
    // Obtener el nombre del item desde el área
    const area = areas.value.find(a => a.key === areaKey)
    const itemName = area?.items?.[parseInt(itemKey)] || area?.items?.[itemKey] || 'Ver Foto'
    viewingPhoto.value = getPhotoImage(photo)
    viewingPhotoItemName.value = itemName
    showPhotoViewModal.value = true
  }
}

const closePhotoViewModal = () => {
  showPhotoViewModal.value = false
  viewingPhoto.value = null
  viewingPhotoItemName.value = ''
}

// Función para obtener el texto del estado (igual que en Dashboard)
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

const toggleComment = (areaKey, itemKey) => {
  formData.areas[areaKey].showComment[itemKey] = !formData.areas[areaKey].showComment[itemKey]
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

// Calcular progreso de cada área basado en items diligenciados
const getAreaProgress = (areaKey) => {
  const area = areas.value.find(a => a.key === areaKey)
  if (!area || !formData.areas[areaKey]?.enabled) {
    return 0
  }
  
  const totalItems = area.items.length
  if (totalItems === 0) return 0
  
  const areaData = formData.areas[areaKey]
  const ratings = areaData.ratings || {}
  
  // Contar items con rating seleccionado (puede ser índice numérico o string)
  let itemsWithRating = 0
  area.items.forEach((item, index) => {
    const hasRating = ratings[index] || ratings[String(index)]
    if (hasRating && (hasRating === 'E' || hasRating === 'B' || hasRating === 'R')) {
      itemsWithRating++
    }
  })
  
  const percentage = Math.round((itemsWithRating / totalItems) * 100)
  return percentage
}

const INDEXED_DB_NAME = 'BitacoraDrafts'
const INDEXED_DB_STORE = 'drafts'

const getDraftFromIndexedDB = (id) => {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(INDEXED_DB_NAME, 1)
      req.onerror = () => resolve(null)
      req.onsuccess = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
          db.close()
          return resolve(null)
        }
        const tx = db.transaction(INDEXED_DB_STORE, 'readonly')
        const store = tx.objectStore(INDEXED_DB_STORE)
        const getReq = store.get('bitacora_draft_' + id)
        getReq.onsuccess = () => {
          db.close()
          resolve(getReq.result || null)
        }
        getReq.onerror = () => {
          db.close()
          resolve(null)
        }
      }
      req.onupgradeneeded = (e) => {
        e.target.result.createObjectStore(INDEXED_DB_STORE)
      }
    } catch (_) {
      resolve(null)
    }
  })
}

const deleteDraftFromIndexedDB = (id) => {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(INDEXED_DB_NAME, 1)
      req.onerror = () => resolve()
      req.onsuccess = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
          db.close()
          return resolve()
        }
        const tx = db.transaction(INDEXED_DB_STORE, 'readwrite')
        const store = tx.objectStore(INDEXED_DB_STORE)
        store.delete('bitacora_draft_' + id)
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => { db.close(); resolve() }
      }
      req.onupgradeneeded = (e) => { e.target.result.createObjectStore(INDEXED_DB_STORE) }
    } catch (_) { resolve() }
  })
}

const setDraftInIndexedDB = (id, data) => {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(INDEXED_DB_NAME, 1)
      req.onerror = () => resolve(false)
      req.onsuccess = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
          db.close()
          return resolve(false)
        }
        const tx = db.transaction(INDEXED_DB_STORE, 'readwrite')
        const store = tx.objectStore(INDEXED_DB_STORE)
        store.put(data, 'bitacora_draft_' + id)
        tx.oncomplete = () => {
          db.close()
          resolve(true)
        }
        tx.onerror = () => {
          db.close()
          resolve(false)
        }
      }
      req.onupgradeneeded = (e) => {
        e.target.result.createObjectStore(INDEXED_DB_STORE)
      }
    } catch (_) {
      resolve(false)
    }
  })
}

// Copia formData sin base64 en fotos para no exceder cuota de localStorage (~5MB)
const formDataForStorage = () => {
  const out = { areas: {} }
  Object.entries(formData.areas).forEach(([areaKey, areaData]) => {
    out.areas[areaKey] = { ...areaData, photos: {} }
    if (!areaData.photos) return
    Object.entries(areaData.photos).forEach(([itemKey, photo]) => {
      if (!photo) return

      // Si es array (máx 2 fotos por ítem), procesa cada foto individualmente
      if (Array.isArray(photo)) {
        const processed = photo
          .filter(Boolean)
          .slice(0, MAX_PHOTOS_PER_ITEM)
          .map((p) => {
            const isBase64 =
              typeof p === 'string'
                ? p.startsWith('data:image')
                : (p?.image && typeof p.image === 'string' && p.image.startsWith('data:image'))

            const hasUrl =
              typeof p === 'object' &&
              p !== null &&
              typeof p.url === 'string' &&
              (p.url.startsWith('http://') || p.url.startsWith('https://'))

            if (hasUrl) {
              return {
                url: p.url,
                geolocation: p.geolocation || null,
                timestamp: p.timestamp || null
              }
            }

            if (isBase64) {
              return {
                url: null,
                geolocation: typeof p === 'object' ? p.geolocation : null,
                timestamp: typeof p === 'object' ? p.timestamp : null,
                _base64Omitted: true
              }
            }

            return typeof p === 'object' ? { ...p } : p
          })

        if (processed.length > 0) out.areas[areaKey].photos[itemKey] = processed
        return
      }

      const isBase64 =
        typeof photo === 'string'
          ? photo.startsWith('data:image')
          : (photo.image && typeof photo.image === 'string' && photo.image.startsWith('data:image'))

      const hasUrl =
        typeof photo === 'object' &&
        typeof photo.url === 'string' &&
        (photo.url.startsWith('http://') || photo.url.startsWith('https://'))

      if (hasUrl) {
        out.areas[areaKey].photos[itemKey] = {
          url: photo.url,
          geolocation: photo.geolocation || null,
          timestamp: photo.timestamp || null
        }
      } else if (isBase64) {
        out.areas[areaKey].photos[itemKey] = {
          url: null,
          geolocation: typeof photo === 'object' ? photo.geolocation : null,
          timestamp: typeof photo === 'object' ? photo.timestamp : null,
          _base64Omitted: true
        }
      } else {
        out.areas[areaKey].photos[itemKey] = typeof photo === 'object' ? { ...photo } : photo
      }
    })
  })
  return out
}

const saveDraft = async () => {
  const id = String(bitacoraId.value ?? '')
  const fullData = JSON.stringify(formData)
  const ok = await setDraftInIndexedDB(id, fullData)
  if (ok) {
    try {
      localStorage.setItem('bitacora_draft_id', String(id))
      localStorage.setItem('bitacora_draft', JSON.stringify(formDataForStorage()))
    } catch (_) {}
    alert('Borrador guardado (incluidas las fotos)')
    return
  }
  try {
    localStorage.setItem('bitacora_draft_id', String(id))
    localStorage.setItem('bitacora_draft', JSON.stringify(formDataForStorage()))
    alert('Borrador guardado')
  } catch (e) {
    alert('Error al guardar borrador: ' + (e && e.message ? e.message : 'espacio insuficiente. Intente enviar la supervisión directamente.'))
  }
}

const submitForm = async () => {
  // Prevenir múltiples envíos
  if (isSubmitting.value) {
    console.log('⚠️ Ya se está enviando la bitácora, ignorando clic adicional')
    return
  }

  // Validar formulario
  const hasRatings = Object.values(formData.areas).some(area => 
    area.enabled && Object.keys(area.ratings).length > 0
  )
  
  if (!hasRatings) {
    alert('Debe calificar al menos un elemento')
    return
  }
  
  // Validar que todos los items con calificación R tengan foto
  const itemsSinFoto = []
  Object.entries(formData.areas).forEach(([areaKey, areaData]) => {
    if (!areaData.enabled) return
    
    Object.entries(areaData.ratings || {}).forEach(([itemKey, rating]) => {
      if (rating === 'R' && !areaData.photos?.[itemKey]) {
        const area = areas.value.find(a => a.key === areaKey)
        const itemName = area?.items?.[parseInt(itemKey)] || `Item ${itemKey}`
        itemsSinFoto.push(`${area?.name || areaKey}: ${itemName}`)
      }
    })
  })
  
  if (itemsSinFoto.length > 0) {
    alert(`Debe tomar una foto para los siguientes items con calificación Regular:\n\n${itemsSinFoto.join('\n')}`)
    return
  }
  
  // Activar estado de carga
  isSubmitting.value = true
  
  // Prevenir scroll durante el envío
  document.body.style.overflow = 'hidden'
  
  try {
    // Preparar datos para enviar en el formato que espera el backend
    const dataToSend = {
      areas: {},
      comentarios: {},
      evidencias: {}
    }
    
    // Obtener los items de cada área para mapear índices a nombres
    const areaItemsMap = {}
    areas.value.forEach(area => {
      areaItemsMap[area.key] = area.items
    })
    
    // Procesar cada área
    Object.entries(formData.areas).forEach(([areaKey, areaData]) => {
      if (!areaData.enabled) return
      
      const items = areaItemsMap[areaKey] || []
      
      // Transformar ratings: de índices numéricos a nombres de items
      const areasRatings = {}
      Object.entries(areaData.ratings || {}).forEach(([itemIndex, rating]) => {
        const itemName = items[parseInt(itemIndex)]
        if (itemName && rating) {
          areasRatings[itemName] = rating
        }
      })
      
      // Transformar comentarios: de índices numéricos a nombres de items
      const areasComentarios = {}
      Object.entries(areaData.comments || {}).forEach(([itemIndex, comment]) => {
        const itemName = items[parseInt(itemIndex)]
        if (itemName && comment) {
          areasComentarios[itemName] = comment
        }
      })
      
      // Transformar fotos (evidencias): de índices numéricos a nombres de items
      const areasEvidencias = {}
      Object.entries(areaData.photos || {}).forEach(([itemIndex, photoData]) => {
        const itemName = items[parseInt(itemIndex)]
        if (itemName && photoData) {
          // Nuevo formato: { fotos: [ { image, geolocation, timestamp }, ... ] } (máx 2)
          if (Array.isArray(photoData)) {
            const fotos = photoData
              .filter(Boolean)
              .slice(0, MAX_PHOTOS_PER_ITEM)
              .map((p) => {
                if (typeof p === 'object' && p !== null) {
                  return {
                    image: p.image,
                    geolocation: p.geolocation || null,
                    timestamp: p.timestamp || new Date().toISOString()
                  }
                }
                return p // compat: string URL/base64
              })
            if (fotos.length > 0) areasEvidencias[itemName] = { fotos }
          } else if (typeof photoData === 'object' && photoData.image) {
            areasEvidencias[itemName] = {
              fotos: [{
                image: photoData.image,
                geolocation: photoData.geolocation || null,
                timestamp: photoData.timestamp || new Date().toISOString()
              }]
            }
          } else {
            // Compatibilidad: string legacy (URL/base64)
            areasEvidencias[itemName] = photoData
          }
        }
      })
      
      // Asignar solo si hay datos
      if (Object.keys(areasRatings).length > 0) {
        dataToSend.areas[areaKey] = areasRatings
      }
      
      if (Object.keys(areasComentarios).length > 0) {
        dataToSend.comentarios[areaKey] = areasComentarios
      }
      
      if (Object.keys(areasEvidencias).length > 0) {
        dataToSend.evidencias[areaKey] = areasEvidencias
      }
      
      // Logging para verificar fotos
      const photosCount = Object.keys(areasEvidencias).length
      if (photosCount > 0) {
        console.log(`📷 Área ${areaKey} tiene ${photosCount} foto(s):`)
        Object.entries(areasEvidencias).forEach(([itemName, photoData]) => {
        // Manejar { fotos: [...] } (nuevo) y legados
        const firstFoto =
          photoData && typeof photoData === 'object' && Array.isArray(photoData.fotos)
            ? photoData.fotos[0]
            : null
        const imageData =
          firstFoto && typeof firstFoto === 'object'
            ? (firstFoto.image || firstFoto.url || null)
            : (photoData && typeof photoData === 'object' && photoData.image ? photoData.image : null)

        const isBase64 = typeof imageData === 'string' && imageData.startsWith('data:image')
        const photoSize = typeof imageData === 'string' ? imageData.length : 0
        const hasGeolocation = !!firstFoto?.geolocation

        console.log(
          `  - Item ${itemName}: ${isBase64 ? '✅ Base64 válido' : '❌ No es base64'}, tamaño: ${photoSize} caracteres, geolocalización: ${hasGeolocation ? '✅' : '❌'}`
        )

        if (hasGeolocation) {
          console.log(
            `    📍 Lat: ${firstFoto.geolocation.latitude}, Lng: ${firstFoto.geolocation.longitude}, Accuracy: ${firstFoto.geolocation.accuracy}m`
          )
        }
        })
      }
    })
    
    // Determinar estado basado en si hay calificaciones "R"
    let hasRegularRatings = false
    Object.values(dataToSend.areas).forEach(areaRatings => {
      if (Object.values(areaRatings).includes('R')) {
        hasRegularRatings = true
      }
    })
    
    // Si hay calificaciones R, el estado es "con_novedad", sino "completada"
    if (Object.keys(dataToSend.areas).length > 0) {
      dataToSend.estado = hasRegularRatings ? 'con_novedad' : 'completada'
    }
    
    // Agregar comentario global si existe (no se incluye en PDF)
    if (comentarioGlobal.value && comentarioGlobal.value.trim()) {
      dataToSend.comentarioGlobal = comentarioGlobal.value.trim()
    }
    
    console.log('💾 Datos a enviar al backend:', {
      areasCount: Object.keys(dataToSend.areas).length,
      comentariosCount: Object.keys(dataToSend.comentarios).length,
      evidenciasCount: Object.keys(dataToSend.evidencias).length,
      totalPhotos: Object.values(dataToSend.evidencias).reduce((sum, area) => 
        sum + Object.keys(area || {}).length, 0
      ),
      estado: dataToSend.estado,
      dataPreview: JSON.stringify(dataToSend).substring(0, 1000) + '...'
    })
    
    // Generar PDF en base64 ANTES de enviar
    console.log('📄 Generando PDF en base64...')
    let pdfBase64 = null
    try {
      pdfBase64 = await generatePDFBase64()
      console.log('📄 generatePDFBase64 retornó:', pdfBase64 ? 'base64 válido' : 'null')
      
      if (!pdfBase64) {
        console.warn('⚠️ generatePDFBase64 retornó null, intentando fallback...')
        // Si falla generatePDFBase64, seguir sin PDF pero enviar los datos
        console.log('⚠️ Se enviará la bitácora SIN pdfBase64, el backend regenerará el PDF')
      } else {
        console.log('✅ PDF generado en base64, tamaño:', (pdfBase64.length / 1024).toFixed(2), 'KB')
        // Agregar el PDF base64 al payload
        dataToSend.pdfBase64 = pdfBase64
      }
    } catch (pdfError) {
      console.error('❌ Error generando PDF en base64:', pdfError)
      console.log('⚠️ Se enviará la bitácora SIN pdfBase64, el backend regenerará el PDF')
      // Continuar sin PDF - el backend lo regenerará
    }
    
    // Enviar al backend usando el store
    // Asegurar que bitacoraId es el valor, no el ref
    const bitacoraIdValue = typeof bitacoraId === 'object' && bitacoraId?.value ? bitacoraId.value : bitacoraId
    console.log('🔍 Enviando bitácora CON PDF - bitacoraId:', bitacoraIdValue)
    console.log('🔍 bitacoraId (tipo):', typeof bitacoraIdValue)
    console.log('🔍 Payload contiene PDF:', !!dataToSend.pdfBase64)
    
    await bitacorasStore.llenarBitacora(bitacoraIdValue, dataToSend)
    
    // Guardar en localStorage como completada (sin base64 para no exceder cuota)
    try {
      localStorage.setItem('bitacora_completed', JSON.stringify(formDataForStorage()))
      console.log('✅ Bitácora guardada en localStorage')
    } catch (e) {
      console.warn('⚠️ No se pudo guardar bitacora_completed en localStorage:', e?.message)
    }

    // Quitar borrador de IndexedDB y localStorage para esta bitácora
    await deleteDraftFromIndexedDB(String(bitacoraIdValue))
    if (localStorage.getItem('bitacora_draft_id') === String(bitacoraIdValue)) {
      localStorage.removeItem('bitacora_draft_id')
      localStorage.removeItem('bitacora_draft')
    }
    
    alert('Supervisión enviada correctamente')
    
    // Descargar PDF localmente también
    downloadPDFFromForm()
    
    // Redirigir al dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('❌ Error enviando supervisión:', error)
    console.error('❌ Mensaje de error:', error.message)
    console.error('❌ Stack trace:', error.stack)
    
    // Desactivar estado de carga ANTES de mostrar el error
    // Esto asegura que el overlay no bloquee el mensaje de error
    isSubmitting.value = false
    document.body.style.overflow = ''
    
    // Esperar un momento para que el overlay se oculte antes de mostrar el alert
    await nextTick()
    setTimeout(() => {
      // Mostrar mensaje de error más específico
      const errorMessage = error.message || 'Error al enviar la supervisión, intentalo de nuevo'
      alert(`Error: ${errorMessage}`)
    }, 300)
  } finally {
    // Asegurar que el estado de carga esté desactivado (por si acaso)
    if (isSubmitting.value) {
      isSubmitting.value = false
      document.body.style.overflow = ''
    }
  }
}

// Función auxiliar para convertir imagen a base64
const imageToBase64 = async (url) => {
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' })
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.warn('Error convirtiendo imagen a base64:', url?.substring(0, 50), error)
    return null
  }
}

// Convierte todas las fotos con URL externa (http/https) a base64 para que aparezcan en el PDF.
// Usa proxy del backend para evitar CORS (p. ej. Dropbox).
const getPhotosBase64Map = async () => {
  const map = new Map()
  const urls = new Set()
  Object.values(formData.areas || {}).forEach((areaData) => {
    if (!areaData.photos) return
    Object.values(areaData.photos).forEach((photoData) => {
      const list = normalizePhotosArray(photoData)
      list.forEach((pd) => {
        const url = typeof pd === 'object' && pd !== null ? (pd.url || pd.image || '') : pd
        if (typeof url !== 'string') return
        if (url && (url.startsWith('http://') || url.startsWith('https://'))) urls.add(url)
      })
    })
  })
  const proxyBase = `${API_BASE_URL}/bitacoras-supervision/proxy-image`
  await Promise.all(Array.from(urls).map(async (url) => {
    let dataUrl = await imageToBase64(url)
    if (!dataUrl && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
      const proxyUrl = `${proxyBase}?url=${encodeURIComponent(url)}`
      dataUrl = await imageToBase64(proxyUrl)
    }
    if (dataUrl) map.set(url, dataUrl)
  }))
  return map
}

// Única fuente del HTML del PDF: descarga y envío al backend usan exactamente el mismo contenido
const buildBitacoraPDFHTML = (encabezadoBase64, photoBase64ByUrl = new Map()) => {
  const allItemCards = []
  Object.entries(formData.areas).forEach(([areaKey, areaData]) => {
    if (!areaData.enabled) return
    const areaName = areas.value.find((a) => a.key === areaKey)?.name || areaKey
    const areaItems = areas.value.find((a) => a.key === areaKey)?.items || []
    areaItems.forEach((item, index) => {
      const rating = areaData.ratings?.[index] || areaData.ratings?.[String(index)]
      if (!rating) return

      const ratingText = rating === 'E' ? 'Excelente' : rating === 'B' ? 'Bueno' : 'Regular'
      const comment = areaData.comments?.[index] || areaData.comments?.[String(index)] || ''
      const photoData = areaData.photos?.[index] || areaData.photos?.[String(index)] || null
      const photoList = normalizePhotosArray(photoData).slice(0, MAX_PHOTOS_PER_ITEM)
      const photoSrcs = photoList
        .map((pd) => (typeof pd === 'object' && pd !== null ? (pd.url || pd.image || '') : pd))
        .filter((p) => typeof p === 'string' && p.length > 0)
        .map((src) => {
          if ((src.startsWith('http://') || src.startsWith('https://')) && photoBase64ByUrl.has(src)) return photoBase64ByUrl.get(src)
          return src
        })

      const firstPhotoObj = typeof photoList[0] === 'object' && photoList[0] !== null ? photoList[0] : null
      const coordsText = firstPhotoObj?.geolocation
        ? `${firstPhotoObj.geolocation.latitude.toFixed(6)}, ${firstPhotoObj.geolocation.longitude.toFixed(6)}`
        : ''

      const slots = Array.from({ length: MAX_PHOTOS_PER_ITEM }).map((_, slotIdx) => {
        const src = photoSrcs[slotIdx]
        if (!src) {
          return '<div class="photo-slot empty"><span>SIN FOTO</span></div>'
        }
        return `<div class="photo-slot"><img src="${src}" alt="${item}" /></div>`
      }).join('')

      const card = `
        <section class="item-card">
          <div class="item-head">
            <div class="item-head-left">
              <div class="item-area">Area: ${areaName}</div>
              <div class="item-name">${item}</div>
            </div>
            <div class="item-rating rating-${rating.toLowerCase()}">${ratingText}</div>
          </div>
          <div class="photos-grid">${slots}</div>
          <div class="item-meta">
            <div class="coords">${coordsText ? `Coordenadas: ${coordsText}` : 'Coordenadas: N/A'}</div>
            <div class="comment">${comment ? comment : 'Sin comentario.'}</div>
          </div>
        </section>`
      allItemCards.push(card)
    })
  })

  // Siempre 2 items por página, completando con placeholders
  if (allItemCards.length % 2 !== 0) {
    allItemCards.push(`
      <section class="item-card placeholder">
        <div class="item-head">
          <div class="item-head-left">
            <div class="item-area">Area: N/A</div>
            <div class="item-name">SIN ITEM</div>
          </div>
          <div class="item-rating rating-na">N/A</div>
        </div>
        <div class="photos-grid">
          <div class="photo-slot empty"><span>SIN FOTO</span></div>
          <div class="photo-slot empty"><span>SIN FOTO</span></div>
          <div class="photo-slot empty"><span>SIN FOTO</span></div>
        </div>
        <div class="item-meta">
          <div class="coords">Coordenadas: N/A</div>
          <div class="comment">Bloque de relleno para conservar el formato corporativo.</div>
        </div>
      </section>`)
  }

  const pages = []
  for (let i = 0; i < allItemCards.length; i += 2) {
    pages.push(`<div class="pdf-page"><div class="page-items">${allItemCards[i] || ''}${allItemCards[i + 1] || ''}</div></div>`)
  }
  const areasHTML = pages.join('')

  const unidadLabel = bitacora.value.unidadNombre || bitacora.value.unidadResidencial?.nombre || 'No especificada'
  let infoHTML = '<p><strong>Unidad Residencial:</strong> ' + unidadLabel + '</p>'
  infoHTML += '<p><strong>Fecha Programada:</strong> ' + formatDate(bitacora.value.fecha) + '</p>'
  infoHTML += '<p><strong>Supervisor:</strong> ' + bitacora.value.supervisor + '</p>'
  if (bitacora.value.fechaInicio) infoHTML += '<p><strong>Fecha de Inicio:</strong> ' + formatDate(bitacora.value.fechaInicio) + '</p>'
  if (bitacora.value.fechaFin) infoHTML += '<p><strong>Fecha de Cierre:</strong> ' + formatDate(bitacora.value.fechaFin) + '</p>'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Bitácora de Supervisión - ${bitacora.value.unidadNombre || bitacora.value.unidadResidencial?.nombre || 'Unidad Residencial'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background: #fff; color: #111827; font-size: 12px; line-height: 1.35; }
    .pdf-header { width: 100%; max-height: 88px; object-fit: contain; display: block; margin: 0 auto 6px auto; }
    .content-wrapper { padding: 10px 10px 0 10px; background: white; }
    .header { text-align: center; margin-bottom: 6px; padding: 8px 10px; background: #1e3a8a; color: white; border-radius: 8px; }
    .header h1 { margin: 0 0 2px 0; font-size: 15px; font-weight: 700; letter-spacing: 0.02em; }
    .header h2 { margin: 0; font-size: 11px; font-weight: 500; opacity: .95; }
    .info { margin-bottom: 8px; padding: 8px 10px; background: #f8fafc; border: 1px solid #dbeafe; border-radius: 8px; }
    .info p { margin: 2px 0; color: #334155; font-size: 11px; }
    .pdf-page { min-height: 260mm; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; padding-bottom: 2mm; }
    .pdf-page:last-child { page-break-after: auto; }
    .page-items { display: grid; grid-template-rows: 1fr 1fr; gap: 8px; height: 100%; }
    .item-card { border: 1px solid #c4b5fd; border-radius: 10px; padding: 8px; background: #fcfcff; page-break-inside: avoid; }
    .item-card.placeholder { opacity: .95; }
    .item-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; background: #ede9fe; border: 1px solid #ddd6fe; border-radius: 8px; padding: 6px 8px; }
    .item-area { font-size: 10px; color: #6d28d9; text-transform: uppercase; font-weight: 700; }
    .item-name { font-size: 13px; color: #312e81; font-weight: 700; margin-top: 1px; }
    .item-rating { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; color: #fff; white-space: nowrap; }
    .rating-e { background: #059669; }
    .rating-b { background: #2563eb; }
    .rating-r { background: #d97706; }
    .rating-na { background: #94a3b8; }
    .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 6px; }
    .photo-slot { height: 132px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f8fafc; }
    .photo-slot img { width: 100%; height: 100%; object-fit: contain; }
    .photo-slot.empty { background: #f5f3ff; border: 1px dashed #a78bfa; }
    .photo-slot.empty span { font-size: 10px; font-weight: 700; color: #7c3aed; letter-spacing: 0.03em; }
    .item-meta { display: grid; grid-template-columns: 1fr; gap: 5px; }
    .coords { font-family: monospace; font-size: 10px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 5px 7px; }
    .comment { font-size: 10px; color: #334155; background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 6px; padding: 6px 7px; min-height: 34px; }
    @media print {
      body { background: white; }
      .pdf-page { page-break-after: always; }
      .pdf-page:last-child { page-break-after: auto; }
    }
  </style>
</head>
<body>
  ${encabezadoBase64 ? '<img src="' + encabezadoBase64 + '" alt="MARMA" class="pdf-header" />' : ''}
  <div class="content-wrapper">
    <div class="header">
      <h1>MARMA - Soluciones en Mantenimiento</h1>
      <h2>Bitácora de Supervisión</h2>
    </div>
    <div class="info">${infoHTML}</div>
    ${areasHTML}
  </div>
</body>
</html>`
}

const getPdfItemCards = (photoBase64ByUrl = new Map()) => {
  const cards = []
  Object.entries(formData.areas).forEach(([areaKey, areaData]) => {
    if (!areaData.enabled) return
    const areaName = areas.value.find((a) => a.key === areaKey)?.name || areaKey
    const areaItems = areas.value.find((a) => a.key === areaKey)?.items || []
    areaItems.forEach((item, index) => {
      const rating = areaData.ratings?.[index] || areaData.ratings?.[String(index)]
      if (!rating) return
      const ratingText = rating === 'E' ? 'Excelente' : rating === 'B' ? 'Bueno' : 'Regular'
      const comment = areaData.comments?.[index] || areaData.comments?.[String(index)] || 'Sin comentario.'
      const photoData = areaData.photos?.[index] || areaData.photos?.[String(index)] || null
      const photoList = normalizePhotosArray(photoData).slice(0, MAX_PHOTOS_PER_ITEM)
      const photoSrcs = photoList
        .map((pd) => (typeof pd === 'object' && pd !== null ? (pd.url || pd.image || '') : pd))
        .filter((p) => typeof p === 'string' && p.length > 0)
        .map((src) => ((src.startsWith('http://') || src.startsWith('https://')) && photoBase64ByUrl.has(src) ? photoBase64ByUrl.get(src) : src))
      const firstPhotoObj = typeof photoList[0] === 'object' && photoList[0] !== null ? photoList[0] : null
      const coordsText = firstPhotoObj?.geolocation
        ? `${firstPhotoObj.geolocation.latitude.toFixed(6)}, ${firstPhotoObj.geolocation.longitude.toFixed(6)}`
        : 'N/A'
      cards.push({ areaName, item, rating, ratingText, comment, coordsText, photoSrcs })
    })
  })
  if (cards.length % 2 !== 0) {
    cards.push({
      areaName: 'N/A',
      item: 'SIN ITEM',
      rating: 'NA',
      ratingText: 'N/A',
      comment: 'Bloque de relleno para conservar el formato corporativo.',
      coordsText: 'N/A',
      photoSrcs: []
    })
  }
  return cards
}

const addPdfImageSafe = (doc, dataUrl, x, y, w, h) => {
  if (!dataUrl || typeof dataUrl !== 'string') return false
  try {
    const format = dataUrl.includes('image/png') ? 'PNG' : 'JPEG'
    doc.addImage(dataUrl, format, x, y, w, h, undefined, 'FAST')
    return true
  } catch {
    return false
  }
}

const buildPdfDoc = async () => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = 210
  const pageH = 297
  const margin = 10
  const headerH = 32
  const gapCards = 6
  const headerTotal = headerH + 3
  const availableCardsH = pageH - margin * 2 - headerTotal - gapCards - 4
  const cardH = availableCardsH / 2

  // Priorizar SIEMPRE el encabezado horizontal del PDF.
  let headerBase64 = await imageToBase64(encabezadoPdfUrl)
  // Fallback de seguridad
  if (!headerBase64) headerBase64 = await imageToBase64(`${import.meta.env.BASE_URL || '/'}encabezado_para_pdf_marma.png`)
  if (!headerBase64) headerBase64 = await imageToBase64(nuevoLogoPdfUrl)
  const photoBase64ByUrl = await getPhotosBase64Map()
  let allCards = getPdfItemCards(photoBase64ByUrl)

  /** Encabezado imagen + nombre compañía; páginas 2+ sin bloque informativo extra */
  const drawPdfHeaderOnly = () => {
    const contentW = pageW - margin * 2
    let y = margin
    if (headerBase64) {
      const ok = addPdfImageSafe(doc, headerBase64, margin, y, pageW - margin * 2, headerH)
      if (!ok) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.setTextColor(30, 58, 138)
        doc.text('MARMA - Soluciones en Mantenimiento', margin + 2, y + 8)
      }
    }
    const headerTextStartX = margin + contentW * 0.2
    const headerTextMaxW = contentW * 0.7
    const textoEncabezadoPdf = ((bitacora.value.nombreCompania || '').trim() || 'EMPRESA').toUpperCase()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(17, 24, 39)
    const lineasComp = doc.splitTextToSize(textoEncabezadoPdf, headerTextMaxW)
    doc.text(lineasComp, headerTextStartX, y + 19)
    return margin + headerH + 3
  }

  const PLACEHOLDER_CARD = {
    areaName: 'N/A',
    item: 'SIN ITEM',
    rating: 'NA',
    ratingText: 'N/A',
    comment: 'Bloque de relleno para conservar el formato corporativo.',
    coordsText: 'N/A',
    photoSrcs: []
  }

  const formatUnidadField = (v) => {
    if (v === null || v === undefined) return '—'
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '—'
    if (typeof v === 'string' && v.trim() === '') return '—'
    return String(v)
  }

  const formatUnidadDate = (d) => {
    if (!d) return '—'
    try {
      return formatDate(d instanceof Date ? d : new Date(d))
    } catch {
      return '—'
    }
  }

  const formatUnidadTipo = (t) => {
    const m = {
      condominio: 'Condominio',
      edificio: 'Edificio',
      conjunto_residencial: 'Conjunto residencial',
      urbanizacion: 'Urbanización'
    }
    return m[t] || formatUnidadField(t)
  }

  const countRatingsEbr = () => {
    let e = 0
    let b = 0
    let r = 0
    Object.values(formData.areas).forEach((areaData) => {
      if (!areaData.enabled) return
      const ratings = areaData.ratings || {}
      Object.values(ratings).forEach((rating) => {
        if (rating === 'E') e++
        else if (rating === 'B') b++
        else if (rating === 'R') r++
      })
    })
    return { e, b, r }
  }

  /** Por cada área habilitada: totales E/B/R (para gráfico ejecutivo por zona) */
  const getAreaRatingStats = () => {
    const list = []
    Object.entries(formData.areas).forEach(([areaKey, areaData]) => {
      if (!areaData.enabled) return
      const ratings = areaData.ratings || {}
      const areaName = areas.value.find((a) => a.key === areaKey)?.name || areaKey
      let e = 0
      let b = 0
      let r = 0
      Object.values(ratings).forEach((rating) => {
        if (rating === 'E') e++
        else if (rating === 'B') b++
        else if (rating === 'R') r++
      })
      const total = e + b + r
      if (total > 0) list.push({ name: areaName, e, b, r, total })
    })
    return list
  }

  const supervisorNombreParaPdf = () => {
    const n = (bitacora.value.nombreSupervisor || '').trim()
    if (n) return n
    const s = (bitacora.value.supervisor || '').trim()
    if (s && !s.includes('@')) return s
    return '—'
  }

  /** Página 1: resumen ejecutivo — tarjetas, gráficos y criterios con badges */
  const drawPdfFirstPageBody = (yStart) => {
    const contentW = pageW - margin * 2
    const brandBlue = [30, 52, 90]
    const rgbE = [5, 150, 105]
    const rgbB = [37, 99, 235]
    const rgbR = [245, 158, 11]
    const u = bitacora.value.unidadResidencial
    const gap = 3.5
    const boxW = (contentW - gap * 2) / 3
    const padIn = 4
    const lineH = 3.05
    const fontBody = 7.1
    const fontTitleCard = 9.2
    const innerW = boxW - padIn * 2

    const drawRatingBadge = (cx, cyCenter, letter, rgb) => {
      const bw = 7.4
      const bh = 5.4
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.roundedRect(cx, cyCenter - bh / 2, bw, bh, 1.2, 1.2, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(letter, cx + bw / 2, cyCenter + 1.4, { align: 'center' })
    }

    const pairs = [
      ['Nombre', u?.nombre],
      ['Dirección', u?.direccion],
      ['Correo', u?.correo],
      ['Tipo', formatUnidadTipo(u?.tipo)],
      ['Orden consecutivo', u?.ordenConsecutivo],
      ['Razón social', u?.razonSocial],
      ['NIT', u?.nit],
      ['Punto de referencia', u?.puntoReferencia],
      ['Nº portería', u?.numeroPorteria],
      ['Nombre R.L.', u?.nombreRepresentanteLegal],
      ['Cédula R.L.', u?.cedulaRepresentanteLegal],
      ['Celular R.L.', u?.celularRepresentanteLegal],
      ['Nombre admon. delegado', u?.nombreAdministradorDelegado],
      ['Celular admon.', u?.celularAdministradorDelegado],
      ['Perfiles contratados', u?.perfilesContratados],
      ['Nº operarios', u?.numeroOperarios],
      ['Horarios', u?.horarios],
      ['Jornada', u?.jornada],
      ['Fecha inicio', formatUnidadDate(u?.fechaInicio)],
      ['Fecha terminación', formatUnidadField(u?.fechaTerminacion)],
      ['Correo cartas', u?.correoCartas],
      ['Correo administrador', u?.correoFacturacion],
      ['Frecuencia supervisión', u?.frecuenciaSupervision],
      ['Observaciones', u?.observacionesContrato]
    ]

    const nPairs = pairs.length
    const third = Math.ceil(nPairs / 3)
    const blocks = [pairs.slice(0, third), pairs.slice(third, third * 2), pairs.slice(third * 2)]
    const titles = ['Unidad residencial', 'Inspección', 'Supervisor y contrato']

    const measureColumn = (col) => {
      let nLines = 0
      let gapSum = 0
      if (col === 1) {
        nLines += 1
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.8)
        nLines += doc.splitTextToSize(formatDate(bitacora.value.fecha), innerW).length
        gapSum += 1.2
      }
      if (col === 2) {
        nLines += 1
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.8)
        nLines += doc.splitTextToSize(supervisorNombreParaPdf(), innerW).length
        gapSum += 1.2
      }
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fontBody)
      blocks[col].forEach(([label, rawVal]) => {
        const val =
          typeof rawVal === 'number' && Number.isFinite(rawVal) ? String(rawVal) : formatUnidadField(rawVal)
        const block = `${label}: ${val}`
        nLines += doc.splitTextToSize(block, innerW).length
      })
      const h = nLines * lineH + gapSum
      return { nLines, gapSum, h }
    }

    const measured = [0, 1, 2].map((c) => measureColumn(c))
    const maxContentH = Math.max(measured[0].h, measured[1].h, measured[2].h, 1)
    const lineSlack = [0, 1, 2].map((col) => {
      const { nLines, h } = measured[col]
      const slack = maxContentH - h
      if (nLines <= 0 || slack <= 0.01) return lineH
      return lineH + slack / nLines
    })

    const cardsRowH = Math.min(
      118,
      Math.max(68, 12 + maxContentH + padIn)
    )

    for (let col = 0; col < 3; col++) {
      const bx = margin + col * (boxW + gap)
      const lhCol = lineSlack[col]
      doc.setFillColor(250, 250, 252)
      doc.setDrawColor(214, 218, 228)
      doc.roundedRect(bx, yStart, boxW, cardsRowH, 3, 3, 'FD')
      doc.setFillColor(brandBlue[0], brandBlue[1], brandBlue[2])
      doc.rect(bx, yStart, boxW, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(fontTitleCard)
      doc.text(titles[col], bx + boxW / 2, yStart + 5.5, { align: 'center' })

      let cy = yStart + 12

      if (col === 1) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.4)
        doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
        doc.text('Inspección realizada el', bx + padIn, cy)
        cy += lhCol
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.8)
        doc.setTextColor(17, 24, 39)
        doc.splitTextToSize(formatDate(bitacora.value.fecha), innerW).forEach((ln) => {
          doc.text(ln, bx + padIn, cy)
          cy += lhCol
        })
        cy += 1.2
      }

      if (col === 2) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.4)
        doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
        doc.text('Supervisor responsable', bx + padIn, cy)
        cy += lhCol
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7.8)
        doc.setTextColor(17, 24, 39)
        doc.splitTextToSize(supervisorNombreParaPdf(), innerW).forEach((ln) => {
          doc.text(ln, bx + padIn, cy)
          cy += lhCol
        })
        cy += 1.2
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(fontBody)
      doc.setTextColor(17, 24, 39)
      blocks[col].forEach(([label, rawVal]) => {
        const val =
          typeof rawVal === 'number' && Number.isFinite(rawVal) ? String(rawVal) : formatUnidadField(rawVal)
        const block = `${label}: ${val}`
        doc.splitTextToSize(block, innerW).forEach((ln) => {
          doc.text(ln, bx + padIn, cy)
          cy += lhCol
        })
      })
    }

    let y = yStart + cardsRowH + 6
    const counts = countRatingsEbr()
    const totalItems = counts.e + counts.b + counts.r
    const pctE = totalItems > 0 ? Math.round((counts.e / totalItems) * 100) : 0
    const pctB = totalItems > 0 ? Math.round((counts.b / totalItems) * 100) : 0
    const pctR = totalItems > 0 ? Math.round((counts.r / totalItems) * 100) : 0
    const maxC = Math.max(counts.e, counts.b, counts.r, 1)

    /** Padding interno de las tarjetas de gráficos (mm) */
    const chartPad = 5
    const chartInnerX = () => margin + chartPad
    const chartInnerW = () => contentW - chartPad * 2

    /* —— Fila 1: definiciones E / B / R —— contenedor + mini-cards por columna —— */
    const defRefPad = 7
    const defColGap = 3
    const defLineStep = 3.1
    const defBodyLines = 3
    const defMiniPad = 3.5
    const defBadgeHalfH = 2.7
    const defInnerW = contentW - defRefPad * 2
    const defColW = (defInnerW - defColGap * 2) / 3
    const defTextAfterBadge = 11
    const iyDef = y + defRefPad
    const defTitleBaseline = iyDef + 5.5
    /* Espacio extra bajo el título para que cada mini-card (badge + texto) no solape el título */
    const defGapTitleToBody = 13.5
    const defFirstLineY = defTitleBaseline + defGapTitleToBody
    const defBadgeCenterY = defFirstLineY - 1.05
    const defCardTop = defBadgeCenterY - defBadgeHalfH - defMiniPad
    const defCardBottom = defFirstLineY + (defBodyLines - 1) * defLineStep + defMiniPad + 2
    const defCardH = defCardBottom - defCardTop
    const defBandH = defCardBottom - y + defRefPad

    doc.setFillColor(252, 252, 254)
    doc.setDrawColor(218, 222, 232)
    doc.roundedRect(margin, y, contentW, defBandH, 3, 3, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
    doc.text('Referencia de calificación', margin + contentW / 2, defTitleBaseline, { align: 'center' })

    const defCols = [
      { letter: 'E', rgb: rgbE, txt: 'Excelente: condiciones óptimas y alineadas a los estándares de supervisión.' },
      { letter: 'B', rgb: rgbB, txt: 'Bueno: adecuado; pueden existir observaciones menores o mejoras puntuales.' },
      { letter: 'R', rgb: rgbR, txt: 'Regular: aspectos que requieren atención, seguimiento o plan de mejora.' }
    ]
    const defTextW = Math.max(6, defColW - defMiniPad * 2 - defTextAfterBadge - 1)
    defCols.forEach((d, i) => {
      const dx = margin + defRefPad + i * (defColW + defColGap)
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(208, 213, 224)
      doc.setLineWidth(0.25)
      doc.roundedRect(dx, defCardTop, defColW, defCardH, 2.2, 2.2, 'FD')
    })
    doc.setLineWidth(0.2)
    defCols.forEach((d, i) => {
      const dx = margin + defRefPad + i * (defColW + defColGap)
      drawRatingBadge(dx + defMiniPad + 2, defBadgeCenterY, d.letter, d.rgb)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.8)
      doc.setTextColor(51, 65, 85)
      const lines = doc.splitTextToSize(d.txt, defTextW)
      lines.slice(0, defBodyLines).forEach((ln, idx) => {
        doc.text(ln, dx + defMiniPad + defTextAfterBadge, defFirstLineY + idx * defLineStep)
      })
    })
    y += defBandH + 6

    /* —— Fila 2: resumen global (conteos) —— */
    const chartBandH = 30 + chartPad * 2
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(210, 214, 222)
    doc.roundedRect(margin, y, contentW, chartBandH, 3, 3, 'FD')
    const iyCh = y + chartPad
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
    doc.text('Resumen global de calificaciones (conteos)', margin + contentW / 2, iyCh + 6.5, { align: 'center' })

    const labelW = 44
    const barLeft = chartInnerX() + labelW + 6
    const barMaxW = chartInnerW() - labelW - 22
    const rowH = 5.2
    const rows = [
      { n: counts.e, label: 'Excelente (E)', rgb: rgbE },
      { n: counts.b, label: 'Bueno (B)', rgb: rgbB },
      { n: counts.r, label: 'Regular (R)', rgb: rgbR }
    ]
    let ry = iyCh + 12
    rows.forEach((row) => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.6)
      doc.setTextColor(55, 65, 81)
      doc.text(row.label, chartInnerX() + 4, ry + 2.8)
      doc.setFillColor(238, 242, 246)
      doc.roundedRect(barLeft, ry, barMaxW, 4, 0.7, 0.7, 'F')
      const bw = (row.n / maxC) * barMaxW
      doc.setFillColor(row.rgb[0], row.rgb[1], row.rgb[2])
      if (bw > 0.4) doc.roundedRect(barLeft, ry, bw, 4, 0.7, 0.7, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.2)
      doc.setTextColor(17, 24, 39)
      doc.text(String(row.n), barLeft + barMaxW + 4, ry + 2.9)
      ry += rowH
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.2)
    doc.setTextColor(71, 85, 105)
    doc.text(
      `Ítems evaluados: ${totalItems}  ·  ${pctE}% Excelente  ·  ${Object.values(formData.areas).filter((ad) => ad.enabled).length} áreas activas`,
      margin + contentW / 2,
      y + chartBandH - chartPad - 2.5,
      { align: 'center' }
    )

    y += chartBandH + 6

    /* —— Fila 3: composición porcentual (100% apilado) —— KPI ejecutivo —— */
    const compBandH = 22 + chartPad * 2
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(200, 206, 218)
    doc.roundedRect(margin, y, contentW, compBandH, 3, 3, 'FD')
    const iyCo = y + chartPad
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
    doc.text('Composición de la evaluación (% del total de ítems)', margin + contentW / 2, iyCo + 6, {
      align: 'center'
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(100, 116, 139)
    doc.text(
      'Vista rápida del equilibrio E/B/R en toda la bitácora; útil para comunicar resultados a dirección.',
      margin + contentW / 2,
      iyCo + 9.8,
      { align: 'center' }
    )
    const compBarY = iyCo + 14
    const compBarH = 5.5
    const compBarW = chartInnerW() - 16
    const compBarX = chartInnerX() + 8
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(compBarX, compBarY, compBarW, compBarH, 1, 1, 'F')
    if (totalItems > 0) {
      let cx = compBarX
      const wE = (counts.e / totalItems) * compBarW
      const wB = (counts.b / totalItems) * compBarW
      const wR = (counts.r / totalItems) * compBarW
      const minSeg = 0.15
      if (wE > minSeg) {
        doc.setFillColor(rgbE[0], rgbE[1], rgbE[2])
        doc.rect(cx, compBarY, wE, compBarH, 'F')
        cx += wE
      }
      if (wB > minSeg) {
        doc.setFillColor(rgbB[0], rgbB[1], rgbB[2])
        doc.rect(cx, compBarY, wB, compBarH, 'F')
        cx += wB
      }
      if (wR > minSeg) {
        doc.setFillColor(rgbR[0], rgbR[1], rgbR[2])
        doc.rect(cx, compBarY, wR, compBarH, 'F')
      }
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(71, 85, 105)
    doc.text(
      `E ${pctE}%   ·   B ${pctB}%   ·   R ${pctR}%`,
      margin + contentW / 2,
      compBarY + compBarH + 4,
      { align: 'center' }
    )

    y += compBandH + 6
    const zoneStatsAll = getAreaRatingStats()
    const maxZoneRows = 6
    const zoneStats = zoneStatsAll.slice(0, maxZoneRows)
    const zoneRowH = 6
    const zoneChartH =
      Math.max(28, 14 + zoneStats.length * zoneRowH + (zoneStatsAll.length > maxZoneRows ? 6 : 0)) + chartPad * 2
    doc.setFillColor(248, 250, 252)
    doc.setDrawColor(200, 206, 218)
    doc.roundedRect(margin, y, contentW, zoneChartH, 3, 3, 'FD')
    const iyZ = y + chartPad
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
    doc.text('Distribución por zona de supervisión (E / B / R)', margin + contentW / 2, iyZ + 7, {
      align: 'center'
    })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(100, 116, 139)
    doc.text(
      'Cada barra muestra la proporción de ítems calificados en esa área; útil para focalizar mejoras.',
      margin + contentW / 2,
      iyZ + 11.5,
      { align: 'center' }
    )

    const zLabelW = 48
    const zBarLeft = chartInnerX() + zLabelW + 5
    const zBarW = chartInnerW() - zLabelW - 20
    let zy = iyZ + 16
    if (zoneStats.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(7.5)
      doc.setTextColor(148, 163, 184)
      doc.text('Sin datos por zona en esta bitácora.', margin + contentW / 2, zy + 8, { align: 'center' })
    } else {
      zoneStats.forEach((z) => {
        const nameLines = doc.splitTextToSize(z.name, zLabelW - 2)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.8)
        doc.setTextColor(51, 65, 85)
        doc.text(nameLines[0] || z.name, chartInnerX() + 3, zy + 3.2)
        doc.setFillColor(229, 231, 235)
        doc.roundedRect(zBarLeft, zy, zBarW, 4.2, 0.6, 0.6, 'F')
        const t = z.total
        let zx = zBarLeft
        const we = t ? (z.e / t) * zBarW : 0
        const wb = t ? (z.b / t) * zBarW : 0
        const wr = t ? (z.r / t) * zBarW : 0
        if (we > 0.15) {
          doc.setFillColor(rgbE[0], rgbE[1], rgbE[2])
          doc.rect(zx, zy, we, 4.2, 'F')
          zx += we
        }
        if (wb > 0.15) {
          doc.setFillColor(rgbB[0], rgbB[1], rgbB[2])
          doc.rect(zx, zy, wb, 4.2, 'F')
          zx += wb
        }
        if (wr > 0.15) {
          doc.setFillColor(rgbR[0], rgbR[1], rgbR[2])
          doc.rect(zx, zy, wr, 4.2, 'F')
        }
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(71, 85, 105)
        doc.text(`${z.total}`, zBarLeft + zBarW + 3, zy + 3.2)
        zy += zoneRowH
      })
      if (zoneStatsAll.length > maxZoneRows) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(6.5)
        doc.setTextColor(100, 116, 139)
        doc.text(
          `+ ${zoneStatsAll.length - maxZoneRows} zona(s) más en el detalle fotográfico.`,
          margin + contentW / 2,
          zy + 2,
          { align: 'center' }
        )
      }
    }

    y += zoneChartH + 7
  }

  const drawCard = (card, x, y) => {
    const cardW = pageW - margin * 2
    const brandBlue = [30, 52, 90] // hsl(223,50%,23.5%) aprox
    const pastelBlue = [255, 255, 255]
    const pastelBlueBorder = [214, 226, 245]
    doc.setFillColor(252, 252, 255)
    doc.setDrawColor(196, 181, 253)
    doc.roundedRect(x, y, cardW, cardH, 3, 3, 'FD')

    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(pastelBlueBorder[0], pastelBlueBorder[1], pastelBlueBorder[2])
    doc.roundedRect(x + 2, y + 2, cardW - 4, 10, 2, 2, 'FD')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
    doc.text(`Area: ${card.areaName}`, x + 4, y + 6)
    doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2])
    doc.setFontSize(10)
    doc.text(card.item, x + 4, y + 10)

    const ratingColor = card.rating === 'E' ? [5, 150, 105] : card.rating === 'B' ? [37, 99, 235] : card.rating === 'R' ? [217, 119, 6] : [148, 163, 184]
    doc.setFillColor(ratingColor[0], ratingColor[1], ratingColor[2])
    doc.setTextColor(255, 255, 255)
    doc.roundedRect(x + cardW - 33, y + 4, 29, 6, 3, 3, 'F')
    doc.setFontSize(8)
    doc.text(card.ratingText, x + cardW - 30, y + 8.2)

    const photosY = y + 14
    const gap = 3
    const photoW = (cardW - 4 - gap * 2) / 3
    const metaBaseH = 13 // coords + comentario corto
    const photoH = Math.max(58, cardH - 14 - metaBaseH - 6)
    for (let i = 0; i < 3; i++) {
      const px = x + 2 + i * (photoW + gap)
      if (card.photoSrcs[i]) {
        doc.setDrawColor(203, 213, 225)
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(px, photosY, photoW, photoH, 2, 2, 'FD')
        // Llenar todo el alto/ancho del slot para evitar franjas en blanco
        addPdfImageSafe(doc, card.photoSrcs[i], px, photosY, photoW, photoH)
      } else {
        doc.setDrawColor(pastelBlueBorder[0], pastelBlueBorder[1], pastelBlueBorder[2])
        doc.setFillColor(255, 255, 255)
        doc.setLineWidth(0.6)
        doc.setLineDashPattern([1.2, 1.2], 0)
        doc.roundedRect(px, photosY, photoW, photoH, 2, 2, 'FD')
        doc.setLineDashPattern([], 0)
        doc.setLineWidth(0.2)
        doc.setTextColor(126, 151, 190)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.text('SIN FOTO', px + photoW / 2, photosY + photoH / 2, { align: 'center' })
      }
    }

    const metaY = photosY + photoH + 3
    doc.setTextColor(71, 85, 105)
    doc.setFont('courier', 'normal')
    doc.setFontSize(7.5)
    doc.text(`Coordenadas: ${card.coordsText}`, x + 3, metaY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(51, 65, 85)
    const commentText = card.comment && card.comment.trim() ? card.comment.trim() : 'Sin comentario.'
    const commentLines = doc.splitTextToSize(commentText, cardW - 6)
    // Sin comentario: solo 1 línea. Con comentario: máximo 2 líneas para compactar.
    const limitedComment = commentText === 'Sin comentario.' ? commentLines.slice(0, 1) : commentLines.slice(0, 2)
    doc.text(limitedComment, x + 3, metaY + 3.8)
  }

  const isPlaceholderCard = (c) => c && c.areaName === 'N/A' && c.item === 'SIN ITEM'
  if (allCards.length && isPlaceholderCard(allCards[allCards.length - 1])) {
    allCards = allCards.slice(0, -1)
  }

  if (allCards.length % 2 !== 0) {
    allCards.push({ ...PLACEHOLDER_CARD })
  }

  const yBelowHeader = drawPdfHeaderOnly()
  drawPdfFirstPageBody(yBelowHeader)

  for (let i = 0; i < allCards.length; i += 2) {
    doc.addPage()
    const startY = drawPdfHeaderOnly()
    drawCard(allCards[i], margin, startY)
    drawCard(allCards[i + 1], margin, startY + cardH + gapCards)
  }
  return doc
}

// Generar PDF en base64 SIN html2canvas
const generatePDFBase64 = async () => {
  console.log('📄 Generando PDF en base64 (jsPDF directo, sin html2canvas)...')
  try {
    const doc = await buildPdfDoc()
    const dataUrl = doc.output('dataurlstring')
    const base64 = dataUrl && dataUrl.includes(',') ? dataUrl.split(',')[1] : null
    return base64 || null
  } catch (error) {
    console.error('❌ Error generando PDF en base64:', error)
    return null
  }
}

// Generar y descargar PDF SIN html2canvas
const generatePDF = async () => {
  console.log('📄 Generando PDF (jsPDF directo, sin html2canvas)...')
  const doc = await buildPdfDoc()
  const unidadNombre = bitacora.value.unidadNombre || bitacora.value.unidadResidencial?.nombre || 'UnidadResidencial'
  const fileName = `bitacora_${unidadNombre.replace(/\s+/g, '_')}_${formatDate(bitacora.value.fecha)}.pdf`
  doc.save(fileName)
  console.log('✅ PDF descargado como: ' + fileName)
}

// Función auxiliar para convertir Map de Mongoose a objeto plano
const convertMapToObject = (mapData) => {
  if (!mapData) return {}
  
  // Si es un Map de Mongoose, convertirlo a objeto
  if (mapData instanceof Map || mapData.constructor?.name === 'Map') {
    const obj = {}
    mapData.forEach((value, key) => {
      // Si el valor también es un Map, convertirlo recursivamente
      if (value instanceof Map || value.constructor?.name === 'Map') {
        obj[key] = {}
        value.forEach((subValue, subKey) => {
          obj[key][subKey] = subValue
        })
      } else {
        obj[key] = value
      }
    })
    return obj
  }
  
  // Si ya es un objeto, verificar si tiene valores Map anidados
  if (typeof mapData === 'object') {
    const obj = {}
    Object.entries(mapData).forEach(([key, value]) => {
      if (value instanceof Map || value.constructor?.name === 'Map') {
        obj[key] = {}
        value.forEach((subValue, subKey) => {
          obj[key][subKey] = subValue
        })
      } else {
        obj[key] = value
      }
    })
    return obj
  }
  
  return mapData
}

// Función para mapear datos del backend (nombres de items) al formato del frontend (índices)
const mapBackendDataToFrontend = (backendData) => {
  console.log('🔄 Mapeando datos del backend al frontend:', backendData)
  
  // Convertir Maps de Mongoose a objetos planos
  const areasData = convertMapToObject(backendData.areas)
  const comentariosData = convertMapToObject(backendData.comentarios)
  const evidenciasData = convertMapToObject(backendData.evidencias)
  const deshabilitadasData = convertMapToObject(backendData.deshabilitadas)
  
  console.log('🔍 Áreas convertidas:', areasData)
  console.log('🔍 Comentarios convertidos:', comentariosData)
  console.log('🔍 Evidencias convertidas:', evidenciasData)
  
  // Crear mapa de items por área para convertir nombres a índices
  const itemIndexMap = {}
  areas.value.forEach(area => {
    itemIndexMap[area.key] = {}
    area.items.forEach((itemName, index) => {
      itemIndexMap[area.key][itemName] = index
    })
  })
  
  console.log('🔍 Mapa de items a índices:', itemIndexMap)
  
  // Mapear áreas del backend
  if (areasData && Object.keys(areasData).length > 0) {
    Object.entries(areasData).forEach(([areaKey, areaRatings]) => {
      if (formData.areas[areaKey]) {
        // Habilitar el área si tiene ratings (significa que fue usada)
        if (Object.keys(areaRatings).length > 0) {
          formData.areas[areaKey].enabled = true
          console.log(`✅ Área ${areaKey} habilitada (tiene ${Object.keys(areaRatings).length} ratings)`)
        }
        
        // Convertir nombres de items a índices
        const ratingsByIndex = {}
        Object.entries(areaRatings).forEach(([itemName, rating]) => {
          const index = itemIndexMap[areaKey]?.[itemName]
          if (index !== undefined) {
            ratingsByIndex[index] = rating
          } else {
            console.warn(`⚠️ Item "${itemName}" no encontrado en área "${areaKey}"`)
          }
        })
        formData.areas[areaKey].ratings = ratingsByIndex
        console.log(`✅ Área ${areaKey} - ratings mapeados:`, ratingsByIndex)
      }
    })
  }
  
  // Mapear comentarios del backend
  if (comentariosData && Object.keys(comentariosData).length > 0) {
    Object.entries(comentariosData).forEach(([areaKey, areaComments]) => {
      if (formData.areas[areaKey]) {
        // Habilitar el área si tiene comentarios (significa que fue usada)
        if (Object.keys(areaComments).length > 0) {
          formData.areas[areaKey].enabled = true
          console.log(`✅ Área ${areaKey} habilitada (tiene ${Object.keys(areaComments).length} comentarios)`)
        }
        
        const commentsByIndex = {}
        Object.entries(areaComments).forEach(([itemName, comment]) => {
          const index = itemIndexMap[areaKey]?.[itemName]
          if (index !== undefined) {
            commentsByIndex[index] = comment
          }
        })
        formData.areas[areaKey].comments = commentsByIndex
        console.log(`✅ Área ${areaKey} - comentarios mapeados:`, commentsByIndex)
      }
    })
  }
  
  // Mapear evidencias (fotos) del backend
  if (evidenciasData && Object.keys(evidenciasData).length > 0) {
    console.log('📸 ===== MAPEANDO EVIDENCIAS =====')
    console.log('📸 Evidencias recibidas del backend:', evidenciasData)
    Object.entries(evidenciasData).forEach(([areaKey, areaEvidencias]) => {
      if (formData.areas[areaKey]) {
        // Habilitar el área si tiene evidencias (significa que fue usada)
        if (Object.keys(areaEvidencias).length > 0) {
          formData.areas[areaKey].enabled = true
          console.log(`✅ Área ${areaKey} habilitada (tiene ${Object.keys(areaEvidencias).length} evidencias)`)
        }
        
        const photosByIndex = {}
        console.log(`📸 Procesando área "${areaKey}":`, areaEvidencias)
        Object.entries(areaEvidencias).forEach(([itemName, photoData]) => {
          const index = itemIndexMap[areaKey]?.[itemName]
          if (index !== undefined) {
            console.log(`📸 Item "${itemName}" (índice ${index}):`, {
              tipo: typeof photoData,
              esObjeto: typeof photoData === 'object',
              tieneUrl: typeof photoData === 'object' && !!photoData?.url,
              url: typeof photoData === 'object' ? photoData?.url?.substring(0, 80) + '...' : 'N/A',
              tieneImage: typeof photoData === 'object' && !!photoData?.image,
              esString: typeof photoData === 'string',
              esUrl: typeof photoData === 'string' && (photoData.startsWith('http://') || photoData.startsWith('https://')),
              esBase64: typeof photoData === 'string' && photoData.startsWith('data:image')
            })
            
            // Filtrar evidencias vacías o inválidas
            if (photoData === null || photoData === undefined || photoData === '') {
              console.log(`⚠️ Evidencia vacía para ${areaKey}/${itemName}, omitiendo`)
              return
            }
            
            // Si es un objeto, verificar que tenga url, image o base64 válidos
            if (typeof photoData === 'object') {
              const hasUrl = photoData.url && typeof photoData.url === 'string' && photoData.url.length > 0
              const hasImage = photoData.image && typeof photoData.image === 'string' && photoData.image.length > 0
              const hasBase64 = photoData.base64 && typeof photoData.base64 === 'string' && photoData.base64.length > 0
              const hasFotos =
                Array.isArray(photoData.fotos) &&
                photoData.fotos.some((f) => {
                  if (!f) return false
                  if (typeof f === 'string') return f.startsWith('data:image') || f.startsWith('http')
                  if (typeof f === 'object' && f !== null) {
                    return (
                      (typeof f.url === 'string' && f.url.length > 0) ||
                      (typeof f.image === 'string' && f.image.length > 0) ||
                      (typeof f.base64 === 'string' && f.base64.length > 0)
                    )
                  }
                  return false
                })
              
              console.log(`📸 Verificación de objeto para ${areaKey}/${itemName}:`, {
                hasUrl,
                hasImage,
                hasBase64,
                url: hasUrl ? photoData.url.substring(0, 80) + '...' : 'N/A'
              })
              
              if (!hasUrl && !hasImage && !hasBase64 && !hasFotos) {
                console.log(`⚠️ Evidencia inválida (objeto vacío) para ${areaKey}/${itemName}, omitiendo`)
                return
              }
              
              // Mantener el objeto con url, image o base64
              // Nuevo formato: { fotos: [...] }
              photosByIndex[index] = (photoData && typeof photoData === 'object' && Array.isArray(photoData.fotos))
                ? photoData.fotos
                : photoData
              console.log(`✅ Evidencia guardada para ${areaKey}/${itemName} (índice ${index})`)
            } 
            // Si es un string, verificar que sea URL o base64 válido
            else if (typeof photoData === 'string' && photoData.length > 0) {
              const isUrl = photoData.startsWith('http://') || photoData.startsWith('https://')
              const isBase64 = photoData.startsWith('data:image')
              
              if (isUrl || isBase64) {
                photosByIndex[index] = photoData
                console.log(`✅ Evidencia (string) guardada para ${areaKey}/${itemName} (índice ${index})`)
              } else {
                console.log(`⚠️ Evidencia inválida (string no URL/base64) para ${areaKey}/${itemName}, omitiendo`)
              }
            }
          } else {
            console.warn(`⚠️ Índice no encontrado para item "${itemName}" en área "${areaKey}"`)
          }
        })
        formData.areas[areaKey].photos = photosByIndex
        console.log(`✅ Área ${areaKey} - fotos mapeadas:`, Object.keys(photosByIndex).length, 'foto(s)')
        console.log(`📸 Fotos finales para ${areaKey}:`, photosByIndex)
      } else {
        console.warn(`⚠️ Área "${areaKey}" no encontrada en formData.areas`)
      }
    })
    console.log('📸 ===== FIN MAPEO DE EVIDENCIAS =====')
  } else {
    console.log('⚠️ No hay evidencias para mapear')
  }
  
  // Mapear áreas deshabilitadas
  // NOTA: Si un área tiene datos (ratings, comentarios, evidencias), debe estar habilitada
  // Solo se deshabilita si explícitamente está marcada como deshabilitada Y no tiene datos
  if (deshabilitadasData && Object.keys(deshabilitadasData).length > 0) {
    Object.entries(deshabilitadasData).forEach(([areaKey, disabled]) => {
      if (formData.areas[areaKey]) {
        // Solo deshabilitar si no tiene datos (ratings, comentarios o evidencias)
        const hasRatings = formData.areas[areaKey].ratings && Object.keys(formData.areas[areaKey].ratings).length > 0
        const hasComments = formData.areas[areaKey].comments && Object.keys(formData.areas[areaKey].comments).length > 0
        const hasPhotos = formData.areas[areaKey].photos && Object.keys(formData.areas[areaKey].photos).length > 0
        
        if (disabled && !hasRatings && !hasComments && !hasPhotos) {
          formData.areas[areaKey].enabled = false
          console.log(`⚠️ Área ${areaKey} deshabilitada (sin datos)`)
        } else if (!disabled || hasRatings || hasComments || hasPhotos) {
          formData.areas[areaKey].enabled = true
          console.log(`✅ Área ${areaKey} habilitada (tiene datos o no está deshabilitada)`)
        }
      }
    })
  }
  
  // Log final del estado de las áreas
  console.log('📊 ===== ESTADO FINAL DE ÁREAS =====')
  Object.keys(formData.areas).forEach(areaKey => {
    const area = formData.areas[areaKey]
    const ratingsCount = area.ratings ? Object.keys(area.ratings).length : 0
    const commentsCount = area.comments ? Object.keys(area.comments).length : 0
    const photosCount = area.photos ? Object.keys(area.photos).length : 0
    console.log(`📊 Área ${areaKey}:`, {
      enabled: area.enabled,
      ratings: ratingsCount,
      comments: commentsCount,
      photos: photosCount
    })
  })
}

// Función para cargar una bitácora (reutilizable)
const loadBitacora = async (id) => {
  // Limpiar datos del formulario antes de cargar nueva bitácora
  // Esto previene que se muestren datos de una bitácora anterior
  console.log('🧹 Limpiando datos del formulario antes de cargar bitácora:', id)
  Object.keys(formData.areas).forEach(areaKey => {
    formData.areas[areaKey].enabled = false
    formData.areas[areaKey].ratings = {}
    formData.areas[areaKey].comments = {}
    formData.areas[areaKey].photos = {}
  })
  comentarioGlobal.value = ''
  
  // Inicializar acordeón cerrado
  areas.value.forEach(a => { openAreas[a.key] = false })
  
  // Cargar bitácora desde el store
  try {
    console.log('📥 Cargando bitácora desde el store:', id)
    await bitacorasStore.loadBitacoraById(id)
    
    if (bitacorasStore.currentBitacora) {
      const bitacoraData = bitacorasStore.currentBitacora
      
      // Verificar que la bitácora cargada corresponde al ID solicitado
      if (bitacoraData._id !== id) {
        console.warn('⚠️ ID de bitácora no coincide:', {
          solicitado: id,
          recibido: bitacoraData._id
        })
      }
      
      // Actualizar datos de la bitácora
      bitacora.value = {
        cliente: bitacoraData.cliente || '',
        fecha: bitacoraData.fecha ? new Date(bitacoraData.fecha) : new Date(),
        supervisor: bitacoraData.supervisor || '',
        observaciones: bitacoraData.observaciones || '',
        comentarioGlobal: bitacoraData.comentarioGlobal || '',
        estado: bitacoraData.estado || 'programada',
        unidadNombre: bitacoraData.unidadNombre || bitacoraData.unidadResidencial?.nombre || '',
        nombreCompania: bitacoraData.nombreCompania || '',
        nombreSupervisor: bitacoraData.nombreSupervisor || '',
        supervisorEmail: bitacoraData.supervisorEmail || '',
        unidadResidencial: bitacoraData.unidadResidencial || null
      }
      
      // Cargar comentario global
      comentarioGlobal.value = bitacoraData.comentarioGlobal || ''
      
      console.log('✅ Estado de bitácora cargado:', bitacora.value.estado)
      console.log('✅ Datos de bitácora cargados:', bitacora.value)
      console.log('✅ ID de bitácora:', bitacoraData._id)
      
      // Mapear datos del backend al formato del frontend
      mapBackendDataToFrontend(bitacoraData)
      
      console.log('✅ FormData actualizado con datos del backend')
    } else {
      console.warn('⚠️ No se encontró bitácora en el store')
    }
  } catch (error) {
    console.error('❌ Error cargando bitácora:', error)
    // Si hay un error del store, mostrarlo al usuario
    if (bitacorasStore.error) {
      alert(`Error: ${bitacorasStore.error}`)
    }
  }
  
  // Cargar borrador si existe (solo si no hay datos del backend)
  const loadDraftWhenEmpty = Object.keys(formData.areas.piscinas?.ratings || {}).length === 0
  if (!loadDraftWhenEmpty) return

  const idStr = String(id)
  const fromIndexedDB = await getDraftFromIndexedDB(idStr)
  if (fromIndexedDB && typeof fromIndexedDB === 'string') {
    try {
      const draftData = JSON.parse(fromIndexedDB)
      Object.assign(formData, draftData)
      console.log('📝 Borrador cargado desde IndexedDB (incluidas fotos)')
      return
    } catch (_) {}
  }

  const draftId = localStorage.getItem('bitacora_draft_id')
  const draft = localStorage.getItem('bitacora_draft')
  if (draft && draftId === idStr) {
    console.log('📝 Cargando borrador desde localStorage')
    try {
      const draftData = JSON.parse(draft)
      let hadOmittedPhotos = false
      Object.values(draftData.areas || {}).forEach((area) => {
        Object.values(area.photos || {}).forEach((p) => {
          if (p && p._base64Omitted) hadOmittedPhotos = true
        })
      })
      Object.assign(formData, draftData)
      if (hadOmittedPhotos) {
        console.log('📝 Borrador cargado; algunas fotos no se guardaron por espacio (vuelva a tomarlas si hace falta).')
      }
    } catch (_) {}
  }
}

// Cargar bitácora al montar el componente
onMounted(async () => {
  await loadBitacora(bitacoraId.value)
  if (route.query?.autoDownloadPdf === '1') {
    await nextTick()
    try {
      await downloadPDFFromForm()
      if (route.query?.fromAdmin === '1') {
        setTimeout(() => {
          try {
            window.close()
          } catch (closeErr) {
            console.warn('No se pudo cerrar la ventana después de descargar el PDF:', closeErr)
          }
        }, 1500)
      }
    } catch (e) {
      console.error('❌ Error en autoDownloadPdf:', e)
    }
  }
})

// Watch para detectar cambios en la ruta (cuando se navega entre bitácoras)
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    console.log('🔄 Cambio de bitácora detectado:', { anterior: oldId, nueva: newId })
    bitacoraId.value = newId
    await loadBitacora(newId)
  }
}, { immediate: false })

// Manejar actualizaciones de ruta (navegación entre bitácoras sin desmontar el componente)
onBeforeRouteUpdate(async (to, from, next) => {
  if (to.params.id !== from.params.id) {
    console.log('🔄 Navegando entre bitácoras:', { desde: from.params.id, hacia: to.params.id })
    bitacoraId.value = to.params.id
    await loadBitacora(to.params.id)
  }
  next()
})

// Función para descargar PDF desde el formulario (genera PDF real y lo descarga)
const downloadPDFFromForm = async () => {
  try {
    await generatePDF()
  } catch (err) {
    console.error('Error generando/descargando PDF:', err)
    alert('Error al generar el PDF')
  }
}

// Navegación
const goBack = () => {
  router.push('/dashboard')
}

// Limpiar cámara al desmontar componente
onBeforeUnmount(() => {
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => track.stop())
  }
})
</script>

<style scoped>
/* Fondo degradado morado como Locally */
.bitacora-form {
  background: linear-gradient(180deg, #8b5cf6 0%, #a855f7 50%, #c084fc 100%);
  min-height: 100vh;
  padding: 20px;
}

.top-actions {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 16px;
}

.back-btn {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%) !important;
  color: #7c3aed !important;
  border: 2px solid #c4b5fd !important;
  padding: 12px 20px !important;
  border-radius: 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 10px !important;
  font-weight: 600 !important;
  font-size: 15px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.1) !important;
  position: relative !important;
  overflow: hidden !important;
}

.back-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.back-btn:hover::before {
  left: 100%;
}

.back-btn:hover {
  background: linear-gradient(135deg, #e9d5ff 0%, #ddd6fe 100%) !important;
  border-color: #a78bfa !important;
  color: #6b21a8 !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4) !important;
}

.back-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.2);
}

.back-btn i {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.back-btn:hover i {
  transform: translateX(-2px);
}

.info-display {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  background: white;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.read-only-badge {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  justify-content: space-between !important;
  flex-wrap: wrap;
  gap: 12px;
}

.read-only-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 8px;
  color: #92400e;
  font-weight: 600;
  font-size: 14px;
}

.read-only-indicator i {
  font-size: 16px;
}

/* Estilos para el badge de estado (igual que en Dashboard) */
.status {
  padding: 3px 10px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  display: inline-block;
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

.info-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #1f2937;
  font-weight: 600;
}

.area-tabs {
  display: none;
}

.area-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #f3e8ff;
  color: #7c3aed;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.area-tab:hover {
  background: #e9d5ff;
  border-color: #c084fc;
}

.area-tab.active {
  background: #ede9fe;
  border-color: #8b5cf6;
  color: #8b5cf6;
}

.area-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.area-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.area-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 12px;
}

.area-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.supervision-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.supervision-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  padding-right: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  overflow: hidden;
}

.supervision-item > label {
  margin: 0;
  font-weight: 600;
  color: #1f2937;
  font-size: 15px;
  width: 100%;
}

.rating-badges-group {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: nowrap;
  margin-right: 0;
  padding-right: 0;
  max-width: 100%;
  overflow: hidden;
}

.rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 6px 8px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid;
  position: relative;
  user-select: none;
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 0;
}

.rating-badge input[type="radio"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  margin: 0;
  pointer-events: none;
}

.rating-label {
  font-size: 13px;
  font-weight: 700;
  min-width: 16px;
  text-align: center;
}

.rating-text {
  font-size: 11px;
  font-weight: 500;
}

/* Estilos para Excelente (E) */
.rating-badge-e {
  background: #d1fae5;
  color: #065f46;
  border-color: #10b981;
}

.rating-badge-e:hover:not(.disabled) {
  background: #a7f3d0;
  border-color: #059669;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.rating-badge-e.active {
  background: #059669;
  color: white;
  border-color: #047857;
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.4);
  font-weight: 700;
}

/* Estilos para Bueno (B) */
.rating-badge-b {
  background: #dbeafe;
  color: #1e40af;
  border-color: #3b82f6;
}

.rating-badge-b:hover:not(.disabled) {
  background: #bfdbfe;
  border-color: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.rating-badge-b.active {
  background: #2563eb;
  color: white;
  border-color: #1d4ed8;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
  font-weight: 700;
}

/* Estilos para Regular (R) */
.rating-badge-r {
  background: #fef3c7;
  color: #92400e;
  border-color: #f59e0b;
}

.rating-badge-r:hover:not(.disabled) {
  background: #fde68a;
  border-color: #d97706;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(245, 158, 11, 0.2);
}

.rating-badge-r.active {
  background: #d97706;
  color: white;
  border-color: #b45309;
  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
  font-weight: 700;
}

/* Estado deshabilitado */
.rating-badge.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.rating-badge.disabled.active {
  opacity: 0.8;
}

.photo-capture {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.photo-btn {
  background: #8b5cf6;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.photo-btn:hover {
  background: #7c3aed;
}

.photo-preview {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.photo-thumb {
  position: relative;
  display: inline-block;
}

.photo-preview img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid #8b5cf6;
}

.photo-preview.read-only img {
  border: 2px solid #10b981;
  transition: transform 0.2s;
}

.photo-preview.read-only img:hover {
  transform: scale(1.1);
}

.photo-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 6px;
  color: #92400e;
  font-size: 13px;
  font-weight: 500;
}

.photo-warning i {
  font-size: 16px;
  color: #f59e0b;
}

.remove-photo {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.comment-section {
  margin-top: 12px;
}

.add-comment-btn {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  position: relative;
}

.add-comment-btn:hover {
  background: #f1f5f9;
}

.comment-textarea {
  width: 100%;
  margin-top: 8px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.comment-display {
  margin-top: 8px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.comment-display i {
  color: #8b5cf6;
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 2px;
}

.comment-display span {
  flex: 1;
  line-height: 1.5;
}

.global-comment-section {
  margin: 30px 0;
  padding: 20px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  border-left: 4px solid #8b5cf6;
}

.global-comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.global-comment-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.global-comment-header i {
  font-size: 20px;
  color: #8b5cf6;
}

.global-comment-badge {
  padding: 4px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.global-comment-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s;
}

.global-comment-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.global-comment-help {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.global-comment-help i {
  font-size: 14px;
  color: #8b5cf6;
}

.global-comment-display {
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-wrap;
}

.global-comment-section.read-only {
  background: #eff6ff;
  border-left-color: #3b82f6;
}

.footer {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.btn {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

/* Excluir .back-btn de los estilos generales de .btn */
.btn:not(.back-btn) {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.btn:not(.back-btn):hover {
  background: #f1f5f9;
}

.btn.primary {
  background: #8b5cf6;
  color: white;
  border-color: #8b5cf6;
}

.btn.primary:hover {
  background: #7c3aed;
}

.download-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.download-btn:hover {
  background: #059669;
  border-color: #059669;
}

.view-photo-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.view-photo-btn:hover {
  background: #059669;
  border-color: #059669;
}

@media (max-width: 768px) {
  .area-tabs {
    flex-direction: column;
  }
  
  .supervision-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .checkbox-group {
    width: 100%;
    justify-content: space-around;
  }
  
  .footer {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    justify-content: center;
  }
}
.area-accordion { margin-bottom: 16px; }
.area-accordion-header { 
  width: 100%; 
  display: flex;
  justify-content: space-between; 
  align-items: center;
  padding: 16px 20px;
  gap: 12px;
}

.area-accordion-header > i {
  flex-shrink: 0;
  font-size: 18px;
  color: #6b7280;
  margin-left: 8px;
}
.area-accordion-header .left { 
  display: flex; 
  align-items: center; 
  gap: 10px;
  flex: 1;
  min-width: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.area-accordion-header .left i {
  font-size: 18px;
  color: #8b5cf6;
  flex-shrink: 0;
}

.area-accordion-body { padding-top: 16px }

/* Barra de progreso inline en el encabezado del acordeón - Diseño mejorado */
.progress-container-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  margin-right: 8px;
  flex-shrink: 0;
  padding: 4px 12px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-radius: 20px;
  border: 1px solid #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.progress-bar-inline {
  width: 100px;
  height: 10px;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill-inline {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  border-radius: 10px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.progress-fill-inline::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text-inline {
  font-size: 13px;
  font-weight: 700;
  color: #6b21a8;
  min-width: 42px;
  text-align: center;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 2px rgba(139, 92, 246, 0.2);
}

/* Modal de Cámara */
.camera-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.camera-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.camera-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
}

.camera-modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  background: transparent;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #1f2937;
}

.camera-preview {
  position: relative;
  width: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  max-height: 60vh;
  overflow: hidden;
}

.camera-preview video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform: scaleX(-1); /* Espejo para que se vea natural */
}

.photo-view-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 70vh;
  border-radius: 8px;
}

/* Modal específico para ver foto (con fondo difuminado) */
.photo-view-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.photo-view-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.photo-view-modal .camera-modal-header {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border-bottom: 1px solid #d1d5db;
}

.photo-view-modal .camera-preview {
  background: #f9fafb;
  padding: 20px;
}

.photo-view-modal .camera-modal-actions {
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.camera-modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f8fafc;
}

.camera-modal-actions .btn {
  flex: 1;
  justify-content: center;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
}

.cancel-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.capture-btn {
  background: #8b5cf6;
  color: white;
  border: 1px solid #8b5cf6;
}

.capture-btn:hover {
  background: #7c3aed;
}

/* Overlay de carga durante el envío */
.submitting-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.submitting-content {
  background: white;
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.3s ease-out;
}

.submitting-content h3 {
  margin: 24px 0 8px 0;
  font-size: 24px;
  color: #1f2937;
}

.submitting-content .submitting-hint {
  margin-top: 12px;
  font-size: 14px;
  color: #6b7280;
  font-style: italic;
  font-weight: 700;
  color: #1f2937;
}

.submitting-content p {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
}

.loading-spinner-large {
  border: 6px solid #f3f4f6;
  border-top: 6px solid #8b5cf6;
  border-radius: 50%;
  width: 64px;
  height: 64px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Animación para el spinner de Phosphor */
.ph-spin {
  animation: spin 1s linear infinite;
}

/* Deshabilitar interacción cuando se está enviando */
.bitacora-form.submitting {
  pointer-events: none;
  opacity: 0.6;
}

/* Estilos para botones deshabilitados */
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.btn:disabled:hover {
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .camera-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .camera-preview {
    min-height: 50vh;
  }
  
  .camera-modal-actions {
    flex-direction: column;
  }
  
  .camera-modal-actions .btn {
    width: 100%;
  }
}
</style>
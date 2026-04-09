<template>
  <div class="area-form">
    <h3>{{ area.name }}</h3>
    
    <div class="items-grid">
      <div 
        v-for="item in items" 
        :key="item"
        class="item-card"
      >
        <div class="item-header">
          <h4>{{ item }}</h4>
        </div>
        
        <div class="item-content">
          <!-- Calificación E/B/R -->
          <div class="rating-section">
            <label>Calificación:</label>
            <div class="rating-buttons">
              <button 
                @click="updateRating(item, 'E')"
                class="rating-btn excellent"
                :class="{ active: getCurrentValue(item) === 'E' }"
              >
                E
              </button>
              <button 
                @click="updateRating(item, 'B')"
                class="rating-btn good"
                :class="{ active: getCurrentValue(item) === 'B' }"
              >
                B
              </button>
              <button 
                @click="updateRating(item, 'R')"
                class="rating-btn regular"
                :class="{ active: getCurrentValue(item) === 'R' }"
              >
                R
              </button>
            </div>
          </div>

          <!-- Comentarios -->
          <div class="comments-section">
            <label>Comentarios:</label>
            <textarea 
              :value="getCurrentComment(item)"
              @input="updateComment(item, $event.target.value)"
              placeholder="Agregar comentarios..."
              class="comment-input"
            ></textarea>
          </div>

          <!-- Evidencia (solo si es R) -->
          <div v-if="getCurrentValue(item) === 'R'" class="evidence-section">
            <label>Evidencia fotográfica:</label>
            <div class="evidence-controls">
              <button 
                @click="capturePhoto(item)"
                class="capture-btn"
              >
                📷 Capturar Foto
              </button>
              <div v-if="getCurrentEvidence(item)" class="evidence-preview">
                <img :src="getCurrentEvidence(item)" alt="Evidencia" class="evidence-image">
                <button @click="removeEvidence(item)" class="remove-btn">❌</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  area: Object,
  items: Array,
  values: Object,
  comments: Object,
  evidences: Object
})

const emit = defineEmits(['update', 'capture-photo'])

const getCurrentValue = (item) => {
  return props.values?.[item] || ''
}

const getCurrentComment = (item) => {
  return props.comments?.[item] || ''
}

const getCurrentEvidence = (item) => {
  return props.evidences?.[item] || ''
}

const updateRating = (item, rating) => {
  emit('update', props.area.key, item, rating, getCurrentComment(item), getCurrentEvidence(item))
}

const updateComment = (item, comment) => {
  emit('update', props.area.key, item, getCurrentValue(item), comment, getCurrentEvidence(item))
}

const capturePhoto = (item) => {
  emit('capture-photo', props.area.key, item)
}

const removeEvidence = (item) => {
  emit('update', props.area.key, item, getCurrentValue(item), getCurrentComment(item), '')
}
</script>

<style scoped>
.area-form {
  padding: 0;
}

.area-form h3 {
  margin: 0 0 24px 0;
  color: var(--text);
  font-size: 18px;
  font-weight: 600;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.item-card {
  background: var(--surface);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border);
  transition: all 0.2s ease;
}

.item-card:hover {
  box-shadow: var(--shadow);
}

.item-header h4 {
  margin: 0 0 16px 0;
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rating-section, .comments-section, .evidence-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-section label, .comments-section label, .evidence-section label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
}

.rating-buttons {
  display: flex;
  gap: 8px;
}

.rating-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
}

.rating-btn.excellent {
  background: var(--excellent);
  color: white;
}

.rating-btn.good {
  background: var(--good);
  color: white;
}

.rating-btn.regular {
  background: var(--regular);
  color: white;
}

.rating-btn.active {
  border-color: var(--text);
  transform: scale(1.1);
}

.rating-btn:hover:not(.active) {
  opacity: 0.8;
}

.comment-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.comment-input:focus {
  outline: none;
  border-color: var(--primary);
}

.evidence-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.capture-btn {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s ease;
}

.capture-btn:hover {
  background: var(--primary-dark);
}

.evidence-preview {
  position: relative;
  display: inline-block;
}

.evidence-image {
  width: 100%;
  max-width: 200px;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--border);
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>















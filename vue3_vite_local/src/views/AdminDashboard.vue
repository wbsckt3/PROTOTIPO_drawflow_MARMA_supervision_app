<template>
  <div class="admin-dashboard-container">
    <!-- Sidebar Navigation -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <div class="logo-section">
          <i class="ph ph-shield-check logo-icon"></i>
          <div class="logo-text">
            <h1 class="brand-title">ORBIX</h1>
            <span class="brand-subtitle">Panel Administrativo</span>
          </div>
        </div>
        <div v-if="adminStore.company" class="company-info">
          <i class="ph ph-buildings"></i>
          <span>{{ adminStore.company.name }}</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="activeTab = tab.key"
          :class="['nav-item', { active: activeTab === tab.key }]"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
        </button>
      </nav>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <i class="ph ph-user"></i>
          </div>
          <div class="user-details">
            <span class="user-name">{{ authStore.user?.name }}</span>
            <span class="user-role">Administrador</span>
          </div>
        </div>
        <button @click="logout" class="logout-btn">
          <i class="ph ph-sign-out"></i>
          Salir
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="admin-main">

    <!-- Loading State -->
    <div v-if="adminStore.isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando...</p>
    </div>

    <!-- Modal: Detalle Unidad -->
    <div v-if="showDetalleUnidadModal && unidadDetalle" class="modal-overlay" @click.self="showDetalleUnidadModal = false">
      <div class="modal-content large unidad-modal">
        <div class="modal-header">
          <h3>Detalle Unidad Residencial</h3>
          <button @click="showDetalleUnidadModal = false" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="modal-body unidad-form-grid unidad-form-grid-3 unidad-detalle-grid">
          <div class="form-group">
            <label>Nombre</label>
            <p>{{ unidadDetalle.nombre }}</p>
          </div>
          <div class="form-group">
            <label>Orden Consec.</label>
            <p>{{ unidadDetalle.ordenConsecutivo || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Razón Social</label>
            <p>{{ unidadDetalle.razonSocial || '---' }}</p>
          </div>
          <div class="form-group">
            <label>NIT</label>
            <p>{{ unidadDetalle.nit || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <p>{{ unidadDetalle.direccion }}</p>
          </div>
          <div class="form-group">
            <label>Punto de referencia</label>
            <p>{{ unidadDetalle.puntoReferencia || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Número de portería</label>
            <p>{{ unidadDetalle.numeroPorteria || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Correo administrador</label>
            <p>{{ unidadDetalle.correoFacturacion || unidadDetalle.correo || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Nombre Representante Legal</label>
            <p>{{ unidadDetalle.nombreRepresentanteLegal || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Cédula Representante Legal</label>
            <p>{{ unidadDetalle.cedulaRepresentanteLegal || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Celular Representante Legal</label>
            <p>{{ unidadDetalle.celularRepresentanteLegal || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Nombre Admón Delegado</label>
            <p>{{ unidadDetalle.nombreAdministradorDelegado || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Celular Admón Delegado</label>
            <p>{{ unidadDetalle.celularAdministradorDelegado || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Perfiles contratados</label>
            <p>{{ unidadDetalle.perfilesContratados || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Número de operarios</label>
            <p>{{ unidadDetalle.numeroOperarios ?? '---' }}</p>
          </div>
          <div class="form-group">
            <label>Horarios</label>
            <p>{{ unidadDetalle.horarios || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Jornada</label>
            <p>{{ unidadDetalle.jornada || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Fecha de inicio</label>
            <p>{{ unidadDetalle.fechaInicio ? formatDate(unidadDetalle.fechaInicio) : '---' }}</p>
          </div>
          <div class="form-group">
            <label>Fecha de terminación</label>
            <p>{{ unidadDetalle.fechaTerminacion || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Correo cartas</label>
            <p>{{ unidadDetalle.correoCartas || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Correo facturación</label>
            <p>{{ unidadDetalle.correoFacturacion || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Valores agregados</label>
            <p>{{ unidadDetalle.valoresAgregados || '---' }}</p>
          </div>
          <div class="form-group">
            <label>Frecuencia supervisión</label>
            <p>{{ unidadDetalle.frecuenciaSupervision || '---' }}</p>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Valor contrato (con IVA y AIU)</label>
            <p>{{ unidadDetalle.valorContratoConIva ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(unidadDetalle.valorContratoConIva) : '---' }}</p>
          </div>
          <div class="form-group" style="grid-column: 1 / -1;">
            <label>Observaciones</label>
            <p>{{ unidadDetalle.observacionesContrato || '---' }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetalleUnidadModal = false" class="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="adminStore.error" class="error-container">
      <i class="ph ph-warning"></i>
      <p>Error: {{ adminStore.error }}</p>
      <button @click="refreshData" class="retry-btn">
        <i class="ph ph-arrow-clockwise"></i>
        Reintentar
      </button>
    </div>

    <!-- Tab Content: Usuarios -->
    <div v-else-if="activeTab === 'usuarios'" class="tab-content">
      <div class="content-header">
        <div class="header-title-section">
          <h2>Gestión de Supervisores</h2>
          <p class="header-subtitle">Administra y gestiona los supervisores del sistema</p>
        </div>
        <button @click="showUsuarioModal = true" class="btn-primary">
          <i class="ph ph-user-plus"></i>
          Agregar Supervisor
        </button>
      </div>
      
      <div v-if="adminStore.usuarios.length === 0" class="empty-state">
        <i class="ph ph-users"></i>
        <h3>No hay supervisores registrados</h3>
        <p>Comienza agregando tu primer supervisor al sistema</p>
        <button @click="showUsuarioModal = true" class="btn-primary">
          <i class="ph ph-user-plus"></i>
          Agregar Primer Supervisor
        </button>
      </div>
      
      <div v-else class="cards-grid">
        <div v-for="usuario in adminStore.usuarios" :key="usuario._id || usuario.email" class="card">
          <div class="card-header">
            <h3>{{ usuario.name || usuario.FullName || usuario.email }}</h3>
            <span :class="['badge', `badge-${usuario.role || 'editor'}`]">
              {{ usuario.role || 'editor' }}
            </span>
          </div>
          <div class="card-body">
            <p><strong>Email:</strong> {{ usuario.email || usuario.Email }}</p>
            <p v-if="usuario.companyId"><strong>Empresa:</strong> {{ adminStore.company?.name }}</p>
          </div>
          <div class="card-footer">
            <button @click="verBitacorasSupervisor(usuario.email || usuario.Email)" class="btn-secondary">
              <i class="ph ph-clipboard-text"></i>
              Ver Bitácoras
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content: Unidades -->
    <div v-else-if="activeTab === 'unidades'" class="tab-content">
      <div class="content-header">
        <div class="header-title-section">
          <h2>Unidades Residenciales</h2>
          <p class="header-subtitle">Gestiona las unidades residenciales y sus áreas de supervisión</p>
        </div>
        <button @click="showUnidadModal = true" class="btn-primary">
          <i class="ph ph-building"></i>
          Nueva Unidad
        </button>
      </div>
      
      <!-- Filtros de Unidades -->
      <div class="filters-section-wrapper">
        <div class="filters-title">
          <i class="ph ph-funnel"></i>
          Filtros de Búsqueda
        </div>
        <div class="filters-section">
          <div class="filter-group">
            <label>
              <i class="ph ph-buildings"></i>
              Unidad:
            </label>
            <input
              type="text"
              v-model="filtroUnidadNombre"
              list="unidades-datalist"
              placeholder="Escriba parte del nombre..."
              class="filter-input-autocomplete"
            />
            <datalist id="unidades-datalist">
              <option v-for="u in adminStore.unidades" :key="u._id" :value="u.nombre" />
            </datalist>
          </div>
          <div class="filter-group">
            <label>
              <i class="ph ph-filter"></i>
              Estado:
            </label>
            <select v-model="filtroUnidadEstado" @change="aplicarFiltroUnidades">
              <option value="">Todas</option>
              <option value="true">Habilitadas</option>
              <option value="false">Deshabilitadas</option>
            </select>
          </div>
          <button @click="limpiarFiltroUnidades" class="btn-secondary">
            <i class="ph ph-x-circle"></i>
            Limpiar Filtros
          </button>
        </div>
      </div>
      
      <div v-if="unidadesFiltradas.length === 0" class="empty-state">
        <i class="ph ph-buildings"></i>
        <h3>No hay unidades residenciales</h3>
        <p>Comienza creando tu primera unidad residencial</p>
        <button @click="showUnidadModal = true" class="btn-primary">
          <i class="ph ph-building"></i>
          Crear Primera Unidad
        </button>
      </div>
      
      <div v-else class="cards-grid">
        <div
          v-for="unidad in unidadesFiltradas"
          :key="unidad._id"
          class="card unidad-card"
          :class="{ 'card-disabled': !unidad.isActive }"
        >
          <div class="card-header">
            <h3>{{ unidad.nombre }}</h3>
            <div class="card-header-badges">
              <span class="badge badge-tipo">{{ unidad.tipo }}</span>
              <span v-if="!unidad.isActive" class="badge badge-disabled">Deshabilitada</span>
            </div>
          </div>
          <div class="card-body">
            <div class="card-body-row">
              <p><strong>Razón social:</strong> <span>{{ unidad.razonSocial || unidad.nombre }}</span></p>
              <p><strong>NIT:</strong> <span>{{ unidad.nit || '---' }}</span></p>
              <p><strong>Dirección:</strong> <span>{{ unidad.direccion }}</span></p>
              <p><strong>Punto de referencia:</strong> <span>{{ unidad.puntoReferencia || '---' }}</span></p>
              <p><strong>Correo administrador:</strong> <span>{{ unidad.correoFacturacion || unidad.correo || '---' }}</span></p>
              <p><strong>Perfiles contratados:</strong> <span>{{ unidad.perfilesContratados || '---' }}</span></p>
              <p><strong>Nro. operarios:</strong> <span>{{ unidad.numeroOperarios ?? '---' }}</span></p>
              <p><strong>Horario:</strong> <span>{{ unidad.horarios || '---' }}</span></p>
              <p><strong>Valor contrato (IVA + AIU):</strong> <span>{{ unidad.valorContratoConIva ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(unidad.valorContratoConIva) : '---' }}</span></p>
              <p><strong>Áreas:</strong> <span>{{ Object.keys(unidad.areas || {}).length }} áreas configuradas</span></p>
              <p class="info-item-inline">
                <i class="ph ph-calendar-check"></i>
                <strong>Siguiente bitácora programada:</strong> 
                <span v-if="getUnidadBitacorasInfo(unidad._id)?.siguienteProgramada">
                  {{ formatDate(getUnidadBitacorasInfo(unidad._id).siguienteProgramada.fecha) }}
                </span>
                <span v-else>---</span>
              </p>
              <p class="info-item-inline">
                <i class="ph ph-check-circle"></i>
                <strong>Última bitácora diligenciada:</strong> 
                <span v-if="getUnidadBitacorasInfo(unidad._id)?.ultimaCompletada">
                  {{ formatDate(getUnidadBitacorasInfo(unidad._id).ultimaCompletada.fecha) }}
                  <span :class="['badge', `badge-${getUnidadBitacorasInfo(unidad._id).ultimaCompletada.estado}`]">
                    {{ getStatusText(getUnidadBitacorasInfo(unidad._id).ultimaCompletada.estado) }}
                  </span>
                </span>
                <span v-else>---</span>
              </p>
            </div>
          </div>
          <div class="card-footer">
            <button @click="verDetalleUnidad(unidad)" class="btn-secondary">
              <i class="ph ph-info"></i>
              Ver Detalle
            </button>
            <button @click="verBitacorasUnidad(unidad._id)" class="btn-secondary" :disabled="!unidad.isActive">
              <i class="ph ph-clipboard-text"></i>
              Ver Bitácoras
            </button>
            <button @click="crearBitacoraUnidad(unidad)" class="btn-primary" :disabled="!unidad.isActive">
              <i class="ph ph-calendar-plus"></i>
              Nueva Visita
            </button>
            <button @click="editarUnidad(unidad)" class="btn-secondary">
              <i class="ph ph-pencil"></i>
              Editar
            </button>
            <button 
              @click="toggleEstadoUnidad(unidad)" 
              :class="['btn-secondary', unidad.isActive ? 'btn-disable' : 'btn-enable']"
            >
              <i :class="unidad.isActive ? 'ph ph-eye-slash' : 'ph ph-eye'"></i>
              {{ unidad.isActive ? 'Deshabilitar' : 'Habilitar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content: Bitácoras -->
    <div v-else-if="activeTab === 'bitacoras'" class="tab-content">
      <div class="content-header">
        <div class="header-title-section">
          <h2>Bitácoras de Supervisión</h2>
          <p class="header-subtitle">Visualiza y gestiona todas las bitácoras de supervisión del sistema</p>
        </div>
      </div>
      
      <div class="filters-section-wrapper">
        <h3 class="filters-title">
          <i class="ph ph-funnel"></i>
          Filtros de Búsqueda
        </h3>
        <div class="filters-section">
          <div class="filter-group">
            <label>
              <i class="ph ph-building"></i>
              Unidad:
            </label>
            <select v-model="filters.unidadResidencialId" @change="applyFilters">
              <option value="">Todas</option>
              <option v-for="unidad in adminStore.unidades" :key="unidad._id" :value="unidad._id">
                {{ unidad.nombre }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>
              <i class="ph ph-calendar"></i>
              Desde:
            </label>
            <input type="date" v-model="filters.fechaDesde" @change="handleFechaDesdeChange" />
          </div>
          <div class="filter-group">
            <label>
              <i class="ph ph-calendar"></i>
              Hasta:
            </label>
            <input type="date" v-model="filters.fechaHasta" @change="applyFilters" />
          </div>
          <div class="filter-group">
            <label>
              <i class="ph ph-funnel"></i>
              Estado:
            </label>
            <select v-model="filters.estado" @change="applyFilters">
              <option value="">Todos</option>
              <option value="programada">Programada</option>
              <option value="completada">Completada</option>
              <option value="con_novedad">Completada con novedad</option>
            </select>
          </div>
          <button @click="clearFilters" class="btn-secondary">
            <i class="ph ph-x-circle"></i>
            Limpiar Filtros
          </button>
        </div>
      </div>
      
      <div v-if="filteredBitacoras.length === 0" class="empty-state">
        <i class="ph ph-clipboard-text"></i>
        <h3>No hay bitácoras disponibles</h3>
        <p>No se encontraron bitácoras con los filtros seleccionados</p>
        <button @click="clearFilters" class="btn-secondary">
          <i class="ph ph-x-circle"></i>
          Limpiar Filtros
        </button>
      </div>
      
      <div v-else class="cards-grid">
        <div v-for="bitacora in filteredBitacoras" :key="bitacora._id" class="card">
          <div class="card-header">
            <h3>{{ bitacora.unidadNombre || 'Sin unidad' }}</h3>
            <span :class="['badge', `badge-${bitacora.estado}`]">
              {{ getStatusText(bitacora.estado) }}
            </span>
          </div>
          <div class="card-body">
            <p><strong>Supervisor:</strong> <span>{{ bitacora.supervisor || bitacora.supervisorEmail }}</span></p>
            <p><strong>Fecha:</strong> <span>{{ formatDate(bitacora.fecha) }}</span></p>
            <p v-if="bitacora.fechaInicio"><strong>Inicio:</strong> <span>{{ formatDate(bitacora.fechaInicio) }}</span></p>
            <p v-if="bitacora.fechaFin"><strong>Cierre:</strong> <span>{{ formatDate(bitacora.fechaFin) }}</span></p>
            <p v-if="bitacora.observaciones"><strong>Observaciones:</strong> <span>{{ bitacora.observaciones }}</span></p>
          </div>
          <div class="card-footer">
            <button @click="verDetalleBitacora(bitacora._id)" class="btn-primary">
              <i class="ph ph-eye"></i>
              Ver Detalle
            </button>
            <button 
              v-if="bitacora.estado !== 'programada'" 
              @click="descargarPdfBitacora(bitacora)" 
              class="btn-secondary"
            >
              <i class="ph ph-file-pdf"></i>
              Descargar PDF
            </button>
            <button 
              v-if="bitacora.estado === 'programada'" 
              @click="editarBitacora(bitacora)" 
              class="btn-secondary"
            >
              <i class="ph ph-pencil"></i>
              Editar
            </button>
            <button 
              v-if="bitacora.estado === 'programada'" 
              @click="eliminarBitacoraConfirm(bitacora)" 
              class="btn-secondary btn-danger"
            >
              <i class="ph ph-trash"></i>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Agregar Usuario -->
    <div v-if="showUsuarioModal" class="modal-overlay" @click.self="showUsuarioModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Agregar Supervisor</h3>
          <button @click="showUsuarioModal = false" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <form @submit.prevent="handleCrearUsuario" class="modal-body">
          <div class="form-group">
            <label>Email (Gmail)</label>
            <input type="email" v-model="usuarioForm.email" required placeholder="supervisor@gmail.com" />
          </div>
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" v-model="usuarioForm.name" required placeholder="Nombre completo" />
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select v-model="usuarioForm.role" required>
              <option value="editor">Supervisor (Editor)</option>
              <option value="admin">Administrador</option>
              <option value="viewer">Solo Lectura</option>
            </select>
          </div>
          <div class="form-group">
            <label>Código de Activación <span style="color: #dc2626;">*</span></label>
            <input 
              type="password" 
              v-model="codigoActivacion" 
              required 
              placeholder="Ingrese el código de activación"
              @input="validarCodigoActivacion"
            />
            <small class="form-help-text">
              <i class="ph ph-info"></i>
              Se requiere código de activación para crear supervisores
            </small>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showUsuarioModal = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary" :disabled="!codigoActivacionValido">
              <i class="ph ph-lock" v-if="!codigoActivacionValido"></i>
              <i class="ph ph-check" v-else></i>
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Agregar Unidad -->
    <div v-if="showUnidadModal" class="modal-overlay" @click.self="showUnidadModal = false">
      <div class="modal-content large unidad-modal">
        <div class="modal-header">
          <h3>Nueva Unidad Residencial</h3>
          <button @click="showUnidadModal = false" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <form @submit.prevent="handleCrearUnidad" class="modal-body unidad-form-grid unidad-form-grid-3">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" v-model="unidadForm.nombre" required placeholder="Conjunto Residencial..." />
          </div>
          <div class="form-group">
            <label>Orden Consec.</label>
            <input type="text" v-model="unidadForm.ordenConsecutivo" placeholder="132" />
          </div>
          <div class="form-group">
            <label>Razón Social</label>
            <input type="text" v-model="unidadForm.razonSocial" placeholder="Razón social legal" />
          </div>
          <div class="form-group">
            <label>NIT</label>
            <input type="text" v-model="unidadForm.nit" placeholder="890.985.818-9" />
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input type="text" v-model="unidadForm.direccion" required placeholder="Dirección completa" />
          </div>
          <div class="form-group">
            <label>Punto de referencia</label>
            <input type="text" v-model="unidadForm.puntoReferencia" placeholder="Cerca de..." />
          </div>
          <div class="form-group">
            <label>Número de portería</label>
            <input type="text" v-model="unidadForm.numeroPorteria" />
          </div>
          <div class="form-group">
            <label>Correo</label>
            <input type="email" v-model="unidadForm.correo" placeholder="correo@ejemplo.com" />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="unidadForm.tipo" required>
              <option value="condominio">Condominio</option>
              <option value="edificio">Edificio</option>
              <option value="conjunto_residencial">Conjunto Residencial</option>
              <option value="urbanizacion">Urbanización</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nombre Representante Legal</label>
            <input type="text" v-model="unidadForm.nombreRepresentanteLegal" />
          </div>
          <div class="form-group">
            <label>Cédula Representante Legal</label>
            <input type="text" v-model="unidadForm.cedulaRepresentanteLegal" />
          </div>
          <div class="form-group">
            <label>Celular Representante Legal</label>
            <input type="text" v-model="unidadForm.celularRepresentanteLegal" />
          </div>
          <div class="form-group">
            <label>Nombre Admón Delegado</label>
            <input type="text" v-model="unidadForm.nombreAdministradorDelegado" />
          </div>
          <div class="form-group">
            <label>Celular Admón Delegado</label>
            <input type="text" v-model="unidadForm.celularAdministradorDelegado" />
          </div>
          <div class="form-group">
            <label>Perfiles contratados</label>
            <input type="text" v-model="unidadForm.perfilesContratados" placeholder="OFICIOS VARIOS, ..." />
          </div>
          <div class="form-group">
            <label>Número de operarios</label>
            <input type="number" min="0" v-model="unidadForm.numeroOperarios" />
          </div>
          <div class="form-group">
            <label>Horarios</label>
            <input type="text" v-model="unidadForm.horarios" placeholder="LUNES A SÁBADO" />
          </div>
          <div class="form-group">
            <label>Jornada</label>
            <input type="text" v-model="unidadForm.jornada" />
          </div>
          <div class="form-group">
            <label>Fecha de inicio</label>
            <input type="date" v-model="unidadForm.fechaInicio" />
          </div>
          <div class="form-group">
            <label>Fecha de terminación</label>
            <input type="text" v-model="unidadForm.fechaTerminacion" placeholder="INDEFINIDO o fecha" />
          </div>
          <div class="form-group">
            <label>Correo cartas</label>
            <input type="email" v-model="unidadForm.correoCartas" />
          </div>
          <div class="form-group">
            <label>Correo facturación</label>
            <input type="email" v-model="unidadForm.correoFacturacion" />
          </div>
          <div class="form-group">
            <label>Valores agregados</label>
            <textarea v-model="unidadForm.valoresAgregados" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Frecuencia supervisión</label>
            <input type="text" v-model="unidadForm.frecuenciaSupervision" placeholder="SEMANAL, MENSUAL..." />
          </div>
          <div class="form-group">
            <label>Valor contrato (con IVA y AIU)</label>
            <input type="number" min="0" step="0.01" v-model="unidadForm.valorContratoConIva" />
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="unidadForm.observacionesContrato" rows="3"></textarea>
          </div>
          <div class="modal-footer" style="grid-column: 1 / -1;">
            <button type="button" @click="showUnidadModal = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Crear</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Crear Bitácora -->
    <div v-if="showBitacoraModal" class="modal-overlay" @click.self="showBitacoraModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Programar Visita de Supervisión</h3>
          <button @click="showBitacoraModal = false" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <form @submit.prevent="handleCrearBitacora" class="modal-body">
          <div class="form-group">
            <label>Unidad Residencial</label>
            <select v-model="bitacoraForm.unidadResidencialId" required>
              <option value="">Seleccionar unidad</option>
              <option v-for="unidad in adminStore.unidades" :key="unidad._id" :value="unidad._id">
                {{ unidad.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Supervisor</label>
            <select v-model="bitacoraForm.supervisorEmail" required>
              <option value="">Seleccionar supervisor</option>
              <option v-for="usuario in adminStore.usuarios" :key="usuario.email || usuario.Email" 
                      :value="usuario.email || usuario.Email">
                {{ usuario.name || usuario.FullName || usuario.email || usuario.Email }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha Programada</label>
            <input type="datetime-local" v-model="bitacoraForm.fecha" required />
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="bitacoraForm.observaciones" rows="3" placeholder="Observaciones para la visita..."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showBitacoraModal = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Programar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Editar Unidad -->
    <div v-if="showEditUnidadModal" class="modal-overlay" @click.self="showEditUnidadModal = false">
      <div class="modal-content large unidad-modal">
        <div class="modal-header">
          <h3>Editar Unidad Residencial</h3>
          <button @click="showEditUnidadModal = false" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <form @submit.prevent="handleActualizarUnidad" class="modal-body unidad-form-grid unidad-form-grid-3">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" v-model="unidadEditForm.nombre" required placeholder="Conjunto Residencial..." />
          </div>
          <div class="form-group">
            <label>Orden Consec.</label>
            <input type="text" v-model="unidadEditForm.ordenConsecutivo" />
          </div>
          <div class="form-group">
            <label>Razón Social</label>
            <input type="text" v-model="unidadEditForm.razonSocial" />
          </div>
          <div class="form-group">
            <label>NIT</label>
            <input type="text" v-model="unidadEditForm.nit" />
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input type="text" v-model="unidadEditForm.direccion" required placeholder="Dirección completa" />
          </div>
          <div class="form-group">
            <label>Punto de referencia</label>
            <input type="text" v-model="unidadEditForm.puntoReferencia" />
          </div>
          <div class="form-group">
            <label>Número de portería</label>
            <input type="text" v-model="unidadEditForm.numeroPorteria" />
          </div>
          <div class="form-group">
            <label>Correo</label>
            <input type="email" v-model="unidadEditForm.correo" placeholder="correo@ejemplo.com" />
          </div>
          <div class="form-group">
            <label>Tipo</label>
            <select v-model="unidadEditForm.tipo" required>
              <option value="condominio">Condominio</option>
              <option value="edificio">Edificio</option>
              <option value="conjunto_residencial">Conjunto Residencial</option>
              <option value="urbanizacion">Urbanización</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nombre Representante Legal</label>
            <input type="text" v-model="unidadEditForm.nombreRepresentanteLegal" />
          </div>
          <div class="form-group">
            <label>Cédula Representante Legal</label>
            <input type="text" v-model="unidadEditForm.cedulaRepresentanteLegal" />
          </div>
          <div class="form-group">
            <label>Celular Representante Legal</label>
            <input type="text" v-model="unidadEditForm.celularRepresentanteLegal" />
          </div>
          <div class="form-group">
            <label>Nombre Admón Delegado</label>
            <input type="text" v-model="unidadEditForm.nombreAdministradorDelegado" />
          </div>
          <div class="form-group">
            <label>Celular Admón Delegado</label>
            <input type="text" v-model="unidadEditForm.celularAdministradorDelegado" />
          </div>
          <div class="form-group">
            <label>Perfiles contratados</label>
            <input type="text" v-model="unidadEditForm.perfilesContratados" />
          </div>
          <div class="form-group">
            <label>Número de operarios</label>
            <input type="number" min="0" v-model="unidadEditForm.numeroOperarios" />
          </div>
          <div class="form-group">
            <label>Horarios</label>
            <input type="text" v-model="unidadEditForm.horarios" />
          </div>
          <div class="form-group">
            <label>Jornada</label>
            <input type="text" v-model="unidadEditForm.jornada" />
          </div>
          <div class="form-group">
            <label>Fecha de inicio</label>
            <input type="date" v-model="unidadEditForm.fechaInicio" />
          </div>
          <div class="form-group">
            <label>Fecha de terminación</label>
            <input type="text" v-model="unidadEditForm.fechaTerminacion" />
          </div>
          <div class="form-group">
            <label>Correo cartas</label>
            <input type="email" v-model="unidadEditForm.correoCartas" />
          </div>
          <div class="form-group">
            <label>Correo facturación</label>
            <input type="email" v-model="unidadEditForm.correoFacturacion" />
          </div>
          <div class="form-group">
            <label>Valores agregados</label>
            <textarea v-model="unidadEditForm.valoresAgregados" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Frecuencia supervisión</label>
            <input type="text" v-model="unidadEditForm.frecuenciaSupervision" />
          </div>
          <div class="form-group">
            <label>Valor contrato (con IVA y AIU)</label>
            <input type="number" min="0" step="0.01" v-model="unidadEditForm.valorContratoConIva" />
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="unidadEditForm.observacionesContrato" rows="3"></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showEditUnidadModal = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Actualizar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Editar Bitácora -->
    <div v-if="showEditBitacoraModal" class="modal-overlay" @click.self="showEditBitacoraModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Reprogramar Bitácora</h3>
          <button @click="showEditBitacoraModal = false" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <form @submit.prevent="handleActualizarBitacora" class="modal-body">
          <div class="form-group">
            <label>Unidad Residencial</label>
            <select v-model="bitacoraEditForm.unidadResidencialId" required>
              <option value="">Seleccionar unidad</option>
              <option v-for="unidad in adminStore.unidades" :key="unidad._id" :value="unidad._id">
                {{ unidad.nombre }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Supervisor</label>
            <select v-model="bitacoraEditForm.supervisorEmail" required>
              <option value="">Seleccionar supervisor</option>
              <option v-for="usuario in adminStore.usuarios" :key="usuario.email || usuario.Email" 
                      :value="usuario.email || usuario.Email">
                {{ usuario.name || usuario.FullName || usuario.email || usuario.Email }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Fecha Programada</label>
            <input type="datetime-local" v-model="bitacoraEditForm.fecha" required />
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <textarea v-model="bitacoraEditForm.observaciones" rows="3" placeholder="Observaciones para la visita..."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" @click="showEditBitacoraModal = false" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">Actualizar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Ver Detalle Bitácora -->
    <div v-if="showDetalleModal && bitacoraDetalle" class="modal-overlay" @click.self="showDetalleModal = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>Detalle de Bitácora</h3>
          <button @click="showDetalleModal = false" class="modal-close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-section">
            <h4>Información General</h4>
            <p><strong>Unidad:</strong> {{ bitacoraDetalle.unidadNombre || 'No especificada' }}</p>
            <p><strong>Supervisor:</strong> {{ bitacoraDetalle.supervisor || bitacoraDetalle.supervisorEmail }}</p>
            <p v-if="bitacoraDetalle.createdAt"><strong>Fecha de Creación:</strong> {{ formatDate(bitacoraDetalle.createdAt) }}</p>
            <p v-if="bitacoraDetalle.fechaProgramada || bitacoraDetalle.fecha"><strong>Fecha Programada:</strong> {{ formatDate(bitacoraDetalle.fechaProgramada || bitacoraDetalle.fecha) }}</p>
            <p v-if="bitacoraDetalle.updatedAt"><strong>Fecha de Ejecución:</strong> {{ formatDate(bitacoraDetalle.updatedAt) }}</p>
            <p><strong>Estado:</strong> <span :class="['badge', `badge-${bitacoraDetalle.estado}`]">{{ getStatusText(bitacoraDetalle.estado) }}</span></p>
            <p v-if="bitacoraDetalle.observaciones"><strong>Observaciones:</strong> {{ bitacoraDetalle.observaciones }}</p>
            <p v-if="bitacoraDetalle.comentarioGlobal" class="comentario-global-admin">
              <strong>Comentario Global (Interno):</strong> 
              <span class="comentario-global-text">{{ bitacoraDetalle.comentarioGlobal }}</span>
              <span class="comentario-global-badge">No incluido en PDF</span>
            </p>
          </div>
          <!-- Convenciones de Calificación -->
          <div class="detail-section">
            <h4>Convenciones de Calificación</h4>
            <div class="convenciones-grid">
              <div class="convencion-item">
                <span class="badge badge-calificacion-E">E</span>
                <span>Excelente</span>
              </div>
              <div class="convencion-item">
                <span class="badge badge-calificacion-B">B</span>
                <span>Bueno</span>
              </div>
              <div class="convencion-item">
                <span class="badge badge-calificacion-R">R</span>
                <span>Regular (requiere evidencia fotográfica)</span>
              </div>
            </div>
          </div>
          
          <!-- Áreas y Elementos Calificados -->
          <div v-if="bitacoraDetalle.areas && Object.keys(bitacoraDetalle.areas).length > 0" class="detail-section">
            <h4>Áreas y Elementos Calificados</h4>
            <div v-for="(areaData, areaKey) in bitacoraDetalle.areas" :key="areaKey" class="area-detail">
              <h5>{{ getAreaName(areaKey) }}</h5>
              <div class="items-list">
                <div v-for="(calificacion, itemName) in areaData" :key="itemName" class="item-detail">
                  <div class="item-header">
                    <span class="item-name">{{ itemName }}</span>
                    <span :class="['badge', `badge-calificacion-${calificacion}`]">{{ calificacion }}</span>
                  </div>
                  <div v-if="bitacoraDetalle.comentarios && bitacoraDetalle.comentarios[areaKey] && bitacoraDetalle.comentarios[areaKey][itemName]" class="item-comentario">
                    <strong>Comentario:</strong> {{ bitacoraDetalle.comentarios[areaKey][itemName] }}
                  </div>
                  <div v-if="hasEvidencia(bitacoraDetalle, areaKey, itemName)" class="item-evidencia">
                    <strong>Evidencia {{ calificacion === 'R' ? '(requerida)' : '(opcional)' }}:</strong>
                    <img :src="getEvidenciaSrc(getEvidenciaData(bitacoraDetalle, areaKey, itemName))" alt="Evidencia" class="evidencia-img" />
                    <div v-if="getEvidenciaGeolocation(getEvidenciaData(bitacoraDetalle, areaKey, itemName))" class="evidencia-geolocation">
                      <i class="ph ph-map-pin"></i>
                      <span>📍 {{ getEvidenciaGeolocation(getEvidenciaData(bitacoraDetalle, areaKey, itemName)) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else-if="bitacoraDetalle.estado === 'programada'" class="detail-section">
            <p class="info-message">Esta bitácora aún no ha sido diligenciada.</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetalleModal = false" class="btn-secondary">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Tab Content: Propuestas de Servicio -->
    <div v-else-if="activeTab === 'propuestas'" class="tab-content">
      <div class="content-header">
        <div class="header-title-section">
          <h2>Propuestas de Servicio</h2>
          <p class="header-subtitle">Gestiona las propuestas de proveedores de servicio para resolver problemas reportados</p>
        </div>
        <button @click="cargarPropuestas" class="btn-secondary">
          <i class="ph ph-arrow-clockwise"></i>
          Actualizar
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters-section-wrapper">
        <div class="filters-title">
          <i class="ph ph-funnel"></i>
          Filtros
        </div>
        <div class="filters-section">
          <div class="filter-group">
            <label>Estado:</label>
            <select v-model="filtroPropuestaEstado" @change="aplicarFiltroPropuestas">
              <option value="">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="aceptada">Aceptadas</option>
              <option value="rechazada">Rechazadas</option>
              <option value="completada">Completadas</option>
            </select>
          </div>
          <button @click="limpiarFiltroPropuestas" class="btn-secondary">
            <i class="ph ph-x-circle"></i>
            Limpiar Filtros
          </button>
        </div>
      </div>

      <!-- Lista de Propuestas -->
      <div v-if="propuestasFiltradas.length === 0" class="empty-state">
        <i class="ph ph-handshake"></i>
        <h3>No hay propuestas de servicio</h3>
        <p>Las propuestas de proveedores aparecerán aquí cuando envíen ofertas para resolver problemas reportados</p>
      </div>

      <div v-else class="cards-grid">
        <div v-for="propuesta in propuestasFiltradas" :key="propuesta._id" class="card propuesta-card">
          <div class="card-header">
            <div>
              <h3>{{ propuesta.area }} - {{ propuesta.item }}</h3>
              <p class="card-subtitle">{{ propuesta.unidadResidencialNombre }}</p>
            </div>
            <span :class="['badge', `badge-${propuesta.estado}`]">
              {{ getEstadoLabel(propuesta.estado) }}
            </span>
          </div>
          
          <div class="card-body">
            <div class="propuesta-info">
              <div class="info-row">
                <strong>Proveedor:</strong>
                <span>{{ propuesta.proveedorNombre }}</span>
              </div>
              <div class="info-row">
                <strong>Email:</strong>
                <span>{{ propuesta.proveedorEmail }}</span>
              </div>
              <div class="info-row">
                <strong>WhatsApp:</strong>
                <a :href="`https://wa.me/${propuesta.whatsapp.replace(/[^0-9]/g, '')}`" target="_blank" class="whatsapp-link">
                  <i class="ph ph-whatsapp-logo"></i>
                  {{ propuesta.whatsapp }}
                </a>
              </div>
              <div class="info-row">
                <strong>Propuesta:</strong>
                <p class="propuesta-texto">{{ propuesta.propuestaTexto }}</p>
              </div>
              <div v-if="propuesta.imagenUrl" class="imagen-preview">
                <img :src="propuesta.imagenUrl" alt="Evidencia" @click="verImagen(propuesta.imagenUrl)" style="max-width: 100%; border-radius: 8px; cursor: pointer;" />
              </div>
              <div v-if="propuesta.respuestaAdmin" class="respuesta-admin">
                <strong>Tu respuesta:</strong>
                <p>{{ propuesta.respuestaAdmin }}</p>
              </div>
            </div>
          </div>

          <div class="card-footer">
            <div class="footer-actions">
              <a 
                :href="`https://wa.me/${propuesta.whatsapp.replace(/[^0-9]/g, '')}`" 
                target="_blank" 
                class="btn-whatsapp"
              >
                <i class="ph ph-whatsapp-logo"></i>
                Contactar por WhatsApp
              </a>
              <div v-if="propuesta.estado === 'pendiente'" class="action-buttons">
                <button @click="aceptarPropuesta(propuesta._id)" class="btn-success">
                  <i class="ph ph-check"></i>
                  Aceptar
                </button>
                <button @click="rechazarPropuesta(propuesta._id)" class="btn-danger">
                  <i class="ph ph-x"></i>
                  Rechazar
                </button>
              </div>
            </div>
            <div class="propuesta-meta">
              <span class="meta-item">
                <i class="ph ph-calendar"></i>
                {{ formatDatePropuesta(propuesta.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAdminStore } from '../stores/admin'
import { API_BASE_URL } from '../config/api.js'

const router = useRouter()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const activeTab = ref('usuarios')
const showUsuarioModal = ref(false)
const showUnidadModal = ref(false)
const showEditUnidadModal = ref(false)
const showDetalleUnidadModal = ref(false)
const showBitacoraModal = ref(false)
const showEditBitacoraModal = ref(false)
const showDetalleModal = ref(false)
const bitacoraDetalle = ref(null)

// Propuestas de servicio
const propuestas = ref([])
const filtroPropuestaEstado = ref('')
const isLoadingPropuestas = ref(false)

const tabs = [
  { key: 'usuarios', label: 'Supervisores', icon: 'ph ph-users' },
  { key: 'unidades', label: 'Unidades', icon: 'ph ph-buildings' },
  { key: 'bitacoras', label: 'Bitácoras', icon: 'ph ph-clipboard-text' },
  { key: 'propuestas', label: 'Propuestas', icon: 'ph ph-handshake' }
]

// Código de activación privado de Tech Guard
const CODIGO_ACTIVACION = 'TECHGUARD-SUPERVISOR-a7u6TBU1gUG6UI'

const codigoActivacion = ref('')
const codigoActivacionValido = computed(() => {
  return codigoActivacion.value.trim() === CODIGO_ACTIVACION
})

const validarCodigoActivacion = () => {
  // La validación se hace automáticamente mediante el computed
}

const usuarioForm = ref({
  email: '',
  name: '',
  role: 'editor'
})

const unidadForm = ref({
  nombre: '',
  direccion: '',
  correo: '',
  tipo: 'condominio',
  ordenConsecutivo: '',
  razonSocial: '',
  nit: '',
  puntoReferencia: '',
  numeroPorteria: '',
  nombreRepresentanteLegal: '',
  cedulaRepresentanteLegal: '',
  celularRepresentanteLegal: '',
  nombreAdministradorDelegado: '',
  celularAdministradorDelegado: '',
  perfilesContratados: '',
  numeroOperarios: '',
  horarios: '',
  jornada: '',
  fechaInicio: '',
  fechaTerminacion: '',
  correoCartas: '',
  correoFacturacion: '',
  valoresAgregados: '',
  frecuenciaSupervision: '',
  valorContratoConIva: '',
  observacionesContrato: ''
})

const unidadEditForm = ref({
  _id: '',
  nombre: '',
  direccion: '',
  correo: '',
  tipo: 'condominio',
  ordenConsecutivo: '',
  razonSocial: '',
  nit: '',
  puntoReferencia: '',
  numeroPorteria: '',
  nombreRepresentanteLegal: '',
  cedulaRepresentanteLegal: '',
  celularRepresentanteLegal: '',
  nombreAdministradorDelegado: '',
  celularAdministradorDelegado: '',
  perfilesContratados: '',
  numeroOperarios: '',
  horarios: '',
  jornada: '',
  fechaInicio: '',
  fechaTerminacion: '',
  correoCartas: '',
  correoFacturacion: '',
  valoresAgregados: '',
  frecuenciaSupervision: '',
  valorContratoConIva: '',
  observacionesContrato: ''
})

const unidadDetalle = ref(null)

const bitacoraForm = ref({
  unidadResidencialId: '',
  supervisorEmail: '',
  fecha: '',
  observaciones: ''
})

const bitacoraEditForm = ref({
  _id: '',
  unidadResidencialId: '',
  supervisorEmail: '',
  fecha: '',
  observaciones: ''
})

const filters = ref({
  unidadResidencialId: '',
  fechaDesde: '',
  fechaHasta: '',
  estado: ''
})

const filteredBitacoras = computed(() => {
  let result = adminStore.bitacoras
  
  if (filters.value.unidadResidencialId) {
    result = result.filter(b => b.unidadResidencialId === filters.value.unidadResidencialId)
  }
  
  if (filters.value.fechaDesde) {
    const desde = new Date(filters.value.fechaDesde)
    result = result.filter(b => new Date(b.fecha) >= desde)
  }
  
  if (filters.value.fechaHasta) {
    const hasta = new Date(filters.value.fechaHasta)
    hasta.setHours(23, 59, 59, 999)
    result = result.filter(b => new Date(b.fecha) <= hasta)
  }
  
  if (filters.value.estado) {
    result = result.filter(b => b.estado === filters.value.estado)
  }
  
  return result
})

const filtroUnidadEstado = ref('')

const filtroUnidadNombre = ref('')

const unidadesFiltradas = computed(() => {
  let result = adminStore.unidades
  
  if (filtroUnidadEstado.value !== '') {
    const isActive = filtroUnidadEstado.value === 'true'
    result = result.filter(u => u.isActive === isActive)
  }
  
  const texto = (filtroUnidadNombre.value || '').trim().toLowerCase()
  if (texto) {
    result = result.filter(u => (u.nombre || '').toLowerCase().includes(texto))
  }
  
  return result
})

onMounted(async () => {
  // Verificar acceso de admin
  if (!adminStore.isAdmin) {
    alert('Acceso denegado. Solo administradores pueden acceder a este panel.')
    router.push('/dashboard')
    return
  }
  
  // Cargar datos iniciales
  await loadInitialData()
})

const loadInitialData = async () => {
  try {
    await adminStore.loadCompany()
    await adminStore.loadUsuarios()
    await adminStore.loadUnidades()
    await adminStore.loadBitacoras()
  } catch (error) {
    console.error('Error cargando datos iniciales:', error)
  }
}

const refreshData = async () => {
  await loadInitialData()
}

const handleCrearUsuario = async () => {
  // Validar código de activación antes de proceder
  if (!codigoActivacionValido.value) {
    alert('Código de activación incorrecto. No se puede crear el supervisor.')
    return
  }
  
  try {
    await adminStore.crearUsuario(usuarioForm.value)
    showUsuarioModal.value = false
    usuarioForm.value = { email: '', name: '', role: 'editor' }
    codigoActivacion.value = '' // Limpiar código al cerrar
    alert('Supervisor agregado exitosamente')
  } catch (error) {
    alert('Error al agregar supervisor: ' + error.message)
  }
}

// Limpiar código cuando se cierra el modal
watch(showUsuarioModal, (newVal) => {
  if (!newVal) {
    codigoActivacion.value = ''
  }
})

const handleCrearUnidad = async () => {
  try {
    await adminStore.crearUnidad(unidadForm.value)
    showUnidadModal.value = false
    unidadForm.value = {
      nombre: '',
      direccion: '',
      correo: '',
      tipo: 'condominio',
      ordenConsecutivo: '',
      razonSocial: '',
      nit: '',
      puntoReferencia: '',
      numeroPorteria: '',
      nombreRepresentanteLegal: '',
      cedulaRepresentanteLegal: '',
      celularRepresentanteLegal: '',
      nombreAdministradorDelegado: '',
      celularAdministradorDelegado: '',
      perfilesContratados: '',
      numeroOperarios: '',
      horarios: '',
      jornada: '',
      fechaInicio: '',
      fechaTerminacion: '',
      correoCartas: '',
      correoFacturacion: '',
      valoresAgregados: '',
      frecuenciaSupervision: '',
      valorContratoConIva: '',
      observacionesContrato: ''
    }
    alert('Unidad residencial creada exitosamente')
  } catch (error) {
    alert('Error al crear unidad: ' + error.message)
  }
}

const aplicarFiltroUnidades = () => {
  // El filtro se aplica automáticamente mediante el computed unidadesFiltradas
}

const limpiarFiltroUnidades = () => {
  filtroUnidadEstado.value = ''
  filtroUnidadNombre.value = ''
}

const verDetalleUnidad = (unidad) => {
  unidadDetalle.value = unidad
  showDetalleUnidadModal.value = true
}

const editarUnidad = (unidad) => {
  unidadEditForm.value = {
    _id: unidad._id,
    nombre: unidad.nombre,
    direccion: unidad.direccion,
    correo: unidad.correo || '',
    tipo: unidad.tipo,
    ordenConsecutivo: unidad.ordenConsecutivo || '',
    razonSocial: unidad.razonSocial || '',
    nit: unidad.nit || '',
    puntoReferencia: unidad.puntoReferencia || '',
    numeroPorteria: unidad.numeroPorteria || '',
    nombreRepresentanteLegal: unidad.nombreRepresentanteLegal || '',
    cedulaRepresentanteLegal: unidad.cedulaRepresentanteLegal || '',
    celularRepresentanteLegal: unidad.celularRepresentanteLegal || '',
    nombreAdministradorDelegado: unidad.nombreAdministradorDelegado || '',
    celularAdministradorDelegado: unidad.celularAdministradorDelegado || '',
    perfilesContratados: unidad.perfilesContratados || '',
    numeroOperarios: unidad.numeroOperarios ?? '',
    horarios: unidad.horarios || '',
    jornada: unidad.jornada || '',
    fechaInicio: unidad.fechaInicio ? unidad.fechaInicio.substring(0, 10) : '',
    fechaTerminacion: unidad.fechaTerminacion || '',
    correoCartas: unidad.correoCartas || '',
    correoFacturacion: unidad.correoFacturacion || '',
    valoresAgregados: unidad.valoresAgregados || '',
    frecuenciaSupervision: unidad.frecuenciaSupervision || '',
    valorContratoConIva: unidad.valorContratoConIva ?? '',
    observacionesContrato: unidad.observacionesContrato || ''
  }
  showEditUnidadModal.value = true
}

const handleActualizarUnidad = async () => {
  try {
    await adminStore.actualizarUnidad(unidadEditForm.value._id, {
      nombre: unidadEditForm.value.nombre,
      direccion: unidadEditForm.value.direccion,
      correo: unidadEditForm.value.correo,
      tipo: unidadEditForm.value.tipo,
      ordenConsecutivo: unidadEditForm.value.ordenConsecutivo,
      razonSocial: unidadEditForm.value.razonSocial,
      nit: unidadEditForm.value.nit,
      puntoReferencia: unidadEditForm.value.puntoReferencia,
      numeroPorteria: unidadEditForm.value.numeroPorteria,
      nombreRepresentanteLegal: unidadEditForm.value.nombreRepresentanteLegal,
      cedulaRepresentanteLegal: unidadEditForm.value.cedulaRepresentanteLegal,
      celularRepresentanteLegal: unidadEditForm.value.celularRepresentanteLegal,
      nombreAdministradorDelegado: unidadEditForm.value.nombreAdministradorDelegado,
      celularAdministradorDelegado: unidadEditForm.value.celularAdministradorDelegado,
      perfilesContratados: unidadEditForm.value.perfilesContratados,
      numeroOperarios: unidadEditForm.value.numeroOperarios,
      horarios: unidadEditForm.value.horarios,
      jornada: unidadEditForm.value.jornada,
      fechaInicio: unidadEditForm.value.fechaInicio,
      fechaTerminacion: unidadEditForm.value.fechaTerminacion,
      correoCartas: unidadEditForm.value.correoCartas,
      correoFacturacion: unidadEditForm.value.correoFacturacion,
      valoresAgregados: unidadEditForm.value.valoresAgregados,
      frecuenciaSupervision: unidadEditForm.value.frecuenciaSupervision,
      valorContratoConIva: unidadEditForm.value.valorContratoConIva,
      observacionesContrato: unidadEditForm.value.observacionesContrato
    })
    showEditUnidadModal.value = false
    await adminStore.loadUnidades()
    alert('Unidad actualizada exitosamente')
  } catch (error) {
    alert('Error al actualizar unidad: ' + error.message)
  }
}

const toggleEstadoUnidad = async (unidad) => {
  if (!confirm(`¿Estás seguro de ${unidad.isActive ? 'deshabilitar' : 'habilitar'} la unidad "${unidad.nombre}"?`)) {
    return
  }
  
  try {
    await adminStore.actualizarEstadoUnidad(unidad._id, !unidad.isActive)
    // Recargar unidades para reflejar el cambio
    await adminStore.loadUnidades()
    alert(`Unidad ${!unidad.isActive ? 'habilitada' : 'deshabilitada'} exitosamente`)
  } catch (error) {
    alert('Error al actualizar estado de unidad: ' + error.message)
  }
}

const editarBitacora = (bitacora) => {
  // Formatear fecha para el input datetime-local
  const fecha = bitacora.fecha ? new Date(bitacora.fecha).toISOString().slice(0, 16) : ''
  
  bitacoraEditForm.value = {
    _id: bitacora._id,
    unidadResidencialId: bitacora.unidadResidencialId,
    supervisorEmail: bitacora.supervisorEmail || bitacora.supervisor,
    fecha: fecha,
    observaciones: bitacora.observaciones || ''
  }
  showEditBitacoraModal.value = true
}

const handleActualizarBitacora = async () => {
  try {
    await adminStore.actualizarBitacora(bitacoraEditForm.value._id, {
      unidadResidencialId: bitacoraEditForm.value.unidadResidencialId,
      supervisorEmail: bitacoraEditForm.value.supervisorEmail,
      fecha: bitacoraEditForm.value.fecha,
      observaciones: bitacoraEditForm.value.observaciones
    })
    // Cerrar el modal primero
    showEditBitacoraModal.value = false
    // Recargar bitácoras para reflejar los cambios
    await adminStore.loadBitacoras(filters.value)
    alert('Bitácora reprogramada exitosamente')
  } catch (error) {
    alert('Error al actualizar bitácora: ' + error.message)
  }
}

const eliminarBitacoraConfirm = async (bitacora) => {
  if (!confirm(`¿Estás seguro de eliminar la bitácora programada para el ${formatDate(bitacora.fecha)}? Esta acción no se puede deshacer.`)) {
    return
  }
  
  try {
    await adminStore.eliminarBitacora(bitacora._id)
    alert('Bitácora eliminada exitosamente')
  } catch (error) {
    alert('Error al eliminar bitácora: ' + error.message)
  }
}

const crearBitacoraUnidad = (unidad) => {
  bitacoraForm.value.unidadResidencialId = unidad._id
  bitacoraForm.value.supervisorEmail = ''
  bitacoraForm.value.fecha = ''
  bitacoraForm.value.observaciones = ''
  showBitacoraModal.value = true
}

const isCreatingBitacora = ref(false)

const handleCrearBitacora = async () => {
  if (isCreatingBitacora.value) return // Prevenir múltiples clics
  
  try {
    isCreatingBitacora.value = true
    
    // Validar y convertir fecha
    if (!bitacoraForm.value.fecha) {
      alert('Por favor, selecciona una fecha')
      return
    }
    
    // El input datetime-local devuelve un string en formato "YYYY-MM-DDTHH:mm"
    // Necesitamos convertirlo a ISO string pero preservando la fecha/hora seleccionada
    const fechaLocal = new Date(bitacoraForm.value.fecha)
    
    // Verificar que la fecha sea válida
    if (isNaN(fechaLocal.getTime())) {
      alert('Fecha inválida. Por favor, selecciona una fecha válida')
      return
    }
    
    console.log('🔍 Fecha seleccionada (local):', bitacoraForm.value.fecha)
    console.log('🔍 Fecha convertida a Date:', fechaLocal)
    console.log('🔍 Fecha en ISO string:', fechaLocal.toISOString())
    
    // Convertir fecha a ISO string para enviar al backend
    const fechaISO = fechaLocal.toISOString()
    
    await adminStore.crearBitacora({
      ...bitacoraForm.value,
      fecha: fechaISO
    })
    
    showBitacoraModal.value = false
    bitacoraForm.value = {
      unidadResidencialId: '',
      supervisorEmail: '',
      fecha: '',
      observaciones: ''
    }
    alert('Visita programada exitosamente')
  } catch (error) {
    alert('Error al programar visita: ' + error.message)
  } finally {
    isCreatingBitacora.value = false
  }
}

const verBitacorasSupervisor = async (supervisorEmail) => {
  try {
    console.log('🔍 Ver bitácoras del supervisor:', supervisorEmail)
    
    // Primero intentar usar el endpoint específico para supervisor
    try {
      const bitacoras = await adminStore.getBitacorasBySupervisor(supervisorEmail)
      console.log('✅ Bitácoras obtenidas del endpoint específico:', bitacoras?.length || 0)
      
      // Guardar las bitácoras directamente en el store
      adminStore.bitacoras = bitacoras || []
      
      // Establecer filtros y cambiar de tab
      filters.value.supervisorEmail = supervisorEmail
      activeTab.value = 'bitacoras'
    } catch (specificError) {
      console.warn('⚠️ Error con endpoint específico, usando loadBitacoras:', specificError)
      // Si falla el endpoint específico, usar loadBitacoras con filtro
      filters.value.supervisorEmail = supervisorEmail
      activeTab.value = 'bitacoras'
      await adminStore.loadBitacoras(filters.value)
    }
  } catch (error) {
    console.error('❌ Error cargando bitácoras del supervisor:', error)
    const errorMessage = error.message || 'Error desconocido'
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      alert('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté disponible.')
    } else {
      alert('Error cargando bitácoras: ' + errorMessage)
    }
  }
}

const verBitacorasUnidad = async (unidadId) => {
  try {
    filters.value.unidadResidencialId = unidadId
    activeTab.value = 'bitacoras'
    await adminStore.loadBitacoras(filters.value)
  } catch (error) {
    console.error('❌ Error cargando bitácoras de la unidad:', error)
    const errorMessage = error.message || 'Error desconocido'
    if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
      alert('Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet y que el servidor esté disponible.')
    } else {
      alert('Error cargando bitácoras: ' + errorMessage)
    }
  }
}

const verDetalleBitacora = async (bitacoraId) => {
  try {
    const bitacora = await adminStore.getBitacoraById(bitacoraId)
    console.log('🔍 Bitácora recibida del backend:', bitacora)
    console.log('🔍 Evidencias recibidas (raw):', bitacora.evidencias)
    console.log('🔍 Tipo de evidencias:', typeof bitacora.evidencias)
    console.log('🔍 Es Map?:', bitacora.evidencias instanceof Map)
    
    // Función auxiliar para convertir fechas (igual que en el store de bitacoras)
    const safeDate = (dateValue) => {
      if (!dateValue) return null
      // Si ya es un Date, verificar que sea válido
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue
      }
      // Si es un objeto con $date (formato MongoDB)
      if (typeof dateValue === 'object' && dateValue !== null && dateValue.$date) {
        const dateObj = new Date(dateValue.$date)
        return isNaN(dateObj.getTime()) ? null : dateObj
      }
      // Si es un string, intentar parsearlo
      if (typeof dateValue === 'string') {
        const dateObj = new Date(dateValue)
        return isNaN(dateObj.getTime()) ? null : dateObj
      }
      // Intentar convertir directamente
      try {
        const dateObj = new Date(dateValue)
        return isNaN(dateObj.getTime()) ? null : dateObj
      } catch (e) {
        return null
      }
    }
    
    // EXTRAER FECHAS ANTES de convertir Maps (para preservar formato MongoDB)
    const fechaOriginal = bitacora.fecha
    const fechaProgramadaOriginal = bitacora.fechaProgramada
    const fechaInicioOriginal = bitacora.fechaInicio
    const fechaFinOriginal = bitacora.fechaFin
    const createdAtOriginal = bitacora.createdAt
    const updatedAtOriginal = bitacora.updatedAt
    
    console.log('🔍 Fechas ORIGINALES (antes de convertir):', {
      fecha: fechaOriginal,
      fechaProgramada: fechaProgramadaOriginal,
      fechaInicio: fechaInicioOriginal,
      fechaFin: fechaFinOriginal,
      createdAt: createdAtOriginal,
      updatedAt: updatedAtOriginal
    })
    
    // Convertir Maps de Mongoose a objetos normales (para evidencias, areas, etc.)
    const bitacoraConvertida = convertMapsToObjects(bitacora)
    
    // Asignar el objeto convertido y luego sobrescribir las fechas con las convertidas
    bitacoraDetalle.value = bitacoraConvertida
    
    // Convertir fechas usando safeDate con los valores ORIGINALES (antes de convertMapsToObjects)
    const fechaConvertida = safeDate(fechaOriginal)
    const fechaProgramadaConvertida = safeDate(fechaProgramadaOriginal) || fechaConvertida
    const fechaInicioConvertida = safeDate(fechaInicioOriginal)
    const fechaFinConvertida = safeDate(fechaFinOriginal)
    const createdAtConvertida = safeDate(createdAtOriginal)
    const updatedAtConvertida = safeDate(updatedAtOriginal)
    
    console.log('🔍 Fechas CONVERTIDAS:', {
      fecha: fechaConvertida,
      fechaProgramada: fechaProgramadaConvertida,
      fechaInicio: fechaInicioConvertida,
      fechaFin: fechaFinConvertida,
      createdAt: createdAtConvertida,
      updatedAt: updatedAtConvertida
    })
    
    // Asignar fechas convertidas
    bitacoraDetalle.value.fecha = fechaConvertida
    bitacoraDetalle.value.fechaProgramada = fechaProgramadaConvertida
    bitacoraDetalle.value.fechaInicio = fechaInicioConvertida
    bitacoraDetalle.value.fechaFin = fechaFinConvertida
    bitacoraDetalle.value.createdAt = createdAtConvertida
    bitacoraDetalle.value.updatedAt = updatedAtConvertida
    
    
    console.log('🔍 Bitácora después de convertir Maps:', bitacoraDetalle.value)
    console.log('🔍 Fecha convertida:', bitacoraDetalle.value.fecha)
    console.log('🔍 Evidencias después de convertir:', bitacoraDetalle.value.evidencias)
    
    // Log detallado de la estructura de evidencias
    if (bitacoraDetalle.value.evidencias) {
      console.log('🔍 Estructura de evidencias:')
      Object.entries(bitacoraDetalle.value.evidencias).forEach(([areaKey, areaEvidencias]) => {
        console.log(`  Área: ${areaKey}`)
        if (areaEvidencias && typeof areaEvidencias === 'object') {
          Object.entries(areaEvidencias).forEach(([itemName, evidencia]) => {
            console.log(`    Item: ${itemName}`)
            console.log(`      Tipo: ${typeof evidencia}`)
            if (typeof evidencia === 'object' && evidencia !== null) {
              console.log(`      Keys: ${Object.keys(evidencia).join(', ')}`)
              console.log(`      Tiene URL: ${!!evidencia.url}`)
              console.log(`      Tiene image: ${!!evidencia.image}`)
              console.log(`      Tiene base64: ${!!evidencia.base64}`)
              if (evidencia.url) {
                console.log(`      URL: ${evidencia.url.substring(0, 80)}...`)
              }
            } else if (typeof evidencia === 'string') {
              console.log(`      String preview: ${evidencia.substring(0, 50)}...`)
            }
          })
        }
      })
    } else {
      console.warn('⚠️ No hay evidencias en bitacoraDetalle')
    }
    
    showDetalleModal.value = true
  } catch (error) {
    alert('Error cargando detalle: ' + error.message)
  }
}

const descargarPdfBitacora = (bitacora) => {
  if (!bitacora || !bitacora._id) return
  const routeLocation = router.resolve({
    name: 'bitacora',
    params: { id: bitacora._id },
    query: { autoDownloadPdf: '1', fromAdmin: '1' }
  })
  window.open(routeLocation.href, '_blank')
}

const handleFechaDesdeChange = () => {
  // Si se selecciona fechaDesde pero no fechaHasta, usar la misma fecha
  if (filters.value.fechaDesde && !filters.value.fechaHasta) {
    filters.value.fechaHasta = filters.value.fechaDesde
  }
  applyFilters()
}

const applyFilters = () => {
  // Asegurar que si hay fechaDesde pero no fechaHasta, usar la misma fecha
  const filtersToSend = { ...filters.value }
  if (filtersToSend.fechaDesde && !filtersToSend.fechaHasta) {
    filtersToSend.fechaHasta = filtersToSend.fechaDesde
  }
  adminStore.loadBitacoras(filtersToSend)
}

const clearFilters = () => {
  filters.value = {
    unidadResidencialId: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: ''
  }
  adminStore.loadBitacoras()
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    }
    // Intentar convertir directamente
    const dateObj = new Date(date)
    if (!isNaN(dateObj.getTime())) {
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
  
  console.warn('⚠️ Formato de fecha no reconocido:', date, typeof date)
  return 'Fecha inválida'
}

const formatDatePropuesta = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusText = (estado) => {
  const statusMap = {
    programada: 'Programada',
    en_progreso: 'En Progreso',
    completada: 'Completada',
    con_novedad: 'Completada con novedad',
    cancelada: 'Cancelada'
  }
  return statusMap[estado] || estado
}

const getUnidadBitacorasInfo = (unidadId) => {
  if (!unidadId || !adminStore.bitacoras || adminStore.bitacoras.length === 0) {
    return {
      programadaHoy: null,
      ultimaCompletada: null
    }
  }
  
  const bitacorasUnidad = adminStore.bitacoras.filter(b => b.unidadResidencialId === unidadId)
  
  if (bitacorasUnidad.length === 0) {
    return {
      programadaHoy: null,
      ultimaCompletada: null
    }
  }
  
  // Siguiente bitácora programada (la más próxima en el futuro)
  const ahora = new Date()
  const programadas = bitacorasUnidad
    .filter(b => b.estado === 'programada')
    .sort((a, b) => {
      const fechaA = new Date(a.fecha)
      const fechaB = new Date(b.fecha)
      return fechaA - fechaB
    })
  const siguienteProgramada = programadas.find(b => {
    const fechaBitacora = new Date(b.fecha)
    return fechaBitacora >= ahora
  }) || (programadas.length > 0 ? programadas[0] : null)
  
  // Última bitácora completada o con novedad
  const completadas = bitacorasUnidad
    .filter(b => b.estado === 'completada' || b.estado === 'con_novedad')
    .sort((a, b) => {
      const fechaA = new Date(a.fechaFin || a.fecha)
      const fechaB = new Date(b.fechaFin || b.fecha)
      return fechaB - fechaA
    })
  
  return {
    siguienteProgramada: siguienteProgramada || null,
    ultimaCompletada: completadas.length > 0 ? completadas[0] : null
  }
}

const getEvidenciaSrc = (evidencia) => {
  if (!evidencia) {
    return ''
  }
  
  // Si es un objeto con url (Dropbox), base64 o image
  if (typeof evidencia === 'object' && evidencia !== null) {
    const foto0 = Array.isArray(evidencia.fotos) ? evidencia.fotos[0] : evidencia
    // Prioridad: url (Dropbox) > image (base64) > base64
    if (foto0.url && typeof foto0.url === 'string' && foto0.url.length > 0) {
      // Si es una URL de Dropbox, devolverla directamente
      return foto0.url
    }
    const imageData = foto0.image || foto0.base64
    if (imageData && typeof imageData === 'string' && imageData.length > 0) {
      return imageData
    }
    return ''
  }
  
  // Si es un string, verificar si es URL o base64
  if (typeof evidencia === 'string' && evidencia.length > 0) {
    // Si es una URL (http/https), devolverla directamente
    if (evidencia.startsWith('http://') || evidencia.startsWith('https://')) {
      return evidencia
    }
    // Si es base64, devolverlo directamente
    if (evidencia.startsWith('data:image')) {
      return evidencia
    }
  }
  
  return ''
}

const getEvidenciaGeolocation = (evidencia) => {
  if (!evidencia || typeof evidencia !== 'object') return null
  const foto0 = Array.isArray(evidencia.fotos) ? evidencia.fotos[0] : evidencia
  const geolocation = foto0.geolocation
  if (geolocation && geolocation.latitude && geolocation.longitude) {
    return `${geolocation.latitude.toFixed(6)}, ${geolocation.longitude.toFixed(6)}`
  }
  return null
}

// Función auxiliar para verificar si existe evidencia
const hasEvidencia = (bitacoraDetalle, areaKey, itemName) => {
  if (!bitacoraDetalle || !bitacoraDetalle.evidencias) {
    return false
  }
  if (!bitacoraDetalle.evidencias[areaKey]) {
    return false
  }
  const evidencia = bitacoraDetalle.evidencias[areaKey][itemName]
  
  // Si es null, undefined o string vacío, no hay evidencia
  if (evidencia === null || evidencia === undefined || evidencia === '') return false
  
  // Si es un objeto, debe tener url, image o base64 válidos
  if (typeof evidencia === 'object') {
    const foto0 = Array.isArray(evidencia.fotos) ? evidencia.fotos[0] : evidencia
    const hasUrl = foto0.url && typeof foto0.url === 'string' && foto0.url.length > 0
    const hasImage = foto0.image && typeof foto0.image === 'string' && foto0.image.length > 0
    const hasBase64 = foto0.base64 && typeof foto0.base64 === 'string' && foto0.base64.length > 0
    return !!(hasUrl || hasImage || hasBase64)
  }
  
  // Si es un string, debe tener contenido y ser una URL válida o base64
  if (typeof evidencia === 'string') {
    const isUrl = evidencia.startsWith('http://') || evidencia.startsWith('https://')
    const isBase64 = evidencia.startsWith('data:image')
    return evidencia.length > 0 && (isUrl || isBase64)
  }
  
  return false
}

// Función auxiliar para obtener los datos de evidencia
const getEvidenciaData = (bitacoraDetalle, areaKey, itemName) => {
  if (!bitacoraDetalle || !bitacoraDetalle.evidencias) {
    console.log('🔍 getEvidenciaData: No hay bitacoraDetalle o evidencias')
    return null
  }
  if (!bitacoraDetalle.evidencias[areaKey]) {
    console.log('🔍 getEvidenciaData: No hay evidencias para área:', areaKey, 'Áreas disponibles:', Object.keys(bitacoraDetalle.evidencias))
    return null
  }
  const evidencia = bitacoraDetalle.evidencias[areaKey][itemName]
  console.log('🔍 getEvidenciaData:', {
    areaKey,
    itemName,
    itemsDisponibles: Object.keys(bitacoraDetalle.evidencias[areaKey]),
    evidencia: evidencia ? (typeof evidencia === 'object' ? { hasUrl: !!evidencia.url, keys: Object.keys(evidencia) } : 'string') : 'null'
  })
  return evidencia || null
}

const getAreaName = (areaKey) => {
  const areaNames = {
    piscinas: 'PISCINAS',
    zonas_comunes: 'ZONAS COMUNES',
    zonas_externas: 'ZONAS EXTERNAS',
    oficinas: 'OFICINAS',
    operario: 'OPERARIO'
  }
  return areaNames[areaKey] || areaKey.toUpperCase()
}

// Función para convertir Maps de Mongoose a objetos normales
const convertMapsToObjects = (data) => {
  if (!data) return data
  
  const convert = (obj) => {
    if (obj === null || obj === undefined) return obj
    
    // PRESERVAR fechas de MongoDB con formato {"$date": "..."}
    // Esto debe ir ANTES de cualquier otra conversión
    if (typeof obj === 'object' && obj !== null && obj.$date !== undefined) {
      // Es una fecha de MongoDB, preservarla tal cual
      return { $date: obj.$date }
    }
    
    // Si es un Map (de Mongoose o JavaScript nativo)
    if (obj instanceof Map || (obj.constructor && obj.constructor.name === 'Map')) {
      const result = {}
      for (const [key, value] of obj.entries()) {
        result[key] = convert(value)
      }
      return result
    }
    
    // Si tiene método toObject (Mongoose document)
    if (typeof obj.toObject === 'function') {
      return convert(obj.toObject())
    }
    
    // Si es un array, convertir cada elemento
    if (Array.isArray(obj)) {
      return obj.map(item => convert(item))
    }
    
    // Si es un objeto normal, convertir cada propiedad
    if (typeof obj === 'object') {
      const result = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = convert(obj[key])
        }
      }
      return result
    }
    
    // Valor primitivo, devolverlo tal cual
    return obj
  }
  
  return convert(data)
}

const logout = () => {
  authStore.logout()
  router.push('/auth')
}
</script>

<style scoped>
/* Dashboard optimizado para pantallas grandes de escritorio */
.admin-dashboard-container {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  max-width: 100%;
  margin: 0;
}

/* Sidebar */
.admin-sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  color: #6b7280;
  transition: all 0.2s ease;
  text-align: left;
  margin-bottom: 4px;
}

.nav-item i {
  font-size: 20px;
  width: 24px;
  text-align: center;
}

.nav-item:hover {
  background: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.sidebar-footer .user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
}

.user-details {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.user-details .user-name {
  font-weight: 600;
  color: #111827;
  font-size: 14px;
  line-height: 1.4;
}

.user-role {
  font-size: 12px;
  color: #6b7280;
}

.sidebar-footer .logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s;
}

.sidebar-footer .logout-btn:hover {
  background: #dc2626;
}

/* Main Content */
.admin-main {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
  background: #f3f4f6;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.logo-icon {
  font-size: 28px;
  color: #8b5cf6;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.company-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  color: #4b5563;
  font-weight: 500;
  font-size: 13px;
}

.tab-content {
  background: transparent;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
  border: none;
  min-height: auto;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.header-title-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.content-header h2 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.header-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  font-weight: 400;
}

.filters-section-wrapper {
  margin-bottom: 32px;
}

.filters-title {
  margin: 0 0 16px 0;
  color: #374151;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.filters-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: end;
  background: #f9fafb;
  padding: 24px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 600;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-group select,
.filter-group input {
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
  background: #ffffff;
  transition: all 0.2s;
}

.filter-group select:focus,
.filter-group input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.cards-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #ffffff;
  border-radius: 8px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  border-left: 4px solid #8b5cf6;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.card:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  border-left-color: #7c3aed;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.card-header h3 {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.unidad-card .card-header {
  background: #f5f3ff;
  border-radius: 8px;
  padding: 10px 14px;
  margin: -6px -10px 8px -10px;
}

.card-body {
  flex: 1;
  min-width: 0;
}

.card-body-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.card-body-row p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #4b5563;
  white-space: nowrap;
}

.info-item-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 14px;
  color: #4b5563;
}

.info-item-inline i {
  color: #8b5cf6;
  font-size: 16px;
}

.badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge-editor {
  background: #dbeafe;
  color: #1e40af;
}

.badge-admin {
  background: #fee2e2;
  color: #991b1b;
}

.badge-viewer {
  background: #f3f4f6;
  color: #4b5563;
}

.badge-tipo {
  background: #e0e7ff;
  color: #3730a3;
}

.badge-programada {
  background: #fef3c7;
  color: #92400e;
}

.badge-en_progreso {
  background: #dbeafe;
  color: #1e40af;
}

.badge-completada {
  background: #d1fae5;
  color: #065f46;
}

.badge-con_novedad {
  background: #fce7f3;
  color: #831843;
}

.badge-cancelada {
  background: #fee2e2;
  color: #991b1b;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 2;
  min-width: 0;
}

.card-body p {
  margin: 0;
  color: #4b5563;
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  gap: 8px;
}

.card-body p strong {
  color: #374151;
  min-width: 100px;
}

.card-footer {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.modal-content.large {
  max-width: 980px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-body {
  padding: 30px;
}

.unidad-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
}

.unidad-form-grid .form-group {
  margin-bottom: 0;
}

.unidad-form-grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.unidad-detalle-grid .form-group label {
  background: #f5f3ff;
  border-radius: 6px;
  padding: 6px 10px;
}

.unidad-detalle-grid .form-group p {
  margin-top: 4px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-help-text {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.form-help-text i {
  font-size: 14px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #9ca3af;
}

.btn-primary:disabled:hover {
  background: #9ca3af;
  transform: none;
}

.unidad-card {
  display: grid;
  grid-template-columns: minmax(0, 2.5fr) auto;
  grid-template-rows: auto auto;
  column-gap: 32px;
  row-gap: 12px;
  align-items: flex-start;
}

.unidad-card .card-header {
  grid-column: 1 / 3;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.unidad-card .card-body {
  grid-column: 1 / 2;
}

.unidad-card .card-footer {
  grid-column: 2 / 3;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.unidad-card .card-body-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 24px;
  row-gap: 4px;
}

.unidad-card .card-body-row p {
  white-space: normal;
}

.unidad-card .card-footer .btn-primary,
.unidad-card .card-footer .btn-secondary {
  width: 180px;
  flex: 0 0 auto;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 20px 30px;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 60px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #8b5cf6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
  display: block;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.detail-section {
  margin-bottom: 25px;
  padding-bottom: 25px;
  border-bottom: 1px solid #e5e7eb;
}

.detail-section:last-child {
  border-bottom: none;
}

.detail-section h4 {
  margin: 0 0 15px 0;
  color: #8b5cf6;
  font-size: 18px;
}

.detail-section p {
  margin: 10px 0;
  color: #4b5563;
}

.unidad-bitacoras-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.unidad-bitacoras-info .info-item {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4b5563;
}

.unidad-bitacoras-info .info-item i {
  color: #8b5cf6;
  font-size: 16px;
}

.area-detail {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #8b5cf6;
}

.area-detail h5 {
  margin: 0 0 12px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-detail {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.item-comentario {
  margin-top: 8px;
  padding: 8px;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 13px;
  color: #92400e;
}

.item-evidencia {
  margin-top: 8px;
}

.evidencia-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.badge-calificacion-E {
  background: #10b981;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-calificacion-B {
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.badge-calificacion-R {
  background: #f59e0b;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.info-message {
  padding: 16px;
  background: #eff6ff;
  border-radius: 6px;
  color: #1e40af;
  text-align: center;
  font-style: italic;
}

.card-disabled {
  opacity: 0.6;
  border-left-color: #9ca3af;
}

.card-header-badges {
  display: flex;
  gap: 8px;
  align-items: center;
}

.badge-disabled {
  background: #fee2e2;
  color: #991b1b;
}

.btn-disable {
  background: #fee2e2;
  color: #991b1b;
}

.btn-disable:hover {
  background: #fecaca;
}

.btn-enable {
  background: #d1fae5;
  color: #065f46;
}

.btn-enable:hover {
  background: #a7f3d0;
}

/* Estilos para Propuestas */
.propuesta-card {
  border-left: 4px solid #667eea;
}

.propuesta-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-row strong {
  color: #374151;
  font-size: 13px;
}

.info-row span, .info-row p {
  color: #6b7280;
  font-size: 14px;
}

.propuesta-texto {
  margin: 0;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  line-height: 1.6;
}

.whatsapp-link {
  color: #25d366;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.whatsapp-link:hover {
  text-decoration: underline;
}

.btn-whatsapp {
  background: #25d366;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-whatsapp:hover {
  background: #20ba5a;
}

.btn-success {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #dc2626;
}

.footer-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.propuesta-meta {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9ca3af;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.respuesta-admin {
  margin-top: 12px;
  padding: 12px;
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
  border-radius: 6px;
}

.respuesta-admin strong {
  color: #1e40af;
  font-size: 13px;
}

.respuesta-admin p {
  margin: 4px 0 0 0;
  color: #1e3a8a;
  font-size: 14px;
}

.badge-pendiente {
  background: #fef3c7;
  color: #92400e;
}

.badge-aceptada {
  background: #d1fae5;
  color: #065f46;
}

.badge-rechazada {
  background: #fee2e2;
  color: #991b1b;
}

.badge-completada {
  background: #dbeafe;
  color: #1e40af;
}

.convenciones-grid {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.convencion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.evidencia-geolocation {
  margin-top: 8px;
  padding: 8px;
  background: #eff6ff;
  border-radius: 4px;
  font-size: 12px;
  color: #1e40af;
  display: flex;
  align-items: center;
  gap: 6px;
}

.comentario-global-admin {
  margin-top: 16px;
  padding: 16px;
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
}

.comentario-global-text {
  display: block;
  margin-top: 8px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  color: #4b5563;
  line-height: 1.6;
  white-space: pre-wrap;
}

.comentario-global-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 4px 10px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Dashboard optimizado SOLO para pantallas grandes de escritorio */
/* Mínimo recomendado: 1280px de ancho */

/* Ajustes para pantallas muy grandes (4K) */
@media (min-width: 1920px) {
  .admin-main {
    padding: 40px;
  }
}

/* Ajustes para pantallas grandes estándar */
@media (min-width: 1440px) and (max-width: 1919px) {
  .admin-main {
    padding: 32px;
  }
}

/* Aviso para pantallas medianas/pequeñas */
@media (max-width: 1279px) {
  .admin-dashboard-container::before {
    content: '⚠️ Este panel está optimizado para pantallas grandes de escritorio (mínimo 1280px). Para una mejor experiencia, usa una computadora con pantalla grande.';
    display: block;
    background: #fef3c7;
    color: #92400e;
    padding: 16px 24px;
    border-bottom: 2px solid #fcd34d;
    font-weight: 600;
    text-align: center;
    font-size: 14px;
    line-height: 1.5;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .admin-sidebar {
    width: 240px;
  }

  .admin-main {
    padding: 24px;
  }

  .content-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .filters-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .card {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-footer {
    width: 100%;
    margin-top: 16px;
  }
}

.empty-state {
  text-align: center;
  padding: 80px 40px;
  background: #f9fafb;
  border-radius: 10px;
  border: 2px dashed #d1d5db;
}

.empty-state i {
  font-size: 64px;
  color: #9ca3af;
  margin-bottom: 20px;
  display: block;
}

.empty-state h3 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 20px;
  font-weight: 600;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
  font-size: 14px;
}

.empty-state .btn-primary,
.empty-state .btn-secondary {
  display: inline-flex;
  width: auto;
  padding: 12px 24px;
}
</style>


<template>
  <v-container>
    <v-toolbar flat>
      <v-toolbar-title>Auditoría de pacientes</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-dialog v-model="dialogCrearAuditoria" max-width="800px">
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            color="primary"
            @click="abrirModalCrearAuditoria()"
            dark
            class="mb-2"
            v-bind="attrs"
            v-on="on"
          >
            Crear Auditoría de paciente
          </v-btn>
        </template>
        <v-card>
          <v-card-title>
            <span class="headline">Crear Auditoría</span>
          </v-card-title>
          <v-card-text>
            <v-form>
              <!-- Datos de Ingreso -->
              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field label="Número Documento"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-autocomplete label="Tipo documento"></v-autocomplete>
                </v-col>
              </v-row>
              <!-- Datos del Paciente -->
              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field label="Nombres y apellidos"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Sexo"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Edad"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Municipio residencia afiliado"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Pertenece a la cohorte"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="IPS asignada"></v-text-field>
                </v-col>
              </v-row>
              <!-- Diagnóstico -->
              <v-row>
                <v-col cols="12" md="3">
                  <v-text-field label="Nombre auditor seguimiento"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Diagnostico hospitalizacion"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Diagnóstico relacionado a riesgo cardiovascular"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Diagnostico secundario"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Tipo ingreso"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="IPS remisión/rescate"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Inoportunidad rescate"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Motivo inoportunidad rescate"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Reingreso hospitalización &lt; a 15 días"></v-text-field>
                </v-col>
                <v-col cols="12" md="3">
                  <v-text-field label="Gestion de auditoria"></v-text-field>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="dialogCrearAuditoria = false">Cancelar</v-btn>
            <v-btn color="blue darken-1" text @click="submitForm">Guardar</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-toolbar>

    <!-- Tabla de Auditoría de pacientes -->
    <v-data-table
      :headers="headers"
      :items="auditoriaPacientes"
      item-value="name"
      class="elevation-1"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn color="green" text @click="abrirModalCrearObservacion(item)">Agregar Observación</v-btn>
        <v-btn color="blue" text @click="abrirModalVerObservaciones()">Ver Observaciones</v-btn>
        <v-btn color="red" text @click="abrirModalCerrarAuditoria(item)">Cerrar Auditoría</v-btn>
      </template>
    </v-data-table>

    <!-- Modal para mostrar observaciones -->
    <v-dialog v-model="dialogVerObservaciones" max-width="600px">
      <v-card>
        <v-card-title>
          <span class="headline">Observaciones</span>
        </v-card-title>
        <v-card-text>
          <v-simple-table class="elevation-1">
            <thead>
              <tr>
                <th>Archivo Subido</th>
                <th>Observación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(observacion, index) in observaciones" :key="index">
                <td>{{ observacion.archivo }}</td>
                <td>{{ observacion.texto }}</td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogVerObservaciones = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal para cerrar auditoría -->
    <v-dialog v-model="dialogCerrarAuditoria" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Cerrar Auditoría</span>
        </v-card-title>
        <v-card-text>
          <p>¿Está seguro de que desea cerrar la auditoría de este paciente?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogCerrarAuditoria = false">Cancelar</v-btn>
          <v-btn color="red darken-1" text @click="cerrarAuditoria">Cerrar Auditoría</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal para agregar observación -->
    <v-dialog v-model="dialogCrearObservacion" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="headline">Agregar Observación</span>
        </v-card-title>
        <v-card-text>
          <v-form>
            <v-textarea label="Seguimiento a la auditoría" v-model="observacion" required></v-textarea>
            <v-file-input label="Historia clínica" v-model="historiaClinica" required></v-file-input>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogCrearObservacion = false">Cancelar</v-btn>
          <v-btn color="blue darken-1" text @click="guardarObservacion">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      dialogCrearAuditoria: false,
      dialogCrearObservacion: false,
      dialogVerObservaciones: false,
      dialogCerrarAuditoria: false,
      observaciones: [], // Aquí se almacenarán las observaciones y el archivo
      auditoriaPacientes: [],
      observacion: '',
      historiaClinica: null,
      headers: [
        { text: 'Número Documento', value: 'numeroDocumento' },
        { text: 'Tipo Documento', value: 'tipoDocumento' },
        { text: 'Nombres y Apellidos', value: 'nombresApellidos' },
        { text: 'Sexo', value: 'sexo' },
        { text: 'Edad', value: 'edad' },
        { text: 'Municipio Residencia', value: 'municipioResidencia' },
        { text: 'Cohorte', value: 'cohorte' },
        { text: 'IPS Asignada', value: 'ipsAsignada' },
        { text: 'Acciones', value: 'actions', sortable: false },
      ],
    };
  },
  mounted() {
    // Datos de prueba para la tabla
    this.auditoriaPacientes = [
      {
        numeroDocumento: '12345678',
        tipoDocumento: 'CC',
        nombresApellidos: 'Juan Pérez',
        sexo: 'Masculino',
        edad: 45,
        municipioResidencia: 'Bogotá',
        cohorte: 'SI',
        ipsAsignada: 'IPS SaludTotal',
      },
      {
        numeroDocumento: '87654321',
        tipoDocumento: 'CC',
        nombresApellidos: 'María García',
        sexo: 'Femenino',
        edad: 39,
        municipioResidencia: 'Medellín',
        cohorte: 'NO',
        ipsAsignada: 'IPS Sura',
      },
      // Agrega más registros de prueba según sea necesario
    ];
  },
  methods: {
    abrirModalCrearAuditoria() {
      this.dialogCrearAuditoria = true;
    },
    abrirModalCrearObservacion(item) {
      this.dialogCrearObservacion = true;
    },
    abrirModalVerObservaciones() {
      // Aquí deberías cargar las observaciones de la auditoría
      this.observaciones = [
        { archivo: 'archivo1.pdf', texto: 'Observación 1' },
        { archivo: 'archivo2.pdf', texto: 'Observación 2' },
        // Agrega más observaciones según sea necesario
      ];
      this.dialogVerObservaciones = true;
    },
    abrirModalCerrarAuditoria(item) {
      this.dialogCerrarAuditoria = true;
    },
    cerrarAuditoria() {
      // Lógica para cerrar auditoría
      this.dialogCerrarAuditoria = false;
      console.log('Cerrar Auditoría');
    },
    guardarObservacion() {
      // Lógica para guardar la observación
      this.dialogCrearObservacion = false;
      console.log('Guardar Observación', this.observacion, this.historiaClinica);
    },
    submitForm() {
      // Lógica para enviar el formulario de creación de auditoría
      this.dialogCrearAuditoria = false;
      console.log('Crear Auditoría');
    },
  },
};
</script>

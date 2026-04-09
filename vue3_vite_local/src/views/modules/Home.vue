<template>
  <v-container fluid v-show="mostrarContenido" style="height: 81vh; margin-top: 20px">
    <v-layout> 
      <v-container fluid>
        <v-card class="pa-4" style="max-height: 100vh; overflow-y: auto; overflow-x: hidden;">

          <div>
            <h3 style="margin-left: 1.2rem;">
              Cargar RIPS según resolución número 3374 de 2000
            </h3>
          </div>
          <div style="margin-left: 1.2rem;">
            • Esta funcionalidad no es un validador en cuanto a la calidad de los datos, valida la estructura de los RIPS en cuanto a cantidad de columnas y caracteres.<br> 
            • La calidad del dato debe ser validada en el momento de la generación del archivo.<br>
            • La carga de los documentos solamente se hace cuando todos los archivos han sido validados en su totalidad de columnas requeridas y la cantidad de caracteres que debe contener cada dato.
          </div>

          <v-row style="padding: 30px">                  
            <v-form :disabled="activeForm" class="full-width" v-model="formValidarCargarRips">
              <div v-if="!activeForm">
                <v-row>
                  <!-- input 1 -->
                  <v-col cols="12" md="3" v-if="userRoles.some(role => role === 'Rips_interno')">
                    <!-- Columna para roles específicos -->
                  </v-col>

                  <!-- input 2 -->
                  <v-col cols="12" md="3">
                    <!-- Otro input -->
                  </v-col> 

                  <!-- input 3 -->
                  <v-col cols="12" md="3">
                    <!-- Otro input -->
                  </v-col>

                  <!-- input para seleccionar carpeta -->
                  <v-col cols="12" md="3">
                    <v-row class="justify-start align-center" style="margin: 0; padding: 0; margin-left: 17px">
                      <v-btn color="primary" @click="triggerFileInput">Seleccionar Carpeta</v-btn>
                      <input
                        type="file"
                        webkitdirectory
                        directory
                        multiple
                        @change="handleDirectoryUpload"
                        ref="fileInput"
                        style="display: none;"
                      />
                    </v-row>
                  </v-col>
                </v-row>

                <!-- Inputs de archivo dinámicos -->
                <div class="d-flex" style="width: 100%; margin-top: 20px">            
                  <div class="file-input-container" style="width: 100%;">
                    <div v-for="(file, index) in selectedRipFiles" :key="index" class="file-input-row" style="margin-top: -20px">
                      <v-row>
                        <v-col cols="8" md="6" class="text-label">
                          <label :for="'file-' + index" style="width: 100%;" class="file-input-label">{{ file.text }}:</label>
                        </v-col>
                        <v-col cols="10" md="4">
                          <v-file-input
                            style="width: 100%;" 
                            v-model="file.uploadedFile"
                            :label="`Cargar archivo para ${file.text}`"
                            outlined
                            dense
                            show-size
                            :id="'file-' + index"
                          />
                        </v-col>
                        <v-col cols="2" md="2" class="text-center d-flex align-center pa-0">
                          <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                              <v-btn icon v-bind="attrs" v-on="on" @click="abrirDocumento(file.text)" class="icon-btn">
                                <v-icon medium color="#0d47a1">visibility</v-icon>
                              </v-btn>
                            </template>
                            <span>Ver documento</span>
                          </v-tooltip>
                          <v-tooltip bottom>
                            <template v-slot:activator="{ on, attrs }">
                              <v-btn icon v-bind="attrs" v-on="on" @click="borrarDocumentoIcono(file.text)" class="icon-btn">
                                <v-icon medium color="error">delete</v-icon>
                              </v-btn>
                            </template>
                            <span>Borrar documento</span>
                          </v-tooltip>
                        </v-col>
                      </v-row>
                    </div>
                  </div>
                </div>

              </div>                                                                                                                   
            </v-form>
          </v-row> 

        </v-card>
      </v-container>
    </v-layout>
  </v-container>
</template>

<script> 
import { mapState } from "vuex";
import store from '../../store';
import { Role } from "../../router/role.js";
import vuetify from '../../plugins/vuetify.js'; // Import the Vuetify plugin

export default {
  name: 'home',
    props: {
        activeForm: Boolean
    },
  data() {
    return {
      mostrarContenido: true,
        formValidarCargarRips: true,
        selectedRipFile: null, // Archivo RIPS seleccionado
        selectedRipFiles: [],  // Lista de archivos RIPS seleccionados
        uploadedFile: null,    // Archivo cargado por el usuario
        ripFiles: [
            { text: 'AF - Archivo de las transacciones', value: 'fileTransaccion' },
            { text: 'US - Archivo de los usuarios de los servicios de salud', value: 'fileUsuario' },
            { text: 'AD - Archivo de descripción agrupada de los servicios de salud prestados', value: 'fileDescripcionAgrupada' },
            { text: 'AC - Archivo de consulta', value: 'fileConsulta' },
            { text: 'AP - Archivo de procedimientos', value: 'fileProdedimientos' },
            { text: 'AH - Archivo de hospitalización', value: 'fileHospitalizacion' },
            { text: 'AU - Archivo de urgencias', value: 'fileUrgencia' },
            { text: 'AN - Archivo de recién nacidos', value: 'fileRecienNacidos' },
            { text: 'AM - Archivo de medicamentos', value: 'fileMedicamentos' },
            { text: 'AT - Archivo de otros servicios', value: 'fileOtrosArchivos' }
        ],
        menuPeriodoCargaVisible: false, // Propiedad booleana para controlar la visibilidad del menú

    };
  },

  methods: {
    
      /**
       * Dispara el evento de clic en el input de archivo.
       * 
       * Este método simula un clic en el input de archivo referenciado, 
       * activando la interfaz para que el usuario seleccione un archivo.
       * Es útil cuando se desea iniciar la carga de archivos mediante 
       * un botón u otro elemento de la interfaz de usuario.
       */
      triggerFileInput() {
          this.$refs.fileInput.click(); // Simula un clic en el input de archivo
      }, 

      /**
       * Maneja la carga de un directorio de archivos, mapea cada archivo a un objeto 
       * con la información relevante y lo almacena en `selectedRipFiles`.
       *
       * @param {Event} event - Evento de cambio disparado por la selección de archivos.
       * @property {FileList} event.target.files - Lista de archivos seleccionados.
       */
      /*handleDirectoryUpload(event) {
          const files = event.target.files;
          const filesArray = Array.from(files);          
          this.selectedRipFiles = filesArray.map(file => {
          const matchingRipFile = this.ripFiles.find(ripFile => file.name.includes(ripFile.text.split(' ')[0]));
          if (matchingRipFile) {
              return {
              text: matchingRipFile.text,
              uploadedFile: file,
              value: matchingRipFile.value,
              };
          }
          return null;
          }).filter(file => file !== null);
      },*/
	  


  handleDirectoryUpload(event) {
    const files = event.target.files;
    const filesArray = Array.from(files); 

    // Procesar cada archivo de manera individual
    this.selectedRipFiles = filesArray.map(file => {
  const matchingRipFile = this.ripFiles.find(ripFile => 
    file.name.includes(ripFile.text.split(' ')[0])
  );

  if (matchingRipFile) {
    try {
      // Determinar qué validación aplicar según el nombre del archivo
      if (file.name.includes('AC')) {
        this.validarInformacionAC(file); // Validar archivo tipo AC
      } else if (file.name.includes('AD')) {
        this.validarInformacionAD(file); // Validar archivo tipo AD
      } else {
        // Si el archivo no tiene un tipo reconocido
        this.$notify({
          title: `Tipo de archivo no reconocido: ${file.name}`,
          type: "warning",
        });
        return null;
      }

      // Si el archivo pasó la validación, agregarlo a selectedRipFiles
      return {
        text: matchingRipFile.text,
        uploadedFile: file,
        value: matchingRipFile.value,
      };
    } catch (error) {
      // Si hay un error en la validación, mostrar una notificación y no agregar el archivo
      this.$notify({
        title: `Error al validar el archivo ${file.name}`,
        message: error.message,
        type: "error",
      });
      return null;
    }
  }
  return null;
}).filter(file => file !== null);  // Filtrar archivos no válidos


    if (this.selectedRipFiles.length > 0) {
      this.$notify({
        title: "Archivos cargados correctamente",
        type: "success",
      });
    } else {
      this.$notify({
        title: "No se cargaron archivos válidos",
        type: "warning",
      });
    }
  },

  validarInformacionAC(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');

      lines.forEach((line, index) => {
        const celda = line.split(',');
        this.validarCamposAC(celda, index + 1, file.name);
      });

      this.$notify({
        title: `Archivo ${file.name} validado correctamente`,
        type: "success",
      });
    };
    reader.readAsText(file);
  },

  validarInformacionAD(file) {
    // Implementa la validación específica para el tipo de archivo AD
  },

  validarCamposAC(celda, count, fileName) {
    const nombresColumnas = [
      "numero factura", "codigo prestador", "tipo de documento", 
      "numero de identificacion", "fecha consulta", "numero de autorizacion", 
      "codigo de consulta", "finalidad consulta", "causa externa", 
      "diagnostico principal", "diagnostico relacionado uno", 
      "diagnostico relacionado dos", "diagnostico relacionado tres", 
      "tipo diagnostico principal"
    ];
    const tamanosMaximos = [20, 10, 2, 20, 10, 15, 8, 2, 2, 4, 4, 4, 4, 1];

    for (let i = 0; i < tamanosMaximos.length; i++) {
      if (celda[i] && celda[i].length > tamanosMaximos[i]) {
        throw new Error(`La columna ${nombresColumnas[i]} en la línea ${count} del archivo ${fileName} excede el tamaño máximo del campo`);
      }
    }

    for (let i = 0; i < celda.length; i++) {
      if ((i !== 5 && i !== 10 && i !== 11 && i !== 12 && i !== 14 && i !== 15) && (!celda[i] || celda[i].trim() === "")) {
        throw new Error(`La columna ${nombresColumnas[i]} en la línea ${count} del archivo ${fileName} no debe estar vacía`);
      }
    }
  },

  // Otros métodos de validación según el tipo de archivo
  // validarInformacionXX(file) { ... }
  


    /**
     * Muestra el documento seleccionado en el modal correspondiente.
     * 
     * @param {string} type - Tipo de documento a mostrar ('text').
     */
     mostrarDocumento(text) {
        this.modalTitulo = `Verifique que el documento esté acorde con la norma.`;

        // Buscar el archivo en selectedRipFiles basado en `text`
        const fileEntry = this.selectedRipFiles.find(file => file.text === text);

        if (fileEntry && fileEntry.uploadedFile) {
            const file = fileEntry.uploadedFile;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.documentoSeleccionado = e.target.result;
                this.componenteDocumento = 'txt';
                this.mostrarModal = true;
            };
            reader.readAsText(file);
        } else {
            this.documentoSeleccionado = 'Archivo no encontrado o no cargado.';
            this.componenteDocumento = '';
            this.mostrarModal = true;
        }
    },

    /**
     * Abre el modal para mostrar el documento correspondiente.
     * 
     * Este método establece la visibilidad del modal y llama a 
     * `mostrarDocumento` con el parámetro proporcionado para 
     * cargar y visualizar el documento.
     * 
     * @param {string} text - El texto que representa el tipo o 
     * identificación del documento a mostrar.
     */
    abrirDocumento(text) {
        this.visibility = true;
        this.mostrarDocumento(text);
    },

    borrarDocumentoIcono(fileName) {
      this.selectedRipFiles = this.selectedRipFiles.filter(file => file.text !== fileName);
    }
  },

  computed: {
    ...mapState({
      userRoles: state => state.auth.roles.map(role => role.name)
    }),
  },

  setup() {
    // ... your setup logic
    return {
      vuetify // Make vuetify available in the template
    };
  },
};
</script>

<style scoped>

  .bg-primary {
      color: #fff;
      border-color: #6e00ff;
      background-color: #6e00ff;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, .15);
  }
  
  .search-input {
      width: 100%;
      border-radius: 20px;
      border: 1px solid #ccc;
      padding: 10px;
      box-sizing: border-box;
  }
  ::v-deep .elevation div table thead tr th {
      background-color: rgb(223, 223, 223) !important;
  }

  ::v-deep .elevation div table thead tr th span {
      font-weight: bold;
      color: black !important;
  }
  .center-icon {
      text-align: center; /* Centrar horizontalmente */
      vertical-align: middle; /* Centrar verticalmente */
  }
  .blueGlobal {
      background-color: blue;
      /* Estilos adicionales para el encabezado */
  }

  /* estilos para el header que contiene input de busqueda y boton de cargar carta de agotado */
  .search-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px;
      background-color: white;
  }

  .centered {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-top: 20px;
  }

  .upload-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 40px;
  }

  .upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  }

  .upload-message {
  margin-bottom: 10px;
  }

  .upload-btn {
  width: 300px;
  background-color: green;

  }

  .divCard{
      margin-top: 5px;
  }

  .container {
  margin-top: -20px; /* Ajusta el valor según tus necesidades */
  overflow-x: hidden;
  }

  .boxPdf {
  overflow: auto;
  height: 100vh;
  }

  .boxPdf>span {
  width: 100%;
  }

  .input-file{
      padding: 21px;
      margin: 20p;
      background: aliceblue;
      margin-top: -22px;
      width: 100%;
  }

  .estado-button {
      cursor: pointer;
      background-color: #caced3;
      color: gray;
      padding: 5px 10px;
      border-radius: 4px;
      font-weight: normal;
      font-size: 11px;
  }

  .estado-button:hover {
  background-color: green;
  color: white
  }

  #period{
      width: 113px;
      padding: 5px;
      border: 1px solid #d6d5e0;
      border-radius: 7px;
      margin-left: 10px;
  }
  #ips_origen_malla{
      width: 113px;
      padding: 5px;
      border: 1px solid #d6d5e0;
      border-radius: 7px;
      margin-left: 10px;
  }

  .file-input-container {
      display: flex;
      flex-direction: column;
  }

  .file-input-row {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
  }

  .file-input-label {
      margin-right: 10px;
      min-width: 150px;
      text-align: right;
  }

  .file-input {
      flex: 1;
  }

  .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      z-index: 9999;
  }

  .loading-container img {
      width: 100px;
      height: 100px;
  }

  .loading-container p {
      font-size: 1.2em;
      margin-top: 10px;
  }
  .full-width {
      width: 100%;
  }
  .text-label{
      background: #eceff1;
      height: 30%;
      margin-top: 12px;
      border-radius: 7px;
      padding: 8px;
      padding-left: 23px;
  }
  .icon-btn {
    margin-top: -26px; /* Ajusta este valor según sea necesario */
  }

</style>
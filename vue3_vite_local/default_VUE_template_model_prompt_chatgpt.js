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
    • Esta funcionalidad no es un validador en cuanto a la calidad de los datos, valída la estructura de los RIPS en cuanto a cantidad de columnas y caractéres.<br> 
    • La calidad del dato debe ser validada en el momento de la generación del archivo.<br>
    • La carga de los documentos solamente se hace cuando todos los archivos han sido validados en su totalidad de columnas requeridas y la cantidad de caracteres que debe contener cada dato
  </div>
          
  <v-row style="padding: 30px">                  
    <v-form :disabled="activeForm" class="full-width" v-model="formValidarCargarRips">
      <div v-if="!activeForm" style="">
        <v-row>
          <!-- input 1 -->
          <v-col cols="12" md="3" v-if="userRoles.some(role => role.name === 'Rips_interno')">
            
          </v-col>
    
          <!-- input 2 -->
          <v-col cols="12" md="3">
            
          </v-col> 
    
          <!-- input 3 -->
          <v-col cols="12" md="3">
            
          </v-col>
          
        </v-row>
    
       
      </div>                                                                                                                   
    </v-form>
  </v-row> 

</v-card>
</v-container>
</v-layout>
</v-container>
</template>

<script> 
  import { mapState } from "vuex"; //  computed: { ...mapState(["auth"]), ...
  import store from '../../store'; // 
  import { Role } from "../../router/role.js";
  
export default {
  name: 'home',
  components: {
      VForm // Register VForm
  },
  props: {
    activeForm: Boolean
  },
  data() {
    return {
      name: 'Documents',
      activeForm: true,
      mostrarContenido: true, // Inicialmente visible
      formValidarCargarRips: true,
    };
  },

  methods: {


  }, 

  mounted() {

  },
  
  computed: {
    ...mapState({
      userRoles: state => state.auth.roles.map(role => role.name)
    }),
  },
  
  created() {
    console.log(this.userRoles); 
    // this.getListaPrestadores();
  }
  
}
</script>
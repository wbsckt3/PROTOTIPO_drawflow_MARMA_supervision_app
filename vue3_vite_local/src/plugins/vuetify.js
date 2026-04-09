import 'vuetify/styles'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { aliases, md } from 'vuetify/iconsets/md'

// Vuetify
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        primary: '#0D47A1',
        secondary: '#0a5cb8',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107'
      },
    },
  },
  icons: {
    iconfont: 'md',
    aliases,
    sets: {
      md,
    },
  },
  // Registrar componentes lab solo si existen en tu versión
  components: {
  },
});


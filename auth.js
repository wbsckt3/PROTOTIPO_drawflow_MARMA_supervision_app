// ========================================
// GOOGLE SIGN-IN AUTHENTICATION
// ========================================

const API_BASE_URL = 'https://www.refactorii.com/api/tenant';

// Función para manejar la respuesta de Google Sign-In
async function handleCredentialResponse(response) {
    try {
        console.log('🔐 Iniciando autenticación con Google...');
        console.log('Respuesta de Google:', response);
        
        // Decodificar el JWT token
        const payload = JSON.parse(atob(response.credential.split('.')[1]));
        console.log('Payload decodificado:', payload);
        
        // Crear objeto de usuario para enviar al backend
        const userData = {
            FullName: payload.name,
            GivenName: payload.given_name,
            FamilyName: payload.family_name,
            ImageURL: payload.picture,
            Email: payload.email
        };
        
        // Enviar datos al backend para autenticación
        const authResponse = await fetch(`${API_BASE_URL}/auth/google-signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        if (!authResponse.ok) {
            throw new Error(`Error de autenticación: ${authResponse.status}`);
        }
        
        const authResult = await authResponse.json();
        console.log('Resultado de autenticación:', authResult);
        
        // Guardar token y datos de usuario
        const tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 horas
        localStorage.setItem('refactorii_token', response.credential);
        localStorage.setItem('token_expiry', tokenExpiry.toString());
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        console.log('✅ Datos guardados en localStorage:');
        console.log('- Token:', response.credential.substring(0, 50) + '...');
        console.log('- Expiry:', new Date(tokenExpiry).toLocaleString());
        console.log('- User:', userData.FullName, userData.Email);
        
        // Ocultar overlay y recargar la página para mostrar el contenido
        const overlay = document.getElementById('auth-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.classList.remove('auth-lock');
        }
        
        // Recargar la página para inicializar con el usuario autenticado
        window.location.reload();
        
    } catch (error) {
        console.error('Error en autenticación:', error);
        alert('Error al autenticarse. Por favor, inténtalo de nuevo.');
    }
}

// Función para validar si el token es válido
function validarToken() {
    const token = localStorage.getItem("refactorii_token");
    const expiry = parseInt(localStorage.getItem("token_expiry") || "0", 10);
    
    console.log('🔍 Validando token...');
    console.log('- Token existe:', !!token);
    console.log('- Expiry:', new Date(expiry).toLocaleString());
    console.log('- Tiempo actual:', new Date().toLocaleString());
    
    // 1. No hay token ? simplemente indicar que NO está autenticado
    if (!token || !expiry) {
        console.log('❌ No hay token o expiry');
        return false;
    }
    
    // 2. Token expirado ? responde silenciosamente para mantener overlay sin spam
    if (Date.now() > expiry) {
        console.warn("⚠️ Token expirado: limpiando credenciales mínimas");
        localStorage.removeItem("refactorii_token");
        localStorage.removeItem("token_expiry");
        return false;
    }
    
    // 3. Token válido
    console.log('✅ Token válido');
    return true;
}

// Función para obtener datos del usuario autenticado
function getCurrentUser() {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('refactorii_token');
    localStorage.removeItem('token_expiry');
    localStorage.removeItem('user_data');
    
    // Mostrar overlay de nuevo
    const overlay = document.getElementById('auth-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        document.body.classList.add('auth-lock');
    }
    
    // Recargar la página
    window.location.reload();
}

// Función para obtener el email del usuario autenticado
function getUserEmail() {
    const user = getCurrentUser();
    return user ? user.Email : null;
}

// Función para cargar las bitácoras del supervisor
async function loadBitacorasSupervisor() {
    const userEmail = getUserEmail();
    if (!userEmail) {
        console.error('No hay usuario autenticado');
        return [];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/bitacoras-supervision`, {
            headers: {
                'x-user-email': userEmail
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const bitacoras = await response.json();
        return bitacoras;
    } catch (error) {
        console.error('Error cargando bitácoras:', error);
        return [];
    }
}

// Exportar funciones y constantes para uso global
window.API_BASE_URL = API_BASE_URL;
window.handleCredentialResponse = handleCredentialResponse;
window.validarToken = validarToken;
window.getCurrentUser = getCurrentUser;
window.logout = logout;
window.getUserEmail = getUserEmail;
window.loadBitacorasSupervisor = loadBitacorasSupervisor;

    // Agregar Google signin desde auth.js > server.js en front:
 
    <style>
		 #auth-overlay {
		  position: fixed;
		  top: 0;
		  left: 0;
		  width: 100%;
		  height: 100%;
		  backdrop-filter: blur(8px);
		  background-color: rgba(0, 0, 0, 0.3);
		  z-index: 9999;
		  display: flex;
		  align-items: center;
		  justify-content: center;
		}

		.auth-content {
		  background: rgba(255, 255, 255, 0.20);
		  padding: 2rem;
		  border-radius: 12px;
		  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
		  text-align: center;
		}

		.auth-container {
			display: flex;
			justify-content: center;
			align-items: center;
			margin-top: 1rem; /* opcional */
		}
		
		.header-istqb {
		  display: flex;
		  align-items: center;
		  background: linear-gradient(90deg, #2f4c6e, #3498db);
		  color: white;
		  padding: 44px 30px;
		  border-radius: 12px;
		  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
		  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		  margin-top: -22px;
		}

		.header-istqb .icon {
		  font-size: 43px;
		  margin-right: 15px;
		}

		.header-istqb h2 {
		  margin: 0;
		  font-size: 34px;
		  font-weight: 700;
		}

		.header-istqb p {
		  margin: 2px 0 0;
		  font-size: 17px;
		  font-weight: 400;
		  opacity: 0.9;
		}
	</style>
 
    <!-- Google Sign-In -->
	<script src="https://accounts.google.com/gsi/client" async defer></script>
	<script src="./auth.js" async defer></script>
	</head>
	<body>

	<!-- Overlay de autenticación -->
	<div id="auth-overlay">
		  <div class="auth-blur"></div>
		  <div class="auth-content">	
			<p style="font-weight: bold; font-size: 22px; width: width: 92%;">
				<div class="header-istqb">
				  <span class="icon">🧪</span>
				  <div class="text-content">
					<h2>Planificador de Automatización ISTQB</h2>
					<p>Generación de planes de prueba automatizados según estándares ISTQB avanzado</p>
				  </div>
				</div>

			</p>
		  <br>
	<div class="auth-container">
		  <div id="g_id_onload"
			   data-client_id="980822676255-vntch0t28qbesul2bp5oc1galtoi8a97.apps.googleusercontent.com"
			   data-callback="handleCredentialResponse"
			   data-context="use"
			   data-ux_mode="popup"
			   data-auto_select="false"
			   data-itp_support="true">
		  </div>
		  <div class="g_id_signin"
			   data-type="standard"
			   data-shape="rectangular"
			   data-theme="outline"
			   data-text="signin_with"
			   data-size="medium"
			   data-logo_alignment="left">
		  </div>
	</div>
	<br>
	<hr/>
		  
	<p style="font-weight: bold; font-size: 20px;">
	🧩 Testea la <strong>homogeneidad</strong>, <strong>consistencia</strong> y <strong>conexión</strong> de toda la arquitectura  
	(front 🖥️ + back ⚙️ + infra ☁️ + DB 🗄️)
	</p>

	<p style="font-weight: bold; font-size: 20px;">
	🔗 Garantiza con <strong>tests E2E</strong> la sincronía perfecta entre capas  
	(UI 🎨 ↔ API 📡 ↔ DB/Infra 🛠️)  
	👉 ¡Sin caer en el <span style="color:red;">DEVOPS Hell 🔥</span>!
	</p>

	<p style="font-weight: bold; font-size: 20px;">
	📬 Genera pruebas directas al back con <strong>Postman/Newman</strong> 📨 o <strong>RestAssured</strong> 🛡️
	</p>

	<p style="font-weight: bold; font-size: 20px;">
	Evalúa sin fricción 🎯 la <strong>unicidad</strong>, el <strong>flujo 🧪 y la integración de </strong> de microservicios y componentes 
	</p>

		
	  </div>
	</div>

    ...
	
	 // ========================================
    // INICIALIZACIÃ“N DE LA APLICACIÃ“N
    // ========================================
    
    function validarToken() {
		const token  = localStorage.getItem("refactorii_token");
		const expiry = parseInt(localStorage.getItem("token_expiry") || "0", 10);
		// 1. No hay token ? simplemente indicar que NO está autenticado
		if (!token || !expiry) {
			return false;
		}
		// 2. Token expirado ? responde silenciosamente para mantener overlay sin spam
		if (Date.now() > expiry) {
			console.warn("Token expirado: limpiando credenciales mínimas");
			localStorage.removeItem("refactorii_token");
			localStorage.removeItem("token_expiry");
			return false;
		}
		// 3. Token válido
		return true;
    }
	 
	document.addEventListener('DOMContentLoaded', async () => {
		const overlay  = document.getElementById('auth-overlay');
		const loggedIn = validarToken();   // true ? token válido; false ? no logueado o expirado
		if (loggedIn) {
			// Oculta overlay y permite scroll
			overlay.style.display = 'none';
			document.body.classList.remove('auth-lock');
		} else {
			// Mantén overlay visible bloqueando clics/scroll
			overlay.style.display = 'flex';
			document.body.classList.add('auth-lock');
		}
		/*  ??  Estos pasos SIEMPRE se ejecutan, tanto logueado como no.
         Eso permite que toda la UI se pinte detrás del overlay. */
		//setTimeout(() => inicializarEditor(), 100);
	}); 
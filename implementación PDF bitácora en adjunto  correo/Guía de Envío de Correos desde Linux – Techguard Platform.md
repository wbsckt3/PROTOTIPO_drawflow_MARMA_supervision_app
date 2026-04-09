## **Envío de correos desde Linux usando `msmtp` \+ `mutt`**

**Proyecto:** Techguard / Bitech  
 **Servidor:** Ubuntu 22  
 **Uso:** Multi-cliente, multi-correo, con adjuntos (PDF)

---

## **🎯 OBJETIVO**

Permitir que la aplicación envíe correos:

* Desde **distintas cuentas de correo (por cliente)**

* Con **adjuntos PDF**

* Sin manejar SMTP desde la aplicación

* Usando herramientas estándar de Linux

---

## **🧱 ARQUITECTURA**

`Aplicación (Node.js u otra)`  
        `↓`  
`Genera archivo (PDF)`  
        `↓`  
`Guarda archivo en /tmp`  
        `↓`  
`Ejecuta comando Linux (mutt)`  
        `↓`  
`msmtp`  
        `↓`  
`SMTP (Gmail / Outlook / etc.)`

---

## **📦 COMPONENTES USADOS**

* `msmtp` → motor SMTP

* `mutt` → construcción correcta de correos con adjuntos

* `/tmp` → carpeta temporal para archivos

* Gmail → proveedor SMTP (por ahora)

---

## **🔐 REQUISITO PREVIO (por cada correo)**

Cada cuenta Gmail debe tener:

1. **Verificación en dos pasos (2FA)** activada

2. **Contraseña de aplicación** generada  
    (NO se usa la contraseña normal)

---

## **📄 1️⃣ Archivo de configuración de correos**

### **`~/.msmtprc`**

📍 Ubicación:

`/home/usuario/.msmtprc`

🔒 Permisos:

`chmod 600 ~/.msmtprc`

---

### **🧩 Estructura GENERAL (multi-cliente)**

`defaults`  
`auth           on`  
`tls            on`  
`tls_trust_file /etc/ssl/certs/ca-certificates.crt`  
`logfile        ~/.msmtp.log`

`# ===== CLIENTE 1 =====`  
`account cliente1_gmail`  
`host smtp.gmail.com`  
`port 587`  
`from cliente1@gmail.com`  
`user cliente1@gmail.com`  
`password APP_PASSWORD_CLIENTE1`

`# ===== CLIENTE 2 =====`  
`account cliente2_gmail`  
`host smtp.gmail.com`  
`port 587`  
`from cliente2@gmail.com`  
`user cliente2@gmail.com`  
`password APP_PASSWORD_CLIENTE2`

`# ===== CLIENTE 3 =====`  
`account cliente3_outlook`  
`host smtp.office365.com`  
`port 587`  
`from cliente3@empresa.com`  
`user cliente3@empresa.com`  
`password APP_PASSWORD_CLIENTE3`

`# Cuenta por defecto (opcional)`  
`account default : cliente1_gmail`

📌 **Cada cliente \= un `account`**

---

## **✏️ 2️⃣ Cómo MODIFICAR o AGREGAR una cuenta de correo**

### **Abrir archivo**

`nano ~/.msmtprc`

### **Agregar nuevo cliente**

Copiar y adaptar:

`account clienteX_gmail`  
`host smtp.gmail.com`  
`port 587`  
`from clienteX@gmail.com`  
`user clienteX@gmail.com`  
`password APP_PASSWORD_CLIENTEX`

Guardar y salir.

---

## **✉️ 3️⃣ Envío de correos DESDE LINUX (manual)**

### **📬 Enviar SIN adjuntos**

`echo "Mensaje de prueba" | \`  
`msmtp -a cliente1_gmail destino@empresa.com`

---

### **📎 Enviar CON adjunto (PDF) – MÉTODO OFICIAL**

👉 **SIEMPRE usar `mutt`**

`echo "Adjunto el documento solicitado." | \`  
`mutt -s "Asunto del correo" \`  
`-a /tmp/reporte.pdf -- \`  
`destino1@empresa.com destino2@gmail.com`

---

### **📌 Forzar remitente (recomendado)**

`echo "Adjunto el documento." | \`  
`mutt -e 'set from=cliente1@gmail.com realname="Techguard Platform"' \`  
`-s "Reporte" \`  
`-a /tmp/reporte.pdf -- \`  
`destino@empresa.com`

---

## **📂 4️⃣ REGLA OBLIGATORIA DE ARCHIVOS**

🚨 **Todos los archivos adjuntos deben crearse en `/tmp`**

### **✔ Correcto**

`/tmp/reporte.pdf`  
`/tmp/factura_123.pdf`

### **❌ Incorrecto**

`/home/usuario/reporte.pdf`  
`/var/data/reporte.pdf`

📌 `/tmp` es:

* temporal

* seguro

* estándar en Linux

* ideal para limpieza automática

---

## **🧹 Limpieza recomendada**

Después del envío:

`rm /tmp/reporte.pdf`

---

## **🟢 5️⃣ Uso desde NODE.JS (forma oficial)**

### **Ejemplo Node.js**

`const { exec } = require("child_process");`

`function enviarCorreo({`  
  `cuenta,`  
  `asunto,`  
  `mensaje,`  
  `archivo,`  
  `destinatarios`  
`}) {`  
  `` const cmd = ` ``  
`echo "${mensaje}" | \`  
`mutt -s "${asunto}" \`  
`-a ${archivo} -- \`  
`${destinatarios.join(" ")}`  
  `` `; ``

  `exec(cmd, (error) => {`  
    `if (error) {`  
      `console.error("Error enviando correo:", error);`  
    `}`  
  `});`  
`}`

---

### **Ejemplo de llamada**

`enviarCorreo({`  
  `cuenta: "cliente1_gmail",`  
  `asunto: "Factura",`  
  `mensaje: "Adjunto su factura.",`  
  `archivo: "/tmp/factura_123.pdf",`  
  `destinatarios: [`  
    `"cliente@empresa.com",`  
    `"contabilidad@empresa.com"`  
  `]`  
`});`

---

## **📊 6️⃣ Logs y diagnóstico**

### **Ver logs de envío**

`cat ~/.msmtp.log`

Errores comunes:

* contraseña incorrecta

* App Password revocada

* cuenta no definida

* 2FA no activo

---

## **🔐 7️⃣ Seguridad (OBLIGATORIO)**

* `.msmtprc` con permisos **600**

* Nunca guardar passwords en código

* Un App Password por cliente

* Revocar passwords cuando un cliente se retira

---

## **🧠 RESUMEN FINAL**

✔ Un archivo `.msmtprc`  
 ✔ Un `account` por cliente  
 ✔ Archivos SIEMPRE en `/tmp`  
 ✔ Envíos con `mutt`  
 ✔ App solo ejecuta comandos  
 ✔ SMTP desacoplado del código


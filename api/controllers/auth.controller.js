// Ajuste de la ruta de importación para GoogleSigninUser
const GoogleSigninUser = require("../models/GoogleSigninUser.js")

// Controlador para manejar el payload de Google Sign-in desde el frontend
const googleSignIn = async (req, res) => {
  try {
    // El frontend enviará el payload decodificado o el credential directamente
    const { FullName, GivenName, FamilyName, ImageURL, Email } = req.body

    if (!Email) {
      return res.status(400).json({ error: "Email no proporcionado en el payload de Google." })
    }

    // Buscar si el usuario ya existe por email
    let user = await GoogleSigninUser.findOne({ Email })

    if (user) {
      // Si el usuario existe, actualizar sus datos (excepto los de registro inicial)
      user.FullName = FullName || user.FullName
      user.GivenName = GivenName || user.GivenName
      user.FamilyName = FamilyName || user.FamilyName
      user.ImageURL = ImageURL || user.ImageURL
      await user.save()
      console.log(`Usuario existente actualizado: ${user.Email}`)
    } else {
      // Si el usuario no existe, crear uno nuevo
      user = new GoogleSigninUser({
        FullName,
        GivenName,
        FamilyName,
        FechaIngreso: new Date().toISOString(), // Fecha de ingreso al sistema
        ImageURL,
        Email,
        userPay: false, // Por defecto, no paga
        recipesOk: [],
        recipesOkCalificadas: new Map(),
        learningPaths: [],
        testAutomationPlans: [],
      })
      await user.save()
      console.log(`Nuevo usuario registrado: ${user.Email}`)
    }

    // Aquí podrías generar un token JWT o una sesión para el usuario
    // y enviarlo de vuelta al frontend para que lo almacene (ej. en localStorage)
    // Como en tu ejemplo de `getUserByEmail` que devuelve `data.tkn`
    // Por ahora, solo respondemos con la información del usuario
    res.status(200).json({
      message: "Inicio de sesión/registro con Google exitoso",
      user: {
        _id: user._id,
        FullName: user.FullName,
        Email: user.Email,
        // ... otros campos que quieras enviar al cliente
      },
      // Simula la devolución de un token si lo tuvieras
      // tkn: 'tu_jwt_generado_aqui'
    })
  } catch (error) {
    console.error("Error en Google Sign-in (backend):", error)
    res.status(500).json({ error: "Error interno del servidor en Google Sign-in" })
  }
}

module.exports = {
  googleSignIn,
}

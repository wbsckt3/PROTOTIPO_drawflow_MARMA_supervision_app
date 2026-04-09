// Archivo de índice para exportar todos los modelos

const GoogleSigninUser = require("../../GoogleSigninUsers/GoogleSigninUser.js") // Desde models/ sube 1 nivel a la ra�z, luego entra a GoogleSigninUsers/
const Company = require("./company.model.js") // En la misma carpeta
const CompanyGoogleSigninUser = require("./CompanyGoogleSigninUser.model.js") // En la misma carpeta

module.exports = {
  GoogleSigninUser,
  Company,
  CompanyGoogleSigninUser
}
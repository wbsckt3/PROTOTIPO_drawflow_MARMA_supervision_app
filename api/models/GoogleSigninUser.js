
const mongoose = require("mongoose");
const { Schema, Types } = mongoose;

//const Schema = mongoose.Schema;

const googleSigninUserSchema = new Schema({
  _id: { type: Types.ObjectId, auto: true },
  //poner acá el payload degoogle Sinin console
  FullName: String,
  GivenName: String,
  FamilyName: String,
  FechaIngreso: String,
  ImageURL: String,
  Email: String,
  userPay: { type: Boolean, default: false },
  //recipesOk: { type: Object, default: {} },
  recipesOk: { type: [String], default: [] }, // Cambia el tipo a array de strings
  //recipesOkCalificadas: { type: Object, default: {} },
  recipesOkCalificadas: {
    type: Map,
     of: {
      recipe: String, // Tipo del recipeId
      url: String // Tipo de la URL calificada
    }  
  },
  learningPaths: {
    type: Array,
    default: []
  },
  testAutomationPlans: {
    type: Array,
    default: []
  }

});
googleSigninUserSchema.index({ Email: 1 });
module.exports = mongoose.model("GoogleSigninUser", googleSigninUserSchema);


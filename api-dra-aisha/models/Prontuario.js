const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MedicacaoSchema = new Schema({
  nome: { type: String, required: true },
  horarioEspecifico: { type: String, default: '' }, 
  horarios: {
    antes_cafe: { type: Boolean, default: false },
    depois_cafe: { type: Boolean, default: false },
    almoco: { type: Boolean, default: false },
    tarde: { type: Boolean, default: false },
    antes_jantar: { type: Boolean, default: false },
    antes_dormir: { type: Boolean, default: false },
  }
});

const EvolucaoSchema = new Schema({
  titulo: { type: String, required: true },
  texto: { type: String, required: true },
  data: { type: Date, default: Date.now },
  autor: { type: String, default: 'Dra. Aisha' }
});

const ProntuarioSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  nomePaciente: { type: String, default: '' },
  idade: { type: Number, default: null },
  patologias: { type: String, default: '' },

  // --- ALERGIAS ---
  alergias: {
    temAlergia: { type: Boolean, default: false },
    quais: { type: String, default: '' }
  },

  medicosAssistentes: [{ type: String }], 
  medicacoes: [MedicacaoSchema],
  evolucoes: [EvolucaoSchema] 

}, { timestamps: true });

module.exports = mongoose.model('Prontuario', ProntuarioSchema);
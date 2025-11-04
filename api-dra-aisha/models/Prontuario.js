// Arquivo: /models/Prontuario.js (Correção do nome)

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

const ProntuarioSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true 
  },
  nomePaciente: { type: String, default: '' },
  idade: { type: Number, default: null },
  patologias: { type: String, default: '' },
  
  // *** CORREÇÃO AQUI ***
  // De: medicosAssitentes
  // Para: medicosAssistentes
  medicosAssistentes: [{ type: String }], 

  medicacoes: [MedicacaoSchema] 
}, {
  timestamps: true
});

const Prontuario = mongoose.model('Prontuario', ProntuarioSchema);
module.exports = Prontuario;
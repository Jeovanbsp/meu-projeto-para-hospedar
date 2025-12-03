// Arquivo: /models/Prontuario.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Molde para UMA Medicação
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

// *** NOVO: Molde para UMA Evolução ***
const EvolucaoSchema = new Schema({
  data: { type: Date, default: Date.now }, // Salva a data/hora automaticamente
  texto: { type: String, required: true }, // O que a médica escreveu
  autor: { type: String } // Nome de quem escreveu (opcional)
});

// Molde do Prontuário
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
  
  medicosAssistentes: [{ type: String }], 

  medicacoes: [MedicacaoSchema],

  // *** NOVO CAMPO: Lista de Evoluções ***
  evolucoes: [EvolucaoSchema] 

}, {
  timestamps: true
});

const Prontuario = mongoose.model('Prontuario', ProntuarioSchema);
module.exports = Prontuario;
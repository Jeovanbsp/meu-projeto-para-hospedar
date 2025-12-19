// Arquivo: /api-dra-aisha/models/Prontuario.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 1. Molde para UMA medicação
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

// 2. Molde para UMA evolução (ATUALIZADO COM TÍTULO)
const EvolucaoSchema = new Schema({
  titulo: { type: String, required: true }, // Novo campo
  texto: { type: String, required: true },
  data: { type: Date, default: Date.now },
  autor: { type: String, default: 'Dra. Aisha' }
});

// 3. Molde para o Prontuário INTEIRO
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

  evolucoes: [EvolucaoSchema] // Lista de evoluções

}, {
  timestamps: true
});

const Prontuario = mongoose.model('Prontuario', ProntuarioSchema);
module.exports = Prontuario;
// Arquivo: /models/Prontuario.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 1. Este é o "molde" para UMA medicação
const MedicacaoSchema = new Schema({
  nome: { type: String, required: true },
  
  // O campo para o horário interativo (ex: "08:30")
  horarioEspecifico: { type: String, default: '' }, 

  // Os "Turnos" (as pílulas)
  horarios: {
    antes_cafe: { type: Boolean, default: false },
    depois_cafe: { type: Boolean, default: false },
    almoco: { type: Boolean, default: false },
    tarde: { type: Boolean, default: false },
    antes_jantar: { type: Boolean, default: false },
    antes_dormir: { type: Boolean, default: false },
  }
});

// 2. Este é o "molde" para o Prontuário INTEIRO
const ProntuarioSchema = new Schema({
  // O link para o "dono" do prontuário (o Usuário)
  user: {
    type: Schema.Types.ObjectId, // Um ID de outro documento
    ref: 'User', // Da coleção 'User'
    required: true,
    unique: true // Cada usuário só pode ter UM prontuário
  },
  
  // Os dados do formulário principal
  nomePaciente: { type: String, default: '' },
  idade: { type: Number, default: null },
  patologias: { type: String, default: '' },

  // A lista de médicos (com o nome CORRIGIDO)
  medicosAssistentes: [{ type: String }], // (com "s")

  // A lista de medicações (usando o "molde" que criamos acima)
  medicacoes: [MedicacaoSchema] 

}, {
  timestamps: true // Salva data de criação e atualização
});

// 3. Exportar o modelo
const Prontuario = mongoose.model('Prontuario', ProntuarioSchema);
module.exports = Prontuario;
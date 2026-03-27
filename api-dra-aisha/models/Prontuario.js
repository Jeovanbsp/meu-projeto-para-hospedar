const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- SCHEMA DE MEDICAÇÃO (Atualizado para refletir o Frontend) ---
const MedicacaoSchema = new Schema({
  nome: { type: String, required: true },
  quantidade: { type: String, default: '' },
  horarioEspecifico: { type: String, default: '' }, 
  turno: { type: String, default: '' } // Atualizado: trocamos os booleanos antigos pelo campo "turno"
});

// --- SCHEMA DE EVOLUÇÃO ---
const EvolucaoSchema = new Schema({
  titulo: { type: String, required: true },
  texto: { type: String, required: true },
  data: { type: Date, default: Date.now },
  autor: { type: String, default: 'Dra. Aisha' }
});

// --- SCHEMA PRINCIPAL DO PRONTUÁRIO ---
const ProntuarioSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  termoAceite: { type: Boolean, default: false },
  nomePaciente: { type: String, default: '' },
  idade: { type: Number, default: null },
  rg: { type: String, default: '' }, // Adicionado para garantir que o RG seja salvo
  
  mobilidade: { type: String, default: '' }, 
  patologias: { type: String, default: '' },
  exames: { type: String, default: '' },

  comorbidades: {
    temComorbidade: { type: Boolean, default: false },
    lista: [{ type: String }],
    outras: { type: String, default: '' }
  },

  alergias: {
    temAlergia: { type: Boolean, default: false },
    quais: { type: String, default: '' }
  },

  // --- A GRANDE CORREÇÃO DOS MÉDICOS ---
  // Antes era apenas [{ type: String }], agora é um array de Objetos:
  medicosAssistentes: [{ 
    nome: { type: String, required: true },
    crm: { type: String, default: '' },
    especialidade: { type: String, default: '' },
    telefone: { type: String, default: '' }
  }], 

  medicacoes: [MedicacaoSchema],
  evolucoes: [EvolucaoSchema] 

}, { timestamps: true });

module.exports = mongoose.model('Prontuario', ProntuarioSchema);
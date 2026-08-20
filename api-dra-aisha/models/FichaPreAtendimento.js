const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- FICHA DE PRÉ-ATENDIMENTO ---
// As respostas são salvas em um objeto flexível ("respostas"),
// pois o formulário é longo e pode evoluir com o tempo.
const FichaPreAtendimentoSchema = new Schema({
  nome: { type: String, required: true },
  cpf: { type: String, default: '' },
  dataNascimento: { type: String, default: '' },

  // Consentimento LGPD obrigatório para envio da ficha
  lgpdAceite: { type: Boolean, required: true, default: false },

  // Objeto com todas as respostas do formulário
  respostas: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('FichaPreAtendimento', FichaPreAtendimentoSchema);

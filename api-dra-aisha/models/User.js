// Arquivo: /models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. O "molde" do nosso Usuário
const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true, // Garante que não existam dois e-mails iguais
    lowercase: true, // Salva sempre em minúsculas
  },
  password: {
    type: String,
    required: true,
    select: false, // Não mostra a senha em buscas (segurança)
  },
  role: {
    type: String,
    enum: ['paciente', 'admin'], // Só pode ser um desses dois
    default: 'paciente', // O padrão é sempre 'paciente'
  }
}, {
  timestamps: true // Salva data de criação e atualização (bom para controle)
});

// 2. O "Gancho" de Criptografia (MUITO IMPORTANTE)
// Antes (pre) de salvar (save) um novo usuário...
UserSchema.pre('save', async function(next) {
  // Se a senha não foi modificada, pula para o próximo passo
  if (!this.isModified('password')) {
    return next();
  }

  // Gera o "sal" e criptografa a senha
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 3. Exportar o modelo para usarmos no resto da API
const User = mongoose.model('User', UserSchema);
module.exports = User;
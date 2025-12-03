// Arquivo: /index.js (Completo e Corrigido para Render)

// 1. Importar as ferramentas
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Carrega variáveis locais (se existirem)
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

// 2. IMPORTAR NOSSOS MODELOS E O MIDDLEWARE
const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware'); 

// 3. Inicializar o Express
const app = express();

// 4. Configurar Middlewares (CORS)
const allowedOrigins = [
  'http://localhost:3000', 
  'https://aishageriatria.onrender.com', 
  'https://meu-projeto-para-hospedar.vercel.app' // Sua URL do Vercel
];

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (como Postman) ou se a origem estiver na lista
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}));
app.use(express.json());

// 5. Pegar as variáveis do .env (Definidas no topo para evitar erros)
const PORT = process.env.PORT || 3001;
// Usamos diretamente os nomes que estão no Render
const MONGODB_URI = process.env.MONGODB_URI; 
const JWT_SECRET = process.env.JWT_SECRET;

// 6. Conectar ao Banco de Dados
mongoose.set('strictQuery', false); 

// Verifica se a string do banco existe antes de tentar conectar
if (!MONGODB_URI) {
  console.error("❌ ERRO CRÍTICO: A variável MONGODB_URI não foi encontrada.");
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
    
    // Inicia o servidor ouvindo em 0.0.0.0 (Necessário para o Render)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  });

// 7. =============================================
//    ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
//    =============================================

app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do Prontuário da Dra. Aisha!' });
});

// Rota de Cadastro
app.post('/auth/register', async (req, res) => {
  console.log('Recebida requisição de cadastro:', req.body);
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
  if (senha.length < 6) return res.status(400).json({ message: 'A senha precisa ter no mínimo 6 caracteres.' });
  try {
    const userExists = await User.findOne({ email: email });
    if (userExists) return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    const newUser = new User({ nome, email, password: senha });
    await newUser.save();
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: { id: newUser._id, nome: newUser.nome, email: newUser.
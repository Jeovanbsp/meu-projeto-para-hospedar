// Arquivo: /index.js (CORREÇÃO DE BINDING PARA O RENDER)

// 1. Importar as ferramentas
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

// 2. IMPORTAR NOSSOS MODELOS E O MIDDLEWARE
const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware'); 

// 3. Inicializar o Express
const app = express();

// 4. Configurar Middlewares
const allowedOrigins = [
  'http://localhost:3000', 
  'https://aishageriatria.onrender.com', 
  'https://meu-projeto-para-hospedar.vercel.app' 
];

app.use(cors({
    origin: function (origin, callback) {
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

// 5. Pegar as variáveis do .env
const PORT = process.env.PORT || 3001;
const dbURI = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

// 6. Conectar ao Banco de Dados
mongoose.set('strictQuery', false); 
mongoose.connect(dbURI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
    
    // *** CORREÇÃO AQUI: Forçamos a API a ouvir em '0.0.0.0' ***
    app.listen(PORT, '0.0.0.0', () => { 
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  });

// 7. ROTAS PÚBLICAS (Restante do código...)
// (As rotas são idênticas ao que você já tem)
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do Prontuário da Dra. Aisha!' });
});
// ... (ROTAS DE CADASTRO, LOGIN, PRONTUÁRIO E ADMIN) ...
app.post('/auth/register', async (req, res) => {
  // (Código de Cadastro)
  console.log('Recebida requisição de cadastro:', req.body);
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
  if (senha.length < 6) return res.status(400).json({ message: 'A senha precisa ter no mínimo 6 caracteres.' });
  try {
    const userExists = await User.findOne({ email: email });
    if (userExists) return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    const newUser = new User({ nome, email, password: senha });
    await newUser.save();
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: { id: newUser._id, nome: newUser.nome, email: newUser.email }});
  } catch (error) {
    console.error('Erro no cadastro:', error.message);
    res.status(500).json({ message: 'Erro interno no servidor. Tente novamente.' });
  }
});

app.post('/auth/login', async (req, res) => {
  // (Código de Login)
  console.log('Recebida requisição de login:', req.body);
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });
  try {
    const user = await User.findOne({ email: email }).select('+password');
    if (!user) return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
    const isMatch = await bcrypt.compare(senha, user.password);
    if (!isMatch) return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
    const payload = { userId: user._id, nome: user.nome, role: user.role };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
    
    res.status(200).json({
      message: 'Login bem-sucedido!',
      token: token,
      userName: user.nome,
      role: user.role
    });
  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(500).json({ message: 'Erro interno no servidor. Tente novamente.' });
  }
});

app.get('/api/public-prontuario/:userId', async (req, res) => {
  // (Código de Prontuário Público)
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }
    const prontuario = await Prontuario.findOne({ user: userId });
    if (!prontuario) {
      return res.status(404).json({ message: 'Prontuário não encontrado.' });
    }
    res.status(200).json(prontuario);
  } catch (error) {
    console.error('Erro ao buscar prontuário público:', error.message);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

app.get('/api/prontuario', authMiddleware, async (req, res) => {
  // (Código de Buscar Prontuário)
  console.log(`Buscando prontuário para o usuário: ${req.user.userId}`);
  try {
    let prontuario = await Prontuario.findOne({ user: req.user.userId });
    if (!prontuario) {
      console.log('Nenhum prontuário encontrado. Criando um novo...');
      prontuario = new Prontuario({
        user: req.user.userId, nomePaciente: req.user.nome, medicacoes: [], medicosAssistentes: []
      });
      await prontuario.save();
    }
    res.status(200).json(prontuario);
  } catch (error) {
    console.error('Erro ao buscar prontuário:', error.message);
    res.status(500).json({ message: 'Erro ao buscar dados do prontuário.' });
  }
});

app.post('/api/prontuario', authMiddleware, async (req, res) => {
  // (Código de Salvar Prontuário)
  console.log(`Salvando prontuário para o usuário: ${req.user.userId}`);
  const { nomePaciente, idade, patologias, medicosAssistentes, medicacoes } = req.body;
  try {
    const dadosProntuario = {
      user: req.user.userId, nomePaciente, idade, patologias, medicosAssistentes, medicacoes 
    };

    const prontuarioAtualizado = await Prontuario.findOneAndUpdate(
      { user: req.user.userId }, 
      dadosProntuario,          
      { new: true, upsert: true } 
    );
    res.status(200).json({ message: 'Prontuário salvo com sucesso!', prontuario: prontuarioAtualizado });
  } catch (error) {
    console.error('Erro ao salvar prontuário:', error.message);
    res.status(500).json({ message: 'Erro ao salvar dados do prontuário.' });
  }
});


// 9. ROTAS DE ADMIN
app.get('/api/admin/pacientes', authMiddleware, adminMiddleware, async (req, res) => {
  // (Código de Admin - Ver Pacientes)
  try {
    const pacientes = await User.find({ role: 'paciente' }).select('nome email createdAt');
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pacientes.' });
  }
});

app.get('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  // (Código de Admin - Buscar Prontuário para Edição)
  try {
    const userId = req.params.userId;
    const prontuario = await Prontuario.findOne({ user: userId });
    if (!prontuario) {
      const user = await User.findById(userId).select('nome');
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });
      return res.status(200).json({
        user: userId, nomePaciente: user.nome, idade: null, patologias: '', medicosAssistentes: [], medicacoes: []
      });
    }
    res.status(200).json(prontuario);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar prontuário para edição.' });
  }
});

app.post('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  // (Código de Admin - Salvar Edição)
  try {
    const userId = req.params.userId;
    const { nomePaciente, idade, patologias, medicosAssistentes, medicacoes } = req.body;
    const dadosProntuario = {
      user: userId, nomePaciente, idade, patologias, medicosAssistentes, medicacoes
    };
    await Prontuario.findOneAndUpdate({ user: userId }, dadosProntuario, { new: true, upsert: true });
    res.status(200).json({ message: 'Prontuário atualizado com sucesso pela Admin!' });
  } catch (error) {
    console.error('Erro ao salvar prontuário (Admin):', error.message);
    res.status(500).json({ message: 'Erro ao salvar dados do prontuário.' });
  }
});

app.delete('/api/admin/paciente/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  // (Código de Admin - Deletar)
  try {
    const userId = req.params.userId;
    await Prontuario.findOneAndDelete({ user: userId });
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'Paciente e seu prontuário foram deletados com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar paciente:', error.message);
    res.status(500).json({ message: 'Erro ao deletar paciente.' });
  }
});
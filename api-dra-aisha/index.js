// Arquivo: /api-dra-aisha/index.js

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware'); 

const app = express();

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

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI; 
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.set('strictQuery', false); 

if (!MONGODB_URI) console.error("❌ ERRO CRÍTICO: MONGODB_URI ausente.");

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas!');
    app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
  })
  .catch((err) => console.error('❌ Erro no MongoDB:', err.message));

// --- ROTAS DE AUTH ---
app.get('/', (req, res) => res.json({ message: 'API Prontuário Dra. Aisha Online' }));

app.post('/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha todos os campos.' });
  if (senha.length < 6) return res.status(400).json({ message: 'Senha deve ter min 6 caracteres.' });
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'E-mail já cadastrado.' });
    const newUser = new User({ nome, email, password: senha });
    await newUser.save();
    res.status(201).json({ message: 'Usuário criado!', user: { id: newUser._id, nome: newUser.nome }});
  } catch (error) {
    res.status(500).json({ message: 'Erro interno.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(senha, user.password))) {
        return res.status(400).json({ message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign({ userId: user._id, nome: user.nome, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ message: 'Login OK!', token, userName: user.nome, role: user.role });
  } catch (error) {
    res.status(500).json({ message: 'Erro no login.' });
  }
});

// --- ROTA PÚBLICA (QR Code) ---
app.get('/api/public-prontuario/:userId', async (req, res) => {
  try {
    const prontuario = await Prontuario.findOne({ user: req.params.userId });
    if (!prontuario) return res.status(404).json({ message: 'Prontuário não encontrado.' });
    res.status(200).json(prontuario);
  } catch (error) {
    res.status(500).json({ message: 'Erro interno.' });
  }
});

// --- ROTAS DO PACIENTE (Leitura Própria) ---
app.get('/api/prontuario', authMiddleware, async (req, res) => {
  try {
    let prontuario = await Prontuario.findOne({ user: req.user.userId });
    if (!prontuario) {
      prontuario = new Prontuario({ user: req.user.userId, nomePaciente: req.user.nome });
      await prontuario.save();
    }
    res.status(200).json(prontuario);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar prontuário.' });
  }
});

app.post('/api/prontuario', authMiddleware, async (req, res) => {
  // CORREÇÃO AQUI: Adicionado 'alergias'
  const { nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes } = req.body;
  try {
    const dados = { user: req.user.userId, nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes };
    const p = await Prontuario.findOneAndUpdate({ user: req.user.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Salvo com sucesso!', prontuario: p });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao salvar.' });
  }
});

// --- ROTAS DE ADMIN ---

app.get('/api/admin/pacientes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pacientes = await User.find({ role: 'paciente' }).select('nome email createdAt');
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pacientes.' });
  }
});

app.get('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const prontuario = await Prontuario.findOne({ user: userId });
    if (!prontuario) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'Usuário não existe.' });
      return res.status(200).json({ user: userId, nomePaciente: user.nome, evolucoes: [] });
    }
    res.status(200).json(prontuario);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar prontuário.' });
  }
});

app.post('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // CORREÇÃO CRUCIAL AQUI: Adicionado 'alergias' na extração
    const { nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes } = req.body;
    
    // Inclui alergias no objeto de dados
    const dados = { user: req.params.userId, nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes };
    
    await Prontuario.findOneAndUpdate({ user: req.params.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Prontuário atualizado!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao salvar.' });
  }
});

app.delete('/api/admin/paciente/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await Prontuario.findOneAndDelete({ user: req.params.userId });
    await User.findByIdAndDelete(req.params.userId);
    res.status(200).json({ message: 'Paciente deletado.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar.' });
  }
});

// --- ROTAS DE EVOLUÇÃO ---
app.post('/api/admin/prontuario/:userId/evolucao', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { titulo, texto } = req.body;
    if (!texto || !titulo) return res.status(400).json({ message: 'Título e texto são obrigatórios.' });

    const p = await Prontuario.findOneAndUpdate(
      { user: req.params.userId },
      { $push: { evolucoes: { titulo, texto, data: new Date(), autor: 'Dra. Aisha' } } },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: 'Evolução salva!', prontuario: p });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao salvar evolução.' });
  }
});

app.put('/api/admin/prontuario/:userId/evolucao/:evolucaoId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId, evolucaoId } = req.params;
    const { titulo, texto } = req.body;

    const prontuario = await Prontuario.findOne({ user: userId });
    if (!prontuario) return res.status(404).json({ message: 'Prontuário não encontrado.' });

    const evolucao = prontuario.evolucoes.id(evolucaoId);
    if (!evolucao) return res.status(404).json({ message: 'Evolução não encontrada.' });

    evolucao.titulo = titulo;
    evolucao.texto = texto;
    
    await prontuario.save();
    res.status(200).json({ message: 'Evolução atualizada!', prontuario });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao editar.' });
  }
});

app.delete('/api/admin/prontuario/:userId/evolucao/:evolucaoId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const prontuario = await Prontuario.findOneAndUpdate(
      { user: req.params.userId },
      { $pull: { evolucoes: { _id: req.params.evolucaoId } } },
      { new: true }
    );
    res.status(200).json({ message: 'Evolução removida.', prontuario });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao excluir.' });
  }
});
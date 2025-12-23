// Arquivo: api-dra-aisha/index.js (Completo)

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

// Models
const User = require('./models/User');
const Prontuario = require('./models/Prontuario');

// Middlewares
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
        if (!origin || allowedOrigins.includes(origin)) { callback(null, true); } 
        else { callback(new Error('Not allowed by CORS')); }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
}));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI; 
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.set('strictQuery', false); 

if (!MONGODB_URI) console.error("❌ ERRO: MONGODB_URI ausente no .env");

mongoose.connect(MONGODB_URI)
  .then(() => { console.log('✅ MongoDB Conectado!'); app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`)); })
  .catch((err) => console.error('❌ Erro Mongo:', err.message));

app.get('/', (req, res) => res.json({ message: 'API Online' }));

// --- AUTENTICAÇÃO ---
app.post('/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha todos os campos.' });
  if (senha.length < 6) return res.status(400).json({ message: 'Senha deve ter no mínimo 6 caracteres.' });

  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'E-mail já cadastrado.' });
    const newUser = new User({ nome, email, password: senha });
    await newUser.save();
    res.status(201).json({ message: 'Usuário criado com sucesso!', user: { id: newUser._id, nome: newUser.nome }});
  } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(senha, user.password))) return res.status(400).json({ message: 'Credenciais inválidas.' });

    const token = jwt.sign({ userId: user._id, nome: user.nome, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ message: 'Login realizado!', token, userName: user.nome, role: user.role });
  } catch (error) { res.status(500).json({ message: 'Erro no servidor.' }); }
});

// --- ROTA PÚBLICA (QR Code) ---
app.get('/api/public-prontuario/:userId', async (req, res) => {
  try {
    const prontuario = await Prontuario.findOne({ user: req.params.userId });
    if (!prontuario) return res.status(404).json({ message: 'Prontuário não encontrado.' });
    res.status(200).json(prontuario);
  } catch (error) { res.status(500).json({ message: 'Erro interno.' }); }
});

// --- ROTAS DO PACIENTE ---
app.get('/api/prontuario', authMiddleware, async (req, res) => {
  try {
    let prontuario = await Prontuario.findOne({ user: req.user.userId });
    if (!prontuario) { 
        prontuario = new Prontuario({ user: req.user.userId, nomePaciente: req.user.nome }); 
        await prontuario.save(); 
    }
    res.status(200).json(prontuario);
  } catch (error) { res.status(500).json({ message: 'Erro ao buscar prontuário.' }); }
});

app.post('/api/prontuario', authMiddleware, async (req, res) => {
  const { nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes, termoAceite } = req.body;
  try {
    const dados = { 
        user: req.user.userId, 
        nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes, termoAceite 
    };
    const p = await Prontuario.findOneAndUpdate({ user: req.user.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Salvo com sucesso!', prontuario: p });
  } catch (error) { res.status(500).json({ message: 'Erro ao salvar.' }); }
});

// --- ROTAS DO ADMIN (GERENCIAMENTO) ---

// 1. LISTAR TODOS OS PACIENTES COM STATUS DO TERMO (ROTA IMPORTANTE)
app.get('/api/admin/pacientes', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Busca usuários (exceto admins)
        const usuarios = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        
        // Cruza com a tabela de Prontuários para ver se aceitou o termo
        const listaCompleta = await Promise.all(usuarios.map(async (u) => {
            const prontuario = await Prontuario.findOne({ user: u._id }).select('termoAceite');
            return {
                _id: u._id,
                nome: u.nome,
                email: u.email,
                createdAt: u.createdAt,
                termoAceite: prontuario ? prontuario.termoAceite : false
            };
        }));

        res.status(200).json(listaCompleta);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao listar pacientes.' });
    }
});

// 2. DELETAR PACIENTE
app.delete('/api/admin/paciente/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await User.findByIdAndDelete(id);
        await Prontuario.findOneAndDelete({ user: id });
        res.status(200).json({ message: 'Paciente removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar paciente.' });
    }
});

// 3. LER PRONTUÁRIO ESPECÍFICO
app.get('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const p = await Prontuario.findOne({ user: req.params.userId });
    if (!p) {
        const u = await User.findById(req.params.userId);
        if(!u) return res.status(404).json({message:'Usuário não encontrado'});
        return res.status(200).json({ user: req.params.userId, nomePaciente: u.nome, evolucoes: [] });
    }
    res.status(200).json(p);
  } catch (error) { res.status(500).json({ message: 'Erro ao ler prontuário.' }); }
});

// 4. SALVAR PRONTUÁRIO ESPECÍFICO
app.post('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes, termoAceite } = req.body;
    const dados = { 
        user: req.params.userId, 
        nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes, termoAceite 
    };
    await Prontuario.findOneAndUpdate({ user: req.params.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Prontuário atualizado pelo Admin!' });
  } catch (error) { res.status(500).json({ message: 'Erro ao salvar.' }); }
});

// 5. EVOLUÇÕES (CRIAR, EDITAR, DELETAR)
app.post('/api/admin/prontuario/:userId/evolucao', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const p = await Prontuario.findOneAndUpdate({ user: req.params.userId }, { $push: { evolucoes: { titulo, texto, data: new Date(), autor: 'Dra. Aisha' } } }, { new: true });
        res.status(200).json({ message: 'Evolução salva', prontuario: p });
    } catch(e) { res.status(500).json({message: 'Erro'}); }
});

app.delete('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req,res)=>{
    try {
        await Prontuario.findOneAndUpdate({user: req.params.userId}, {$pull: {evolucoes: {_id: req.params.evoId}}});
        res.status(200).json({message: 'Evolução deletada'});
    } catch(e){ res.status(500).json({message:'Erro'}); }
});

app.put('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {titulo, texto} = req.body;
        const p = await Prontuario.findOne({user: req.params.userId});
        const evo = p.evolucoes.id(req.params.evoId);
        evo.titulo = titulo; evo.texto = texto;
        await p.save();
        res.status(200).json({message: 'Evolução editada', prontuario: p});
    } catch(e){ res.status(500).json({message: 'Erro'}); }
});
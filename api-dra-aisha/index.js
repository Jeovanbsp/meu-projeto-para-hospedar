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
if (!MONGODB_URI) console.error("❌ ERRO: MONGODB_URI ausente.");

mongoose.connect(MONGODB_URI)
  .then(() => { console.log('✅ MongoDB Conectado!'); app.listen(PORT, () => console.log(`🚀 Porta ${PORT}`)); })
  .catch((err) => console.error('❌ Erro Mongo:', err.message));

app.get('/', (req, res) => res.json({ message: 'API Online' }));

// Auth (Login/Register) - Mantenha igual ao seu original
app.post('/auth/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Preencha tudo.' });
  if (senha.length < 6) return res.status(400).json({ message: 'Senha curta.' });
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'E-mail existe.' });
    const newUser = new User({ nome, email, password: senha });
    await newUser.save();
    res.status(201).json({ message: 'Criado!', user: { id: newUser._id, nome: newUser.nome }});
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/auth/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(senha, user.password))) return res.status(400).json({ message: 'Inválido.' });
    const token = jwt.sign({ userId: user._id, nome: user.nome, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).json({ message: 'OK', token, userName: user.nome, role: user.role });
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// --- ROTA PÚBLICA ---
app.get('/api/public-prontuario/:userId', async (req, res) => {
  try {
    const prontuario = await Prontuario.findOne({ user: req.params.userId });
    if (!prontuario) return res.status(404).json({ message: 'Não encontrado.' });
    res.status(200).json(prontuario);
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// --- ROTAS PACIENTE ---
app.get('/api/prontuario', authMiddleware, async (req, res) => {
  try {
    let prontuario = await Prontuario.findOne({ user: req.user.userId });
    if (!prontuario) { prontuario = new Prontuario({ user: req.user.userId, nomePaciente: req.user.nome }); await prontuario.save(); }
    res.status(200).json(prontuario);
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/prontuario', authMiddleware, async (req, res) => {
  const { nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes } = req.body;
  try {
    const dados = { user: req.user.userId, nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes };
    const p = await Prontuario.findOneAndUpdate({ user: req.user.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Salvo!', prontuario: p });
  } catch (error) { res.status(500).json({ message: 'Erro ao salvar.' }); }
});

// --- ROTAS ADMIN ---
app.get('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const p = await Prontuario.findOne({ user: req.params.userId });
    if (!p) {
        const u = await User.findById(req.params.userId);
        if(!u) return res.status(404).json({message:'User nulo'});
        return res.status(200).json({ user: req.params.userId, nomePaciente: u.nome, evolucoes: [] });
    }
    res.status(200).json(p);
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes } = req.body;
    const dados = { user: req.params.userId, nomePaciente, idade, patologias, alergias, medicosAssistentes, medicacoes };
    await Prontuario.findOneAndUpdate({ user: req.params.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Atualizado!' });
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// Evoluções e Delete (Mantenha o código padrão de evolução e delete user aqui...)
app.post('/api/admin/prontuario/:userId/evolucao', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const p = await Prontuario.findOneAndUpdate({ user: req.params.userId }, { $push: { evolucoes: { titulo, texto, data: new Date(), autor: 'Dra. Aisha' } } }, { new: true });
        res.status(200).json({ message: 'Salvo', prontuario: p });
    } catch(e) { res.status(500).json({message: 'Erro'}); }
});
app.delete('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req,res)=>{
    try {
        await Prontuario.findOneAndUpdate({user: req.params.userId}, {$pull: {evolucoes: {_id: req.params.evoId}}});
        res.status(200).json({message: 'Deletado'});
    } catch(e){ res.status(500).json({message:'Erro'}); }
});
app.put('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {titulo, texto} = req.body;
        const p = await Prontuario.findOne({user: req.params.userId});
        const evo = p.evolucoes.id(req.params.evoId);
        evo.titulo = titulo; evo.texto = texto;
        await p.save();
        res.status(200).json({message: 'Editado', prontuario: p});
    } catch(e){ res.status(500).json({message: 'Erro'}); }
});
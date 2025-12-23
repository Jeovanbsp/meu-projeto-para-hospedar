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

app.use(cors()); 
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI; 
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.set('strictQuery', false); 

if (!MONGODB_URI) console.error("❌ ERRO: MONGODB_URI ausente no .env");

mongoose.connect(MONGODB_URI)
  .then(() => { console.log('✅ MongoDB Conectado!'); app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`)); })
  .catch((err) => console.error('❌ Erro Mongo:', err.message));

app.get('/', (req, res) => res.json({ message: 'API Online' }));

// Auth
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

// Rota Pública
app.get('/api/public-prontuario/:userId', async (req, res) => {
  try {
    const prontuario = await Prontuario.findOne({ user: req.params.userId });
    if (!prontuario) return res.status(404).json({ message: 'Não encontrado.' });
    res.status(200).json(prontuario);
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// --- PACIENTE ---
app.get('/api/prontuario', authMiddleware, async (req, res) => {
  try {
    let prontuario = await Prontuario.findOne({ user: req.user.userId });
    if (!prontuario) { prontuario = new Prontuario({ user: req.user.userId, nomePaciente: req.user.nome }); await prontuario.save(); }
    res.status(200).json(prontuario);
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

app.post('/api/prontuario', authMiddleware, async (req, res) => {
  // ADICIONADO 'exames' AQUI
  const { nomePaciente, idade, patologias, exames, alergias, medicosAssistentes, medicacoes, termoAceite } = req.body;
  try {
    const dados = { user: req.user.userId, termoAceite, nomePaciente, idade, patologias, exames, alergias, medicosAssistentes, medicacoes };
    const p = await Prontuario.findOneAndUpdate({ user: req.user.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Salvo!', prontuario: p });
  } catch (error) { res.status(500).json({ message: 'Erro ao salvar.' }); }
});

// --- ADMIN ---
app.get('/api/admin/pacientes', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const usuarios = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        const listaCompleta = await Promise.all(usuarios.map(async (u) => {
            const prontuario = await Prontuario.findOne({ user: u._id }).select('termoAceite');
            return { _id: u._id, nome: u.nome, email: u.email, createdAt: u.createdAt, termoAceite: prontuario ? prontuario.termoAceite : false };
        }));
        res.status(200).json(listaCompleta);
    } catch (error) { res.status(500).json({ message: 'Erro ao listar.' }); }
});

app.delete('/api/admin/paciente/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params; await User.findByIdAndDelete(id); await Prontuario.findOneAndDelete({ user: id });
        res.status(200).json({ message: 'Deletado.' });
    } catch (error) { res.status(500).json({ message: 'Erro ao deletar.' }); }
});

app.get('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const p = await Prontuario.findOne({ user: req.params.userId });
    if (!p) {
        const u = await User.findById(req.params.userId);
        if(!u) return res.status(404).json({message:'User não encontrado'});
        return res.status(200).json({ user: req.params.userId, nomePaciente: u.nome, medicosAssistentes: [], medicacoes: [], evolucoes: [] });
    }
    res.status(200).json(p);
  } catch (error) { res.status(500).json({ message: 'Erro ao ler.' }); }
});

app.post('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  // ADICIONADO 'exames' AQUI TAMBÉM
  try {
    const { nomePaciente, idade, patologias, exames, alergias, medicosAssistentes, medicacoes, termoAceite } = req.body;
    const dados = { user: req.params.userId, termoAceite, nomePaciente, idade, patologias, exames, alergias, medicosAssistentes, medicacoes };
    await Prontuario.findOneAndUpdate({ user: req.params.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Atualizado!' });
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// Evoluções
app.post('/api/admin/prontuario/:userId/evolucao', authMiddleware, adminMiddleware, async (req, res) => {
    try { const { titulo, texto } = req.body; const p = await Prontuario.findOneAndUpdate({ user: req.params.userId }, { $push: { evolucoes: { titulo, texto, data: new Date(), autor: 'Dra. Aisha' } } }, { new: true }); res.status(200).json({ message: 'Salvo', prontuario: p }); } catch(e) { res.status(500).json({message: 'Erro'}); }
});
app.delete('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req,res)=>{
    try { await Prontuario.findOneAndUpdate({user: req.params.userId}, {$pull: {evolucoes: {_id: req.params.evoId}}}); res.status(200).json({message: 'Deletado'}); } catch(e){ res.status(500).json({message:'Erro'}); }
});
app.put('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req, res) => {
    try { const {titulo, texto} = req.body; const p = await Prontuario.findOne({user: req.params.userId}); const evo = p.evolucoes.id(req.params.evoId); evo.titulo = titulo; evo.texto = texto; await p.save(); res.status(200).json({message: 'Editado', prontuario: p}); } catch(e){ res.status(500).json({message: 'Erro'}); }
});
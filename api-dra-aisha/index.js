const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

const User = require('./models/User');
// const Prontuario = require('./models/Prontuario'); // Se estiver usando arquivo separado, mantenha. Se não, use o schema abaixo.
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

// --- DEFINIÇÃO DO SCHEMA (Se não tiver arquivo separado) ---
const MedicacaoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  quantidade: { type: String, default: '' },
  horarioEspecifico: { type: String, default: '' }, 
  horarios: { type: Map, of: Boolean, default: {} } 
});

const EvolucaoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  texto: { type: String, required: true },
  data: { type: Date, default: Date.now },
  autor: { type: String, default: 'Dra. Aisha' }
});

const ProntuarioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  termoAceite: { type: Boolean, default: false },
  
  // DADOS PESSOAIS COMPLETOS
  nomePaciente: { type: String, default: '' },
  genero: { type: String, default: '' },        // Novo
  dataNascimento: { type: String, default: '' }, // Novo
  emailPessoal: { type: String, default: '' },   // Novo
  cpf: { type: String, default: '' },            // Novo
  rg: { type: String, default: '' },             // Novo
  idade: { type: String, default: '' }, 
  
  // DADOS CLÍNICOS
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

  medicosAssistentes: [{ type: String }], 
  medicacoes: [MedicacaoSchema],
  evolucoes: [EvolucaoSchema] 

}, { timestamps: true });

const Prontuario = mongoose.models.Prontuario || mongoose.model('Prontuario', ProntuarioSchema);

// --- ROTAS DE AUTH ---
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

// --- ESTATÍSTICAS ---
app.get('/api/admin/stats/idades', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const activeUsers = await User.find({ role: { $ne: 'admin' } }, '_id');
        const activeUserIds = activeUsers.map(u => u._id);
        const prontuarios = await Prontuario.find({ user: { $in: activeUserIds } }, 'idade dataNascimento');
        
        const grupos = { 'Ate50': 0, 'De51a60': 0, 'De61a70': 0, 'De71a80': 0, 'De81a90': 0, 'Maior90': 0, 'NaoInformado': 0 };
        let total = 0;

        prontuarios.forEach(p => {
            total++;
            let id = parseInt(p.idade);
            // Calcula idade se não estiver salva, mas tiver data de nascimento
            if (!id && p.dataNascimento) {
                const birthDate = new Date(p.dataNascimento);
                const today = new Date();
                id = today.getFullYear() - birthDate.getFullYear();
            }

            if (!id && id !== 0) { grupos.NaoInformado++; return; }
            if (id <= 50) grupos.Ate50++;
            else if (id <= 60) grupos.De51a60++;
            else if (id <= 70) grupos.De61a70++;
            else if (id <= 80) grupos.De71a80++;
            else if (id <= 90) grupos.De81a90++;
            else grupos.Maior90++;
        });
        res.status(200).json({ grupos, total });
    } catch (error) { res.status(500).json({ message: 'Erro estatisticas.' }); }
});

// --- LISTA ---
app.get('/api/admin/pacientes', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const usuarios = await User.find({ role: { $ne: 'admin' } }).select('-password').sort({ createdAt: -1 });
        const listaCompleta = await Promise.all(usuarios.map(async (u) => {
            const prontuario = await Prontuario.findOne({ user: u._id }).select('termoAceite nomePaciente');
            const nomeExibicao = (prontuario && prontuario.nomePaciente) ? prontuario.nomePaciente : u.nome;
            return { _id: u._id, nome: nomeExibicao, email: u.email, createdAt: u.createdAt, termoAceite: prontuario ? prontuario.termoAceite : false };
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

// --- PRONTUÁRIO (GET) ---
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

// --- PRONTUÁRIO (POST - SALVAR TUDO) ---
app.post('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
        nomePaciente, genero, dataNascimento, emailPessoal, cpf, rg, 
        idade, mobilidade, patologias, exames, comorbidades, alergias, 
        medicosAssistentes, medicacoes, termoAceite 
    } = req.body;

    const dados = { 
        user: req.params.userId, termoAceite, 
        nomePaciente, genero, dataNascimento, emailPessoal, cpf, rg, idade,
        mobilidade, patologias, exames, comorbidades, alergias, 
        medicosAssistentes, medicacoes 
    };

    await Prontuario.findOneAndUpdate({ user: req.params.userId }, dados, { new: true, upsert: true });
    res.status(200).json({ message: 'Atualizado!' });
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// --- EVOLUÇÕES ---
app.post('/api/admin/prontuario/:userId/evolucao', authMiddleware, adminMiddleware, async (req, res) => { try { const { titulo, texto } = req.body; const p = await Prontuario.findOneAndUpdate({ user: req.params.userId }, { $push: { evolucoes: { titulo, texto, data: new Date(), autor: 'Dra. Aisha' } } }, { new: true }); res.status(200).json({ message: 'Salvo', prontuario: p }); } catch(e) { res.status(500).json({message: 'Erro'}); } });
app.delete('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req,res)=>{ try { await Prontuario.findOneAndUpdate({user: req.params.userId}, {$pull: {evolucoes: {_id: req.params.evoId}}}); res.status(200).json({message: 'Deletado'}); } catch(e){ res.status(500).json({message:'Erro'}); } });
app.put('/api/admin/prontuario/:userId/evolucao/:evoId', authMiddleware, adminMiddleware, async (req, res) => { try { const {titulo, texto} = req.body; const p = await Prontuario.findOne({user: req.params.userId}); const evo = p.evolucoes.id(req.params.evoId); evo.titulo = titulo; evo.texto = texto; await p.save(); res.status(200).json({message: 'Editado', prontuario: p}); } catch(e){ res.status(500).json({message: 'Erro'}); } });

// --- API DO PACIENTE (MESMA LÓGICA DE CAMPOS) ---
app.get('/api/prontuario', authMiddleware, async (req, res) => { try { let p = await Prontuario.findOne({ user: req.user.userId }); if (!p) { p = new Prontuario({ user: req.user.userId, nomePaciente: req.user.nome }); await p.save(); } res.status(200).json(p); } catch (error) { res.status(500).json({ message: 'Erro.' }); } });
app.post('/api/prontuario', authMiddleware, async (req, res) => { 
    const { 
        nomePaciente, genero, dataNascimento, emailPessoal, cpf, rg, idade,
        mobilidade, patologias, exames, comorbidades, alergias, 
        medicosAssistentes, medicacoes, termoAceite 
    } = req.body; 
    try { 
        const dados = { 
            user: req.user.userId, termoAceite, 
            nomePaciente, genero, dataNascimento, emailPessoal, cpf, rg, idade,
            mobilidade, patologias, exames, comorbidades, alergias, 
            medicosAssistentes, medicacoes 
        }; 
        await Prontuario.findOneAndUpdate({ user: req.user.userId }, dados, { new: true, upsert: true }); 
        res.status(200).json({ message: 'Salvo!' }); 
    } catch (error) { res.status(500).json({ message: 'Erro.' }); } 
});
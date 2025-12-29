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

// --- ROTA DE ESTATÍSTICAS (GRÁFICO) ---
app.get('/api/admin/stats/idades', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const prontuarios = await Prontuario.find({}, 'idade');
        
        const grupos = {
            'Ate50': 0,
            'De51a60': 0,
            'De61a70': 0,
            'De71a80': 0,
            'De81a90': 0,
            'Maior90': 0,
            'NaoInformado': 0
        };

        let total = 0;

        prontuarios.forEach(p => {
            total++;
            const id = p.idade;

            if (!id && id !== 0) { grupos.NaoInformado++; return; }
            
            if (id <= 50) grupos.Ate50++;
            else if (id <= 60) grupos.De51a60++;
            else if (id <= 70) grupos.De61a70++;
            else if (id <= 80) grupos.De71a80++;
            else if (id <= 90) grupos.De81a90++;
            else grupos.Maior90++;
        });

        res.status(200).json({ grupos, total });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao calcular estatísticas.' });
    }
});
// ---------------------------------------

// Rota Pública
app.get('/api/public-prontuario/:userId', async (req, res) => {
  try {
    const prontuario = await Prontuario.findOne({ user: req.params.userId });
    if (!prontuario) return res.status(404).json({ message: 'Não encontrado.' });
    res.status(200).json(prontuario);
  } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// ... (RESTANTE DAS ROTAS DE PRONTUARIO JÁ EXISTENTES) ...
// (Mantenha as rotas /api/prontuario e /api/admin/prontuario que já configuramos antes)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importação dos Modelos
const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const Banner = require('./models/Banner'); // <-- Modelo de banners
const app = express();
require('dotenv').config()

app.use(cors());

// Limite aumentado para 50mb para aceitar o upload de imagens pesadas em Base64 sem erro 413
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==========================================
// ROTA PÚBLICA DE EMERGÊNCIA (QR CODE)
// ==========================================
app.get('/api/prontuario/publico/:paciente', async (req, res) => {
    try {
        const identificador = req.params.paciente;
        const user = await User.findOne({ nome: identificador });
        
        if (!user) return res.status(404).json({ message: 'Paciente não encontrado.' });

        const prontuario = await Prontuario.findOne({ user: user._id });

        if (!prontuario || !prontuario.termoAceite) {
            return res.status(404).json({ message: 'Prontuário não disponível ou inativo.' });
        }

        res.json(prontuario);
    } catch (error) {
        console.error('Erro na rota pública:', error);
        res.status(500).json({ message: 'Erro interno ao buscar prontuário público.' });
    }
});

// ==========================================
// ROTA PÚBLICA DE BANNERS (PARA O SITE LER AS IMAGENS)
// ==========================================
app.get('/api/banners/publico', async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.json(banners);
    } catch (error) {
        console.error('Erro na rota pública de banners:', error);
        res.status(500).json({ message: 'Erro ao buscar banners públicos.' });
    }
});

// ==========================================
// IMPORTANDO AS ROTAS PROTEGIDAS
// ==========================================
const adminRoutes = require('./routes/adminRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');

app.use('/api/admin', adminRoutes);
app.use('/api/prontuario', pacienteRoutes);

// ==========================================
// ROTAS DE AUTENTICAÇÃO
// ==========================================

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(400).json({ message: 'E-mail não cadastrado.' });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Senha incorreta.' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ token, user: { name: user.nome, role: user.role } });
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// CADASTRO
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nome, email, password, role, telefone } = req.body;
        
        const userExists = await User.findOne({ email: email.toLowerCase().trim() });
        if (userExists) {
            return res.status(400).json({ message: 'Este e-mail já está em uso.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            nome,
            email: email.toLowerCase().trim(),
            password: hashedPassword, 
            telefone: telefone || '', 
            role: role || 'paciente'
        });

        await newUser.save();
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao cadastrar.' });
    }
});

const SERVER_PORT = process.env.PORT || 3001
mongoose.connect(process.env.MONGODB_URI)
    .then(() => app.listen(SERVER_PORT, () => console.log(`Servidor OK Porta: ${SERVER_PORT}`)))
    .catch(err => console.error("Erro ao conectar no MongoDB:", err));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Importação dos Modelos e Middlewares
const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// ========================================================================
// CONFIGURAÇÕES (Middlewares globais)
// ========================================================================
app.use(cors({
    origin: '*', // Permite que seu frontend acesse de qualquer lugar
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// ========================================================================
// 1. ROTAS DE AUTENTICAÇÃO (Ajustadas para bater com seu login.html)
// ========================================================================

// Rota de Cadastro
app.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email já registrado.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'paciente'
        });

        await user.save();
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Rota de Login (REMOVIDO O /api PARA FUNCIONAR COM SEU HTML)
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Credenciais inválidas.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Credenciais inválidas.' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secreta_padrao_123',
            { expiresIn: '1d' }
        );

        // RetornamosuserName para o localStorage do seu front ler corretamente
        res.status(200).json({
            token,
            role: user.role,
            userName: user.name,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// ========================================================================
// 2. ROTA PÚBLICA (QR CODE)
// ========================================================================
app.get('/api/prontuario/publico/:userId', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.params.userId });
        if (!prontuario) return res.status(404).json({ message: 'Prontuário não encontrado.' });
        res.status(200).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados.', error: error.message });
    }
});

// ========================================================================
// 3. ROTAS DO PACIENTE
// ========================================================================
app.get('/api/prontuario', authMiddleware, async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.user.id });
        res.status(200).json(prontuario || { message: 'Nenhum prontuário encontrado.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor.', error: error.message });
    }
});

app.post('/api/prontuario', authMiddleware, async (req, res) => {
    try {
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.user.id },
            { $set: req.body },
            { new: true, upsert: true }
        );
        res.status(200).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar.', error: error.message });
    }
});

// ========================================================================
// 4. ROTAS DO ADMINISTRADOR
// ========================================================================
app.get('/api/admin/pacientes', authMiddleware, async (req, res) => {
    try {
        const pacientes = await User.find({ role: 'paciente' }).select('-password');
        const listaCompleta = await Promise.all(pacientes.map(async (paciente) => {
            const prontuario = await Prontuario.findOne({ user: paciente._id });
            return {
                _id: paciente._id,
                name: paciente.name,
                email: paciente.email,
                prontuario: prontuario || null
            };
        }));
        res.status(200).json(listaCompleta);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pacientes.', error: error.message });
    }
});

app.delete('/api/admin/paciente/:id', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Prontuario.findOneAndDelete({ user: req.params.id });
        res.status(200).json({ message: 'Removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover.', error: error.message });
    }
});

// ========================================================================
// 5. CONEXÃO E START
// ========================================================================
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ MongoDB Conectado');
    app.listen(PORT, () => console.log(`🚀 Porta: ${PORT}`));
})
.catch(err => console.error('❌ Erro DB:', err));
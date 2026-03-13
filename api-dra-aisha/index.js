const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();

// Configuração de CORS para permitir o seu site
app.use(cors());
app.use(express.json());

// ========================================================================
// ROTAS DE AUTENTICAÇÃO (Agora com /api para evitar erro 404)
// ========================================================================

app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email já registrado.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name, email, password: hashedPassword, role: role || 'paciente'
        });

        await user.save();
        res.status(201).json({ message: 'Utilizador criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
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

        res.status(200).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Outras rotas (Prontuário, etc) mantêm-se iguais...
app.get('/api/prontuario', authMiddleware, async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.user.id });
        res.status(200).json(prontuario || { message: 'Nenhum prontuário encontrado.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar prontuário.' });
    }
});

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ MongoDB Conectado');
    app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
})
.catch(err => console.error('❌ Erro DB:', err));
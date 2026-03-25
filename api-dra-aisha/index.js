const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const app = express();
require('dotenv').config()

app.use(cors());
app.use(express.json());

// ==========================================
// IMPORTANDO AS ROTAS
// ==========================================
const adminRoutes = require('./routes/adminRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');

// Rotas da Dra. Aisha (Admin)
// Se adminRoutes.js tem router.get('/pacientes'), o caminho será /api/admin/pacientes
app.use('/api/admin', adminRoutes);

// Rotas do Perfil do Paciente
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

// CADASTRO (Admin cria pacientes)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nome, email, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            nome,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
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
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
// IMPORTANDO E USANDO AS ROTAS
// ==========================================
const adminRoutes = require('./routes/adminRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');

// O front-end da Dra. Aisha chama "/api/admin/..."
app.use('/api/admin', adminRoutes);

// O front-end do paciente chama "/api/prontuario"
app.use('/api/prontuario', pacienteRoutes);


// ROTA DE LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(400).json({ message: 'E-mail não cadastrado.' });
        console.log(user)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Senha incorreta.' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Ajuste: buscando user.nome do banco para não dar erro no front-end
        res.json({ token, user: { name: user.nome, role: user.role } });
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// ROTA DE CADASTRO (Para o Admin criar pacientes)
app.post('/api/auth/register', async (req, res) => {
    try {
        // CORREÇÃO: Pegando 'nome' do req.body em vez de 'name'
        const { nome, email, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            nome, // CORREÇÃO: Salvando no banco de dados como 'nome'
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
    .then(() => app.listen(SERVER_PORT, () => console.log(`Servidor OK Porta: ${SERVER_PORT}`)));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Importação dos Modelos
const User = require('./models/User');
const Prontuario = require('./models/Prontuario'); // <-- Adicionado para a rota pública
const app = express();
require('dotenv').config()

app.use(cors());
app.use(express.json());

// ==========================================
// ROTA PÚBLICA DE EMERGÊNCIA (QR CODE)
// Fica no topo para não ser bloqueada por nenhum Token!
// ==========================================
app.get('/api/prontuario/publico/:paciente', async (req, res) => {
    try {
        const identificador = req.params.paciente;

        // 1. Busca o usuário pelo nome que veio na URL
        const user = await User.findOne({ nome: identificador });
        
        if (!user) {
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        }

        // 2. Busca o prontuário do paciente
        const prontuario = await Prontuario.findOne({ user: user._id });

        // 3. Trava de segurança: só mostra se o prontuário existir e o termo estiver aceito
        if (!prontuario || !prontuario.termoAceite) {
            return res.status(404).json({ message: 'Prontuário não disponível ou inativo.' });
        }

        // 4. Devolve os dados abertos!
        res.json(prontuario);

    } catch (error) {
        console.error('Erro na rota pública:', error);
        res.status(500).json({ message: 'Erro interno ao buscar prontuário público.' });
    }
});


// ==========================================
// IMPORTANDO AS ROTAS PROTEGIDAS
// ==========================================
const adminRoutes = require('./routes/adminRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');

// Rotas da Dra. Aisha (Admin)
app.use('/api/admin', adminRoutes);

// Rotas do Perfil do Paciente (Daqui pra baixo, exige Token)
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

        // Retornando 'name' para manter consistência com o que o front-end espera
        res.json({ token, user: { name: user.nome, role: user.role } });
    } catch (err) {
        console.error(err)
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// CADASTRO
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nome, email, password, role } = req.body;
        
        // Verifica se o usuário já existe
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
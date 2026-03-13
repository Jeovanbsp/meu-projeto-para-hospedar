const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const app = express();

app.use(cors());
app.use(express.json());

// Rota de Login Corrigida
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Utilizador não encontrado.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secreta_padrao_123',
            { expiresIn: '1d' }
        );

        // Resposta estruturada para o login.js ler sem erros
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Erro interno:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://Jeovanbsp:jbsjbsjeo1@cluster0.sxnk9v3.mongodb.net/dra_aisha?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Conectado'))
  .catch(err => console.error('❌ Erro MongoDB:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
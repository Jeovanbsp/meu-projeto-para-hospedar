const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');
const app = express();

// Configurações de Segurança e Dados
app.use(cors());
app.use(express.json());

// Rota de Login Corrigida
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Busca o usuário
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Utilizador não encontrado.' });
        }

        // 2. Compara a senha
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta.' });
        }

        // 3. Gera o Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secreta_padrao_123',
            { expiresIn: '1d' }
        );

        // 4. Resposta formatada para o seu login.js
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                role: user.role
            }
        });

    } catch (error) {
        console.error("ERRO NO LOGIN:", error);
        res.status(500).json({ message: 'Erro interno no servidor.', error: error.message });
    }
});

// CONEXÃO COM O MONGODB
// Usei a sua URI, mas adicionei o nome do banco 'test' ou 'dra_aisha' antes do '?'
const MONGODB_URI = "mongodb+srv://Jeovanbsp:jbsjbsjeo1@cluster0.sxnk9v3.mongodb.net/dra_aisha?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas com sucesso!'))
  .catch(err => console.error('❌ Erro de conexão com o banco:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const app = express();

app.use(cors());
app.use(express.json());

// ROTA DE LOGIN DEFINITIVA
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: 'Utilizador não encontrado.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Senha incorreta.' });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            'secreta_123',
            { expiresIn: '1d' }
        );

        // Envia os dados exatamente como o login.js vai ler
        res.status(200).json({
            token,
            user: { name: user.name, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor' });
    }
});

// SUA CONEXÃO DIRETA
const MONGODB_URI = "mongodb+srv://Jeovanbsp:jbsjbsjeo1@cluster0.sxnk9v3.mongodb.net/dra_aisha?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Banco Conectado'))
  .catch(err => console.error('❌ Erro Banco:', err));

app.listen(process.env.PORT || 3001, () => console.log(`🚀 Online`));
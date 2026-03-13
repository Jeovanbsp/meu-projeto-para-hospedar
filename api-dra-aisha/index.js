const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Limpa o email para evitar erros de digitação
        const emailLimpo = email.toLowerCase().trim();

        const user = await User.findOne({ email: emailLimpo });
        
        if (!user) {
            return res.status(400).json({ message: 'Utilizador não encontrado (Verifique o email).' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha incorreta.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            'secreta_123_aisha',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: { name: user.name, role: user.role }
        });

    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

const MONGODB_URI = "mongodb+srv://Jeovanbsp:jbsjbsjeo1@cluster0.sxnk9v3.mongodb.net/dra_aisha?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Base de dados conectada'))
  .catch(err => console.error('❌ Erro no banco:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor pronto`));
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

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        // Busca o usuário apenas pelo email
        const user = await User.findOne({ email: email });
        
        if (!user) return res.status(400).json({ message: 'Usuário não encontrado' });

        // Compara a senha
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Senha incorreta' });

        // Cria o token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        // Retorna os dados exatamente como o JS vai ler
        res.json({
            token,
            user: { name: user.name, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ message: 'Erro interno', error: err.message });
    }
});

mongoose.connect(process.env.MONGODB_URI || "sua_uri_aqui")
    .then(() => app.listen(process.env.PORT || 3001, () => console.log("Rodando!")))
    .catch(err => console.log(err));
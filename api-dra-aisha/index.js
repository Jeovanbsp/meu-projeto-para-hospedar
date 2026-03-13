const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const app = express();

app.use(cors());
app.use(express.json());

// ROTA DE LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) return res.status(400).json({ message: 'E-mail não cadastrado.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Senha incorreta.' });

        const token = jwt.sign({ id: user._id, role: user.role }, 'secret_aisha', { expiresIn: '1d' });

        res.json({ token, user: { name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});

// ROTA DE CADASTRO (Para o Admin criar pacientes)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            name,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: role || 'paciente'
        });

        await newUser.save();
        res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: 'Erro ao cadastrar.' });
    }
});

mongoose.connect("mongodb+srv://Jeovanbsp:jbsjbsjeo1@cluster0.sxnk9v3.mongodb.net/dra_aisha?retryWrites=true&w=majority")
    .then(() => app.listen(process.env.PORT || 3001, () => console.log("Servidor OK")));
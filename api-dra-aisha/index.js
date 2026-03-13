const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const app = express();

app.use(cors());
app.use(express.json());

// ROTA DE LOGIN - REVISADA PARA NÃO DAR ERRO 500
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Procura o utilizador
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: 'Utilizador não encontrado.' });
        }

        // 2. Verifica a senha (O bcrypt pode dar erro 500 se a senha no banco for inválida)
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Senha incorreta.' });
            }
        } catch (bcryptError) {
            return res.status(500).json({ message: 'Erro ao verificar senha. Tente redefinir a senha do utilizador.' });
        }

        // 3. Gera o Token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            'secreta_123_aisha',
            { expiresIn: '1d' }
        );

        // 4. Envia a resposta
        return res.status(200).json({
            token,
            user: {
                name: user.name,
                role: user.role || 'paciente'
            }
        });

    } catch (error) {
        console.error("ERRO CRÍTICO NO LOGIN:", error);
        return res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// LIGAÇÃO DIRETA AO BANCO (Sem depender de variáveis do Render para testar)
const MONGODB_URI = "mongodb+srv://Jeovanbsp:jbsjbsjeo1@cluster0.sxnk9v3.mongodb.net/dra_aisha?retryWrites=true&w=majority";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Base de dados conectada'))
  .catch(err => console.error('❌ Erro ao ligar ao banco:', err));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor pronto na porta ${PORT}`));
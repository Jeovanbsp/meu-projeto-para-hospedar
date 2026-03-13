const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Importação dos Modelos e Middlewares
const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const authMiddleware = require('./middleware/authMiddleware');
// Se você tiver um adminMiddleware, descomente a linha abaixo e adicione nas rotas de admin
// const adminMiddleware = require('./middleware/adminMiddleware'); 

const app = express();

// Configurações (Middlewares globais)
app.use(cors());
app.use(express.json());

// ========================================================================
// 1. ROTAS DE AUTENTICAÇÃO (Login / Cadastro)
// ========================================================================

// Rota de Cadastro (Mantida no backend caso você queira criar contas via Postman/Admin)
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // Verifica se usuário já existe
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'Email já registado.' });

        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Cria o usuário (role padrão é 'paciente' se não for enviado)
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'paciente'
        });

        await user.save();
        res.status(201).json({ message: 'Utilizador criado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// Rota de Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Credenciais inválidas.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Credenciais inválidas.' });

        // Gera o Token JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secreta_padrao_123',
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
});

// ========================================================================
// 2. ROTA PÚBLICA (QR CODE) - Acesso sem Token
// ========================================================================

app.get('/api/prontuario/publico/:userId', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.params.userId });
        
        if (!prontuario) {
            return res.status(404).json({ message: 'Prontuário não encontrado.' });
        }
        
        // Retorna apenas os dados médicos necessários (sem dados sensíveis de conta)
        res.status(200).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar dados públicos.', error: error.message });
    }
});

// ========================================================================
// 3. ROTAS DO PACIENTE (Requer authMiddleware)
// ========================================================================

// Buscar o próprio prontuário
app.get('/api/prontuario', authMiddleware, async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.user.id });
        if (!prontuario) return res.status(200).json({ message: 'Nenhum prontuário encontrado.', user: req.user.id });
        
        res.status(200).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar prontuário.', error: error.message });
    }
});

// Criar ou Atualizar o próprio prontuário
app.post('/api/prontuario', authMiddleware, async (req, res) => {
    try {
        const dadosProntuario = req.body;
        
        // Procura se já existe um prontuário para este utilizador
        let prontuario = await Prontuario.findOne({ user: req.user.id });

        if (prontuario) {
            // Atualiza
            prontuario = await Prontuario.findOneAndUpdate(
                { user: req.user.id },
                { $set: dadosProntuario },
                { new: true }
            );
        } else {
            // Cria um novo
            prontuario = new Prontuario({
                user: req.user.id,
                ...dadosProntuario
            });
            await prontuario.save();
        }

        res.status(200).json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao guardar prontuário.', error: error.message });
    }
});

// ========================================================================
// 4. ROTAS DO ADMINISTRADOR (Painel da Dra. Aisha)
// ========================================================================
// Nota: Se você usar o adminMiddleware, coloque-o ao lado do authMiddleware
// Exemplo: app.get('/api/admin/pacientes', authMiddleware, adminMiddleware, async ...

// Buscar TODOS os pacientes e seus prontuários
app.get('/api/admin/pacientes', authMiddleware, async (req, res) => {
    try {
        // Busca todos os usuários com role 'paciente'
        const pacientes = await User.find({ role: 'paciente' }).select('-password');
        
        // Para cada paciente, busca o seu prontuário associado
        const listaCompleta = await Promise.all(pacientes.map(async (paciente) => {
            const prontuario = await Prontuario.findOne({ user: paciente._id });
            return {
                _id: paciente._id,
                name: paciente.name,
                email: paciente.email,
                prontuario: prontuario || null
            };
        }));

        res.status(200).json(listaCompleta);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar lista de pacientes.', error: error.message });
    }
});

// Buscar UM paciente específico para edição no admin
app.get('/api/admin/paciente/:id', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'Paciente não encontrado.' });

        const prontuario = await Prontuario.findOne({ user: req.params.id });
        
        res.status(200).json({ user, prontuario });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar paciente.', error: error.message });
    }
});

// Atualizar o prontuário de UM paciente pelo Admin
app.put('/api/admin/paciente/:id', authMiddleware, async (req, res) => {
    try {
        const dadosProntuario = req.body;
        
        let prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id },
            { $set: dadosProntuario },
            { new: true, upsert: true } // O upsert garante que se não existir, ele cria
        );

        res.status(200).json({ message: 'Prontuário atualizado com sucesso.', prontuario });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar prontuário.', error: error.message });
    }
});

// Excluir paciente (Exclui Usuário + Prontuário)
app.delete('/api/admin/paciente/:id', authMiddleware, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Prontuario.findOneAndDelete({ user: req.params.id });
        res.status(200).json({ message: 'Paciente e prontuário removidos com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover paciente.', error: error.message });
    }
});


// ========================================================================
// 5. LIGAÇÃO À BASE DE DADOS E ARRANQUE DO SERVIDOR
// ========================================================================

const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("ERRO FATAL: Variável MONGODB_URI não definida no .env ou nas configurações do servidor.");
    process.exit(1);
}

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
    app.listen(PORT, () => {
        console.log(`🚀 Servidor a rodar na porta ${PORT}`);
    });
})
.catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err);
});
// Arquivo: /routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Prontuario = require('../models/Prontuario');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protege TODAS as rotas deste arquivo exigindo token e nível admin
router.use(authMiddleware, adminMiddleware);

// 1. DASHBOARD: Listar todos os pacientes com status do termo
router.get('/pacientes', async (req, res) => {
    try {
        const pacientes = await User.find({ role: 'paciente' }).lean();
        const prontuarios = await Prontuario.find({ user: { $in: pacientes.map(p => p._id) } }).lean();

        const listaFormatada = pacientes.map(pac => {
            const prontuario = prontuarios.find(p => p.user.toString() === pac._id.toString());
            return {
                _id: pac._id,
                nome: pac.nome,
                email: pac.email,
                createdAt: pac.createdAt,
                termoAceite: prontuario ? prontuario.termoAceite : false
            };
        });
        res.json(listaFormatada);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pacientes.' });
    }
});

// 2. DASHBOARD: Deletar paciente e seu prontuário
router.delete('/paciente/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Prontuario.findOneAndDelete({ user: req.params.id });
        res.json({ message: 'Paciente excluído com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao excluir paciente.' });
    }
});

// 3. PRONTUÁRIO ADMIN: Buscar prontuário de um paciente específico
router.get('/prontuario/:id', async (req, res) => {
    try {
        let prontuario = await Prontuario.findOne({ user: req.params.id });
        if (!prontuario) {
            const user = await User.findById(req.params.id);
            // Retorna um "molde" vazio caso o prontuário ainda não exista no banco
            return res.json({ user: req.params.id, nomePaciente: user ? user.nome : '', termoAceite: false });
        }
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar prontuário.' });
    }
});

// 4. PRONTUÁRIO ADMIN: Salvar/Atualizar prontuário inteiro
router.post('/prontuario/:id', async (req, res) => {
    try {
        const dados = { ...req.body, user: req.params.id };
        // Atualiza se existir, ou cria se não existir (upsert: true)
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id }, 
            dados, 
            { new: true, upsert: true }
        );
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar prontuário.' });
    }
});

// 5. EVOLUÇÃO: Criar nova evolução
router.post('/prontuario/:id/evolucao', async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id },
            { $push: { evolucoes: { titulo, texto, autor: 'Dra. Aisha' } } },
            { new: true, upsert: true }
        );
        res.json({ prontuario });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar evolução.' });
    }
});

// 6. EVOLUÇÃO: Editar evolução existente
router.put('/prontuario/:id/evolucao/:evolucaoId', async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id, "evolucoes._id": req.params.evolucaoId },
            { $set: { "evolucoes.$.titulo": titulo, "evolucoes.$.texto": texto } },
            { new: true }
        );
        res.json({ prontuario });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao editar evolução.' });
    }
});

// 7. EVOLUÇÃO: Deletar evolução
router.delete('/prontuario/:id/evolucao/:evolucaoId', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id },
            { $pull: { evolucoes: { _id: req.params.evolucaoId } } },
            { new: true }
        );
        res.json({ prontuario });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar evolução.' });
    }
});

module.exports = router;
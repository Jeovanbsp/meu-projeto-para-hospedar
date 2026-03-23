const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Prontuario = require('../models/Prontuario');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

// ROTA BUSCA: Agora retorna o RG e todos os campos detalhados
router.get('/prontuario/:id', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.params.id }).lean();
        if (!prontuario) {
            const user = await User.findById(req.params.id);
            return res.json({ user: req.params.id, nomePaciente: user?.nome || '', termoAceite: false });
        }
        res.json(prontuario);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar.' }); }
});

// ROTA SALVA: Salva RG, Médicos, Medicações e Status
router.post('/prontuario/:id', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id }, 
            { ...req.body, user: req.params.id }, 
            { new: true, upsert: true }
        );
        res.json(prontuario);
    } catch (error) { res.status(500).json({ message: 'Erro ao salvar.' }); }
});

// ROTA EVOLUÇÃO (POST): Adiciona data e autor automaticamente
router.post('/prontuario/:id/evolucao', async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id },
            { $push: { evolucoes: { titulo, texto, autor: 'Dra. Aisha', data: new Date() } } },
            { new: true, upsert: true }
        );
        res.json({ prontuario });
    } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// ROTA EVOLUÇÃO (PUT): Edição mantendo a data original ou atualizando se desejar
router.put('/prontuario/:id/evolucao/:evolucaoId', async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id, "evolucoes._id": req.params.evolucaoId },
            { $set: { "evolucoes.$.titulo": titulo, "evolucoes.$.texto": texto, "evolucoes.$.data": new Date() } },
            { new: true }
        );
        res.json({ prontuario });
    } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

// ROTA EVOLUÇÃO (DELETE)
router.delete('/prontuario/:id/evolucao/:evolucaoId', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id },
            { $pull: { evolucoes: { _id: req.params.evolucaoId } } },
            { new: true }
        );
        res.json({ prontuario });
    } catch (error) { res.status(500).json({ message: 'Erro.' }); }
});

module.exports = router;
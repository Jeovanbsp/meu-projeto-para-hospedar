const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Prontuario = require('../models/Prontuario');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware, adminMiddleware);

// DASHBOARD: Listar pacientes para a tabela e gráfico
router.get('/pacientes', async (req, res) => {
    try {
        const pacientes = await User.find({ role: 'paciente' }).lean();
        const prontuarios = await Prontuario.find({ user: { $in: pacientes.map(p => p._id) } }).lean();
        const lista = pacientes.map(pac => {
            const pront = prontuarios.find(p => p.user.toString() === pac._id.toString());
            return {
                _id: pac._id, nome: pac.nome, email: pac.email, createdAt: pac.createdAt,
                idade: pront ? pront.idade : null,
                termoAceite: pront ? pront.termoAceite : false
            };
        });
        res.json(lista);
    } catch (error) { res.status(500).json({ message: 'Erro ao buscar pacientes.' }); }
});

// BUSCA DETALHADA: Carrega tudo (RG, Médicos, Medicamentos, Evoluções)
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

// SALVAR TUDO: O que o Admin mudar aqui, o paciente verá no perfil dele
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

// EVOLUÇÕES: Criar, Editar e Deletar
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

router.delete('/paciente/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Prontuario.findOneAndDelete({ user: req.params.id });
        res.json({ message: 'Sucesso' });
    } catch (error) { res.status(500).json({ message: 'Erro' }); }
});

module.exports = router;
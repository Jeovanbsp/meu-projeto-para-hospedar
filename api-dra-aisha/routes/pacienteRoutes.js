// Arquivo: /routes/pacienteRoutes.js

const express = require('express');
const router = express.Router();
const Prontuario = require('../models/Prontuario');
const authMiddleware = require('../middleware/authMiddleware');

// Protege exigindo apenas que o usuário esteja logado
router.use(authMiddleware);

// 1. Buscar o prontuário do paciente logado
router.get('/', async (req, res) => {
    try {
        // req.user.id vem do token decodificado pelo authMiddleware
        const prontuario = await Prontuario.findOne({ user: req.user.id });
        if (!prontuario) {
            return res.json({ user: req.user.id, termoAceite: false });
        }
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar seu prontuário.' });
    }
});

// 2. Paciente salva seu próprio prontuário (ex: Aceite de Termo)
router.post('/', async (req, res) => {
    try {
        const dados = { ...req.body, user: req.user.id };
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.user.id }, 
            dados, 
            { new: true, upsert: true }
        );
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar informações.' });
    }
});

module.exports = router;
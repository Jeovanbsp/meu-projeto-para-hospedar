// Arquivo: /routes/prontuarioRoutes.js

const express = require('express');
const router = express.Router();
const Prontuario = require('../models/Prontuario');

// Importando os seus "guardas" de segurança
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// 1. ROTA POST: Criar um novo prontuário (Apenas Admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // req.body vai conter os dados enviados pelo front-end (idade, patologias, etc)
        const novoProntuario = new Prontuario(req.body);
        
        await novoProntuario.save();
        res.status(201).json({ message: 'Prontuário criado com sucesso!', prontuario: novoProntuario });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar prontuário.', erro: error.message });
    }
});

// 2. ROTA GET: Buscar todos os prontuários (Apenas Admin)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // O .populate('user') serve para trazer os dados do paciente (nome, email) atrelados a este prontuário
        const prontuarios = await Prontuario.find().populate('user', 'nome email');
        res.json(prontuarios);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar prontuários.' });
    }
});

module.exports = router;
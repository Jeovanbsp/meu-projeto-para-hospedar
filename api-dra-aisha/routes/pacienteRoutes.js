const express = require('express');
const router = express.Router();
const Prontuario = require('../models/Prontuario');
const User = require('../models/User'); // <-- Adicionado para conseguirmos buscar pelo nome
const authMiddleware = require('../middleware/authMiddleware');

// =======================================================
// 1. ROTA PÚBLICA (QR CODE) - ACESSO LIVRE
// ATENÇÃO: Tem que ficar ANTES do authMiddleware!
// =======================================================
router.get('/publico/:paciente', async (req, res) => {
    try {
        const identificador = req.params.paciente;

        // Tenta achar o paciente pelo nome que veio no link do QR Code
        const user = await User.findOne({ nome: identificador });
        
        if (!user) {
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        }

        // Se achou o paciente, busca o prontuário dele
        const prontuario = await Prontuario.findOne({ user: user._id });

        // Verifica se o prontuário existe e se o termo foi aceito
        if (!prontuario || !prontuario.termoAceite) {
            return res.status(404).json({ message: 'Prontuário não disponível.' });
        }

        // Envia os dados abertos para a página pública
        res.json(prontuario);

    } catch (error) {
        console.error('Erro na rota pública:', error);
        res.status(500).json({ message: 'Erro interno ao buscar prontuário público.' });
    }
});

// =======================================================
// 2. CATRACA DE SEGURANÇA (Daqui pra baixo, exige login)
// =======================================================
router.use(authMiddleware);

// 3. Buscar o prontuário do paciente logado
router.get('/', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.user.id });
        if (!prontuario) {
            return res.json({ user: req.user.id, termoAceite: false });
        }
        res.json(prontuario);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar seu prontuário.' });
    }
});

// 4. Paciente salva seu próprio prontuário (ex: Aceite de Termo)
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
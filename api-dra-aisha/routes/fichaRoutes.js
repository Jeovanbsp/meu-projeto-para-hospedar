const express = require('express');
const router = express.Router();
const FichaPreAtendimento = require('../models/FichaPreAtendimento');

// ROTA PÚBLICA: Recebe a ficha de pré-atendimento enviada pelo site
router.post('/', async (req, res) => {
    try {
        const { nome, cpf, dataNascimento, lgpdAceite, respostas } = req.body;

        if (!nome || !nome.trim()) {
            return res.status(400).json({ message: 'O nome é obrigatório.' });
        }

        if (lgpdAceite !== true) {
            return res.status(400).json({ message: 'É necessário aceitar o termo de privacidade (LGPD) para enviar a ficha.' });
        }

        const ficha = new FichaPreAtendimento({
            nome: nome.trim(),
            cpf: cpf || '',
            dataNascimento: dataNascimento || '',
            lgpdAceite: true,
            respostas: respostas || {}
        });

        await ficha.save();
        res.status(201).json({ message: 'Ficha enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar ficha de pré-atendimento:', error);
        res.status(500).json({ message: 'Erro ao enviar a ficha. Tente novamente.' });
    }
});

module.exports = router;

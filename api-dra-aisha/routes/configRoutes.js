const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// ROTAS PROTEGIDAS (LGPD): dados de pacientes (nomes, contatos, endereços)
// não podem ficar expostos publicamente. Exige login (token JWT).
router.use(authMiddleware);
// Salvar disponibilidade
router.post('/disponibilidade', async (req, res) => {
    try {
        const data = req.body;
        await require('../models/Config').findOneAndUpdate({ key: 'disponibilidade' }, { key: 'disponibilidade', value: data }, { upsert: true });
        res.json({ message: 'Salvo' });
    } catch (error) { res.status(500).json({ message: 'Erro' }); }
});
router.get('/disponibilidade', async (req, res) => {
    try {
        const config = await require('../models/Config').findOne({ key: 'disponibilidade' });
        res.json(config?.value || []);
    } catch (error) { res.status(500).json([]); }
});

// Salvar pacientes
router.post('/pacientes', async (req, res) => {
    try {
        const data = req.body;
        await require('../models/Config').findOneAndUpdate({ key: 'pacientes' }, { key: 'pacientes', value: data }, { upsert: true });
        res.json({ message: 'Salvo' });
    } catch (error) { res.status(500).json({ message: 'Erro' }); }
});
router.get('/pacientes', async (req, res) => {
    try {
        const config = await require('../models/Config').findOne({ key: 'pacientes' });
        res.json(config?.value || []);
    } catch (error) { res.status(500).json([]); }
});

// Salvar historico
router.post('/historico', async (req, res) => {
    try {
        const data = req.body;
        await require('../models/Config').findOneAndUpdate({ key: 'historico' }, { key: 'historico', value: data }, { upsert: true });
        res.json({ message: 'Salvo' });
    } catch (error) { res.status(500).json({ message: 'Erro' }); }
});
router.get('/historico', async (req, res) => {
    try {
        const config = await require('../models/Config').findOne({ key: 'historico' });
        res.json(config?.value || []);
    } catch (error) { res.status(500).json([]); }
});

// Salvar tags
router.post('/tags', async (req, res) => {
    try {
        const data = req.body;
        await require('../models/Config').findOneAndUpdate({ key: 'tags' }, { key: 'tags', value: data }, { upsert: true });
        res.json({ message: 'Salvo' });
    } catch (error) { res.status(500).json({ message: 'Erro' }); }
});
router.get('/tags', async (req, res) => {
    try {
        const config = await require('../models/Config').findOne({ key: 'tags' });
        res.json(config?.value || []);
    } catch (error) { res.status(500).json([]); }
});

// Salvar mensagens
router.post('/mensagens', async (req, res) => {
    try {
        const data = req.body;
        await require('../models/Config').findOneAndUpdate({ key: 'mensagens' }, { key: 'mensagens', value: data }, { upsert: true });
        res.json({ message: 'Salvo' });
    } catch (error) { res.status(500).json({ message: 'Erro' }); }
});
router.get('/mensagens', async (req, res) => {
    try {
        const config = await require('../models/Config').findOne({ key: 'mensagens' });
        res.json(config?.value || []);
    } catch (error) { res.status(500).json([]); }
});

// Salvar appointments
router.post('/appointments', async (req, res) => {
    try {
        const data = req.body;
        await require('../models/Config').findOneAndUpdate({ key: 'appointments' }, { key: 'appointments', value: data }, { upsert: true });
        res.json({ message: 'Salvo' });
    } catch (error) { res.status(500).json({ message: 'Erro' }); }
});
router.get('/appointments', async (req, res) => {
    try {
        const config = await require('../models/Config').findOne({ key: 'appointments' });
        res.json(config?.value || []);
    } catch (error) { res.status(500).json([]); }
});

module.exports = router;

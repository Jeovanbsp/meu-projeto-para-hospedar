const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Prontuario = require('../models/Prontuario');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Protege todas as rotas deste arquivo
router.use(authMiddleware, adminMiddleware);

// 1. DASHBOARD: Listar pacientes com idade, termo, senha e telefone (ATUALIZADO)
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
                telefone: pac.telefone || '', // Adicionado para funcionar o botão do WhatsApp
                senha: pac.senha || pac.password || '', // Adicionado para mostrar a senha no Painel
                createdAt: pac.createdAt,
                idade: prontuario ? prontuario.idade : null,
                termoAceite: prontuario ? prontuario.termoAceite : false
            };
        });
        res.json(listaFormatada);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar pacientes.' });
    }
});

// 2. BUSCA PRONTUÁRIO: Carrega RG, Médicos, Medicamentos e Evoluções
router.get('/prontuario/:id', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOne({ user: req.params.id }).lean();
        if (!prontuario) {
            const user = await User.findById(req.params.id);
            return res.json({ user: req.params.id, nomePaciente: user?.nome || '', termoAceite: false });
        }
        res.json(prontuario);
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao buscar.' }); 
    }
});

// 3. SALVAR PRONTUÁRIO: Admin edita tudo
router.post('/prontuario/:id', async (req, res) => {
    try {
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id }, 
            { ...req.body, user: req.params.id }, 
            { new: true, upsert: true }
        );
        res.json(prontuario);
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao salvar.' }); 
    }
});

// 4. EVOLUÇÃO (CRUD)
router.post('/prontuario/:id/evolucao', async (req, res) => {
    try {
        const { titulo, texto } = req.body;
        const prontuario = await Prontuario.findOneAndUpdate(
            { user: req.params.id },
            { $push: { evolucoes: { titulo, texto, autor: 'Dra. Aisha', data: new Date() } } },
            { new: true, upsert: true }
        );
        res.json({ prontuario });
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao registrar evolução.' }); 
    }
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
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao editar evolução.' }); 
    }
});

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

// 5. ATUALIZAR DADOS DE ACESSO DO PACIENTE (A ROTA NOVA QUE FALTAVA)
router.put('/paciente/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone, password, senha } = req.body;

        let paciente = await User.findById(id);
        
        if (!paciente) {
            return res.status(404).json({ message: "Paciente não encontrado." });
        }

        // Atualiza campos básicos se enviados
        if (nome) paciente.nome = nome;
        if (email) paciente.email = email;
        if (telefone !== undefined) paciente.telefone = telefone;

        // Verifica se a médica digitou uma nova senha
        const novaSenha = password || senha;
        if (novaSenha && novaSenha.trim() !== '') {
            paciente.password = novaSenha; // Atualiza a senha oficial do model
            paciente.senha = novaSenha; // Caso você use um campo extra para expor no front
        }

        await paciente.save();
        res.json({ message: "Acesso do paciente atualizado com sucesso!" });

    } catch (error) {
        console.error("Erro ao atualizar paciente:", error);
        res.status(500).json({ message: "Erro interno no servidor ao tentar atualizar." });
    }
});

// 6. DELETAR PACIENTE E PRONTUÁRIO
router.delete('/paciente/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Prontuario.findOneAndDelete({ user: req.params.id });
        res.json({ message: 'Sucesso' });
    } catch (error) { 
        res.status(500).json({ message: 'Erro ao deletar paciente.' }); 
    }
});

module.exports = router;
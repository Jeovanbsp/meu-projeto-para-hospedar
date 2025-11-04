// Arquivo: /index.js (Completo e Finalizado para Admin/Paciente)

// 1. Importar as ferramentas
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 

// 2. IMPORTAR NOSSOS MODELOS E O MIDDLEWARE
const User = require('./models/User');
const Prontuario = require('./models/Prontuario');
const authMiddleware = require('./middleware/authMiddleware');
const adminMiddleware = require('./middleware/adminMiddleware'); 

// 3. Inicializar o Express
const app = express();

// 4. Configurar Middlewares
app.use(cors());
app.use(express.json());

// 5. Pegar as variáveis do .env
const PORT = process.env.PORT || 3001;
const dbURI = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

// 6. Conectar ao Banco de Dados
mongoose.set('strictQuery', false); 
mongoose.connect(dbURI)
  .then(() => {
    console.log('✅ Conectado ao MongoDB Atlas com sucesso!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  });

// 7. =============================================
//    ROTAS DE AUTENTICAÇÃO (PÚBLICAS)
//    =============================================

// Rota de Teste
app.get('/', (req, res) => {
  res.json({ message: 'Bem-vindo à API do Prontuário da Dra. Aisha!' });
});

// Rota de Cadastro
app.post('/auth/register', async (req, res) => {
  console.log('Recebida requisição de cadastro:', req.body);
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
  if (senha.length < 6) return res.status(400).json({ message: 'A senha precisa ter no mínimo 6 caracteres.' });
  try {
    const userExists = await User.findOne({ email: email });
    if (userExists) return res.status(400).json({ message: 'Este e-mail já está cadastrado.' });
    const newUser = new User({ nome, email, password: senha });
    await newUser.save();
    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: { id: newUser._id, nome: newUser.nome, email: newUser.email }});
  } catch (error) {
    console.error('Erro no cadastro:', error.message);
    res.status(500).json({ message: 'Erro interno no servidor. Tente novamente.' });
  }
});

// Rota de Login
app.post('/auth/login', async (req, res) => {
  console.log('Recebida requisição de login:', req.body);
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ message: 'Por favor, forneça e-mail e senha.' });
  try {
    const user = await User.findOne({ email: email }).select('+password');
    if (!user) return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
    const isMatch = await bcrypt.compare(senha, user.password);
    if (!isMatch) return res.status(400).json({ message: 'E-mail ou senha inválidos.' });
    const payload = { userId: user._id, nome: user.nome, role: user.role };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '1d' });
    
    // CORREÇÃO: Envia o role para o frontend redirecionar
    res.status(200).json({
      message: 'Login bem-sucedido!',
      token: token,
      userName: user.nome,
      role: user.role
    });
  } catch (error) {
    console.error('Erro no login:', error.message);
    res.status(500).json({ message: 'Erro interno no servidor. Tente novamente.' });
  }
});

// Rota Pública (QR Code)
app.get('/api/public-prontuario/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'ID de usuário inválido.' });
    }
    const prontuario = await Prontuario.findOne({ user: userId });
    if (!prontuario) {
      return res.status(404).json({ message: 'Prontuário não encontrado.' });
    }
    res.status(200).json(prontuario);
  } catch (error) {
    console.error('Erro ao buscar prontuário público:', error.message);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// 8. =============================================
//    ROTAS DO PRONTUÁRIO (PACIENTE)
//    =============================================

// Rota para BUSCAR o prontuário do usuário logado
app.get('/api/prontuario', authMiddleware, async (req, res) => {
  console.log(`Buscando prontuário para o usuário: ${req.user.userId}`);
  try {
    let prontuario = await Prontuario.findOne({ user: req.user.userId });
    if (!prontuario) {
      console.log('Nenhum prontuário encontrado. Criando um novo...');
      prontuario = new Prontuario({
        user: req.user.userId, nomePaciente: req.user.nome, medicacoes: [], medicosAssistentes: []
      });
      await prontuario.save();
    }
    res.status(200).json(prontuario);
  } catch (error) {
    console.error('Erro ao buscar prontuário:', error.message);
    res.status(500).json({ message: 'Erro ao buscar dados do prontuário.' });
  }
});

// Rota para SALVAR (Atualizar ou Criar) o prontuário
app.post('/api/prontuario', authMiddleware, async (req, res) => {
  console.log(`Salvando prontuário para o usuário: ${req.user.userId}`);
  const { nomePaciente, idade, patologias, medicosAssistentes, medicacoes } = req.body;
  try {
    const dadosProntuario = {
      user: req.user.userId, nomePaciente, idade, patologias, medicosAssistentes, medicacoes 
    };

    const prontuarioAtualizado = await Prontuario.findOneAndUpdate(
      { user: req.user.userId }, 
      dadosProntuario,          
      { new: true, upsert: true } 
    );
    res.status(200).json({ message: 'Prontuário salvo com sucesso!', prontuario: prontuarioAtualizado });
  } catch (error) {
    console.error('Erro ao salvar prontuário:', error.message);
    res.status(500).json({ message: 'Erro ao salvar dados do prontuário.' });
  }
});


// 9. =============================================
//    ROTAS DE ADMIN (PROTEGIDAS)
//    =============================================

// Rota 1: Admin ver TODOS os pacientes
app.get('/api/admin/pacientes', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Busca todos os usuários que têm o role "paciente"
    const pacientes = await User.find({ role: 'paciente' }).select('nome email createdAt');
    res.status(200).json(pacientes);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar pacientes.' });
  }
});

// Rota 2: Admin buscar o prontuário de UM paciente para EDIÇÃO
app.get('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const prontuario = await Prontuario.findOne({ user: userId });

    if (!prontuario) {
      const user = await User.findById(userId).select('nome');
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      return res.status(200).json({
        user: userId,
        nomePaciente: user.nome,
        idade: null,
        patologias: '',
        medicosAssistentes: [],
        medicacoes: []
      });
    }

    res.status(200).json(prontuario);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar prontuário para edição.' });
  }
});

// Rota 3: Admin SALVAR/ATUALIZAR o prontuário de UM paciente
app.post('/api/admin/prontuario/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    const { nomePaciente, idade, patologias, medicosAssistentes, medicacoes } = req.body;

    const dadosProntuario = {
      user: userId, // ID do paciente que está sendo editado 
      nomePaciente,
      idade,
      patologias,
      medicosAssistentes,
      medicacoes
    };

    const prontuarioAtualizado = await Prontuario.findOneAndUpdate(
      { user: userId },
      dadosProntuario,
      { new: true, upsert: true }
    );

    res.status(200).json({
      message: 'Prontuário atualizado com sucesso pela Admin!',
      prontuario: prontuarioAtualizado
    });
  } catch (error) {
    console.error('Erro ao salvar prontuário (Admin):', error.message);
    res.status(500).json({ message: 'Erro ao salvar dados do prontuário.' });
  }
});

// Rota 4: Admin DELETAR um paciente (usuário)
app.delete('/api/admin/paciente/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.userId;
    await Prontuario.findOneAndDelete({ user: userId }); // Deleta o Prontuário
    await User.findByIdAndDelete(userId); // Deleta o Usuário (login)
    res.status(200).json({ message: 'Paciente e seu prontuário foram deletados com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar paciente:', error.message);
    res.status(500).json({ message: 'Erro ao deletar paciente.' });
  }
});
// Arquivo: /js/admin-prontuario.js

document.addEventListener('DOMContentLoaded', () => {

  // --- CONFIGURAÇÃO E SEGURANÇA ---
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const API_URL_BASE = 'https://aishageriatria.onrender.com';
  
  // O ID do paciente que está na URL: ?id=XXXXXXXX
  const pacienteId = new URLSearchParams(window.location.search).get('id');

  // Segurança: Se não for Admin OU não tiver o ID do paciente, chuta.
  if (!token || role !== 'admin' || !pacienteId) {
    localStorage.clear();
    window.location.href = 'login.html';
    return;
  }
  // --- FIM DA SEGURANÇA ---


  // --- SELETORES ---
  const tituloEdicao = document.getElementById('titulo-edicao');
  const nomePacienteInput = document.getElementById('nome-paciente');
  const idadeInput = document.getElementById('idade');
  const patologiasInput = document.getElementById('patologias');
  const formAddMedico = document.getElementById('form-add-medico');
  const nomeMedicoInput = document.getElementById('nome-medico');
  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  const formAddMedicacao = document.getElementById('form-add-medicacao');
  const nomeMedicacaoInput = document.getElementById('nome-medicacao');
  const horarioEspecificoInput = document.getElementById('horario-especifico'); 
  const checkboxesHorarios = document.querySelectorAll('input[name="horario"]');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); // ID diferente!
  const mensagemRetorno = document.getElementById('mensagem-retorno');

  // --- ESTADO LOCAL ---
  let currentMedicacoes = [];
  let currentMedicos = []; 

  const mapTurnos = {
    antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço',
    tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir'
  };


  // --- FUNÇÕES DE CARREGAMENTO E EDIÇÃO ---

  const fetchProntuario = async () => {
    try {
      // Chama a rota de ADMIN, passando o ID do paciente na URL
      const response = await fetch(API_URL_BASE + pacienteId, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar dados do paciente.');
      }
      const data = await response.json();
      
      tituloEdicao.innerText = `Editando Prontuário: ${data.nomePaciente || 'Novo Paciente'}`;
      populateForm(data); 
      
      currentMedicacoes = data.medicacoes || []; 
      renderTabelaMedicacoes();
      
      currentMedicos = data.medicosAssistentes || []; 
      renderMedicosList(); 
      
    } catch (error) {
      console.error('Erro ao carregar prontuário Admin:', error);
      mensagemRetorno.innerText = `Erro: ${error.message}`;
      mensagemRetorno.style.color = '#e74c3c';
    }
  };

  const handleSalvarTudo = async (event) => {
    event.preventDefault();
    
    btnSalvarTudo.disabled = true;
    btnSalvarTudo.innerText = 'Salvando Edição...';
    mensagemRetorno.innerText = '';

    const dadosProntuario = {
      nomePaciente: nomePacienteInput.value,
      idade: idadeInput.value,
      patologias: patologiasInput.value,
      medicosAssistentes: currentMedicos, 
      medicacoes: currentMedicacoes 
    };

    try {
      // Chama a rota de POST Admin para salvar a edição
      const response = await fetch(API_URL_BASE + pacienteId, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dadosProntuario)
      });
      
      const data = await response.json();
      if (response.ok) {
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#2ADCA1';
        tituloEdicao.innerText = `Editando Prontuário: ${nomePacienteInput.value}`; 
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      mensagemRetorno.innerText = `Erro: ${error.message || 'Não foi possível salvar.'}`;
      mensagemRetorno.style.color = '#e74c3c';
    }
    btnSalvarTudo.disabled = false;
    btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
  };

  // --- FUNÇÕES DE SUPORTE (IDÊNTICAS AO PERFIL-PACIENTE.JS) ---

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
  };
  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    if (currentMedicos.length === 0) {
      listaMedicosPills.innerHTML = '<li style="font-size: 14px; color: #777;">Nenhum médico assistente adicionado.</li>';
      return;
    }
    currentMedicos.forEach((medico, index) => {
      const pill = `<li class="pill-medico"><span>${medico}</span><button class="btn-deletar-medico no-print" data-index="${index}">✖</button></li>`;
      listaMedicosPills.insertAdjacentHTML('beforeend', pill);
    });
  };
  const handleAddMedico = (event) => {
    event.preventDefault();
    const nome = nomeMedicoInput.value.trim(); 
    if (!nome) { alert('Por favor, digite o nome do médico.'); return; }
    currentMedicos.push(nome); 
    renderMedicosList(); 
    nomeMedicoInput.value = ''; 
  };
  const handleDeleteMedico = (event) => {
    if (event.target.classList.contains('btn-deletar-medico')) {
      const index = parseInt(event.target.dataset.index, 10);
      currentMedicos.splice(index, 1); 
      renderMedicosList(); 
    }
  };
  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = ''; 
    if (currentMedicacoes.length === 0) {
      listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhuma medicação adicionada.</td></tr>';
      return;
    }
    const medicoesOrdenadas = [...currentMedicacoes]; 
    medicoesOrdenadas.sort((a, b) => {
      const horarioA = a.horarioEspecifico || '99:99';
      const horarioB = b.horarioEspecifico || '99:99';
      if (horarioA < horarioB) return -1;
      if (horarioA > horarioB) return 1;
      return a.nome.localeCompare(b.nome);
    });
    medicoesOrdenadas.forEach((med) => { 
      let turnosHtml = '';
      for (const [key, value] of Object.entries(med.horarios)) {
        if (value === true) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; }
      }
      if (turnosHtml === '') { turnosHtml = 'N/A'; }
      const horarioTxt = med.horarioEspecifico || 'N/A';
      const row = `
        <tr>
          <td class="col-medicacao">${med.nome}</td>
          <td class="col-turnos">${turnosHtml}</td>
          <td class="col-horario">${horarioTxt}</td>
          <td class="col-acao no-print"><button class="btn-deletar-medacao" data-nome="${med.nome}">✖</button></td>
        </tr>
      `;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };
  const handleAddMedicacao = (event) => {
    event.preventDefault(); 
    const nome = nomeMedicacaoInput.value;
    const horarioEspecifico = horarioEspecificoInput.value; 
    if (!nome) { alert('Por favor, digite o nome da medicação.'); return; }
    const horarios = {};
    checkboxesHorarios.forEach(cb => { horarios[cb.value] = cb.checked; });
    currentMedicacoes.push({ nome: nome, horarioEspecifico: horarioEspecifico, horarios: horarios });
    renderTabelaMedicacoes();
    formAddMedicacao.reset(); 
  };
  const handleDeleteMedicacao = (event) => {
    if (event.target.classList.contains('btn-deletar-medacao')) {
      const nomeParaDeletar = event.target.dataset.nome; 
      currentMedicacoes = currentMedicacoes.filter(med => med.nome !== nomeParaDeletar);
      renderTabelaMedicacoes();
    }
  };


  // --- INICIALIZAÇÃO E OUVINTES ---
  formAddMedico.addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  formAddMedicacao.addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);

  fetchProntuario();
});
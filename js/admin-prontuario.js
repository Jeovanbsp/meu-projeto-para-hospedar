// Arquivo: /js/admin-prontuario.js (Completo com Evolução)

document.addEventListener('DOMContentLoaded', () => {

  // --- CONFIGURAÇÃO E SEGURANÇA ---
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const API_ADMIN_BASE = 'https://aishageriatria.onrender.com/api/admin/prontuario/';
  
  const pacienteId = new URLSearchParams(window.location.search).get('id');

  if (!token || role !== 'admin' || !pacienteId) {
    localStorage.clear();
    window.location.href = 'login.html';
    return;
  }

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
  
  // *** NOVOS SELETORES (EVOLUÇÃO) ***
  const textoEvolucaoInput = document.getElementById('texto-evolucao');
  const btnAddEvolucao = document.getElementById('btn-add-evolucao');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');

  const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  // Estado Local
  let currentMedicacoes = [];
  let currentMedicos = []; 
  let currentEvolucoes = []; // <-- NOVO ESTADO

  const mapTurnos = {
    antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço',
    tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir'
  };

  // --- CARREGAMENTO ---
  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) { throw new Error('Falha ao buscar dados.'); }
      const data = await response.json();
      
      tituloEdicao.innerText = `Editando Prontuário: ${data.nomePaciente || 'Novo Paciente'}`;
      
      populateForm(data); 
      currentMedicacoes = data.medicacoes || []; 
      renderTabelaMedicacoes();
      currentMedicos = data.medicosAssistentes || []; 
      renderMedicosList();

      // *** NOVO: Preenche Evoluções ***
      currentEvolucoes = data.evolucoes || [];
      renderEvolucoes();

    } catch (error) {
      console.error(error);
      mensagemRetorno.innerText = `Erro: ${error.message}`;
      mensagemRetorno.style.color = '#e74c3c';
    }
  };

  // --- FUNÇÕES DE EVOLUÇÃO (NOVAS) ---

  const renderEvolucoes = () => {
    listaEvolucoesDiv.innerHTML = '';
    
    if (currentEvolucoes.length === 0) {
      listaEvolucoesDiv.innerHTML = '<p style="color: #777; font-size: 14px; font-style: italic;">Nenhuma evolução registrada.</p>';
      return;
    }

    // Ordena para mostrar a mais recente primeiro
    const evolucoesOrdenadas = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    evolucoesOrdenadas.forEach(evo => {
      const dataFormatada = new Date(evo.data).toLocaleString('pt-BR');
      
      const cardHtml = `
        <div style="background: #f9f9f9; border-left: 4px solid #2ADCA1; padding: 15px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: #777;">
                <strong>${evo.autor || 'Dra. Aisha'}</strong>
                <span>${dataFormatada}</span>
            </div>
            <div style="font-size: 15px; color: #333; white-space: pre-wrap;">${evo.texto}</div>
        </div>
      `;
      listaEvolucoesDiv.insertAdjacentHTML('beforeend', cardHtml);
    });
  };

  const handleAddEvolucao = async () => {
    const texto = textoEvolucaoInput.value.trim();
    if (!texto) {
        alert('Por favor, escreva algo na evolução.');
        return;
    }

    btnAddEvolucao.disabled = true;
    btnAddEvolucao.innerText = 'Salvando...';

    try {
        // Chama a rota ESPECÍFICA para salvar evolução
        const response = await fetch(API_ADMIN_BASE + pacienteId + '/evolucao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ texto: texto })
        });

        const data = await response.json();

        if (response.ok) {
            // Atualiza a lista local com a resposta do servidor
            currentEvolucoes = data.prontuario.evolucoes;
            renderEvolucoes();
            textoEvolucaoInput.value = ''; // Limpa o campo
            alert('Evolução registrada!');
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        alert('Erro ao salvar evolução: ' + error.message);
    }

    btnAddEvolucao.disabled = false;
    btnAddEvolucao.innerText = '+ Registrar Evolução';
  };


  // --- FUNÇÕES DE SUPORTE (EXISTENTES) ---
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
      const response = await fetch(API_ADMIN_BASE + pacienteId, {
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
      console.error('Erro ao salvar:', error);
      mensagemRetorno.innerText = `Erro: ${error.message}`;
      mensagemRetorno.style.color = '#e74c3c';
    }
    btnSalvarTudo.disabled = false;
    btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
  };

  // --- INICIALIZAÇÃO ---
  formAddMedico.addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  formAddMedicacao.addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  
  // *** NOVO LISTENER ***
  btnAddEvolucao.addEventListener('click', handleAddEvolucao);

  fetchProntuario();
});
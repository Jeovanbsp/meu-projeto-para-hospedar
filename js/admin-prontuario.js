// Arquivo: /js/admin-prontuario.js (Versão Final Restaurada)

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

  // --- SELETORES GERAIS ---
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
  
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
  const mensagemRetorno = document.getElementById('mensagem-retorno');

  // --- SELETORES DA EVOLUÇÃO ---
  // Cria o input de Título dinamicamente se não existir no HTML
  const tituloEvolucaoInput = document.getElementById('titulo-evolucao') || createTempTitleInput(); 
  const textoEvolucaoInput = document.getElementById('texto-evolucao');
  const btnAddEvolucao = document.getElementById('btn-add-evolucao');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');
  
  // Estado Local
  let currentMedicacoes = [];
  let currentMedicos = []; 
  let currentEvolucoes = []; 
  let editingEvolucaoId = null; // ID da evolução sendo editada

  const mapTurnos = {
    antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço',
    tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir'
  };

  // Função auxiliar para criar input de Título
  function createTempTitleInput() {
    const input = document.createElement('input');
    input.id = 'titulo-evolucao';
    input.className = 'form-control';
    input.placeholder = 'Assunto / Tópico (ex: Visita de Rotina)';
    input.style.marginBottom = '10px';
    input.style.fontWeight = 'bold';
    const textArea = document.getElementById('texto-evolucao');
    if(textArea) textArea.parentNode.insertBefore(input, textArea);
    return input;
  }

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
      
      // Carrega dados mantendo a estrutura original
      currentMedicacoes = data.medicacoes || []; 
      renderTabelaMedicacoes(); // Usa a função ORIGINAL restaurada abaixo
      
      currentMedicos = data.medicosAssistentes || []; 
      renderMedicosList(); // Usa a função ORIGINAL restaurada abaixo

      // Evoluções (Nova Lógica)
      currentEvolucoes = data.evolucoes || [];
      renderEvolucoes();

    } catch (error) {
      console.error(error);
      mensagemRetorno.innerText = `Erro: ${error.message}`;
      mensagemRetorno.style.color = '#e74c3c';
    }
  };

  // ============================================================
  // LÓGICA DE EVOLUÇÃO (ACORDEÃO + EDITAR + EXCLUIR)
  // ============================================================

  const renderEvolucoes = () => {
    listaEvolucoesDiv.innerHTML = '';
    
    if (!currentEvolucoes || currentEvolucoes.length === 0) {
      listaEvolucoesDiv.innerHTML = '<p style="color: #777; font-style: italic;">Nenhuma evolução registrada.</p>';
      return;
    }

    // Ordena: mais recente primeiro
    const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    list.forEach(evo => {
      const dataFormatada = new Date(evo.data).toLocaleDateString('pt-BR');
      const horaFormatada = new Date(evo.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      const titulo = evo.titulo || 'Sem Tópico';

      // Estrutura do Acordeão
      const itemHtml = `
        <div class="evolucao-item" id="evo-${evo._id}">
            <div class="evo-header">
                <div class="evo-info" onclick="toggleEvolucao('${evo._id}')" style="cursor: pointer;">
                    <span class="evo-date">${dataFormatada} ${horaFormatada}</span>
                    <strong class="evo-title" style="margin-left: 10px;">${titulo}</strong>
                    <span class="evo-icon" style="margin-left: auto;">▼</span>
                </div>
                <div class="evo-actions" style="margin-left: 15px;">
                    <button class="btn-icon edit" onclick="startEditEvolucao('${evo._id}')" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="deleteEvolucao('${evo._id}')" title="Excluir">🗑️</button>
                </div>
            </div>
            <div class="evo-body hidden" id="body-${evo._id}">
                <p>${evo.texto.replace(/\n/g, '<br>')}</p>
                <small style="display:block; margin-top:10px; color:#999;">Autor: ${evo.autor || 'Dra. Aisha'}</small>
            </div>
        </div>
      `;
      listaEvolucoesDiv.insertAdjacentHTML('beforeend', itemHtml);
    });
  };

  // Funções Globais para o HTML acessar (Acordeão e CRUD)
  window.toggleEvolucao = (id) => {
    const body = document.getElementById(`body-${id}`);
    const icon = document.querySelector(`#evo-${id} .evo-icon`);
    if (body.classList.contains('hidden')) {
        body.classList.remove('hidden');
        if(icon) icon.style.transform = 'rotate(180deg)';
    } else {
        body.classList.add('hidden');
        if(icon) icon.style.transform = 'rotate(0deg)';
    }
  };

  window.startEditEvolucao = (id) => {
    const evo = currentEvolucoes.find(e => e._id === id);
    if (!evo) return;

    tituloEvolucaoInput.value = evo.titulo || '';
    textoEvolucaoInput.value = evo.texto;
    editingEvolucaoId = id;
    
    btnAddEvolucao.innerText = '💾 Salvar Alteração';
    btnAddEvolucao.style.backgroundColor = '#f39c12';
    tituloEvolucaoInput.focus();
    tituloEvolucaoInput.scrollIntoView({ behavior: 'smooth' });
  };

  window.deleteEvolucao = async (id) => {
    if (!confirm('Tem certeza que deseja excluir esta evolução?')) return;
    try {
        const response = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            currentEvolucoes = data.prontuario.evolucoes;
            renderEvolucoes();
        } else { alert('Erro ao excluir.'); }
    } catch (err) { alert('Erro de conexão.'); }
  };

  const handleSaveEvolucao = async () => {
    const titulo = tituloEvolucaoInput.value.trim();
    const texto = textoEvolucaoInput.value.trim();

    if (!titulo || !texto) {
        alert('Por favor, preencha o Tópico e o Conteúdo.');
        return;
    }
    btnAddEvolucao.disabled = true;

    try {
        let url = `${API_ADMIN_BASE}${pacienteId}/evolucao`;
        let method = 'POST';
        if (editingEvolucaoId) {
            url += `/${editingEvolucaoId}`;
            method = 'PUT';
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ titulo, texto })
        });

        const data = await response.json();
        if (response.ok) {
            currentEvolucoes = data.prontuario.evolucoes;
            renderEvolucoes();
            // Reset
            tituloEvolucaoInput.value = '';
            textoEvolucaoInput.value = '';
            editingEvolucaoId = null;
            btnAddEvolucao.innerText = '+ Registrar Evolução';
            btnAddEvolucao.style.backgroundColor = '#2ADCA1'; 
            alert('Salvo com sucesso!');
        } else { throw new Error(data.message); }
    } catch (error) { alert('Erro: ' + error.message); }
    btnAddEvolucao.disabled = false;
  };

  // ============================================================
  // FUNÇÕES ORIGINAIS RESTAURADAS (MÉDICOS E MEDICAÇÕES)
  // ============================================================

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
  };

  // LÓGICA ORIGINAL DE MÉDICOS (RESTAURADA)
  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    if (currentMedicos.length === 0) {
      listaMedicosPills.innerHTML = '<li style="font-size: 14px; color: #777;">Nenhum médico assistente adicionado.</li>';
      return;
    }
    currentMedicos.forEach((medico, index) => {
      // O HTML exato do seu arquivo original
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

  // LÓGICA ORIGINAL DE MEDICAÇÕES (RESTAURADA COM TURNOS)
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
    
    // Loop original que cria as 'pills' de turno
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

  // --- INICIALIZAÇÃO E LISTENERS ---
  formAddMedico.addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  formAddMedicacao.addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  
  if (btnAddEvolucao) btnAddEvolucao.addEventListener('click', handleSaveEvolucao);

  fetchProntuario();
});
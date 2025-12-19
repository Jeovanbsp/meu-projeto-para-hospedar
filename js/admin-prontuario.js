// Arquivo: /js/admin-prontuario.js (Versão Final: Restaurada e Minimalista)

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
  
  // Seletores de Médicos e Medicações
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
  // Cria o input de Título se ele não existir no HTML
  const tituloEvolucaoInput = document.getElementById('titulo-evolucao') || createTempTitleInput(); 
  const textoEvolucaoInput = document.getElementById('texto-evolucao');
  const btnAddEvolucao = document.getElementById('btn-add-evolucao');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');
  
  // Estado Local dos Dados
  let currentMedicacoes = [];
  let currentMedicos = []; 
  let currentEvolucoes = []; 
  let editingEvolucaoId = null; 

  const mapTurnos = {
    antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço',
    tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir'
  };

  // Função auxiliar para injetar o campo de Título (caso não tenha no HTML)
  function createTempTitleInput() {
    const input = document.createElement('input');
    input.id = 'titulo-evolucao';
    input.className = 'form-control';
    input.placeholder = 'Assunto (ex: Rotina)'; // Placeholder curto
    input.style.marginBottom = '8px';
    input.style.fontWeight = '600';
    const textArea = document.getElementById('texto-evolucao');
    if(textArea) textArea.parentNode.insertBefore(input, textArea);
    return input;
  }

  // --- CARREGAMENTO INICIAL ---
  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) { throw new Error('Falha ao buscar dados.'); }
      const data = await response.json();
      
      tituloEdicao.innerText = `Prontuário: ${data.nomePaciente || 'Novo Paciente'}`;
      
      populateForm(data); 
      
      // RESTAURAÇÃO: Carrega as tabelas com o visual correto
      currentMedicacoes = data.medicacoes || []; 
      renderTabelaMedicacoes(); 
      
      currentMedicos = data.medicosAssistentes || []; 
      renderMedicosList(); 

      // CARREGA A EVOLUÇÃO MINIMALISTA
      currentEvolucoes = data.evolucoes || [];
      renderEvolucoes();

    } catch (error) {
      console.error(error);
      mensagemRetorno.innerText = `Erro: ${error.message}`;
      mensagemRetorno.style.color = '#e74c3c';
    }
  };

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
  };

  // ============================================================
  // 1. MÉDICOS (VISUAL DE "PILLS" RESTAURADO)
  // ============================================================
  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    if (currentMedicos.length === 0) {
      listaMedicosPills.innerHTML = '<li style="font-size: 13px; color: #999;">Nenhum médico adicionado.</li>';
      return;
    }
    currentMedicos.forEach((medico, index) => {
      // Gera o HTML da etiqueta azul
      const pill = `<li class="pill-medico">
        <span>${medico}</span>
        <button class="btn-deletar-medico no-print" data-index="${index}" title="Remover">✖</button>
      </li>`;
      listaMedicosPills.insertAdjacentHTML('beforeend', pill);
    });
  };

  const handleAddMedico = (event) => {
    event.preventDefault();
    const nome = nomeMedicoInput.value.trim(); 
    if (!nome) { alert('Digite o nome do médico.'); return; }
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

  // ============================================================
  // 2. MEDICAÇÕES (VISUAL DE TURNOS RESTAURADO)
  // ============================================================
  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = ''; 
    if (currentMedicacoes.length === 0) {
      listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999; font-size: 13px;">Nenhuma medicação.</td></tr>';
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
      // Gera as etiquetas verdes para os turnos
      for (const [key, value] of Object.entries(med.horarios)) {
        if (value === true) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; }
      }
      if (turnosHtml === '') { turnosHtml = '<span style="color:#ccc; font-size:0.8rem;">-</span>'; }
      
      const horarioTxt = med.horarioEspecifico || '<span style="color:#ccc;">-</span>';
      
      const row = `
        <tr>
          <td class="col-medicacao" style="font-weight: 500;">${med.nome}</td>
          <td class="col-turnos">${turnosHtml}</td>
          <td class="col-horario" style="font-family: monospace;">${horarioTxt}</td>
          <td class="col-acao no-print"><button class="btn-deletar-medacao" data-nome="${med.nome}" style="color: #ef5350; border:none; background:none; cursor:pointer;">✖</button></td>
        </tr>
      `;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };

  const handleAddMedicacao = (event) => {
    event.preventDefault(); 
    const nome = nomeMedicacaoInput.value;
    const horarioEspecifico = horarioEspecificoInput.value; 
    if (!nome) { alert('Digite o nome da medicação.'); return; }
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

  // ============================================================
  // 3. EVOLUÇÃO (NOVO LAYOUT MINIMALISTA)
  // ============================================================
  const renderEvolucoes = () => {
    listaEvolucoesDiv.innerHTML = '';
    
    if (!currentEvolucoes || currentEvolucoes.length === 0) {
      listaEvolucoesDiv.innerHTML = '<p style="color: #bbb; font-style: italic; font-size: 0.9rem; text-align: center; margin-top: 10px;">Nenhum registro de evolução.</p>';
      return;
    }

    const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    list.forEach(evo => {
      // Data formatada curta (ex: 20/10 14:30)
      const dateObj = new Date(evo.data);
      const dataFormatada = dateObj.toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
      const horaFormatada = dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      const titulo = evo.titulo || 'Evolução';

      // HTML Minimalista
      const itemHtml = `
        <div class="evolucao-item" id="evo-${evo._id}">
            <div class="evo-header" onclick="toggleEvolucao('${evo._id}')">
                <div class="evo-info">
                    <span class="evo-date">${dataFormatada} ${horaFormatada}</span>
                    <strong class="evo-title">${titulo}</strong>
                </div>
                <span class="evo-icon" id="icon-${evo._id}">▼</span>
                <div class="evo-actions" onclick="event.stopPropagation()"> <button class="btn-icon" onclick="startEditEvolucao('${evo._id}')" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="deleteEvolucao('${evo._id}')" title="Excluir">🗑️</button>
                </div>
            </div>
            
            <div class="evo-body hidden" id="body-${evo._id}">
                <p>${evo.texto.replace(/\n/g, '<br>')}</p>
                <small class="evo-author">Por: ${evo.autor || 'Dra. Aisha'}</small>
            </div>
        </div>
      `;
      listaEvolucoesDiv.insertAdjacentHTML('beforeend', itemHtml);
    });
  };

  window.toggleEvolucao = (id) => {
    const body = document.getElementById(`body-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    
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
    
    btnAddEvolucao.innerText = 'Salvar Alteração';
    btnAddEvolucao.style.backgroundColor = '#FFB74D'; // Laranja suave
    tituloEvolucaoInput.focus();
    tituloEvolucaoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  window.deleteEvolucao = async (id) => {
    if (!confirm('Excluir este registro?')) return;
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
        alert('Preencha o Assunto e o Texto.');
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
            btnAddEvolucao.innerText = '+ Registrar';
            btnAddEvolucao.style.backgroundColor = '#2ADCA1'; 
        } else { throw new Error(data.message); }
    } catch (error) { alert('Erro: ' + error.message); }
    btnAddEvolucao.disabled = false;
  };

  const handleSalvarTudo = async (event) => {
    event.preventDefault();
    btnSalvarTudo.disabled = true;
    btnSalvarTudo.innerText = 'Salvando...';
    try {
      const response = await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            nomePaciente: nomePacienteInput.value,
            idade: idadeInput.value,
            patologias: patologiasInput.value,
            medicosAssistentes: currentMedicos, 
            medicacoes: currentMedicacoes
        })
      });
      const data = await response.json();
      if (response.ok) {
        tituloEdicao.innerText = `Prontuário: ${nomePacienteInput.value}`; 
        alert("Dados salvos com sucesso!");
      } else { throw new Error(data.message); }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar.');
    }
    btnSalvarTudo.disabled = false;
    btnSalvarTudo.innerText = 'Salvar Dados Gerais';
  };

  // --- LISTENERS ---
  formAddMedico.addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  formAddMedicacao.addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  if (btnAddEvolucao) btnAddEvolucao.addEventListener('click', handleSaveEvolucao);

  fetchProntuario();
});
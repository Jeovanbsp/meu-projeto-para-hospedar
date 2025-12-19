// Arquivo: /js/admin-prontuario.js

document.addEventListener('DOMContentLoaded', () => {

  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const API_ADMIN_BASE = 'https://aishageriatria.onrender.com/api/admin/prontuario/';
  
  const pacienteId = new URLSearchParams(window.location.search).get('id');

  if (!token || role !== 'admin' || !pacienteId) {
    localStorage.clear();
    window.location.href = 'login.html';
    return;
  }

  // Elementos do DOM
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
  
  // Elementos da Evolução
  const tituloEvolucaoInput = document.getElementById('titulo-evolucao') || createTempTitleInput(); 
  const textoEvolucaoInput = document.getElementById('texto-evolucao');
  const btnAddEvolucao = document.getElementById('btn-add-evolucao');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');

  const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  // Estado Local
  let currentMedicacoes = [];
  let currentMedicos = []; 
  let currentEvolucoes = []; 
  let editingEvolucaoId = null; 

  const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

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

  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + pacienteId, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar dados.');
      const data = await response.json();
      
      tituloEdicao.innerText = `Editando: ${data.nomePaciente || 'Novo Paciente'}`;
      populateForm(data); 
      
      currentMedicacoes = data.medicacoes || []; renderTabelaMedicacoes();
      currentMedicos = data.medicosAssistentes || []; renderMedicosList();
      currentEvolucoes = data.evolucoes || []; renderEvolucoes();

    } catch (error) {
      console.error(error);
    }
  };

  // --- RENDERIZAÇÃO ESTILO "CARD ABERTO" (VISUAL CLÁSSICO) ---
  const renderEvolucoes = () => {
    listaEvolucoesDiv.innerHTML = '';
    
    if (!currentEvolucoes || currentEvolucoes.length === 0) {
      listaEvolucoesDiv.innerHTML = '<p class="text-muted">Nenhuma evolução registrada.</p>';
      return;
    }

    const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));

    list.forEach(evo => {
      const dataFormatada = new Date(evo.data).toLocaleDateString('pt-BR') + ' às ' + new Date(evo.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
      const titulo = evo.titulo || 'Sem Tópico';

      // HTML SIMPLIFICADO: Sem acordeão, tudo visível.
      const itemHtml = `
        <div class="evolucao-item" id="evo-${evo._id}">
            <div class="evo-header">
                <div class="evo-info">
                    <strong class="evo-title">${titulo}</strong>
                    <span class="evo-date"> - ${dataFormatada}</span>
                </div>
                <div class="evo-actions">
                    <button class="btn-icon edit" onclick="startEditEvolucao('${evo._id}')" title="Editar">✏️</button>
                    <button class="btn-icon delete" onclick="deleteEvolucao('${evo._id}')" title="Excluir">🗑️</button>
                </div>
            </div>
            <div class="evo-body">
                <p>${evo.texto.replace(/\n/g, '<br>')}</p>
                <small class="evo-author">Registrado por: ${evo.autor || 'Dra. Aisha'}</small>
            </div>
        </div>
      `;
      listaEvolucoesDiv.insertAdjacentHTML('beforeend', itemHtml);
    });
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
  };

  window.deleteEvolucao = async (id) => {
    if (!confirm('Excluir esta evolução permanentemente?')) return;

    try {
        const response = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            currentEvolucoes = data.prontuario.evolucoes;
            renderEvolucoes();
        } else {
            alert('Erro ao excluir.');
        }
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
            
            tituloEvolucaoInput.value = '';
            textoEvolucaoInput.value = '';
            editingEvolucaoId = null;
            btnAddEvolucao.innerText = '+ Registrar Evolução';
            btnAddEvolucao.style.backgroundColor = '#2ADCA1'; 
            
            alert('Salvo com sucesso!');
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        alert('Erro: ' + error.message);
    }
    btnAddEvolucao.disabled = false;
  };

  // Funções de Apoio (Médicos/Medicações) - Mantidas iguais
  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
  };
  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    currentMedicos.forEach((medico, index) => {
      listaMedicosPills.insertAdjacentHTML('beforeend', `<li class="pill-medico"><span>${medico}</span><button class="btn-deletar-medico" data-index="${index}">✖</button></li>`);
    });
  };
  const handleAddMedico = (e) => { e.preventDefault(); if(!nomeMedicoInput.value) return; currentMedicos.push(nomeMedicoInput.value); renderMedicosList(); nomeMedicoInput.value=''; };
  const handleDeleteMedico = (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); }};
  
  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = '';
    currentMedicacoes.forEach(med => {
         listaMedicacoesBody.insertAdjacentHTML('beforeend', `<tr><td>${med.nome}</td><td>${med.horarioEspecifico}</td><td class="no-print"><button class="btn-deletar-medacao" data-nome="${med.nome}">✖</button></td></tr>`);
    });
  };
  const handleAddMedicacao = (e) => { e.preventDefault(); if(!nomeMedicacaoInput.value) return; 
    const horarios = {}; checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked);
    currentMedicacoes.push({ nome: nomeMedicacaoInput.value, horarioEspecifico: horarioEspecificoInput.value, horarios });
    renderTabelaMedicacoes(); formAddMedicacao.reset();
  };
  const handleDeleteMedicacao = (e) => { if(e.target.classList.contains('btn-deletar-medacao')) { currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome); renderTabelaMedicacoes(); }};

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    btnSalvarTudo.innerText = 'Salvando...';
    try {
      await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nomePaciente: nomePacienteInput.value, idade: idadeInput.value, patologias: patologiasInput.value, medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes })
      });
      alert('Dados do Paciente Salvos!');
    } catch(e) { alert('Erro ao salvar dados gerais.'); }
    btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
  };

  formAddMedico.addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  formAddMedicacao.addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  if (btnAddEvolucao) btnAddEvolucao.addEventListener('click', handleSaveEvolucao);

  fetchProntuario();
});
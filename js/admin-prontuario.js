document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const API_ADMIN_BASE = 'https://aishageriatria.onrender.com/api/admin/prontuario/';
  const pacienteId = new URLSearchParams(window.location.search).get('id');

  if (!token || role !== 'admin' || !pacienteId) { localStorage.clear(); window.location.href = 'login.html'; return; }

  const nomePacienteInput = document.getElementById('nome-paciente');
  const idadeInput = document.getElementById('idade');
  const patologiasInput = document.getElementById('patologias');
  
  const radioAlergiaNao = document.getElementById('alergia-nao');
  const radioAlergiaSim = document.getElementById('alergia-sim');
  const inputAlergiasQuais = document.getElementById('alergias-quais');
  const sinalizadorAlergia = document.getElementById('sinalizador-alergia'); 

  const nomeMedicoInput = document.getElementById('nome-medico');
  const telefoneMedicoInput = document.getElementById('telefone-medico');
  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  
  const nomeMedicacaoInput = document.getElementById('nome-medicacao');
  const qtdMedicacaoInput = document.getElementById('qtd-medicacao');
  const horarioEspecificoInput = document.getElementById('horario-especifico'); 
  const secaoTurnos = document.getElementById('secao-turnos');
  const checkboxesHorarios = document.querySelectorAll('input[name="horario"]');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  
  const tituloEvolucaoInput = document.getElementById('titulo-evolucao') || createTempTitleInput();
  const textoEvolucaoInput = document.getElementById('texto-evolucao');
  const btnAddEvolucao = document.getElementById('btn-add-evolucao');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');
  
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
  const tituloEdicao = document.getElementById('titulo-edicao');
  const badgeTermo = document.getElementById('badge-termo-status');

  let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let editingEvolucaoId = null; 
  let currentTermoAceite = false; 
  const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

  function createTempTitleInput() {
    const input = document.createElement('input'); input.id = 'titulo-evolucao'; input.className = 'form-control'; input.placeholder = 'Assunto'; input.style.marginBottom = '5px';
    const textArea = document.getElementById('texto-evolucao'); if(textArea) textArea.parentNode.insertBefore(input, textArea); return input;
  }

  function toggleAlergiaInput() {
    if (radioAlergiaSim.checked) { inputAlergiasQuais.style.display = 'block'; sinalizadorAlergia.style.display = 'flex'; } 
    else { inputAlergiasQuais.style.display = 'none'; sinalizadorAlergia.style.display = 'none'; }
  }

  horarioEspecificoInput.addEventListener('input', () => {
      if(horarioEspecificoInput.value) secaoTurnos.style.display = 'block';
      else secaoTurnos.style.display = 'none';
  });

  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Erro ao buscar dados.');
      
      const data = await response.json();
      tituloEdicao.innerText = `Editando: ${data.nomePaciente || 'Novo Paciente'}`;
      populateForm(data); 
      currentMedicacoes = data.medicacoes || []; renderTabelaMedicacoes(); 
      currentMedicos = data.medicosAssistentes || []; renderMedicosList(); 
      currentEvolucoes = data.evolucoes || []; renderEvolucoes();
    } catch (error) { console.error(error); alert("Erro ao carregar prontuário."); }
  };

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
    
    currentTermoAceite = data.termoAceite || false;
    if (currentTermoAceite) {
        badgeTermo.innerText = "✅ TERMO ACEITO";
        badgeTermo.className = "badge-termo aceito";
    } else {
        badgeTermo.innerText = "❌ NÃO ACEITO";
        badgeTermo.className = "badge-termo pendente";
    }

    if (data.alergias && data.alergias.temAlergia) { radioAlergiaSim.checked = true; inputAlergiasQuais.value = data.alergias.quais || ''; } 
    else { radioAlergiaNao.checked = true; inputAlergiasQuais.value = ''; }
    toggleAlergiaInput();
  };

  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    if (currentMedicos.length === 0) { listaMedicosPills.innerHTML = '<li style="width:100%; text-align:center; color:#ccc; font-size:0.8rem;">Nenhum médico.</li>'; return; }
    currentMedicos.forEach((medico, index) => {
      const pill = `<li class="pill-medico"><span>${medico}</span><button class="btn-deletar-medico no-print" data-index="${index}">✕</button></li>`;
      listaMedicosPills.insertAdjacentHTML('beforeend', pill);
    });
  };

  const handleAddMedico = (e) => { 
      e.preventDefault(); const nome = nomeMedicoInput.value.trim(); const tel = telefoneMedicoInput.value.trim();
      if(!nome) return; const textoFinal = `${nome} ${tel ? '  (' + tel + ')' : ''}`;
      currentMedicos.push(textoFinal); renderMedicosList(); nomeMedicoInput.value=''; telefoneMedicoInput.value='';
  };
  const handleDeleteMedico = (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); }};

  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = ''; 
    if (currentMedicacoes.length === 0) { listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Nenhuma medicação.</td></tr>'; return; }
    const list = [...currentMedicacoes].sort((a, b) => {
        const horaA = a.horarioEspecifico ? a.horarioEspecifico : '23:59';
        const horaB = b.horarioEspecifico ? b.horarioEspecifico : '23:59';
        return horaA.localeCompare(horaB);
    });
    list.forEach((med) => { 
      let turnosHtml = ''; for (const [key, value] of Object.entries(med.horarios)) { if (value === true) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; } }
      if (!turnosHtml) turnosHtml = '<span style="color:#ccc; font-size:0.8rem;">-</span>';
      const horarioDisplay = med.horarioEspecifico ? med.horarioEspecifico : '<span style="color:#ccc;">--:--</span>';
      const qtdDisplay = med.quantidade ? med.quantidade : '-';
      const row = `<tr><td style="font-weight:500;">${med.nome}</td><td class="col-qtd">${qtdDisplay}</td><td>${turnosHtml}</td><td class="col-horario">${horarioDisplay}</td><td class="no-print" style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td></tr>`;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };

  const handleAddMedicacao = (e) => { 
      e.preventDefault(); if(!nomeMedicacaoInput.value) return; const horarios = {}; checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked); 
      currentMedicacoes.push({ nome: nomeMedicacaoInput.value, quantidade: qtdMedicacaoInput.value, horarioEspecifico: horarioEspecificoInput.value, horarios }); 
      renderTabelaMedicacoes(); document.getElementById('form-add-medicacao').reset(); secaoTurnos.style.display = 'none';
  };
  const handleDeleteMedicacao = (e) => { if(e.target.classList.contains('btn-deletar-medacao')) { currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome); renderTabelaMedicacoes(); }};

  const renderEvolucoes = () => {
    listaEvolucoesDiv.innerHTML = '';
    if (!currentEvolucoes || currentEvolucoes.length === 0) { listaEvolucoesDiv.innerHTML = '<p style="text-align:center; color:#ccc; font-size:0.8rem;">Vazio</p>'; return; }
    const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    list.forEach(evo => {
      const d = new Date(evo.data); const dataStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
      const itemHtml = `<div class="evolucao-item" id="evo-${evo._id}"><div class="evo-header" onclick="toggleEvolucao('${evo._id}')"><div class="evo-left"><span class="evo-date">${dataStr}</span><strong class="evo-title">${evo.titulo}</strong></div><div class="evo-right"><span class="evo-arrow" id="icon-${evo._id}">▼</span><div class="evo-btns" onclick="event.stopPropagation()"><button class="btn-mini edit" onclick="startEditEvolucao('${evo._id}')">✎</button><button class="btn-mini delete" onclick="deleteEvolucao('${evo._id}')">✕</button></div></div></div><div class="evo-body hidden" id="body-${evo._id}"><p>${evo.texto.replace(/\n/g, '<br>')}</p><small style="display:block; margin-top:5px; color:#aaa; font-style:italic;">Ass: ${evo.autor || 'Dra. Aisha'}</small></div></div>`;
      listaEvolucoesDiv.insertAdjacentHTML('beforeend', itemHtml);
    });
  };
  
  window.toggleEvolucao = (id) => { const body = document.getElementById(`body-${id}`); const icon = document.getElementById(`icon-${id}`); if (body.classList.contains('hidden')) { body.classList.remove('hidden'); icon.style.transform = 'rotate(180deg)'; } else { body.classList.add('hidden'); icon.style.transform = 'rotate(0deg)'; } };
  window.startEditEvolucao = (id) => { const evo = currentEvolucoes.find(e => e._id === id); if (!evo) return; tituloEvolucaoInput.value = evo.titulo || ''; textoEvolucaoInput.value = evo.texto; editingEvolucaoId = id; btnAddEvolucao.innerText = 'Salvar Alteração'; btnAddEvolucao.style.backgroundColor = '#FFB74D'; tituloEvolucaoInput.focus(); };
  window.deleteEvolucao = async (id) => { if (!confirm('Excluir?')) return; try { const response = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (response.ok) { const data = await response.json(); currentEvolucoes = data.prontuario.evolucoes; renderEvolucoes(); } } catch (err) { alert('Erro.'); } };
  const handleSaveEvolucao = async () => { const titulo = tituloEvolucaoInput.value.trim(); const texto = textoEvolucaoInput.value.trim(); if (!titulo || !texto) { alert('Preencha Assunto e Texto.'); return; } btnAddEvolucao.disabled = true; try { let url = `${API_ADMIN_BASE}${pacienteId}/evolucao`; let method = 'POST'; if (editingEvolucaoId) { url += `/${editingEvolucaoId}`; method = 'PUT'; } const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ titulo, texto }) }); const data = await response.json(); if (response.ok) { currentEvolucoes = data.prontuario.evolucoes; renderEvolucoes(); tituloEvolucaoInput.value = ''; textoEvolucaoInput.value = ''; editingEvolucaoId = null; btnAddEvolucao.innerText = '+ Registrar'; btnAddEvolucao.style.backgroundColor = '#2ADCA1'; } } catch (error) { alert('Erro: ' + error.message); } btnAddEvolucao.disabled = false; };

  const handleSalvarTudo = async (e) => {
    e.preventDefault(); btnSalvarTudo.innerText = 'Salvando...';
    const dadosAlergia = { temAlergia: radioAlergiaSim.checked, quais: radioAlergiaSim.checked ? inputAlergiasQuais.value : '' };
    try {
      await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nomePaciente: nomePacienteInput.value, idade: idadeInput.value, patologias: patologiasInput.value, alergias: dadosAlergia, medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, termoAceite: currentTermoAceite })
      });
      alert('Dados salvos!');
    } catch(err) { console.error(err); }
    btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
  };

  radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
  radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
  document.getElementById('form-add-medico').addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  document.getElementById('form-add-medicacao').addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  if (btnAddEvolucao) btnAddEvolucao.addEventListener('click', handleSaveEvolucao);

  fetchProntuario();
});
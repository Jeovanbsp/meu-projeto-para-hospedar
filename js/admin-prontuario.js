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
  let currentTermoAceite = false; // Variável para guardar o status do termo
  
  const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

  function createTempTitleInput() {
    const input = document.createElement('input'); input.id = 'titulo-evolucao'; input.className = 'form-control'; input.placeholder = 'Assunto'; input.style.marginBottom = '5px';
    const textArea = document.getElementById('texto-evolucao'); if(textArea) textArea.parentNode.insertBefore(input, textArea); return input;
  }

  function toggleAlergiaInput() {
    if (radioAlergiaSim.checked) { inputAlergiasQuais.style.display = 'block'; sinalizadorAlergia.style.display = 'flex'; } 
    else { inputAlergiasQuais.style.display = 'none'; sinalizadorAlergia.style.display = 'none'; }
  }

  // Turnos Escondidos
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
    } catch (error) { console.error(error); }
  };

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
    
    // Atualiza status do Termo
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
    listaMedicosPills.scrollTop = listaMedicosPills.scrollHeight;
  };

  const handleAddMedico = (e) => { 
      e.preventDefault(); const nome = nomeMedicoInput.value.trim(); const tel = telefoneMedicoInput.value.trim();
      if(!nome) return; const textoFinal = `${nome} ${tel ? '  (' + tel + ')' : ''}`;
      currentMedicos.push(textoFinal); renderMedicosList(); nomeMedicoInput.value=''; telefoneMedicoInput.value='';
  };
  const handleDeleteMedico = (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); }};

  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = ''; 
    if (currentMedicacoes.length === 0) { listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Nenhuma medicação adicionada.</td></tr>'; return; }
    
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

      const row = `<tr>
        <td style="font-weight:500;">${med.nome}</td>
        <td class="col-qtd">${qtdDisplay}</td>
        <td>${turnosHtml}</td>
        <td class="col-horario">${horarioDisplay}</td>
        <td class="no-print" style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td>
      </tr>`;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };

  const handleAddMedicacao = (e) => { 
      e.preventDefault(); if(!nomeMedicacaoInput.value) return; 
      const horarios = {}; checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked); 
      currentMedicacoes.push({ 
          nome: nomeMedicacaoInput.value, 
          quantidade: qtdMedicacaoInput.value, 
          horarioEspecifico: horarioEspecificoInput.value, 
          horarios: horarios 
      }); 
      renderTabelaMedicacoes(); document.getElementById('form-add-medicacao').reset(); secaoTurnos.style.display = 'none';
  };
  const handleDeleteMedicacao = (e) => { if(e.target.classList.contains('btn-deletar-medacao')) { currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome); renderTabelaMedicacoes(); }};

  const handleSalvarTudo = async (e) => {
    e.preventDefault(); btnSalvarTudo.innerText = 'Salvando...';
    const dadosAlergia = { temAlergia: radioAlergiaSim.checked, quais: radioAlergiaSim.checked ? inputAlergiasQuais.value : '' };
    try {
      await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            nomePaciente: nomePacienteInput.value, 
            idade: idadeInput.value, 
            patologias: patologiasInput.value, 
            alergias: dadosAlergia, 
            medicosAssistentes: currentMedicos, 
            medicacoes: currentMedicacoes,
            termoAceite: currentTermoAceite // Preserva o valor que veio do banco
        })
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
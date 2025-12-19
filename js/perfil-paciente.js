document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  const API_URL = 'https://aishageriatria.onrender.com/api/prontuario';

  if (!token) { window.location.href = 'login.html'; return; }

  const nomePacienteInput = document.getElementById('nome-paciente');
  const idadeInput = document.getElementById('idade');
  const patologiasInput = document.getElementById('patologias');
  
  const radioAlergiaNao = document.getElementById('alergia-nao');
  const radioAlergiaSim = document.getElementById('alergia-sim');
  const inputAlergiasQuais = document.getElementById('alergias-quais');
  const sinalizadorAlergia = document.getElementById('sinalizador-alergia'); 

  const nomeMedicoInput = document.getElementById('nome-medico');
  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  const nomeMedicacaoInput = document.getElementById('nome-medicacao');
  const horarioEspecificoInput = document.getElementById('horario-especifico'); 
  const checkboxesHorarios = document.querySelectorAll('input[name="horario"]');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
  const btnDownloadPDF = document.getElementById('btn-download-pdf'); 
  const btnGerarQRCode = document.getElementById('btn-gerar-qrcode');
  const qrCodeContainer = document.getElementById('qrcode-container');
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  let currentMedicacoes = []; let currentMedicos = []; let currentUserId = null; 
  const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

  function toggleAlergiaInput() {
    if (radioAlergiaSim.checked) { inputAlergiasQuais.style.display = 'block'; sinalizadorAlergia.style.display = 'flex'; } 
    else { inputAlergiasQuais.style.display = 'none'; sinalizadorAlergia.style.display = 'none'; }
  }

  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_URL, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
      if (!response.ok) { if (response.status === 401) { localStorage.clear(); window.location.href = 'login.html'; } throw new Error('Falha ao buscar dados.'); }
      const data = await response.json();
      populateForm(data); 
      currentMedicacoes = data.medicacoes || []; renderTabelaMedicacoes();
      currentMedicos = data.medicosAssistentes || []; renderMedicosList(); 
      currentUserId = data.user; 
    } catch (error) { console.error(error); mensagemRetorno.innerText = 'Erro ao carregar.'; mensagemRetorno.style.color = '#e74c3c'; }
  };

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || userName || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
    if (data.alergias && data.alergias.temAlergia) { radioAlergiaSim.checked = true; inputAlergiasQuais.value = data.alergias.quais || ''; } 
    else { radioAlergiaNao.checked = true; inputAlergiasQuais.value = ''; }
    toggleAlergiaInput();
  };

  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    if (currentMedicos.length === 0) { listaMedicosPills.innerHTML = '<li style="width:100%; text-align:center; color:#ccc; font-size:0.8rem;">Nenhum médico.</li>'; return; }
    currentMedicos.forEach((medico, index) => {
      // PACIENTE AGORA TEM BOTÃO EXCLUIR (✕)
      const pill = `<li class="pill-medico"><span>${medico}</span><button class="btn-deletar-medico no-print" data-index="${index}">✕</button></li>`;
      listaMedicosPills.insertAdjacentHTML('beforeend', pill);
    });
    listaMedicosPills.scrollTop = listaMedicosPills.scrollHeight;
  };
  const handleAddMedico = (e) => { e.preventDefault(); if(!nomeMedicoInput.value) return; currentMedicos.push(nomeMedicoInput.value); renderMedicosList(); nomeMedicoInput.value=''; };
  const handleDeleteMedico = (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); }};

  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = ''; 
    if (currentMedicacoes.length === 0) { listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ccc; font-size:0.8rem;">Vazio</td></tr>'; return; }
    const list = [...currentMedicacoes].sort((a, b) => a.nome.localeCompare(b.nome));
    list.forEach((med) => { 
      let turnosHtml = ''; for (const [key, value] of Object.entries(med.horarios)) { if (value === true) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; } }
      if (!turnosHtml) turnosHtml = '<span style="color:#ccc">-</span>';
      const row = `<tr><td>${med.nome}</td><td>${turnosHtml}</td><td>${med.horarioEspecifico || '-'}</td><td class="no-print"><button class="btn-deletar-medacao" data-nome="${med.nome}">✖</button></td></tr>`;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };
  const handleAddMedicacao = (e) => { e.preventDefault(); if(!nomeMedicacaoInput.value) return; const horarios = {}; checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked); currentMedicacoes.push({ nome: nomeMedicacaoInput.value, horarioEspecifico: horarioEspecificoInput.value, horarios }); renderTabelaMedicacoes(); document.getElementById('form-add-medicacao').reset(); };
  const handleDeleteMedicacao = (e) => { if(e.target.classList.contains('btn-deletar-medacao')) { currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome); renderTabelaMedicacoes(); }};

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    btnSalvarTudo.innerText = 'Salvando...';
    const dadosAlergia = { temAlergia: radioAlergiaSim.checked, quais: radioAlergiaSim.checked ? inputAlergiasQuais.value : '' };
    try {
      const response = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ nomePaciente: nomePacienteInput.value, idade: idadeInput.value, patologias: patologiasInput.value, alergias: dadosAlergia, medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes })
      });
      if (response.ok) { mensagemRetorno.innerText = 'Sucesso!'; mensagemRetorno.style.color = '#2ADCA1'; } else { throw new Error('Erro ao salvar'); }
    } catch (error) { mensagemRetorno.innerText = 'Erro ao salvar.'; mensagemRetorno.style.color = '#e74c3c'; }
    btnSalvarTudo.innerText = 'Salvar Prontuário';
  };

  const handleDownloadPDF = () => { window.print(); };
  const handleGerarQRCode = () => { if (!currentUserId) { alert('Erro: ID não encontrado.'); return; } const url = window.location.href.replace('perfil-paciente.html', 'prontuario-publico.html').replace('admin-dashboard.html', 'prontuario-publico.html') + `?id=${currentUserId}`; qrCodeContainer.innerHTML = ''; new QRCode(qrCodeContainer, { text: url, width: 200, height: 200, colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H }); qrCodeContainer.style.display = 'block'; btnGerarQRCode.innerText = 'QR Code Gerado!'; };

  radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
  radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
  document.getElementById('form-add-medico').addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  document.getElementById('form-add-medicacao').addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  btnDownloadPDF.addEventListener('click', handleDownloadPDF); 
  btnGerarQRCode.addEventListener('click', handleGerarQRCode); 

  fetchProntuario();
});
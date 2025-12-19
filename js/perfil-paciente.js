// Arquivo: /js/perfil-paciente.js (Versão Final: Sem Evolução)

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  
  // URL da API do Prontuário
  const API_URL = 'https://aishageriatria.onrender.com/api/prontuario';

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // --- SELETORES ---
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
  
  const btnGerarQRCode = document.getElementById('btn-gerar-qrcode');
  const qrCodeContainer = document.getElementById('qrcode-container');
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
  const btnDownloadPDF = document.getElementById('btn-download-pdf'); 
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  let currentMedicacoes = [];
  let currentMedicos = []; 
  let currentUserId = null; 

  const mapTurnos = {
    antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço',
    tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir'
  };

  // --- CARREGAMENTO ---
  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear(); window.location.href = 'login.html';
        }
        throw new Error('Falha ao buscar dados.');
      }
      const data = await response.json();
      
      populateForm(data); 
      
      // Carrega Médicos e Medicações com o visual "arrumadinho" (Pills)
      currentMedicacoes = data.medicacoes || []; 
      renderTabelaMedicacoes();
      
      currentMedicos = data.medicosAssistentes || []; 
      renderMedicosList(); 
      
      currentUserId = data.user; 

    } catch (error) {
      console.error('Erro ao carregar prontuário:', error);
      mensagemRetorno.innerText = 'Não foi possível carregar seus dados.';
      mensagemRetorno.style.color = '#e74c3c';
    }
  };

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || userName || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
  };

  // --- 1. MÉDICOS (VISUAL PILLS / ETIQUETAS) ---
  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    if (currentMedicos.length === 0) {
      listaMedicosPills.innerHTML = '<li style="font-size: 13px; color: #999;">Nenhum médico assistente adicionado.</li>';
      return;
    }
    currentMedicos.forEach((medico, index) => {
      // Usa a classe pill-medico para ficar igual ao admin
      const pill = `<li class="pill-medico"><span>${medico}</span><button class="btn-deletar-medico no-print" data-index="${index}">✖</button></li>`;
      listaMedicosPills.insertAdjacentHTML('beforeend', pill);
    });
  };

  const handleAddMedico = (e) => { e.preventDefault(); if(!nomeMedicoInput.value) return; currentMedicos.push(nomeMedicoInput.value); renderMedicosList(); nomeMedicoInput.value=''; };
  const handleDeleteMedico = (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); }};

  // --- 2. MEDICAÇÕES (VISUAL TURNOS COLORIDOS) ---
  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = ''; 
    if (currentMedicacoes.length === 0) {
      listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color:#999;">Nenhuma medicação adicionada.</td></tr>';
      return;
    }
    const list = [...currentMedicacoes].sort((a, b) => a.nome.localeCompare(b.nome));
    
    list.forEach((med) => { 
      let turnosHtml = '';
      for (const [key, value] of Object.entries(med.horarios)) {
        if (value === true) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; }
      }
      if (!turnosHtml) turnosHtml = '<span style="color:#ccc">-</span>';
      
      const row = `
        <tr>
          <td style="font-weight:500;">${med.nome}</td>
          <td>${turnosHtml}</td>
          <td style="font-family:monospace;">${med.horarioEspecifico || '-'}</td>
          <td class="no-print"><button class="btn-deletar-medacao" data-nome="${med.nome}" style="color:#ef5350; border:none; background:none; cursor:pointer;">✖</button></td>
        </tr>
      `;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };

  const handleAddMedicacao = (e) => { e.preventDefault(); if(!nomeMedicacaoInput.value) return; 
    const horarios = {}; checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked);
    currentMedicacoes.push({ nome: nomeMedicacaoInput.value, horarioEspecifico: horarioEspecificoInput.value, horarios });
    renderTabelaMedicacoes(); formAddMedicacao.reset(); 
  };
  const handleDeleteMedicacao = (e) => { if(e.target.classList.contains('btn-deletar-medacao')) { currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome); renderTabelaMedicacoes(); }};

  // --- SALVAR (SEM EVOLUÇÃO) ---
  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    btnSalvarTudo.disabled = true;
    btnSalvarTudo.innerText = 'Salvando...';
    
    const dadosProntuario = {
      nomePaciente: nomePacienteInput.value,
      idade: idadeInput.value,
      patologias: patologiasInput.value,
      medicosAssistentes: currentMedicos, 
      medicacoes: currentMedicacoes 
    };

    try {
      const response = await fetch(API_URL, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(dadosProntuario)
      });
      const data = await response.json();
      if (response.ok) {
        mensagemRetorno.innerText = 'Dados atualizados com sucesso!';
        mensagemRetorno.style.color = '#2ADCA1';
      } else { throw new Error(data.message); }
    } catch (error) {
      mensagemRetorno.innerText = 'Erro ao salvar.';
      mensagemRetorno.style.color = '#e74c3c';
    }
    btnSalvarTudo.disabled = false;
    btnSalvarTudo.innerText = 'Salvar Prontuário Completo';
  };

  const handleDownloadPDF = () => { window.print(); };
  
  const handleGerarQRCode = () => {
    if (!currentUserId) { alert('Erro: ID do usuário não encontrado.'); return; }
    // Ajusta URL para apontar para a página pública
    const url = window.location.href.replace('perfil-paciente.html', 'prontuario-publico.html').replace('admin-dashboard.html', 'prontuario-publico.html') + `?id=${currentUserId}`;
    qrCodeContainer.innerHTML = '';
    new QRCode(qrCodeContainer, { text: url, width: 200, height: 200, colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H });
    qrCodeContainer.style.display = 'block';
    btnGerarQRCode.innerText = 'QR Code Gerado!';
  };

  formAddMedico.addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  formAddMedicacao.addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  btnDownloadPDF.addEventListener('click', handleDownloadPDF); 
  btnGerarQRCode.addEventListener('click', handleGerarQRCode); 

  fetchProntuario();
});
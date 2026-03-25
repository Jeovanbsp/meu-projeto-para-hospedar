// Arquivo: /js/perfil-paciente.js

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
  const API_URL = `${API_ADMIN_BASE}/api/prontuario`;

  if (!token) { window.location.href = 'login.html'; return; }

  // Seletores principais
  const checkTermoAceite = document.getElementById('check-termo-aceite');
  const conteudoProntuario = document.getElementById('conteudo-prontuario');
  const nomePacienteInput = document.getElementById('nome-paciente');
  const rgPacienteInput = document.getElementById('rg-paciente'); 
  const idadeInput = document.getElementById('idade');
  const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
  const patologiasInput = document.getElementById('patologias');
  const examesInput = document.getElementById('exames');
  
  // Seletores de Comorbidades (Ajustados para o novo HTML)
  const radioComorbidadeSim = document.querySelector('input[name="temComorbidade"][value="sim"]');
  const radioComorbidadeNao = document.querySelector('input[name="temComorbidade"][value="nao"]');
  const listaComorbidades = document.getElementById('lista-comorbidades');
  const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
  const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');
  const btnMinimizarComorbidades = document.getElementById('btn-minimizar-comorbidades');

  // Seletores de Alergias
  const radioAlergiaSim = document.querySelector('input[name="temAlergia"][value="sim"]');
  const radioAlergiaNao = document.querySelector('input[name="temAlergia"][value="nao"]');
  const inputAlergiasQuais = document.getElementById('alergias-quais');

  // Seletores de Listas e Tabelas
  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  const formAddMedicacao = document.getElementById('form-add-medicacao');
  const btnToggleMedForm = document.getElementById('btn-toggle-med-form');

  // Ações
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
  const btnDownloadPDF = document.getElementById('btn-download-pdf'); 
  const btnGerarQRCode = document.getElementById('btn-gerar-qrcode');
  const qrCodeContainer = document.getElementById('qrcode-container');
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  let currentMedicacoes = []; 
  let currentMedicos = []; 
  let currentUserId = null; 

  // ============================================================
  // LÓGICA DO TERMO E VISIBILIDADE
  // ============================================================

  function toggleConteudoProntuario() { 
      if (checkTermoAceite && checkTermoAceite.checked) { 
          conteudoProntuario.style.display = 'block'; 
      } else if (conteudoProntuario) { 
          conteudoProntuario.style.display = 'none'; 
      } 
  }

  if (checkTermoAceite) {
      checkTermoAceite.addEventListener('change', () => {
          toggleConteudoProntuario();
          if(!checkTermoAceite.checked) alert("Você retirou o aceite. O prontuário foi ocultado.");
      });
  }

  window.abrirModalTermo = () => {
      const nome = (nomePacienteInput ? nomePacienteInput.value : "") || userName || "____________________";
      const rg = (rgPacienteInput ? rgPacienteInput.value : "") || "____________________";
      
      const elNome = document.getElementById('termo-nome-paciente');
      const elRG = document.getElementById('termo-rg-paciente');
      if(elNome) elNome.innerText = nome;
      if(elRG) elRG.innerText = rg;

      document.getElementById('modal-termo').style.display = 'flex';
  };

  window.aceitarTermo = () => {
      if(checkTermoAceite) {
          checkTermoAceite.checked = true;
          checkTermoAceite.disabled = false;
      }
      toggleConteudoProntuario();
      document.getElementById('modal-termo').style.display = 'none';
  };

  function toggleAlergiaInput() { 
      const display = (radioAlergiaSim && radioAlergiaSim.checked) ? 'block' : 'none';
      if(inputAlergiasQuais) inputAlergiasQuais.style.display = display;
  }
  
  function toggleComorbidades() { 
      const display = (radioComorbidadeSim && radioComorbidadeSim.checked) ? 'block' : 'none';
      if(listaComorbidades) listaComorbidades.style.display = display;
  }

  // ============================================================
  // FETCH E SINCRONIZAÇÃO
  // ============================================================

  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      populateForm(data); 
      currentMedicacoes = data.medicacoes || []; renderTabelaMedicacoes();
      currentMedicos = data.medicosAssistentes || []; renderMedicosList(); 
      currentUserId = data.user; 
    } catch (error) { console.error('Erro no fetch:', error); }
  };

  const populateForm = (data) => {
    if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || userName || '';
    if(rgPacienteInput) rgPacienteInput.value = data.rg || '';
    if(idadeInput) idadeInput.value = data.idade || '';
    if(patologiasInput) patologiasInput.value = data.patologias || '';
    if(examesInput) examesInput.value = data.exames || '';

    radiosMobilidade.forEach(radio => { if (radio.value === data.mobilidade) radio.checked = true; });

    if (data.comorbidades && data.comorbidades.temComorbidade) {
        if(radioComorbidadeSim) radioComorbidadeSim.checked = true;
        if(inputOutrasComorbidades) inputOutrasComorbidades.value = data.comorbidades.outras || '';
        checkboxesComorbidades.forEach(cb => { if (data.comorbidades.lista?.includes(cb.value)) cb.checked = true; });
    }
    toggleComorbidades();
    
    if (data.termoAceite && checkTermoAceite) { 
        checkTermoAceite.checked = true; 
        checkTermoAceite.disabled = false;
        toggleConteudoProntuario();
    }

    if (data.alergias?.temAlergia && radioAlergiaSim) { 
        radioAlergiaSim.checked = true; 
        if(inputAlergiasQuais) inputAlergiasQuais.value = data.alergias.quais || ''; 
    } 
    toggleAlergiaInput();
  };

  // ============================================================
  // EVENTOS E SALVAMENTO
  // ============================================================

  btnSalvarTudo?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!checkTermoAceite.checked) { alert("Você deve aceitar o termo."); return; }
    
    btnSalvarTudo.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvando...';
    
    const payload = {
        nomePaciente: nomePacienteInput.value,
        rg: rgPacienteInput.value,
        idade: idadeInput.value,
        mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
        patologias: patologiasInput.value,
        exames: examesInput.value,
        comorbidades: {
            temComorbidade: radioComorbidadeSim.checked,
            lista: Array.from(checkboxesComorbidades).filter(c => c.checked).map(c => c.value),
            outras: inputOutrasComorbidades.value
        },
        alergias: { temAlergia: radioAlergiaSim.checked, quais: inputAlergiasQuais.value },
        medicosAssistentes: currentMedicos,
        medicacoes: currentMedicacoes,
        termoAceite: true
    };

    try {
      await fetch(API_URL, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      mensagemRetorno.innerText = 'Sucesso ao salvar!';
      mensagemRetorno.style.color = '#2ADCA1';
    } catch (error) { console.error(error); }
    btnSalvarTudo.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Prontuário';
  });

  // Funções de auxílio
  if(radioAlergiaSim) radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
  if(radioAlergiaNao) radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
  if(radioComorbidadeSim) radioComorbidadeSim.addEventListener('change', toggleComorbidades);
  if(radioComorbidadeNao) radioComorbidadeNao.addEventListener('change', toggleComorbidades);
  
  if(btnGerarQRCode) btnGerarQRCode.addEventListener('click', () => {
      const url = window.location.href.replace('perfil-paciente.html', 'prontuario-publico.html') + `?id=${currentUserId}`;
      qrCodeContainer.innerHTML = '';
      new QRCode(qrCodeContainer, { text: url, width: 200, height: 200 });
      qrCodeContainer.style.display = 'block';
  });

  fetchProntuario();
});
// Arquivo: /js/perfil-paciente.js

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
  const API_URL = `${API_ADMIN_BASE}/api/prontuario`;

  if (!token) { window.location.href = 'login.html'; return; }

  // Seletores de Elementos Principais
  const checkTermoAceite = document.getElementById('check-termo-aceite');
  const conteudoProntuario = document.getElementById('conteudo-prontuario');
  const nomePacienteInput = document.getElementById('nome-paciente');
  const rgPacienteInput = document.getElementById('rg-paciente'); 
  const idadeInput = document.getElementById('idade');
  const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
  const patologiasInput = document.getElementById('patologias');
  const examesInput = document.getElementById('exames');
  
  const radioComorbidadeSim = document.querySelector('input[name="temComorbidade"][value="sim"]');
  const radioComorbidadeNao = document.querySelector('input[name="temComorbidade"][value="nao"]');
  const listaComorbidades = document.getElementById('lista-comorbidades');
  const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
  const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');
  const btnMinimizarComorbidades = document.getElementById('btn-minimizar-comorbidades');

  const radioAlergiaSim = document.querySelector('input[name="temAlergia"][value="sim"]');
  const radioAlergiaNao = document.querySelector('input[name="temAlergia"][value="nao"]');
  const inputAlergiasQuais = document.getElementById('alergias-quais');

  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
  const qrCodeContainer = document.getElementById('qrcode-container');
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  let currentMedicacoes = []; 
  let currentMedicos = []; 
  let currentUserId = null; 

  // --- FUNÇÕES DE RENDERIZAÇÃO (Definidas antes do uso) ---

  const renderMedicosList = () => { 
      if(!listaMedicosPills) return;
      listaMedicosPills.innerHTML = ''; 
      if (currentMedicos.length === 0) {
          listaMedicosPills.innerHTML = '<li style="color:#ccc; font-size:0.8rem;">Nenhum médico.</li>';
          return;
      }
      currentMedicos.forEach((medico, index) => { 
          const pill = `<li class="pill-medico"><span>${medico}</span><button class="btn-deletar-medico" onclick="removerMedico(${index})">✕</button></li>`; 
          listaMedicosPills.insertAdjacentHTML('beforeend', pill); 
      }); 
  };

  const renderTabelaMedicacoes = () => { 
      if(!listaMedicacoesBody) return;
      listaMedicacoesBody.innerHTML = ''; 
      if (currentMedicacoes.length === 0) {
          listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ccc;">Sem medicações.</td></tr>';
          return;
      }
      currentMedicacoes.forEach((med, index) => { 
          const row = `<tr>
              <td style="font-weight:600;">${med.nome}</td>
              <td>${med.quantidade || '-'}</td>
              <td>${med.horarioEspecifico || '-'}</td>
              <td><button class="btn-excluir" style="width:30px; height:30px;" onclick="removerMedicacao(${index})">✕</button></td>
          </tr>`; 
          listaMedicacoesBody.insertAdjacentHTML('beforeend', row); 
      }); 
  };

  // --- LÓGICA DO TERMO ---
  function toggleConteudoProntuario() { 
      if (checkTermoAceite && checkTermoAceite.checked) { 
          conteudoProntuario.style.display = 'block'; 
      } else if (conteudoProntuario) { 
          conteudoProntuario.style.display = 'none'; 
      } 
  }

  window.abrirModalTermo = () => {
      const nome = (nomePacienteInput ? nomePacienteInput.value : "") || userName || "____________________";
      const rg = (rgPacienteInput ? rgPacienteInput.value : "") || "____________________";
      if(document.getElementById('termo-nome-paciente')) document.getElementById('termo-nome-paciente').innerText = nome;
      if(document.getElementById('termo-rg-paciente')) document.getElementById('termo-rg-paciente').innerText = rg;
      document.getElementById('modal-termo').style.display = 'flex';
  };

  window.aceitarTermo = () => {
      if(checkTermoAceite) { checkTermoAceite.checked = true; checkTermoAceite.disabled = false; }
      toggleConteudoProntuario();
      document.getElementById('modal-termo').style.display = 'none';
  };

  // --- FUNÇÕES DE REMOÇÃO (Expostas para Window) ---
  window.removerMedico = (index) => { currentMedicos.splice(index, 1); renderMedicosList(); };
  window.removerMedicacao = (index) => { currentMedicacoes.splice(index, 1); renderTabelaMedicacoes(); };

  // --- BUSCA E POPULAÇÃO ---
  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      populateForm(data); 
      currentMedicacoes = data.medicacoes || []; 
      currentMedicos = data.medicosAssistentes || [];
      renderTabelaMedicacoes();
      renderMedicosList();
      currentUserId = data.user; 
    } catch (error) { console.error('Erro no fetchProntuario:', error); }
  };

  const populateForm = (data) => {
    if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || userName || '';
    if(rgPacienteInput) rgPacienteInput.value = data.rg || '';
    if(idadeInput) idadeInput.value = data.idade || '';
    if(patologiasInput) patologiasInput.value = data.patologias || '';
    if(examesInput) examesInput.value = data.exames || '';
    radiosMobilidade.forEach(radio => { if (radio.value === data.mobilidade) radio.checked = true; });

    if (data.comorbidades?.temComorbidade && radioComorbidadeSim) {
        radioComorbidadeSim.checked = true;
        if(inputOutrasComorbidades) inputOutrasComorbidades.value = data.comorbidades.outras || '';
        checkboxesComorbidades.forEach(cb => { if (data.comorbidades.lista?.includes(cb.value)) cb.checked = true; });
    }
    if (data.termoAceite && checkTermoAceite) { 
        checkTermoAceite.checked = true; checkTermoAceite.disabled = false; toggleConteudoProntuario();
    }
  };

  // --- EVENTOS ---
  btnSalvarTudo?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!checkTermoAceite.checked) { alert("Deve aceitar o termo."); return; }
    btnSalvarTudo.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Salvando...';
    
    const payload = {
        nomePaciente: nomePacienteInput.value, rg: rgPacienteInput.value, idade: idadeInput.value,
        mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
        patologias: patologiasInput.value, exames: examesInput.value,
        comorbidades: {
            temComorbidade: radioComorbidadeSim.checked,
            lista: Array.from(checkboxesComorbidades).filter(c => c.checked).map(c => c.value),
            outras: inputOutrasComorbidades.value
        },
        alergias: { temAlergia: radioAlergiaSim.checked, quais: inputAlergiasQuais.value },
        medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, termoAceite: true
    };

    try {
      await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if(mensagemRetorno) { mensagemRetorno.innerText = 'Salvo com sucesso!'; mensagemRetorno.style.color = '#2ADCA1'; }
    } catch (error) { console.error(error); }
    btnSalvarTudo.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Prontuário';
  });

  fetchProntuario();
});
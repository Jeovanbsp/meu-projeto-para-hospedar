document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
  const API_URL = `${API_ADMIN_BASE}/api/prontuario`;

  if (!token) { window.location.href = 'login.html'; return; }

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

  const radioAlergiaSim = document.querySelector('input[name="temAlergia"][value="sim"]');
  const radioAlergiaNao = document.querySelector('input[name="temAlergia"][value="nao"]');
  const inputAlergiasQuais = document.getElementById('alergias-quais');

  const nomeMedicoInput = document.getElementById('nome-medico');
  const telefoneMedicoInput = document.getElementById('telefone-medico');
  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  
  const nomeMedicacaoInput = document.getElementById('nome-medicacao');
  const qtdMedicacaoInput = document.getElementById('qtd-medicacao');
  const horarioEspecificoInput = document.getElementById('horario-especifico'); 
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  let currentMedicacoes = []; 
  let currentMedicos = []; 
  let currentUserId = null; 

  const renderMedicosList = () => { 
      listaMedicosPills.innerHTML = ''; 
      currentMedicos.forEach((medico, index) => { 
          const pill = `<li class="pill-medico"><span>${medico}</span><button type="button" onclick="window.removerMedico(${index})">✕</button></li>`; 
          listaMedicosPills.insertAdjacentHTML('beforeend', pill); 
      }); 
  };

  const renderTabelaMedicacoes = () => { 
      listaMedicacoesBody.innerHTML = ''; 
      if (currentMedicacoes.length === 0) {
          listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ccc;">Vazio</td></tr>';
          return;
      }
      currentMedicacoes.forEach((med, index) => { 
          const row = `<tr><td>${med.nome}</td><td>${med.quantidade || '-'}</td><td>${med.horarioEspecifico || '-'}</td><td><button type="button" onclick="window.removerMedicacao(${index})">✕</button></td></tr>`; 
          listaMedicacoesBody.insertAdjacentHTML('beforeend', row); 
      }); 
  };

  window.removerMedico = (index) => { currentMedicos.splice(index, 1); renderMedicosList(); };
  window.removerMedicacao = (index) => { currentMedicacoes.splice(index, 1); renderTabelaMedicacoes(); };

  // CORREÇÃO: e.preventDefault() impede o recarregamento da página ao adicionar médico
  document.getElementById('form-add-medico')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if(!nomeMedicoInput.value) return;
      const textoFinal = `${nomeMedicoInput.value} (${telefoneMedicoInput.value || 'N/A'})`;
      currentMedicos.push(textoFinal);
      renderMedicosList();
      e.target.reset();
  });

  // CORREÇÃO: e.preventDefault() impede o recarregamento da página ao adicionar medicação
  document.getElementById('form-add-medicacao')?.addEventListener('submit', (e) => {
      e.preventDefault();
      if(!nomeMedicacaoInput.value) return;
      currentMedicacoes.push({ 
          nome: nomeMedicacaoInput.value, 
          quantidade: qtdMedicacaoInput.value, 
          horarioEspecifico: horarioEspecificoInput.value,
          horarios: {} 
      });
      renderTabelaMedicacoes();
      e.target.reset();
  });

  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      currentMedicacoes = data.medicacoes || [];
      currentMedicos = data.medicosAssistentes || [];
      populateForm(data); 
      renderTabelaMedicacoes();
      renderMedicosList();
      currentUserId = data.user; 
    } catch (error) { console.error(error); }
  };

  const populateForm = (data) => {
    if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || userName || '';
    if(rgPacienteInput) rgPacienteInput.value = data.rg || '';
    if(idadeInput) idadeInput.value = data.idade || '';
    if(patologiasInput) patologiasInput.value = data.patologias || '';
    if(examesInput) examesInput.value = data.exames || '';
    
    if (data.mobilidade) {
        radiosMobilidade.forEach(radio => { if (radio.value === data.mobilidade) radio.checked = true; });
    }

    if (data.comorbidades?.temComorbidade && radioComorbidadeSim) {
        radioComorbidadeSim.checked = true;
        if(inputOutrasComorbidades) inputOutrasComorbidades.value = data.comorbidades.outras || '';
        checkboxesComorbidades.forEach(cb => { if (data.comorbidades.lista?.includes(cb.value)) cb.checked = true; });
    }

    if (data.alergias?.temAlergia && radioAlergiaSim) {
        radioAlergiaSim.checked = true;
        if(inputAlergiasQuais) { inputAlergiasQuais.value = data.alergias.quais || ''; inputAlergiasQuais.style.display = 'block'; }
    }
  };

  btnSalvarTudo?.addEventListener('click', async (e) => {
    e.preventDefault();
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
        const res = await fetch(API_URL, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
            body: JSON.stringify(payload) 
        });
        if(res.ok) { mensagemRetorno.innerText = 'Prontuário Salvo!'; mensagemRetorno.style.color = '#2ADCA1'; }
    } catch (err) { mensagemRetorno.innerText = 'Erro ao salvar.'; }
  });

  fetchProntuario();
});
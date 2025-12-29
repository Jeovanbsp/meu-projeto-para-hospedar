document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  // URL AUTOMÁTICA
  const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
  
  const pacienteId = new URLSearchParams(window.location.search).get('id');

  if (!token || role !== 'admin' || !pacienteId) { localStorage.clear(); window.location.href = 'login.html'; return; }

  // --- SELEÇÃO DE ELEMENTOS DO DOM ---
  const nomePacienteInput = document.getElementById('nome-paciente');
  const idadeInput = document.getElementById('idade');
  const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
  const patologiasInput = document.getElementById('patologias');
  const examesInput = document.getElementById('exames');
  
  const radioComorbidadeSim = document.getElementById('comorbidade-sim');
  const radioComorbidadeNao = document.getElementById('comorbidade-nao');
  const listaComorbidades = document.getElementById('lista-comorbidades');
  const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
  const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');
  const btnMinimizarComorbidades = document.getElementById('btn-minimizar-comorbidades');
  const textoBtnToggle = document.getElementById('texto-btn-toggle');

  const radioAlergiaSim = document.getElementById('alergia-sim');
  const radioAlergiaNao = document.getElementById('alergia-nao');
  const inputAlergiasQuais = document.getElementById('alergias-quais');
  const sinalizadorAlergia = document.getElementById('sinalizador-alergia'); 

  // Listas
  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');

  // Forms auxiliares
  const nomeMedicoInput = document.getElementById('nome-medico');
  const telefoneMedicoInput = document.getElementById('telefone-medico');
  
  const nomeMedicacaoInput = document.getElementById('nome-medicacao');
  const qtdMedicacaoInput = document.getElementById('qtd-medicacao');
  const horarioEspecificoInput = document.getElementById('horario-especifico'); 
  const secaoTurnos = document.getElementById('secao-turnos');
  const checkboxesHorarios = document.querySelectorAll('input[name="horario"]');
  const btnToggleMedForm = document.getElementById('btn-toggle-med-form');
  const formAddMedicacao = document.getElementById('form-add-medicacao');
  
  const tituloEvolucaoInput = document.getElementById('titulo-evolucao') || createTempTitleInput();
  const textoEvolucaoInput = document.getElementById('texto-evolucao');
  const btnAddEvolucao = document.getElementById('btn-add-evolucao');
  
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
  const tituloEdicao = document.getElementById('titulo-edicao');
  const badgeTermo = document.getElementById('badge-termo-status');

  let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let editingEvolucaoId = null; let currentTermoAceite = false; 
  const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

  function createTempTitleInput() { const input = document.createElement('input'); input.id = 'titulo-evolucao'; input.className = 'form-control'; input.placeholder = 'Assunto'; input.style.marginBottom = '5px'; const textArea = document.getElementById('texto-evolucao'); if(textArea) textArea.parentNode.insertBefore(input, textArea); return input; }

  // --- FUNÇÃO DE CARREGAMENTO (POPULATE) ---
  const populateForm = (data) => {
    // 1. Campos Simples
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
    examesInput.value = data.exames || '';

    // 2. Mobilidade (Radio Buttons)
    if (data.mobilidade) {
        radiosMobilidade.forEach(radio => {
            if (radio.value === data.mobilidade) radio.checked = true;
        });
    }

    // 3. Comorbidades (Obj complexo)
    const comorb = data.comorbidades || {};
    if (comorb.temComorbidade) {
        radioComorbidadeSim.checked = true;
        inputOutrasComorbidades.value = comorb.outras || '';
        
        // Marcar checkboxes salvos
        if (Array.isArray(comorb.lista)) {
            checkboxesComorbidades.forEach(cb => {
                if (comorb.lista.includes(cb.value)) cb.checked = true;
            });
        }
    } else {
        radioComorbidadeNao.checked = true;
        // Limpar checkboxes
        checkboxesComorbidades.forEach(cb => cb.checked = false);
    }
    // Atualizar visual (mostrar/esconder lista)
    toggleComorbidades();

    // 4. Alergias
    const alerg = data.alergias || {};
    if (alerg.temAlergia) {
        radioAlergiaSim.checked = true;
        inputAlergiasQuais.value = alerg.quais || '';
    } else {
        radioAlergiaNao.checked = true;
        inputAlergiasQuais.value = '';
    }
    toggleAlergiaInput();

    // 5. Status do Termo
    currentTermoAceite = data.termoAceite || false;
    if (currentTermoAceite) { 
        badgeTermo.innerText = "✅ TERMO ACEITO"; 
        badgeTermo.className = "badge-termo aceito"; 
    } else { 
        badgeTermo.innerText = "❌ NÃO ACEITO"; 
        badgeTermo.className = "badge-termo pendente"; 
    }
  };

  // --- TOGGLES VISUAIS ---
  function toggleComorbidades() { 
      if (radioComorbidadeSim.checked) { 
          listaComorbidades.style.display = 'block'; 
          if (btnMinimizarComorbidades) {
              btnMinimizarComorbidades.style.display = 'flex';
              btnMinimizarComorbidades.classList.add('aberto');
              if (textoBtnToggle) textoBtnToggle.innerText = 'Minimizar';
          }
      } else { 
          listaComorbidades.style.display = 'none'; 
          if (btnMinimizarComorbidades) btnMinimizarComorbidades.style.display = 'none';
      } 
  }

  function toggleAlergiaInput() { 
      if (radioAlergiaSim.checked) { 
          inputAlergiasQuais.style.display = 'block'; 
          sinalizadorAlergia.style.display = 'flex'; 
      } else { 
          inputAlergiasQuais.style.display = 'none'; 
          sinalizadorAlergia.style.display = 'none'; 
      } 
  }

  // --- FETCH API ---
  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + pacienteId, { 
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      
      if (!response.ok) throw new Error('Erro na requisição');
      
      const data = await response.json();
      
      tituloEdicao.innerText = `Editando: ${data.nomePaciente || 'Paciente'}`;
      
      // Carrega os dados no formulário
      populateForm(data);
      
      // Carrega as listas (Medicação, Médicos, Evolução)
      currentMedicacoes = data.medicacoes || []; renderTabelaMedicacoes(); 
      currentMedicos = data.medicosAssistentes || []; renderMedicosList(); 
      currentEvolucoes = data.evolucoes || []; renderEvolucoes();

    } catch (error) { 
        console.error(error); 
        alert("Erro ao carregar os dados. Verifique a conexão."); 
    }
  };

  // --- SALVAR TUDO ---
  const handleSalvarTudo = async (e) => {
    e.preventDefault(); 
    btnSalvarTudo.innerText = 'Salvando...';
    
    // Coleta Mobilidade
    let mobilidadeSelecionada = '';
    const radioMob = document.querySelector('input[name="mobilidade"]:checked');
    if (radioMob) mobilidadeSelecionada = radioMob.value;

    // Coleta Comorbidades
    const listaComorbChecked = Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value);
    
    const payload = {
        nomePaciente: nomePacienteInput.value, 
        idade: idadeInput.value, 
        mobilidade: mobilidadeSelecionada,
        patologias: patologiasInput.value, 
        exames: examesInput.value,
        comorbidades: {
            temComorbidade: radioComorbidadeSim.checked,
            lista: radioComorbidadeSim.checked ? listaComorbChecked : [],
            outras: radioComorbidadeSim.checked ? inputOutrasComorbidades.value : ''
        },
        alergias: {
            temAlergia: radioAlergiaSim.checked,
            quais: radioAlergiaSim.checked ? inputAlergiasQuais.value : ''
        },
        medicosAssistentes: currentMedicos, 
        medicacoes: currentMedicacoes,
        termoAceite: currentTermoAceite 
    };

    try {
      await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      alert('Dados atualizados com sucesso!');
    } catch(err) { 
        console.error(err); 
        alert('Erro ao salvar.'); 
    }
    btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
  };

  // --- LISTENER EVENTS ---
  // Toggles
  radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
  radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
  radioComorbidadeNao.addEventListener('change', toggleComorbidades);
  radioComorbidadeSim.addEventListener('change', toggleComorbidades);
  
  if (btnMinimizarComorbidades) {
      btnMinimizarComorbidades.addEventListener('click', () => {
          if (listaComorbidades.style.display === 'none') {
              listaComorbidades.style.display = 'block';
              btnMinimizarComorbidades.classList.add('aberto');
              if (textoBtnToggle) textoBtnToggle.innerText = 'Minimizar';
          } else {
              listaComorbidades.style.display = 'none';
              btnMinimizarComorbidades.classList.remove('aberto');
              if (textoBtnToggle) textoBtnToggle.innerText = 'Expandir';
          }
      });
  }

  if (btnToggleMedForm) {
      btnToggleMedForm.addEventListener('click', () => {
          if (formAddMedicacao.style.display === 'none') { 
              formAddMedicacao.style.display = 'block'; 
              btnToggleMedForm.innerText = 'Cancelar Adição'; 
              btnToggleMedForm.classList.add('cancelar'); 
          } else { 
              formAddMedicacao.style.display = 'none'; 
              btnToggleMedForm.innerText = '+ Nova Medicação'; 
              btnToggleMedForm.classList.remove('cancelar'); 
          }
      });
  }

  // Medicos/Medicacoes Handlers (simplificados para brevidade, mantenha as funções de render)
  const renderMedicosList = () => { listaMedicosPills.innerHTML = ''; currentMedicos.forEach((m, i) => { listaMedicosPills.innerHTML += `<li class="pill-medico"><span>${m}</span><button class="btn-deletar-medico" data-index="${i}">✕</button></li>`; }); };
  const renderTabelaMedicacoes = () => { listaMedicacoesBody.innerHTML = ''; currentMedicacoes.forEach(m => { listaMedicacoesBody.innerHTML += `<tr><td>${m.nome}</td><td>${m.quantidade}</td><td>-</td><td>${m.horarioEspecifico}</td><td><button class="btn-deletar-medacao" data-nome="${m.nome}">✕</button></td></tr>`; }); };
  const renderEvolucoes = () => { listaEvolucoesDiv.innerHTML = ''; currentEvolucoes.forEach(e => { listaEvolucoesDiv.innerHTML += `<div class="evolucao-item"><div class="evo-header"><strong>${e.titulo}</strong></div><div class="evo-body"><p>${e.texto}</p></div></div>`; }); };

  document.getElementById('form-add-medico').addEventListener('submit', (e) => { e.preventDefault(); currentMedicos.push(nomeMedicoInput.value); renderMedicosList(); nomeMedicoInput.value=''; });
  listaMedicosPills.addEventListener('click', (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); } });
  
  document.getElementById('form-add-medicacao').addEventListener('submit', (e) => { 
      e.preventDefault(); 
      currentMedicacoes.push({nome: nomeMedicacaoInput.value, quantidade: qtdMedicacaoInput.value, horarioEspecifico: horarioEspecificoInput.value, horarios: {}}); 
      renderTabelaMedicacoes(); 
      formAddMedicacao.style.display = 'none'; 
      btnToggleMedForm.innerText = '+ Nova Medicação'; 
      btnToggleMedForm.classList.remove('cancelar');
  });
  
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);

  // INICIALIZA
  fetchProntuario();
});
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  const API_URL = 'https://aishageriatria.onrender.com/api/prontuario';

  if (!token) { window.location.href = 'login.html'; return; }

  const checkTermoAceite = document.getElementById('check-termo-aceite');
  const conteudoProntuario = document.getElementById('conteudo-prontuario');

  const nomePacienteInput = document.getElementById('nome-paciente');
  const rgPacienteInput = document.getElementById('rg-paciente'); // NOVO CAMPO RG
  const idadeInput = document.getElementById('idade');
  // MOBILIDADE
  const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');

  const patologiasInput = document.getElementById('patologias');
  const examesInput = document.getElementById('exames');
  
  // COMORBIDADES
  const radioComorbidadeNao = document.getElementById('comorbidade-nao');
  const radioComorbidadeSim = document.getElementById('comorbidade-sim');
  const listaComorbidades = document.getElementById('lista-comorbidades');
  const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
  const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');
  const btnMinimizarComorbidades = document.getElementById('btn-minimizar-comorbidades');
  const textoBtnToggle = document.getElementById('texto-btn-toggle');

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
  
  const btnToggleMedForm = document.getElementById('btn-toggle-med-form');
  const formAddMedicacao = document.getElementById('form-add-medicacao');

  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
  const btnDownloadPDF = document.getElementById('btn-download-pdf'); 
  const btnGerarQRCode = document.getElementById('btn-gerar-qrcode');
  const qrCodeContainer = document.getElementById('qrcode-container');
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  let currentMedicacoes = []; let currentMedicos = []; let currentUserId = null; 
  const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

  const btnLogout = document.getElementById('btn-logout-paciente');
  if(btnLogout) { btnLogout.addEventListener('click', () => { localStorage.clear(); window.location.href = 'index.html'; }); }

  // --- LÓGICA DO TERMO DE RESPONSABILIDADE ---
  window.abrirModalTermo = () => {
      // Preenche dados no termo para visualização
      const nomeParaTermo = nomePacienteInput.value || userName || "____________________";
      const rgParaTermo = rgPacienteInput.value || "____________________";
      
      document.getElementById('termo-nome-paciente').innerText = nomeParaTermo;
      document.getElementById('termo-rg-paciente').innerText = rgParaTermo;
      
      const hoje = new Date();
      document.getElementById('termo-data-atual').innerText = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

      document.getElementById('modal-termo').style.display = 'flex';
  };

  window.fecharModalTermo = () => {
      document.getElementById('modal-termo').style.display = 'none';
  };

  window.aceitarTermo = () => {
      checkTermoAceite.checked = true;
      checkTermoAceite.disabled = false; // Habilita visualmente
      toggleConteudoProntuario();
      fecharModalTermo();
      // Rolar a tela para o formulário
      conteudoProntuario.scrollIntoView({ behavior: 'smooth' });
  };

  function toggleConteudoProntuario() { 
      if (checkTermoAceite.checked) { 
          conteudoProntuario.style.display = 'block'; 
      } else { 
          conteudoProntuario.style.display = 'none'; 
      } 
  }
  // Removemos o listener direto de 'change' para forçar o uso do botão, mas mantemos a função
  // checkTermoAceite.addEventListener('change', toggleConteudoProntuario); 

  function toggleAlergiaInput() { if (radioAlergiaSim.checked) { inputAlergiasQuais.style.display = 'block'; sinalizadorAlergia.style.display = 'flex'; } else { inputAlergiasQuais.style.display = 'none'; sinalizadorAlergia.style.display = 'none'; } }
  
  function toggleComorbidades() { 
      if (radioComorbidadeSim.checked) { 
          listaComorbidades.style.display = 'block'; 
          btnMinimizarComorbidades.style.display = 'flex'; 
          btnMinimizarComorbidades.classList.add('aberto');
          if(textoBtnToggle) textoBtnToggle.innerText = 'Minimizar';
      } else { 
          listaComorbidades.style.display = 'none'; 
          btnMinimizarComorbidades.style.display = 'none';
      } 
  }
  
  if(btnMinimizarComorbidades) {
      btnMinimizarComorbidades.addEventListener('click', () => {
          if (listaComorbidades.style.display === 'none') {
              listaComorbidades.style.display = 'block';
              btnMinimizarComorbidades.classList.add('aberto');
              if(textoBtnToggle) textoBtnToggle.innerText = 'Minimizar';
          } else {
              listaComorbidades.style.display = 'none';
              btnMinimizarComorbidades.classList.remove('aberto');
              if(textoBtnToggle) textoBtnToggle.innerText = 'Expandir';
          }
      });
  }

  // TOGGLE MEDICAÇÃO
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

  horarioEspecificoInput.addEventListener('input', () => { if(horarioEspecificoInput.value) secaoTurnos.style.display = 'block'; else secaoTurnos.style.display = 'none'; });

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
    if(rgPacienteInput) rgPacienteInput.value = data.rg || ''; // Popula RG
    idadeInput.value = data.idade || '';
    
    if (data.mobilidade) {
        radiosMobilidade.forEach(radio => {
            if (radio.value === data.mobilidade) radio.checked = true;
        });
    }

    patologiasInput.value = data.patologias || '';
    examesInput.value = data.exames || '';

    if (data.comorbidades && data.comorbidades.temComorbidade) {
        radioComorbidadeSim.checked = true;
        inputOutrasComorbidades.value = data.comorbidades.outras || '';
        if (data.comorbidades.lista) {
            checkboxesComorbidades.forEach(cb => {
                if (data.comorbidades.lista.includes(cb.value)) cb.checked = true;
            });
        }
    } else {
        radioComorbidadeNao.checked = true;
        inputOutrasComorbidades.value = '';
        checkboxesComorbidades.forEach(cb => cb.checked = false);
    }
    toggleComorbidades();
    
    if (data.termoAceite) { 
        checkTermoAceite.checked = true; 
        checkTermoAceite.disabled = false;
        toggleConteudoProntuario();
    }

    if (data.alergias && data.alergias.temAlergia) { radioAlergiaSim.checked = true; inputAlergiasQuais.value = data.alergias.quais || ''; } 
    else { radioAlergiaNao.checked = true; inputAlergiasQuais.value = ''; }
    toggleAlergiaInput();
  };

  const renderMedicosList = () => { listaMedicosPills.innerHTML = ''; if (currentMedicos.length === 0) { listaMedicosPills.innerHTML = '<li style="width:100%; text-align:center; color:#ccc; font-size:0.8rem;">Nenhum médico.</li>'; return; } currentMedicos.forEach((medico, index) => { const pill = `<li class="pill-medico"><span>${medico}</span><button class="btn-deletar-medico no-print" data-index="${index}">✕</button></li>`; listaMedicosPills.insertAdjacentHTML('beforeend', pill); }); listaMedicosPills.scrollTop = listaMedicosPills.scrollHeight; };
  const handleAddMedico = (e) => { e.preventDefault(); const nome = nomeMedicoInput.value.trim(); const tel = telefoneMedicoInput.value.trim(); if(!nome) return; const textoFinal = `${nome} ${tel ? '  (' + tel + ')' : ''}`; currentMedicos.push(textoFinal); renderMedicosList(); nomeMedicoInput.value=''; telefoneMedicoInput.value=''; };
  const handleDeleteMedico = (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); }};

  const renderTabelaMedicacoes = () => { listaMedicacoesBody.innerHTML = ''; if (currentMedicacoes.length === 0) { listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ccc; font-size:0.8rem;">Vazio</td></tr>'; return; } const list = [...currentMedicacoes].sort((a, b) => { const horaA = a.horarioEspecifico ? a.horarioEspecifico : '23:59'; const horaB = b.horarioEspecifico ? b.horarioEspecifico : '23:59'; return horaA.localeCompare(horaB); }); list.forEach((med) => { let turnosHtml = ''; for (const [key, value] of Object.entries(med.horarios)) { if (value === true) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; } } if (!turnosHtml) turnosHtml = '<span style="color:#ccc">-</span>'; const horarioDisplay = med.horarioEspecifico ? med.horarioEspecifico : '<span style="color:#ccc;">--:--</span>'; const qtdDisplay = med.quantidade ? med.quantidade : '-'; const row = `<tr><td style="font-weight:500;">${med.nome}</td><td class="col-qtd">${qtdDisplay}</td><td>${turnosHtml}</td><td class="col-horario">${horarioDisplay}</td><td class="no-print" style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td></tr>`; listaMedicacoesBody.insertAdjacentHTML('beforeend', row); }); };
  
  const handleAddMedicacao = (e) => { 
      e.preventDefault(); if(!nomeMedicacaoInput.value) return; 
      const horarios = {}; checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked); 
      currentMedicacoes.push({ nome: nomeMedicacaoInput.value, quantidade: qtdMedicacaoInput.value, horarioEspecifico: horarioEspecificoInput.value, horarios }); 
      renderTabelaMedicacoes(); document.getElementById('form-add-medicacao').reset(); secaoTurnos.style.display = 'none'; 
      if(formAddMedicacao && btnToggleMedForm) {
          formAddMedicacao.style.display = 'none';
          btnToggleMedForm.innerText = '+ Nova Medicação';
          btnToggleMedForm.classList.remove('cancelar');
      }
  };
  
  const handleDeleteMedicacao = (e) => { if(e.target.classList.contains('btn-deletar-medacao')) { currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome); renderTabelaMedicacoes(); }};

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    if (!checkTermoAceite.checked) { alert("Você deve aceitar o termo de responsabilidade."); return; }
    btnSalvarTudo.innerText = 'Salvando...';
    
    let mobilidadeSelecionada = '';
    const radioMobilidadeChecked = document.querySelector('input[name="mobilidade"]:checked');
    if (radioMobilidadeChecked) { mobilidadeSelecionada = radioMobilidadeChecked.value; }

    const comorbidadesSelecionadas = Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value);
    const comorbidadesDados = {
        temComorbidade: radioComorbidadeSim.checked,
        lista: radioComorbidadeSim.checked ? comorbidadesSelecionadas : [],
        outras: radioComorbidadeSim.checked ? inputOutrasComorbidades.value : ''
    };

    const dadosAlergia = { temAlergia: radioAlergiaSim.checked, quais: radioAlergiaSim.checked ? inputAlergiasQuais.value : '' };
    try {
      await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            nomePaciente: nomePacienteInput.value, 
            rg: rgPacienteInput.value, // Salva o RG
            idade: idadeInput.value, 
            mobilidade: mobilidadeSelecionada, 
            patologias: patologiasInput.value, 
            exames: examesInput.value,
            comorbidades: comorbidadesDados,
            alergias: dadosAlergia, 
            medicosAssistentes: currentMedicos, 
            medicacoes: currentMedicacoes, 
            termoAceite: true 
        })
      });
      mensagemRetorno.innerText = 'Sucesso!'; mensagemRetorno.style.color = '#2ADCA1';
    } catch (error) { mensagemRetorno.innerText = 'Erro ao salvar.'; mensagemRetorno.style.color = '#e74c3c'; }
    btnSalvarTudo.innerText = 'Salvar Prontuário';
  };

  const handleDownloadPDF = () => { window.print(); };
  const handleGerarQRCode = () => { if (!currentUserId) { alert('Erro: ID não encontrado.'); return; } const url = window.location.href.replace('perfil-paciente.html', 'prontuario-publico.html').replace('admin-dashboard.html', 'prontuario-publico.html') + `?id=${currentUserId}`; qrCodeContainer.innerHTML = ''; new QRCode(qrCodeContainer, { text: url, width: 200, height: 200, colorDark : "#000000", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H }); qrCodeContainer.style.display = 'block'; btnGerarQRCode.innerText = 'QR Code Gerado!'; };

  radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
  radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
  radioComorbidadeNao.addEventListener('change', toggleComorbidades);
  radioComorbidadeSim.addEventListener('change', toggleComorbidades);

  document.getElementById('form-add-medico').addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  document.getElementById('form-add-medicacao').addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  btnDownloadPDF.addEventListener('click', handleDownloadPDF); 
  btnGerarQRCode.addEventListener('click', handleGerarQRCode); 

  fetchProntuario();
});
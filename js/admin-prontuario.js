document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
  
  const pacienteId = new URLSearchParams(window.location.search).get('id');

  if (!token || role !== 'admin' || !pacienteId) { localStorage.clear(); window.location.href = 'login.html'; return; }

  // SELETORES
  const nomePacienteInput = document.getElementById('nome-paciente');
  const radiosGenero = document.querySelectorAll('input[name="genero"]');
  const dataNascimentoInput = document.getElementById('data-nascimento');
  const idadeCalculadaSpan = document.getElementById('idade-calculada');
  const idadeInput = document.getElementById('idade'); // Campo oculto para salvar idade numérica
  const emailPessoalInput = document.getElementById('email-pessoal');
  const cpfInput = document.getElementById('cpf');
  const rgInput = document.getElementById('rg');

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

  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');

  const nomeMedicoInput = document.getElementById('nome-medico');
  const telefoneMedicoInput = document.getElementById('telefone-medico');
  const nomeMedicacaoInput = document.getElementById('nome-medicacao');
  const qtdMedicacaoInput = document.getElementById('qtd-medicacao');
  const horarioEspecificoInput = document.getElementById('horario-especifico'); 
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

  // Função para calcular idade
  function calcularIdade(dataStr) {
      if (!dataStr) return '';
      const nascimento = new Date(dataStr);
      const hoje = new Date();
      let anos = hoje.getFullYear() - nascimento.getFullYear();
      let meses = hoje.getMonth() - nascimento.getMonth();
      if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
          anos--;
          meses += 12;
      }
      return `${anos} anos, ${meses} meses`;
  }

  // Listener data nascimento
  if(dataNascimentoInput) {
      dataNascimentoInput.addEventListener('change', () => {
          const textoIdade = calcularIdade(dataNascimentoInput.value);
          if(idadeCalculadaSpan) idadeCalculadaSpan.innerText = textoIdade;
          if(idadeInput) idadeInput.value = parseInt(textoIdade) || ''; 
      });
  }

  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || '';
    
    // Novos Campos
    if (data.genero) radiosGenero.forEach(r => { if(r.value === data.genero) r.checked = true; });
    if (dataNascimentoInput) dataNascimentoInput.value = data.dataNascimento || '';
    if (idadeCalculadaSpan) idadeCalculadaSpan.innerText = calcularIdade(data.dataNascimento) || '-- anos';
    if (emailPessoalInput) emailPessoalInput.value = data.emailPessoal || '';
    if (cpfInput) cpfInput.value = data.cpf || '';
    if (rgInput) rgInput.value = data.rg || '';
    if (idadeInput) idadeInput.value = data.idade || '';

    patologiasInput.value = data.patologias || '';
    examesInput.value = data.exames || '';

    if (data.mobilidade) radiosMobilidade.forEach(r => { if(r.value === data.mobilidade) r.checked = true; });

    const comorb = data.comorbidades || {};
    if (comorb.temComorbidade) {
        radioComorbidadeSim.checked = true;
        inputOutrasComorbidades.value = comorb.outras || '';
        if (comorb.lista) checkboxesComorbidades.forEach(cb => { if(comorb.lista.includes(cb.value)) cb.checked = true; });
    } else { radioComorbidadeNao.checked = true; }
    toggleComorbidades();

    const alerg = data.alergias || {};
    if (alerg.temAlergia) { radioAlergiaSim.checked = true; inputAlergiasQuais.value = alerg.quais || ''; } 
    else { radioAlergiaNao.checked = true; }
    toggleAlergiaInput();

    currentTermoAceite = data.termoAceite || false;
    if (currentTermoAceite) { badgeTermo.innerText = "✅ TERMO ACEITO"; badgeTermo.className = "badge-termo aceito"; } 
    else { badgeTermo.innerText = "❌ NÃO ACEITO"; badgeTermo.className = "badge-termo pendente"; }
  };

  function toggleComorbidades() { 
      if (radioComorbidadeSim.checked) { listaComorbidades.style.display = 'block'; if(btnMinimizarComorbidades) { btnMinimizarComorbidades.style.display = 'flex'; btnMinimizarComorbidades.classList.add('aberto'); if(textoBtnToggle) textoBtnToggle.innerText = 'Minimizar'; } } 
      else { listaComorbidades.style.display = 'none'; if(btnMinimizarComorbidades) btnMinimizarComorbidades.style.display = 'none'; } 
  }
  
  if(btnMinimizarComorbidades) {
      btnMinimizarComorbidades.addEventListener('click', () => {
          if (listaComorbidades.style.display === 'none') { listaComorbidades.style.display = 'block'; btnMinimizarComorbidades.classList.add('aberto'); if(textoBtnToggle) textoBtnToggle.innerText = 'Minimizar'; } 
          else { listaComorbidades.style.display = 'none'; btnMinimizarComorbidades.classList.remove('aberto'); if(textoBtnToggle) textoBtnToggle.innerText = 'Expandir'; }
      });
  }

  function toggleAlergiaInput() { 
      if (radioAlergiaSim.checked) { inputAlergiasQuais.style.display = 'block'; sinalizadorAlergia.style.display = 'flex'; } 
      else { inputAlergiasQuais.style.display = 'none'; sinalizadorAlergia.style.display = 'none'; } 
  }

  const fetchProntuario = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Erro API');
      const data = await response.json();
      tituloEdicao.innerText = `Editando: ${data.nomePaciente || 'Paciente'}`;
      populateForm(data);
      currentMedicacoes = data.medicacoes || []; renderTabelaMedicacoes(); 
      currentMedicos = data.medicosAssistentes || []; renderMedicosList(); 
      currentEvolucoes = data.evolucoes || []; renderEvolucoes();
    } catch (error) { console.error(error); alert("Erro ao carregar dados."); }
  };

  const renderMedicosList = () => { listaMedicosPills.innerHTML = ''; currentMedicos.forEach((m, i) => { listaMedicosPills.innerHTML += `<li class="pill-medico"><span>${m}</span><button class="btn-deletar-medico" data-index="${i}">✕</button></li>`; }); };
  
  const renderTabelaMedicacoes = () => { 
      listaMedicacoesBody.innerHTML = ''; 
      if (currentMedicacoes.length === 0) { listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Nenhuma medicação.</td></tr>'; return; } 
      const list = [...currentMedicacoes].sort((a, b) => { const hA = a.horarioEspecifico || '23:59'; const hB = b.horarioEspecifico || '23:59'; return hA.localeCompare(hB); }); 
      
      list.forEach((med) => { 
          let turnosHtml = ''; 
          if (med.horarios) {
              for (const [key, value] of Object.entries(med.horarios)) { 
                  if (value === true && mapTurnos[key]) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; } 
              } 
          }
          if (!turnosHtml) turnosHtml = '<span style="color:#ccc; font-size:0.8rem;">-</span>'; 
          const horarioDisplay = med.horarioEspecifico ? med.horarioEspecifico : '<span style="color:#ccc;">--:--</span>'; 
          const qtdDisplay = med.quantidade ? med.quantidade : '-'; 
          
          const row = `<tr><td>${med.nome}</td><td class="col-qtd">${qtdDisplay}</td><td>${turnosHtml}</td><td class="col-horario">${horarioDisplay}</td><td class="no-print" style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td></tr>`; 
          listaMedicacoesBody.insertAdjacentHTML('beforeend', row); 
      }); 
  };

  const renderEvolucoes = () => {
    listaEvolucoesDiv.innerHTML = '';
    if (!currentEvolucoes || currentEvolucoes.length === 0) { listaEvolucoesDiv.innerHTML = '<p style="text-align:center; color:#ccc;">Vazio</p>'; return; }
    const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));
    list.forEach(evo => {
        const d = new Date(evo.data);
        const dataStr = `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')} ${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
        const html = `<div class="evolucao-item" id="evo-${evo._id}"><div class="evo-header" id="header-${evo._id}" onclick="toggleEvolucao('${evo._id}')"><div class="evo-left"><span class="evo-date">${dataStr}</span><strong class="evo-title">${evo.titulo}</strong></div><div class="evo-right"><div class="evo-btns" onclick="event.stopPropagation()"><button class="btn-mini edit" onclick="startEditEvolucao('${evo._id}')">✎</button><button class="btn-mini delete" onclick="deleteEvolucao('${evo._id}')">✕</button></div><span class="evo-arrow">▼</span></div></div><div class="evo-body" id="body-${evo._id}"><p>${evo.texto.replace(/\n/g, '<br>')}</p><small style="color:#aaa; display:block; margin-top:5px;">Ass: ${evo.autor || 'Dra. Aisha'}</small></div></div>`;
        listaEvolucoesDiv.insertAdjacentHTML('beforeend', html);
    });
  };

  window.toggleEvolucao = (id) => { const body = document.getElementById(`body-${id}`); const header = document.getElementById(`header-${id}`); if (body.classList.contains('aberto')) { body.classList.remove('aberto'); header.classList.remove('aberto'); } else { body.classList.add('aberto'); header.classList.add('aberto'); } };
  window.startEditEvolucao = (id) => { const evo = currentEvolucoes.find(e => e._id === id); if (!evo) return; tituloEvolucaoInput.value = evo.titulo; textoEvolucaoInput.value = evo.texto; editingEvolucaoId = id; btnAddEvolucao.innerText = 'Salvar Alteração'; btnAddEvolucao.style.backgroundColor = '#FFB74D'; tituloEvolucaoInput.scrollIntoView({behavior: 'smooth'}); };
  window.deleteEvolucao = async (id) => { if (!confirm('Excluir?')) return; try { const res = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, { method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} }); if (res.ok) { const data = await res.json(); if(data.prontuario) currentEvolucoes = data.prontuario.evolucoes; renderEvolucoes(); } } catch (err) { alert('Erro.'); } };
  const handleSaveEvolucao = async () => { const titulo = tituloEvolucaoInput.value.trim(); const texto = textoEvolucaoInput.value.trim(); if (!titulo || !texto) { alert('Preencha tudo.'); return; } btnAddEvolucao.disabled = true; try { let url = `${API_ADMIN_BASE}${pacienteId}/evolucao`; let method = 'POST'; if (editingEvolucaoId) { url += `/${editingEvolucaoId}`; method = 'PUT'; } const res = await fetch(url, { method, headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify({ titulo, texto }) }); const data = await res.json(); if (res.ok) { currentEvolucoes = data.prontuario.evolucoes; renderEvolucoes(); tituloEvolucaoInput.value = ''; textoEvolucaoInput.value = ''; editingEvolucaoId = null; btnAddEvolucao.innerText = '+ Registrar Evolução'; btnAddEvolucao.style.backgroundColor = '#2ADCA1'; } } catch (e) { alert('Erro.'); } btnAddEvolucao.disabled = false; };

  const handleSalvarTudo = async (e) => {
    e.preventDefault(); btnSalvarTudo.innerText = 'Salvando...';
    
    let mob = ''; const rMob = document.querySelector('input[name="mobilidade"]:checked'); if(rMob) mob = rMob.value;
    let genero = ''; const rGenero = document.querySelector('input[name="genero"]:checked'); if(rGenero) genero = rGenero.value;
    
    const cList = Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value);
    
    try {
        await fetch(API_ADMIN_BASE + pacienteId, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                nomePaciente: nomePacienteInput.value, 
                genero: genero,
                dataNascimento: dataNascimentoInput.value,
                emailPessoal: emailPessoalInput.value,
                cpf: cpfInput.value,
                rg: rgInput.value,
                idade: idadeInput.value,
                
                mobilidade: mob,
                patologias: patologiasInput.value, exames: examesInput.value,
                comorbidades: { temComorbidade: radioComorbidadeSim.checked, lista: cList, outras: inputOutrasComorbidades.value },
                alergias: { temAlergia: radioAlergiaSim.checked, quais: inputAlergiasQuais.value },
                medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, termoAceite: currentTermoAceite
            })
        });
        alert('Salvo!');
    } catch (e) { alert('Erro.'); }
    btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
  };

  radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
  radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
  radioComorbidadeNao.addEventListener('change', toggleComorbidades);
  radioComorbidadeSim.addEventListener('change', toggleComorbidades);
  
  if (btnToggleMedForm) { btnToggleMedForm.addEventListener('click', () => { if (formAddMedicacao.style.display === 'none') { formAddMedicacao.style.display = 'block'; btnToggleMedForm.innerText = 'Cancelar'; btnToggleMedForm.classList.add('cancelar'); } else { formAddMedicacao.style.display = 'none'; btnToggleMedForm.innerText = '+ Nova Medicação'; btnToggleMedForm.classList.remove('cancelar'); } }); }
  
  document.getElementById('form-add-medico').addEventListener('submit', (e) => { e.preventDefault(); currentMedicos.push(nomeMedicoInput.value); renderMedicosList(); nomeMedicoInput.value=''; });
  listaMedicosPills.addEventListener('click', (e) => { if(e.target.classList.contains('btn-deletar-medico')) { currentMedicos.splice(e.target.dataset.index, 1); renderMedicosList(); } });
  
  document.getElementById('form-add-medicacao').addEventListener('submit', (e) => { 
      e.preventDefault(); 
      const horarios = {}; 
      checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked); 
      
      currentMedicacoes.push({
          nome: nomeMedicacaoInput.value, 
          quantidade: qtdMedicacaoInput.value, 
          horarioEspecifico: horarioEspecificoInput.value, 
          horarios: horarios 
      }); 
      
      renderTabelaMedicacoes(); 
      formAddMedicacao.style.display='none'; 
      btnToggleMedForm.innerText = '+ Nova Medicação'; 
      btnToggleMedForm.classList.remove('cancelar'); 
      document.getElementById('form-add-medicacao').reset();
  });
  
  listaMedicacoesBody.addEventListener('click', (e) => { if(e.target.classList.contains('btn-deletar-medacao')) { currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome); renderTabelaMedicacoes(); } });

  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  if (btnAddEvolucao) btnAddEvolucao.addEventListener('click', handleSaveEvolucao);

  fetchProntuario();
});
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const API_ADMIN_BASE = 'https://aishageriatria.onrender.com/api/admin/prontuario/';
  const pacienteId = new URLSearchParams(window.location.search).get('id');

  if (!token || role !== 'admin' || !pacienteId) { localStorage.clear(); window.location.href = 'login.html'; return; }

  // ELEMENTOS (MAPEAMENTO COMPLETO)
  const nomePacienteInput = document.getElementById('nome-paciente');
  const idadeInput = document.getElementById('idade');
  const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
  const patologiasInput = document.getElementById('patologias');
  const examesInput = document.getElementById('exames');
  
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

  // (RESTANTE DOS ELEMENTOS: MEDICOS, MEDICACAO, EVOLUCAO...)
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
  
  const tituloEvolucaoInput = document.getElementById('titulo-evolucao') || createTempTitleInput();
  const textoEvolucaoInput = document.getElementById('texto-evolucao');
  const btnAddEvolucao = document.getElementById('btn-add-evolucao');
  const listaEvolucoesDiv = document.getElementById('lista-evolucoes');
  
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
  const tituloEdicao = document.getElementById('titulo-edicao');
  const badgeTermo = document.getElementById('badge-termo-status');

  let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let editingEvolucaoId = null; let currentTermoAceite = false; 
  const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

  function createTempTitleInput() { const input = document.createElement('input'); input.id = 'titulo-evolucao'; input.className = 'form-control'; input.placeholder = 'Assunto'; input.style.marginBottom = '5px'; const textArea = document.getElementById('texto-evolucao'); if(textArea) textArea.parentNode.insertBefore(input, textArea); return input; }

  // --- POPULATE FORM (CORRIGIDO) ---
  const populateForm = (data) => {
    // 1. Dados Básicos
    nomePacienteInput.value = data.nomePaciente || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
    examesInput.value = data.exames || '';

    // 2. Mobilidade (CARREGANDO)
    if (data.mobilidade) {
        radiosMobilidade.forEach(radio => {
            if (radio.value === data.mobilidade) radio.checked = true;
        });
    }

    // 3. Comorbidades (CARREGANDO)
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
    }
    toggleComorbidades(); 

    // 4. Alergias
    if (data.alergias && data.alergias.temAlergia) {
        radioAlergiaSim.checked = true;
        inputAlergiasQuais.value = data.alergias.quais || '';
    } else {
        radioAlergiaNao.checked = true;
        inputAlergiasQuais.value = '';
    }
    toggleAlergiaInput();

    // 5. Termo
    currentTermoAceite = data.termoAceite || false;
    if (currentTermoAceite) { badgeTermo.innerText = "✅ TERMO ACEITO"; badgeTermo.className = "badge-termo aceito"; } else { badgeTermo.innerText = "❌ NÃO ACEITO"; badgeTermo.className = "badge-termo pendente"; }
  };

  // --- TOGGLES ---
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

  function toggleAlergiaInput() { if (radioAlergiaSim.checked) { inputAlergiasQuais.style.display = 'block'; sinalizadorAlergia.style.display = 'flex'; } else { inputAlergiasQuais.style.display = 'none'; sinalizadorAlergia.style.display = 'none'; } }
  horarioEspecificoInput.addEventListener('input', () => { if(horarioEspecificoInput.value) secaoTurnos.style.display = 'block'; else secaoTurnos.style.display = 'none'; });

  // --- FETCH DADOS ---
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

  // --- RESTANTE DAS FUNÇÕES (Mantidas do arquivo anterior: Renders, Handlers, Salvar) ---
  // Certifique-se de copiar as funções renderMedicosList, renderTabelaMedicacoes, renderEvolucoes, handleAdd..., handleDelete... do bloco anterior ou do arquivo JS original.
  // Vou colocar a função de SALVAR para garantir que a Mobilidade seja salva.

  const handleSalvarTudo = async (e) => {
    e.preventDefault(); btnSalvarTudo.innerText = 'Salvando...';
    
    // Coletar Mobilidade
    let mobilidadeSelecionada = '';
    const radioMobilidadeChecked = document.querySelector('input[name="mobilidade"]:checked');
    if (radioMobilidadeChecked) mobilidadeSelecionada = radioMobilidadeChecked.value;

    const comorbidadesSelecionadas = Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value);
    const comorbidadesDados = {
        temComorbidade: radioComorbidadeSim.checked,
        lista: radioComorbidadeSim.checked ? comorbidadesSelecionadas : [],
        outras: radioComorbidadeSim.checked ? inputOutrasComorbidades.value : ''
    };

    const dadosAlergia = { temAlergia: radioAlergiaSim.checked, quais: radioAlergiaSim.checked ? inputAlergiasQuais.value : '' };

    try {
      await fetch(API_ADMIN_BASE + pacienteId, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
            nomePaciente: nomePacienteInput.value, 
            idade: idadeInput.value, 
            mobilidade: mobilidadeSelecionada, // SALVANDO
            patologias: patologiasInput.value, 
            exames: examesInput.value,
            comorbidades: comorbidadesDados,
            alergias: dadosAlergia, 
            medicosAssistentes: currentMedicos, 
            medicacoes: currentMedicacoes,
            termoAceite: currentTermoAceite 
        })
      });
      alert('Dados salvos!');
    } catch(err) { console.error(err); alert('Erro ao salvar.'); }
    btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
  };

  // Listeners e Inicialização
  if (btnToggleMedForm) {
      btnToggleMedForm.addEventListener('click', () => {
          if (formAddMedicacao.style.display === 'none') { formAddMedicacao.style.display = 'block'; btnToggleMedForm.innerText = 'Cancelar Adição'; btnToggleMedForm.classList.add('cancelar'); } else { formAddMedicacao.style.display = 'none'; btnToggleMedForm.innerText = '+ Nova Medicação'; btnToggleMedForm.classList.remove('cancelar'); }
      });
  }
  radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
  radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
  radioComorbidadeNao.addEventListener('change', toggleComorbidades);
  radioComorbidadeSim.addEventListener('change', toggleComorbidades);
  
  // (Adicione os listeners de add/delete médicos e medicações aqui igual ao anterior)
  // ...

  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  fetchProntuario();
});
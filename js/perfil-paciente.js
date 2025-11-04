// Arquivo: /js/perfil-paciente.js (Completo e Corrigido Definitivamente)

document.addEventListener('DOMContentLoaded', () => {

  // ===================================================================
  // 1. CONFIGURAÇÃO INICIAL E VERIFICAÇÃO DE SEGURANÇA
  // ===================================================================
  
  const token = localStorage.getItem('authToken');
  const userName = localStorage.getItem('userName');
  const API_URL = 'https://aishageriatria.onrender.com';

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // ===================================================================
  // 2. SELETORES DE ELEMENTOS
  // ===================================================================
  
  // Formulário Principal
  const nomePacienteInput = document.getElementById('nome-paciente');
  const idadeInput = document.getElementById('idade');
  const patologiasInput = document.getElementById('patologias');
  
  // Gerenciador de Médicos
  const formAddMedico = document.getElementById('form-add-medico');
  const nomeMedicoInput = document.getElementById('nome-medico');
  const listaMedicosPills = document.getElementById('lista-medicos-pills');

  // Gerenciador de Medicações
  const formAddMedicacao = document.getElementById('form-add-medicacao');
  const nomeMedicacaoInput = document.getElementById('nome-medicacao');
  const horarioEspecificoInput = document.getElementById('horario-especifico'); 
  const checkboxesHorarios = document.querySelectorAll('input[name="horario"]');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
  
  // Gerador de QR Code
  const btnGerarQRCode = document.getElementById('btn-gerar-qrcode');
  const qrCodeContainer = document.getElementById('qrcode-container');

  // Botões e Mensagens
  const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
  const btnDownloadPDF = document.getElementById('btn-download-pdf'); // Botão do PDF
  const mensagemRetorno = document.getElementById('mensagem-retorno');
  
  // "Estado" da nossa página
  let currentMedicacoes = [];
  let currentMedicos = []; 
  let currentUserId = null; 

  // Mapeamento dos turnos
  const mapTurnos = {
    antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço',
    tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir'
  };

  // ===================================================================
  // 3. FUNÇÕES PRINCIPAIS
  // ===================================================================

  /**
   * FUNÇÃO 1: Buscar os dados do prontuário na API
   */
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

  /**
   * FUNÇÃO 2: Preencher o formulário principal
   */
  const populateForm = (data) => {
    nomePacienteInput.value = data.nomePaciente || userName || '';
    idadeInput.value = data.idade || '';
    patologiasInput.value = data.patologias || '';
  };

  // --- Funções do Gerenciador de Médicos ---
  
  /**
   * FUNÇÃO 3A: Desenhar a lista de pílulas de médicos
   */
  const renderMedicosList = () => {
    listaMedicosPills.innerHTML = ''; 
    if (currentMedicos.length === 0) {
      listaMedicosPills.innerHTML = '<li style="font-size: 14px; color: #777;">Nenhum médico assistente adicionado.</li>';
      return;
    }
    currentMedicos.forEach((medico, index) => {
      const pill = `
        <li class="pill-medico">
          <span>${medico}</span>
          <button class="btn-deletar-medico no-print" data-index="${index}">✖</button>
        </li>
      `;
      listaMedicosPills.insertAdjacentHTML('beforeend', pill);
    });
  };

  /**
   * FUNÇÃO 3B: Adicionar um médico à lista
   */
  const handleAddMedico = (event) => {
    event.preventDefault();
    const nome = nomeMedicoInput.value.trim(); 
    if (!nome) {
      alert('Por favor, digite o nome do médico.');
      return;
    }
    currentMedicos.push(nome); 
    renderMedicosList(); 
    nomeMedicoInput.value = ''; 
  };

  /**
   * FUNÇÃO 3C: Deletar um médico da lista
   */
  const handleDeleteMedico = (event) => {
    if (event.target.classList.contains('btn-deletar-medico')) {
      const index = parseInt(event.target.dataset.index, 10);
      currentMedicos.splice(index, 1); 
      renderMedicosList(); 
    }
  };


  // --- Funções do Gerenciador de Medicações ---
  
  /**
   * FUNÇÃO 4: Desenhar a tabela de medicações (com ordenação)
   */
  const renderTabelaMedicacoes = () => {
    listaMedicacoesBody.innerHTML = ''; 
    if (currentMedicacoes.length === 0) {
      listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhuma medicação adicionada.</td></tr>';
      return;
    }

    // Lógica de Ordenação por horário
    const medicoesOrdenadas = [...currentMedicacoes]; 
    medicoesOrdenadas.sort((a, b) => {
      const horarioA = a.horarioEspecifico || '99:99';
      const horarioB = b.horarioEspecifico || '99:99';
      if (horarioA < horarioB) return -1;
      if (horarioA > horarioB) return 1;
      return a.nome.localeCompare(b.nome);
    });

    medicoesOrdenadas.forEach((med) => { 
      let turnosHtml = '';
      for (const [key, value] of Object.entries(med.horarios)) {
        if (value === true) { 
          turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`;
        }
      }
      if (turnosHtml === '') { turnosHtml = 'N/A'; }
      const horarioTxt = med.horarioEspecifico || 'N/A';
      
      const row = `
        <tr>
          <td class="col-medicacao">${med.nome}</td>
          <td class="col-turnos">${turnosHtml}</td>
          <td class="col-horario">${horarioTxt}</td>
          <td class="col-acao no-print">
            <button class="btn-deletar-medacao" data-nome="${med.nome}">✖</button>
          </td>
        </tr>
      `;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };

  /**
   * FUNÇÃO 5: Adicionar uma nova medicação
   */
  const handleAddMedicacao = (event) => {
    event.preventDefault(); 
    const nome = nomeMedicacaoInput.value;
    const horarioEspecifico = horarioEspecificoInput.value; 
    if (!nome) {
      alert('Por favor, digite o nome da medicação.');
      return;
    }
    const horarios = {};
    checkboxesHorarios.forEach(cb => {
      horarios[cb.value] = cb.checked;
    });
    currentMedicacoes.push({
      nome: nome,
      horarioEspecifico: horarioEspecifico,
      horarios: horarios
    });
    renderTabelaMedicacoes();
    formAddMedicacao.reset(); 
  };

  /**
   * FUNÇÃO 6: Deletar uma medicação (por nome)
   */
  const handleDeleteMedicacao = (event) => {
    if (event.target.classList.contains('btn-deletar-medacao')) {
      const nomeParaDeletar = event.target.dataset.nome; 
      currentMedicacoes = currentMedicacoes.filter(med => med.nome !== nomeParaDeletar);
      renderTabelaMedicacoes();
    }
  };

  /**
   * FUNÇÃO 7: Salvar TUDO no banco de dados (com nome corrigido)
   */
  const handleSalvarTudo = async (event) => {
    event.preventDefault();
    
    btnSalvarTudo.disabled = true;
    btnSalvarTudo.innerText = 'Salvando...';
    mensagemRetorno.innerText = '';

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
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#2ADCA1';
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao salvar prontuário:', error);
      mensagemRetorno.innerText = `Erro: ${error.message || 'Não foi possível salvar.'}`;
      mensagemRetorno.style.color = '#e74c3c';
    }
    btnSalvarTudo.disabled = false;
    btnSalvarTudo.innerText = 'Salvar Prontuário Completo';
  };

  /**
   * FUNÇÃO 8: Gerar e Baixar o PDF (MÉTODO NATIVO window.print)
   */
  const handleDownloadPDF = () => {
    // Simplesmente chama a função de impressão do navegador
    window.print();
  };
  
  /**
   * FUNÇÃO 9: Gerar o QR Code
   */
  const handleGerarQRCode = () => {
    if (!currentUserId) {
      alert('Erro: Não foi possível encontrar o ID do usuário. Tente recarregar a página.');
      return;
    }
    
    const currentUrl = new URL(window.location.href);
    currentUrl.pathname = currentUrl.pathname.substring(0, currentUrl.pathname.lastIndexOf('/'));
    currentUrl.pathname += '/prontuario-publico.html';
    currentUrl.search = `?id=${currentUserId}`;
    
    const publicUrl = currentUrl.href;
    
    console.log('Gerando QR Code para:', publicUrl);

    qrCodeContainer.innerHTML = '';
    
    new QRCode(qrCodeContainer, {
      text: publicUrl,
      width: 200,
      height: 200,
      colorDark : "#000000",
      colorLight : "#ffffff",
      correctLevel : QRCode.CorrectLevel.H
    });

    qrCodeContainer.style.display = 'block';
    btnGerarQRCode.innerText = 'QR Code Gerado! (Clique para gerar novamente)';
  };


  // ===================================================================
  // 4. INICIALIZAÇÃO E "OUVINTES" DE EVENTOS
  // ===================================================================

  // "Ouvintes" de Médicos
  formAddMedico.addEventListener('submit', handleAddMedico);
  listaMedicosPills.addEventListener('click', handleDeleteMedico);
  
  // "Ouvintes" de Medicações
  formAddMedicacao.addEventListener('submit', handleAddMedicacao);
  listaMedicacoesBody.addEventListener('click', handleDeleteMedicacao);

  // "Ouvintes" de Ações Principais
  btnSalvarTudo.addEventListener('click', handleSalvarTudo);
  btnDownloadPDF.addEventListener('click', handleDownloadPDF); // <-- CORRIGIDO
  btnGerarQRCode.addEventListener('click', handleGerarQRCode); 

  // Ponto de partida
  fetchProntuario();
});
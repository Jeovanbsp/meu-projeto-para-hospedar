// Arquivo: /js/prontuario-publico.js (CÓDIGO CORRETO DO FRONTEND)

document.addEventListener('DOMContentLoaded', () => {

  // URL da nossa API (backend) - CORRIGIDO PARA O RENDER
  // Note que é o mesmo URL que está no seu log!
  const API_URL_BASE = 'https://aishageriatria.onrender.com/api/public-prontuario/'; // <--- URL CORRIGIDO!
  
  // Mapeamento dos turnos
  const mapTurnos = {
    antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço',
    tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir'
  };

  // Seletores dos elementos de LEITURA
  const tituloProntuario = document.getElementById('titulo-prontuario');
  const nomePacienteEl = document.getElementById('nome-paciente');
  const idadeEl = document.getElementById('idade');
  const patologiasEl = document.getElementById('patologias');
  const listaMedicosPills = document.getElementById('lista-medicos-pills');
  const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');

  /**
   * FUNÇÃO 1: Buscar o ID do paciente na URL
   */
  const getUserIdFromURL = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('id'); // Pega o valor depois de "id="
  };

  /**
   * FUNÇÃO 2: Buscar os dados do prontuário na API
   */
  const fetchProntuarioPublico = async (userId) => {
    if (!userId) {
      tituloProntuario.innerText = 'ERRO: ID do paciente não fornecido.';
      tituloProntuario.style.color = '#e74c3c';
      return;
    }
    
    try {
      // Chama a nova rota da API: /api/public-prontuario/ID_DO_USER
      const response = await fetch(API_URL_BASE + userId);
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Prontuário não encontrado.');
      }
      
      const data = await response.json();
      
      populatePage(data);
      
    } catch (error) {
      console.error('Erro ao carregar prontuário público:', error);
      tituloProntuario.innerText = `ERRO: ${error.message}`;
      tituloProntuario.style.color = '#e74c3c';
    }
  };

  /**
   * FUNÇÃO 3: Preencher a página com os dados
   */
  const populatePage = (data) => {
    // Título e Formulário Principal
    tituloProntuario.innerText = 'Prontuário de ' + (data.nomePaciente || 'Paciente');
    nomePacienteEl.innerText = data.nomePaciente || 'Não informado';
    idadeEl.innerText = data.idade || 'Não informada';
    patologiasEl.innerText = data.patologias || 'Nenhuma registrada';

    // Lista de Médicos
    listaMedicosPills.innerHTML = ''; 
    if (!data.medicosAssistentes || data.medicosAssistentes.length === 0) {
      listaMedicosPills.innerHTML = '<li style="font-size: 14px; color: #777;">Nenhum médico assistente adicionado.</li>';
    } else {
      data.medicosAssistentes.forEach((medico) => {
        const pill = `<li class="pill-medico"><span>${medico}</span></li>`;
        listaMedicosPills.insertAdjacentHTML('beforeend', pill);
      });
    }

    // Tabela de Medicações
    listaMedicacoesBody.innerHTML = ''; 
    if (!data.medicacoes || data.medicacoes.length === 0) {
      listaMedicacoesBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhuma medicação adicionada.</td></tr>';
      return;
    }
    
    // Ordena as medicações
    data.medicacoes.sort((a, b) => {
      const horarioA = a.horarioEspecifico || '99:99';
      const horarioB = b.horarioEspecifico || '99:99';
      if (horarioA < horarioB) return -1;
      if (horarioA > horarioB) return 1;
      return a.nome.localeCompare(b.nome);
    });
    
    // Desenha a tabela
    data.medicacoes.forEach((med) => { 
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
        </tr>
      `;
      listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
    });
  };
  
  // --- Ponto de partida ---
  const userId = getUserIdFromURL();
  fetchProntuarioPublico(userId);
  
});
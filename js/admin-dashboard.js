// Arquivo: /js/admin-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const tbody = document.getElementById('paciente-tbody');
  const searchInput = document.getElementById('search-input'); // <-- NOVO SELETOR
  
  // URL da API no Render
  const API_ADMIN_BASE = 'https://aishageriatria.onrender.com/api/admin/';

  // Variável para guardar TODOS os pacientes carregados
  let allPacientes = [];

  // Segurança
  if (!token || role !== 'admin') {
    localStorage.clear();
    window.location.href = 'login.html';
    return;
  }

  // --- Carregar Pacientes ---
  const fetchPacientes = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + 'pacientes', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) { throw new Error('Não foi possível carregar os pacientes.'); }
      
      // Salva a lista completa na nossa variável
      allPacientes = await response.json();
      
      // Renderiza a tabela com todos os pacientes inicialmente
      renderTabela(allPacientes);

    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="4" style="color: red;">Erro: ${error.message}</td></tr>`;
    }
  };

  // --- Lógica de Busca (Filtragem) ---
  searchInput.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase(); // O que foi digitado (em minúsculas)

    // Filtra a lista original
    const pacientesFiltrados = allPacientes.filter(paciente => {
      return paciente.nome.toLowerCase().includes(termo) || 
             paciente.email.toLowerCase().includes(termo);
    });

    // Redesenha a tabela apenas com os filtrados
    renderTabela(pacientesFiltrados);
  });

  // --- Desenhar Tabela ---
  const renderTabela = (listaPacientes) => {
    tbody.innerHTML = '';
    
    if (listaPacientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Nenhum paciente encontrado.</td></tr>';
      return;
    }
    
    listaPacientes.forEach(paciente => {
      // Ação de Visualizar (onclick)
      const viewAction = `window.location.href='admin-prontuario.html?id=${paciente._id}'`;

      const row = `
        <tr>
          <td>${paciente.nome}</td>
          <td>${paciente.email}</td>
          <td>${new Date(paciente.createdAt).toLocaleDateString('pt-BR')}</td>
          <td>
            <button onclick="${viewAction}" 
                    data-id="${paciente._id}" 
                    style="background: #2ADCA1; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                Visualizar/Editar
            </button>
            <button class="btn-delete" data-id="${paciente._id}">Apagar</button>
          </td>
        </tr>
      `;
      tbody.insertAdjacentHTML('beforeend', row);
    });
  };

  // --- Deletar (Ouvinte de Clique) ---
  tbody.addEventListener('click', async (event) => {
    if (event.target.classList.contains('btn-delete')) {
      const userId = event.target.dataset.id;
      
      if (!confirm('Tem certeza que deseja apagar este paciente? Esta ação é irreversível.')) {
        return;
      }
      
      try {
        await fetch(API_ADMIN_BASE + `paciente/${userId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Paciente deletado com sucesso.');
        fetchPacientes(); // Recarrega a lista completa da API
      } catch (error) {
        alert(`Erro ao apagar: ${error.message}`);
      }
    }
  });

  // Ponto de partida
  fetchPacientes();
});
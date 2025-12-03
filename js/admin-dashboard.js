// Arquivo: /js/admin-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('authToken');
  const role = localStorage.getItem('userRole');
  const tbody = document.getElementById('paciente-tbody');
  
  // *** CORREÇÃO AQUI: Adicionado /api/admin/ ***
  const API_ADMIN_BASE = 'https://aishageriatria.onrender.com/api/admin/';

  if (!token || role !== 'admin') {
    localStorage.clear();
    window.location.href = 'login.html';
    return;
  }

  const fetchPacientes = async () => {
    try {
      const response = await fetch(API_ADMIN_BASE + 'pacientes', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) { throw new Error('Não foi possível carregar os pacientes.'); }
      const pacientes = await response.json();
      renderTabela(pacientes);
    } catch (error) {
      tbody.innerHTML = `<tr><td colspan="4" style="color: red;">Erro: ${error.message}</td></tr>`;
    }
  };

  const renderTabela = (pacientes) => {
    tbody.innerHTML = '';
    if (pacientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4">Nenhum paciente cadastrado.</td></tr>';
      return;
    }
    pacientes.forEach(paciente => {
      const row = `
        <tr>
          <td>${paciente.nome}</td>
          <td>${paciente.email}</td>
          <td>${new Date(paciente.createdAt).toLocaleDateString('pt-BR')}</td>
          <td>
            <button onclick="window.location.href='admin-prontuario.html?id=${paciente._id}'" 
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
        fetchPacientes();
      } catch (error) {
        alert(`Erro ao apagar: ${error.message}`);
      }
    }
  });

  fetchPacientes();
});
// Arquivo: js/admin-dashboard.js (Completo)

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    // URL da API (Verifique se está usando a URL correta do Render)
    const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';

    const API_URL = `${API_ADMIN_BASE}/api/admin/pacientes`;
    const API_DELETE_URL = `${API_ADMIN_BASE}/api/admin/paciente/`;

    if (!token || role !== 'admin') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    const listaBody = document.getElementById('lista-pacientes-body');
    const totalSpan = document.getElementById('total-pacientes');

    // Função de Busca
    const fetchPacientes = async () => {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Sessão expirada. Faça login novamente.');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`Erro do servidor: ${response.status}`);
            }

            const pacientes = await response.json();
            renderTabela(pacientes);

        } catch (error) {
            console.error("Erro no fetch:", error);
            if (listaBody) {
                listaBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#e74c3c; padding:20px; font-weight:bold;">
                    Erro ao conectar com o servidor.<br>
                    <small style="color:#555; font-weight:normal;">Verifique se o backend no Render foi atualizado e reiniciado.</small>
                </td></tr>`;
            }
        }
    };

    // Função de Renderização
    const renderTabela = (pacientes) => {
        if (!listaBody) return;
        
        listaBody.innerHTML = ''; 
        if (totalSpan) totalSpan.innerText = pacientes.length;

        if (pacientes.length === 0) {
            listaBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#777;">Nenhum paciente cadastrado.</td></tr>';
            return;
        }

        pacientes.forEach(p => {
            const dataCriacao = p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-';
            
            // Badge Status Termo
            let statusHtml = '';
            if (p.termoAceite === true) {
                statusHtml = '<span class="status-badge status-ok">✅ Aceito</span>';
            } else {
                statusHtml = '<span class="status-badge status-pendente">⚠️ Pendente</span>';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:600; color:#2c3e50;">${p.nome}</td>
                <td>${p.email}</td>
                <td style="text-align:center;">${statusHtml}</td>
                <td>${dataCriacao}</td>
                <td style="text-align: center;">
                    <button class="btn-acao btn-ver" onclick="irParaProntuario('${p._id}')" title="Editar Prontuário">
                        📋 Prontuário
                    </button>
                    <button class="btn-acao btn-excluir" onclick="deletarPaciente('${p._id}', '${p.nome}')" title="Excluir Paciente">
                        🗑️
                    </button>
                </td>
            `;
            listaBody.appendChild(tr);
        });
    };

    // Funções Globais
    window.irParaProntuario = (id) => {
        window.location.href = `admin-prontuario.html?id=${id}`;
    };

    window.deletarPaciente = async (id, nome) => {
        if (!confirm(`ATENÇÃO:\nTem certeza que deseja excluir o paciente "${nome}"?\n\nIsso apagará o login e todos os dados do prontuário permanentemente.`)) {
            return;
        }

        try {
            const response = await fetch(API_DELETE_URL + id, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('Paciente excluído com sucesso!');
                fetchPacientes(); 
            } else {
                alert('Erro ao excluir.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão ao tentar excluir.');
        }
    };

    fetchPacientes();
});
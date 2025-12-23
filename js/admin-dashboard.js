// Arquivo: js/admin-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    // Rotas da API
    const API_URL = 'https://aishageriatria.onrender.com/api/admin/pacientes';
    const API_DELETE_URL = 'https://aishageriatria.onrender.com/api/admin/paciente/';

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
                throw new Error('Falha na comunicação com o servidor.');
            }

            const pacientes = await response.json();
            renderTabela(pacientes);

        } catch (error) {
            console.error(error);
            if (listaBody) {
                listaBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#e74c3c; padding:20px; font-weight:bold;">
                    Erro ao carregar pacientes.<br>Verifique se o servidor foi reiniciado.
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
            
            // LÓGICA DO BADGE VERDE/AMARELO
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
                <td>${statusHtml}</td>
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
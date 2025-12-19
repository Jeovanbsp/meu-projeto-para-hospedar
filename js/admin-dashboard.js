// Arquivo: js/admin-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    // URL da API (Ajuste se necessário)
    const API_URL = 'https://aishageriatria.onrender.com/api/admin/pacientes';
    const API_DELETE_URL = 'https://aishageriatria.onrender.com/api/admin/paciente/';

    // 1. Verificação de Segurança
    if (!token || role !== 'admin') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    const listaBody = document.getElementById('lista-pacientes-body');
    const totalSpan = document.getElementById('total-pacientes');

    // 2. Função para Carregar Pacientes
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
                    alert('Sessão expirada.');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error('Erro ao buscar lista.');
            }

            const pacientes = await response.json();
            renderTabela(pacientes);

        } catch (error) {
            console.error(error);
            listaBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:red; padding:20px;">Erro ao carregar pacientes. Verifique sua conexão.</td></tr>';
        }
    };

    // 3. Função para Desenhar a Tabela
    const renderTabela = (pacientes) => {
        listaBody.innerHTML = ''; // Limpa loading
        totalSpan.innerText = pacientes.length;

        if (pacientes.length === 0) {
            listaBody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#777;">Nenhum paciente encontrado.</td></tr>';
            return;
        }

        pacientes.forEach(p => {
            // Formatar data
            const dataCriacao = new Date(p.createdAt).toLocaleDateString('pt-BR');
            
            // Criar linha
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${p.nome}</strong></td>
                <td>${p.email}</td>
                <td>${dataCriacao}</td>
                <td style="text-align: center;">
                    <button class="btn-acao btn-ver" onclick="irParaProntuario('${p._id}')">
                        📋 Prontuário
                    </button>
                    <button class="btn-acao btn-excluir" onclick="deletarPaciente('${p._id}', '${p.nome}')">
                        🗑️
                    </button>
                </td>
            `;
            listaBody.appendChild(tr);
        });
    };

    // 4. Funções Globais (para funcionar no onclick do HTML)
    
    // Redireciona para a página de edição (admin-prontuario.html)
    window.irParaProntuario = (id) => {
        window.location.href = `admin-prontuario.html?id=${id}`;
    };

    // Deleta o paciente
    window.deletarPaciente = async (id, nome) => {
        if (!confirm(`Tem certeza que deseja excluir o paciente ${nome}? Todos os dados do prontuário serão perdidos.`)) {
            return;
        }

        try {
            const response = await fetch(API_DELETE_URL + id, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                alert('Paciente excluído com sucesso!');
                fetchPacientes(); // Recarrega a lista
            } else {
                alert('Erro ao excluir.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        }
    };

    // Inicia o carregamento
    fetchPacientes();
});
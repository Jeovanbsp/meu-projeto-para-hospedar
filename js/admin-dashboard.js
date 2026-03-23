// Arquivo: js/admin-dashboard.js (Completo e Atualizado)

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    // Configuração de URL inteligente (Local vs Vercel/Render)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';

    const API_URL = `${API_ADMIN_BASE}/api/admin/pacientes`;
    const API_DELETE_URL = `${API_ADMIN_BASE}/api/admin/paciente/`;

    if (!token || role !== 'admin') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    // CORREÇÃO 1: IDs atualizados para bater com o admin-dashboard.html
    const listaBody = document.getElementById('lista-pacientes');
    const totalSpan = document.getElementById('texto-total');

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
                // CORREÇÃO 2: Mudando para <li>, já que o HTML usa <ul>
                listaBody.innerHTML = `<li style="text-align:center; color:#e74c3c; padding:20px; font-weight:bold;">
                    Erro ao conectar com o servidor.<br>
                    <small style="color:#555; font-weight:normal;">Verifique se o backend no Render foi atualizado e reiniciado.</small>
                </li>`;
            }
        }
    };

    // Função de Renderização
    const renderTabela = (pacientes) => {
        if (!listaBody) return;
        
        listaBody.innerHTML = ''; 
        if (totalSpan) totalSpan.innerText = pacientes.length;

        if (pacientes.length === 0) {
            listaBody.innerHTML = '<li style="text-align:center; padding:20px; color:#777;">Nenhum paciente cadastrado.</li>';
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

            // CORREÇÃO 3: Estrutura feita para se alinhar em Flexbox (como lista)
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.style.padding = '15px';
            li.style.borderBottom = '1px solid #eee';
            
            li.innerHTML = `
                <div style="flex: 2;">
                    <strong style="color:#2c3e50; font-size: 1.1rem;">${p.nome}</strong><br>
                    <span style="color: #666; font-size: 0.9rem;">${p.email}</span>
                </div>
                <div style="flex: 1; text-align: center;">${statusHtml}</div>
                <div style="flex: 1; text-align: center; color: #888; font-size: 0.9rem;">${dataCriacao}</div>
                <div style="flex: 1; text-align: right;">
                    <button class="btn-acao btn-ver" onclick="irParaProntuario('${p._id}')" title="Editar Prontuário" style="margin-right: 5px; background: #2ADCA1; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer;">
                        📋 Prontuário
                    </button>
                    <button class="btn-acao btn-excluir" onclick="deletarPaciente('${p._id}', '${p.nome}')" title="Excluir Paciente" style="background: #ff6b6b; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            `;
            listaBody.appendChild(li);
        });
    };

    // Funções Globais da Lista e Botões de Ação
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

    // CORREÇÃO 4: Expondo as funções que o HTML procura para carregar atualizar e o Modal
    window.carregarLista = fetchPacientes;
    
    window.abrirModalCadastro = () => {
        document.getElementById('modal-cadastro').style.display = 'flex';
    };

    window.fecharModalCadastro = () => {
        document.getElementById('modal-cadastro').style.display = 'none';
        const form = document.getElementById('form-cadastro-paciente');
        if(form) form.reset();
    };

    // Configuração do formulário de novo paciente no modal
    const formCadastro = document.getElementById('form-cadastro-paciente');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('novo-nome').value;
            const email = document.getElementById('novo-email').value;
            const senha = document.getElementById('novo-senha').value;
            
            try {
                const response = await fetch(`${API_ADMIN_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, password: senha, role: 'paciente' })
                });
                
                if (response.ok) {
                    alert('Paciente cadastrado com sucesso!');
                    window.fecharModalCadastro();
                    fetchPacientes(); 
                } else {
                    const data = await response.json();
                    alert(data.message || 'Erro ao cadastrar paciente.');
                }
            } catch (error) {
                alert('Erro de conexão ao cadastrar paciente.');
            }
        });
    }

    // Configuração do Logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    // Chamada inicial
    fetchPacientes();
});
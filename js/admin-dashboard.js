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

    const listaBody = document.getElementById('lista-pacientes');
    const totalSpan = document.getElementById('texto-total');
    const inputPesquisa = document.getElementById('input-pesquisa');
    
    // Variáveis Globais para Pesquisa e Gráfico
    let pacientesGlobais = [];
    let graficoInstancia = null;

    const fetchPacientes = async () => {
        try {
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert('Sessão expirada. Faça login novamente.');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(`Erro do servidor: ${response.status}`);
            }

            // Salva na memória para a pesquisa funcionar rápido
            pacientesGlobais = await response.json(); 
            
            renderTabela(pacientesGlobais);
            renderGrafico(pacientesGlobais);

        } catch (error) {
            console.error("Erro no fetch:", error);
            if (listaBody) {
                listaBody.innerHTML = `<li style="text-align:center; color:#ff6b6b; padding:40px;"><i class="ph ph-warning-circle" style="font-size: 2.5rem; display:block; margin: 0 auto 10px auto;"></i>Erro ao conectar com o servidor.<br><small style="color:#666">Verifique se o backend está rodando.</small></li>`;
            }
        }
    };

    // SISTEMA DE PESQUISA (Filtro em tempo real)
    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', (e) => {
            const termoBusca = e.target.value.toLowerCase().trim();
            const pacientesFiltrados = pacientesGlobais.filter(p => 
                p.nome.toLowerCase().includes(termoBusca) || 
                p.email.toLowerCase().includes(termoBusca)
            );
            renderTabela(pacientesFiltrados);
        });
    }

    const renderTabela = (pacientes) => {
        if (!listaBody) return;
        listaBody.innerHTML = ''; 
        if (totalSpan) totalSpan.innerText = pacientes.length;

        if (pacientes.length === 0) {
            listaBody.innerHTML = '<li style="text-align:center; padding:40px; color:#777;"><i class="ph ph-users" style="font-size: 2.5rem; display:block; margin: 0 auto 10px auto; color: #ccc;"></i>Nenhum paciente encontrado.</li>';
            return;
        }

        pacientes.forEach(p => {
            const dataCriacao = p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-';
            
            let statusHtml = p.termoAceite 
                ? '<span class="status-badge status-ok"><i class="ph ph-check-circle"></i> Aceito</span>' 
                : '<span class="status-badge status-pendente"><i class="ph ph-clock-circle"></i> Pendente</span>';

            const li = document.createElement('li');
            li.className = 'linha-grid'; // Aplica o alinhamento profissional (alinhado com o cabeçalho)
            
            li.innerHTML = `
                <div>
                    <strong style="color:#2c3e50; font-size: 1.05rem;">${p.nome}</strong><br>
                    <span style="color: #888; font-size: 0.85rem;">${p.email}</span>
                </div>
                <div style="text-align: center;">${statusHtml}</div>
                <div style="text-align: center; color: #666; font-size: 0.9rem;">${dataCriacao}</div>
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="btn-acao btn-ver" onclick="irParaProntuario('${p._id}')" title="Acessar Prontuário">
                        <i class="ph ph-clipboard-text" style="font-size: 1.15rem;"></i> Prontuário
                    </button>
                    <button class="btn-acao btn-excluir" onclick="deletarPaciente('${p._id}', '${p.nome}')" title="Excluir">
                        <i class="ph ph-trash" style="font-size: 1.15rem;"></i> Deletar
                    </button>
                </div>
            `;
            listaBody.appendChild(li);
        });
    };

    // FUNÇÃO DO GRÁFICO (Volta a funcionar lado a lado)
    const renderGrafico = (pacientes) => {
        const ctx = document.getElementById('graficoIdades');
        if (!ctx) return;

        // Contador de idades (Por enquanto, todos ficam "Não Informada" pois o back-end não está enviando esse dado na lista principal)
        let faixas = { 'Não Informada': 0, 'Até 60': 0, '61 a 70': 0, '71 a 80': 0, '81+': 0 };
        
        pacientes.forEach(p => {
            const idade = p.idade; // Nota: esse campo precisa ser adicionado no adminRoutes.js se quiser idades reais
            if (!idade) faixas['Não Informada']++;
            else if (idade <= 60) faixas['Até 60']++;
            else if (idade <= 70) faixas['61 a 70']++;
            else if (idade <= 80) faixas['71 a 80']++;
            else faixas['81+']++;
        });

        if (graficoInstancia) graficoInstancia.destroy();

        graficoInstancia = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(faixas),
                datasets: [{
                    data: Object.values(faixas),
                    // Usando as cores verdes da identidade Dra. Aisha
                    backgroundColor: ['#e0e0e0', '#2ADCA1', '#f39c12', '#3498db', '#9b59b6'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Montserrat', size: 12 } } }
                }
            }
        });
    };

    window.irParaProntuario = (id) => {
        window.location.href = `admin-prontuario.html?id=${id}`;
    };

    window.deletarPaciente = async (id, nome) => {
        if (!confirm(`ATENÇÃO:\nTem certeza que deseja excluir o paciente "${nome}"?\n\nIsso apagará o login e todos os dados do prontuário permanentemente.`)) return;
        try {
            const response = await fetch(API_DELETE_URL + id, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                inputPesquisa.value = ''; // Limpa a pesquisa ao deletar
                fetchPacientes(); 
            } else { alert('Erro ao excluir.'); }
        } catch (error) { alert('Erro de conexão ao tentar excluir.'); }
    };

    window.carregarLista = fetchPacientes;
    window.abrirModalCadastro = () => { document.getElementById('modal-cadastro').style.display = 'flex'; };
    window.fecharModalCadastro = () => { document.getElementById('modal-cadastro').style.display = 'none'; document.getElementById('form-cadastro-paciente').reset(); };

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
                    window.fecharModalCadastro();
                    inputPesquisa.value = ''; // Limpa a pesquisa ao cadastrar
                    fetchPacientes(); 
                } else {
                    const data = await response.json();
                    alert(data.message || 'Erro ao cadastrar paciente.');
                }
            } catch (error) { alert('Erro de conexão ao cadastrar paciente.'); }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'login.html';
        });
    }

    fetchPacientes();
});
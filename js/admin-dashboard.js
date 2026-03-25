document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // Removida a barra extra no final para evitar duplicidade //
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
    
    let pacientesGlobais = [];
    let graficoInstancia = null;

    const fetchPacientes = async () => {
        try {
            console.log("Tentando buscar pacientes em:", API_URL); // Log de ajuda
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (!response.ok) {
                const erroTexto = await response.text();
                console.error("Resposta do servidor:", response.status, erroTexto);
                throw new Error(`Erro ${response.status}: Falha ao buscar dados`);
            }

            pacientesGlobais = await response.json(); 
            renderTabela(pacientesGlobais);
            renderGrafico(pacientesGlobais);

        } catch (error) {
            console.error("Erro no fetchPacientes:", error);
            if (listaBody) {
                listaBody.innerHTML = `<li style="text-align:center; color:#ff6b6b; padding:40px;">Erro ao carregar dados do servidor.</li>`;
            }
        }
    };

    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtrados = pacientesGlobais.filter(p => p.nome.toLowerCase().includes(termo));
            renderTabela(filtrados);
        });
    }

    const renderTabela = (pacientes) => {
        if (!listaBody) return;
        listaBody.innerHTML = ''; 
        if (totalSpan) totalSpan.innerText = pacientes.length;

        if (pacientes.length === 0) {
            listaBody.innerHTML = '<li style="text-align:center; padding:40px; color:#777;">Nenhum paciente encontrado.</li>';
            return;
        }

        pacientes.forEach(p => {
            const dataStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-';
            let statusBadge = p.termoAceite 
                ? '<span class="status-badge status-ok"><i class="ph ph-check-circle"></i> Aceito</span>' 
                : '<span class="status-badge status-pendente"><i class="ph ph-clock-circle"></i> Pendente</span>';

            const li = document.createElement('li');
            li.className = 'linha-grid'; 
            
            li.innerHTML = `
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong style="color:#2c3e50; font-size: 0.95rem;">${p.nome}</strong><br>
                    <span style="color: #888; font-size: 0.75rem;">${p.email}</span>
                </div>
                <div style="text-align: center;">${statusBadge}</div>
                <div style="text-align: center; color: #666; font-size: 0.8rem;">${dataStr}</div>
                <div class="acoes-container">
                    <button class="btn-ver" onclick="irParaProntuario('${p._id}')">
                        <i class="ph ph-clipboard-text"></i> Prontuário
                    </button>
                    <button class="btn-excluir" onclick="deletarPaciente('${p._id}', '${p.nome}')" data-tooltip="Deletar Paciente">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            `;
            listaBody.appendChild(li);
        });
    };

    const renderGrafico = (pacientes) => {
        const ctx = document.getElementById('graficoIdades');
        if (!ctx) return;

        let faixas = { 
            'Até 60 anos': 0, 
            '61-70 anos': 0, 
            '71-80 anos': 0, 
            '81+ anos': 0, 
            'Não Informada': 0 
        };

        pacientes.forEach(p => {
            const idade = p.idade ? parseInt(p.idade) : null;
            if (!idade) faixas['Não Informada']++;
            else if (idade <= 60) faixas['Até 60 anos']++;
            else if (idade <= 70) faixas['61-70 anos']++;
            else if (idade <= 80) faixas['71-80 anos']++;
            else faixas['81+ anos']++;
        });

        if (graficoInstancia) graficoInstancia.destroy();

        graficoInstancia = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(faixas),
                datasets: [{
                    data: Object.values(faixas),
                    backgroundColor: ['#2ADCA1', '#24b685', '#FFB74D', '#3498db', '#e0e0e0'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: { family: 'Montserrat', size: 11, weight: '600' }
                        }
                    }
                }
            }
        });
    };

    window.irParaProntuario = (id) => {
        window.location.href = `admin-prontuario.html?id=${id}`;
    };

    window.deletarPaciente = async (id, nome) => {
        if (!confirm(`Você quer deletar mesmo o paciente "${nome}"?`)) return;
        try {
            const response = await fetch(API_DELETE_URL + id, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) { fetchPacientes(); } else { alert('Erro ao excluir.'); }
        } catch (error) { alert('Erro de conexão.'); }
    };

    window.carregarLista = fetchPacientes;
    window.abrirModalCadastro = () => { document.getElementById('modal-cadastro').style.display = 'flex'; };
    window.fecharModalCadastro = () => { 
        document.getElementById('modal-cadastro').style.display = 'none'; 
        document.getElementById('form-cadastro-paciente').reset(); 
    };

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
                if (response.ok) { window.fecharModalCadastro(); fetchPacientes(); } 
                else { const data = await response.json(); alert(data.message || 'Erro.'); }
            } catch (error) { alert('Erro de conexão.'); }
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
// Arquivo: /js/admin-dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    const API_ADMIN_BASE = 'https://aishageriatria.onrender.com';
    const API_URL = `${API_ADMIN_BASE}/api/admin/pacientes`;
    const API_PACIENTE_URL = `${API_ADMIN_BASE}/api/admin/paciente/`;

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
            const response = await fetch(API_URL, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                }
            });

            if (!response.ok) throw new Error(`Erro ${response.status}`);

            pacientesGlobais = await response.json(); 
            renderTabela(pacientesGlobais);
            renderGrafico(pacientesGlobais);

        } catch (error) {
            console.error("Erro no fetchPacientes:", error);
            if (listaBody) {
                listaBody.innerHTML = `<li style="text-align:center; color:#ff6b6b; padding:40px;"><i class="ph ph-warning-circle" style="font-size:2rem; margin-bottom: 10px; display:block;"></i> Erro ao carregar dados do servidor.</li>`;
            }
        }
    };

    const renderTabela = (pacientes) => {
        if (!listaBody) return;
        listaBody.innerHTML = ''; 
        if (totalSpan) totalSpan.innerText = pacientes.length;

        if (pacientes.length === 0) {
            listaBody.innerHTML = '<li style="text-align:center; padding:40px; color:#777;"><i class="ph ph-magnifying-glass" style="font-size:2rem; display:block; margin-bottom:10px; color:#ccc;"></i>Nenhum paciente encontrado.</li>';
            return;
        }

        const pacientesOrdenados = [...pacientes].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        pacientesOrdenados.forEach(p => {
            const dataStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-';
            let statusBadge = p.termoAceite 
                ? '<span class="status-badge status-ok"><i class="ph-fill ph-check-circle"></i> Aceito</span>' 
                : '<span class="status-badge status-pendente"><i class="ph-fill ph-clock"></i> Pendente</span>';

            const telLimpo = p.telefone ? p.telefone.replace(/\D/g, '') : '';
            const temContato = telLimpo.length >= 8;
            
            // Oculta o hash do bcrypt e exibe uma mensagem amigável
            const senhaDisplay = 'Protegida (Edite para resetar)'; 

            const li = document.createElement('li');
            li.className = 'linha-grid'; 
            
            const mobileLabelStatus = window.innerWidth <= 768 ? '<div style="font-size:0.7rem; color:#999; margin-bottom:3px; text-transform:uppercase;">Termo</div>' : '';
            const mobileLabelData = window.innerWidth <= 768 ? '<div style="font-size:0.7rem; color:#999; margin-bottom:3px; text-transform:uppercase;">Cadastro</div>' : '';

            li.innerHTML = `
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <strong style="color:#2c3e50; font-size: 1.05rem;">${p.nome}</strong><br>
                    <span style="color: #888; font-size: 0.85rem;"><i class="ph ph-envelope-simple"></i> ${p.email}</span><br>
                    <span style="color: #007bff; font-size: 0.80rem;"><i class="ph ph-lock-key"></i> Senha: <strong>${senhaDisplay}</strong></span>
                </div>
                <div style="text-align: center;">${mobileLabelStatus}${statusBadge}</div>
                <div style="text-align: center; color: #666; font-weight: 500;">${mobileLabelData}${dataStr}</div>
                <div class="acoes-container">
                    ${temContato ? `<a href="https://wa.me/55${telLimpo}" target="_blank" class="btn-acao btn-wpp" title="Chamar no WhatsApp"><i class="ph-fill ph-whatsapp-logo"></i></a>` : ''}
                    <button class="btn-acao btn-ver" onclick="irParaProntuario('${p._id}')">
                        <i class="ph ph-clipboard-text"></i> Prontuário
                    </button>
                    <button class="btn-acao btn-edit" onclick="abrirModalEditar('${p._id}', '${p.nome}', '${p.email}', '${telLimpo}')" title="Editar Acesso/Senha">
                        <i class="ph ph-pencil"></i>
                    </button>
                    <button class="btn-acao btn-delete" onclick="deletarPaciente('${p._id}', '${p.nome}')" title="Deletar Paciente">
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

        let faixas = { 'Até 60': 0, '61-70': 0, '71-80': 0, '81+': 0, 'S/Idade': 0 };

        pacientes.forEach(p => {
            const idade = p.idade ? parseInt(p.idade) : null;
            if (!idade) faixas['S/Idade']++;
            else if (idade <= 60) faixas['Até 60']++;
            else if (idade <= 70) faixas['61-70']++;
            else if (idade <= 80) faixas['71-80']++;
            else faixas['81+']++;
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
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%', 
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: 'Montserrat', size: 11, weight: 600 } } } }
            }
        });
    };

    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtrados = pacientesGlobais.filter(p => p.nome.toLowerCase().includes(termo) || p.email.toLowerCase().includes(termo));
            renderTabela(filtrados);
        });
    }

    // --- FUNÇÕES DE NAVEGAÇÃO E AÇÃO ---
    window.irParaProntuario = (id) => { window.location.href = `admin-prontuario.html?id=${id}`; };

    window.deletarPaciente = async (id, nome) => {
        if (!confirm(`CUIDADO: Deseja realmente excluir permanentemente o paciente "${nome}" e todos os seus registros médicos?`)) return;
        try {
            const response = await fetch(API_PACIENTE_URL + id, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) fetchPacientes();
            else alert('Erro ao excluir. O servidor negou a requisição.');
        } catch (error) { alert('Erro de conexão com a API.'); }
    };

    window.carregarLista = () => {
        if(inputPesquisa) inputPesquisa.value = '';
        fetchPacientes();
    };

    // --- MODAIS DE CADASTRO E EDIÇÃO ---
    window.abrirModalCadastro = () => { document.getElementById('modal-cadastro').style.display = 'flex'; };
    window.fecharModalCadastro = () => { document.getElementById('modal-cadastro').style.display = 'none'; document.getElementById('form-cadastro-paciente').reset(); };

    window.abrirModalEditar = (id, nome, email, telefone) => {
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-nome').value = nome;
        document.getElementById('edit-email').value = email;
        document.getElementById('edit-telefone').value = telefone || '';
        document.getElementById('edit-senha').value = ''; 
        document.getElementById('modal-editar').style.display = 'flex';
    };
    window.fecharModalEditar = () => { document.getElementById('modal-editar').style.display = 'none'; document.getElementById('form-editar-paciente').reset(); };

    // --- ENVIOS DOS FORMULÁRIOS ---
    const formCadastro = document.getElementById('form-cadastro-paciente');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                nome: document.getElementById('novo-nome').value,
                email: document.getElementById('novo-email').value,
                password: document.getElementById('novo-senha').value,
                telefone: document.getElementById('novo-telefone').value,
                role: 'paciente'
            };
            try {
                const response = await fetch(`${API_ADMIN_BASE}/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (response.ok) { window.fecharModalCadastro(); fetchPacientes(); } 
                else { const data = await response.json(); alert(data.message || 'Erro ao cadastrar.'); }
            } catch (error) { alert('Erro de conexão.'); }
        });
    }

    const formEditar = document.getElementById('form-editar-paciente');
    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('edit-id').value;
            const payload = {
                nome: document.getElementById('edit-nome').value,
                email: document.getElementById('edit-email').value,
                telefone: document.getElementById('edit-telefone').value
            };
            const novaSenha = document.getElementById('edit-senha').value;
            if (novaSenha.trim() !== '') { payload.password = novaSenha; payload.senha = novaSenha; }

            try {
                const response = await fetch(API_PACIENTE_URL + id, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if (response.ok) { window.fecharModalEditar(); fetchPacientes(); } 
                else { alert('Erro ao atualizar cadastro. Verifique a rota no Backend.'); }
            } catch (error) { alert('Erro de conexão.'); }
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => { localStorage.clear(); window.location.href = 'index.html'; });
    }

    window.addEventListener('resize', () => { renderTabela(pacientesGlobais); });

    fetchPacientes();
});
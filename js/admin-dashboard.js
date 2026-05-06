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
            console.error("Erro:", error);
            if (listaBody) listaBody.innerHTML = `<li style="text-align:center; color:#ff6b6b; padding:40px;">Erro ao carregar dados.</li>`;
        }
    };

    const renderTabela = (pacientes) => {
        if (!listaBody) return;
        listaBody.innerHTML = ''; 
        if (totalSpan) totalSpan.innerText = pacientes.length;

        if (pacientes.length === 0) {
            listaBody.innerHTML = '<li style="text-align:center; padding:40px; color:#777;">Nenhum paciente encontrado.</li>';
            return;
        }

        pacientes.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(p => {
            const dataStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('pt-BR') : '-';
            let statusBadge = p.termoAceite 
                ? '<span class="status-badge status-ok"><i class="ph-fill ph-check-circle"></i> Aceito</span>' 
                : '<span class="status-badge status-pendente"><i class="ph-fill ph-clock"></i> Pendente</span>';

            const telLimpo = (p.telefone && p.telefone !== 'undefined') ? String(p.telefone).replace(/\D/g, '') : '';
            const temContato = telLimpo.length >= 8;
            const linkWpp = temContato ? `<a href="https://wa.me/55${telLimpo}" target="_blank" class="btn-wpp-inline"><i class="ph-fill ph-whatsapp-logo"></i> WhatsApp</a>` : '';

            const li = document.createElement('li');
            li.className = 'linha-grid'; 
            
            li.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-start; overflow: hidden;">
                    <strong style="color:#2c3e50; font-size: 1.05rem; white-space: nowrap; text-overflow: ellipsis; width: 100%;">${p.nome}</strong>
                    <span style="color: #888; font-size: 0.85rem; margin-top: 2px;">${p.email}</span>
                    ${linkWpp}
                </div>
                <div style="text-align: center;">${statusBadge}</div>
                <div style="text-align: center; color: #666; font-size: 0.85rem;">${dataStr}</div>
                <div class="acoes-container">
                    <button class="btn-acao btn-ver" onclick="irParaProntuario('${p._id}')">
                        <i class="ph ph-clipboard-text"></i> Prontuário
                    </button>
                    <button class="btn-acao btn-edit" onclick="abrirModalEditar('${p._id}', '${p.nome}', '${p.email}', '${telLimpo}')">
                        <i class="ph ph-pencil"></i>
                    </button>
                    <button class="btn-acao btn-delete" onclick="deletarPaciente('${p._id}', '${p.nome}')">
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
                datasets: [{ data: Object.values(faixas), backgroundColor: ['#2ADCA1', '#24b685', '#FFB74D', '#3498db', '#e0e0e0'], borderWidth: 2, borderColor: '#ffffff' }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Montserrat', size: 11, weight: 600 } } } } }
        });
    };

    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase().trim();
            const filtrados = pacientesGlobais.filter(p => p.nome.toLowerCase().includes(termo) || p.email.toLowerCase().includes(termo));
            renderTabela(filtrados);
        });
    }

    window.irParaProntuario = (id) => { window.location.href = `admin-prontuario.html?id=${id}`; };

    window.deletarPaciente = async (id, nome) => {
        if (!confirm(`Deseja excluir "${nome}"?`)) return;
        try {
            const response = await fetch(API_PACIENTE_URL + id, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (response.ok) fetchPacientes();
        } catch (error) { alert('Erro ao excluir.'); }
    };

    window.carregarLista = () => fetchPacientes();
    window.abrirModalCadastro = () => { document.getElementById('modal-cadastro').style.display = 'flex'; };
    window.fecharModalCadastro = () => { document.getElementById('modal-cadastro').style.display = 'none'; document.getElementById('form-cadastro-paciente').reset(); };
    window.abrirModalEditar = (id, nome, email, telefone) => {
        document.getElementById('edit-id').value = id;
        document.getElementById('edit-nome').value = nome;
        document.getElementById('edit-email').value = email;
        document.getElementById('edit-telefone').value = telefone || '';
        document.getElementById('modal-editar').style.display = 'flex';
    };
    window.fecharModalEditar = () => { document.getElementById('modal-editar').style.display = 'none'; };

    document.getElementById('form-cadastro-paciente')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = { nome: document.getElementById('novo-nome').value, email: document.getElementById('novo-email').value, password: document.getElementById('novo-senha').value, telefone: document.getElementById('novo-telefone').value, role: 'paciente' };
        const response = await fetch(`${API_ADMIN_BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (response.ok) { fecharModalCadastro(); fetchPacientes(); }
    });

    document.getElementById('form-editar-paciente')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const payload = { nome: document.getElementById('edit-nome').value, email: document.getElementById('edit-email').value, telefone: document.getElementById('edit-telefone').value };
        const novaSenha = document.getElementById('edit-senha').value;
        if (novaSenha.trim() !== '') { payload.password = novaSenha; }
        const response = await fetch(API_PACIENTE_URL + id, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (response.ok) { fecharModalEditar(); fetchPacientes(); }
    });

    document.getElementById('btn-logout')?.addEventListener('click', () => { localStorage.clear(); window.location.href = 'index.html'; });

    // ==========================================
    // LÓGICA DE BANNERS / CARROSSEL
    // ==========================================
    const listaBanners = document.getElementById('lista-banners');

    const carregarBannersAdmin = async () => {
        try {
            const res = await fetch(`${API_ADMIN_BASE}/api/admin/banners`, { headers: { 'Authorization': `Bearer ${token}` }});
            const banners = await res.json();
            
            if (!listaBanners) return;
            listaBanners.innerHTML = '';
            
            if(banners.length === 0) {
                listaBanners.innerHTML = '<li style="text-align:center; padding:20px; color:#777;">Nenhuma imagem ativa no site.</li>';
                return;
            }

            banners.forEach(b => {
                const li = document.createElement('li');
                li.className = 'linha-grid';
                li.style.gridTemplateColumns = '2fr 1fr 100px';
                li.innerHTML = `
                    <div style="font-weight:600; color:#2c3e50;">${b.titulo}</div>
                    <div style="text-align:center;"><img src="${b.imagem}" style="height: 50px; border-radius:4px; object-fit: cover;"></div>
                    <div class="acoes-container" style="justify-content: flex-end;">
                        <button class="btn-acao btn-delete" onclick="deletarBanner('${b._id}')" title="Remover do Site"><i class="ph ph-trash"></i></button>
                    </div>
                `;
                listaBanners.appendChild(li);
            });
        } catch (error) { console.error('Erro ao carregar banners:', error); }
    };

    window.abrirModalBanner = () => { document.getElementById('modal-banner').style.display = 'flex'; };
    window.fecharModalBanner = () => { document.getElementById('modal-banner').style.display = 'none'; document.getElementById('form-banner').reset(); };

    window.deletarBanner = async (id) => {
        if(!confirm('Remover esta imagem do site público?')) return;
        try {
            const res = await fetch(`${API_ADMIN_BASE}/api/admin/banner/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
            if(res.ok) carregarBannersAdmin();
        } catch (e) { alert('Erro.'); }
    };

    document.getElementById('form-banner')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('banner-titulo').value;
        const fileInput = document.getElementById('banner-imagem');
        const file = fileInput.files[0];
        const btnSalvar = document.getElementById('btn-salvar-banner');
        
        if(file.size > 5 * 1024 * 1024) { 
            alert('A imagem é muito pesada! Escolha uma imagem de até 5MB.');
            return;
        }

        btnSalvar.innerText = 'Enviando...';
        btnSalvar.disabled = true;

        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const res = await fetch(`${API_ADMIN_BASE}/api/admin/banner`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ titulo, imagem: reader.result })
                });
                if(res.ok) { window.fecharModalBanner(); carregarBannersAdmin(); } 
                else { alert('Erro ao salvar no servidor.'); }
            } catch (err) { alert('Erro de conexão.'); }
            
            btnSalvar.innerText = 'Fazer Upload';
            btnSalvar.disabled = false;
        };
        reader.readAsDataURL(file); 
    });

    fetchPacientes();
    carregarBannersAdmin();
    carregarStats();
});

// NOVAS FUNCOES DE ESTATISTICAS
let chartMensal = null;
let chartLocal = null;

function carregarStats() {
    const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
    const historico = JSON.parse(localStorage.getItem('historico') || '[]');
    const pacientes = JSON.parse(localStorage.getItem('pacientes') || '[]');
    const disponibilidade = JSON.parse(localStorage.getItem('disponibilidade') || '[]');
    
    // Totais
    document.getElementById('total-agendamentos').textContent = agendamentos.length;
    document.getElementById('total-consultas').textContent = historico.filter(h => h.tipo === 'consulta_realizada').length;
    document.getElementById('total-disponiveis').textContent = disponibilidade.length;
    document.getElementById('total-mensagens').textContent = historico.filter(h => h.tipo === 'mensagem').length;
    document.getElementById('total-pacientes').textContent = pacientes.length;
    
    // Popular select de anos
    const anos = new Set();
    agendamentos.forEach(a => { if (a.date) anos.add(a.date.substring(0, 4)); });
    historico.forEach(h => { if (h.data) anos.add(h.data.substring(0, 4)); });
    const selectAno = document.getElementById('filtro-ano');
    selectAno.innerHTML = '<option value="">Todos os Anos</option>';
    Array.from(anos).sort().forEach(ano => {
        selectAno.innerHTML += '<option value="' + ano + '">' + ano + '</option>';
    });
    
    atualizarStats();
    renderListaDados();
}

function atualizarStats() {
    const ano = document.getElementById('filtro-ano').value;
    const mes = document.getElementById('filtro-mes').value;
    const filtrar = (a) => {
        if (ano && a.date && !a.date.startsWith(ano)) return false;
        if (mes && a.date && !a.date.substring(5, 7).startsWith(mes)) return false;
        return true;
    };
    const agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]').filter(filtrar);
    
    // Atualizar totais filtrados
    const historico = JSON.parse(localStorage.getItem('historico') || '[]').filter(h => {
        if (ano && h.data && !h.data.startsWith(ano)) return false;
        if (mes && h.data && !h.data.substring(5, 7).startsWith(mes)) return false;
        return true;
    });
    const disponibilidade = JSON.parse(localStorage.getItem('disponibilidade') || '[]');
    const dispFiltrada = disponibilidade.filter(d => {
        if (ano && d.date && !d.date.startsWith(ano)) return false;
        if (mes && d.date && !d.date.substring(5, 7).startsWith(mes)) return false;
        return true;
    });
    document.getElementById('total-agendamentos').textContent = agendamentos.length;
    document.getElementById('total-consultas').textContent = historico.filter(h => h.tipo === 'consulta_realizada').length;
    document.getElementById('total-disponiveis').textContent = dispFiltrada.length;
    document.getElementById('total-mensagens').textContent = historico.filter(h => h.tipo === 'mensagem').length;
    
    // Grafico por mes
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Maio', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dadosMes = new Array(12).fill(0);
    agendamentos.forEach(a => {
        if (a.date) dadosMes[parseInt(a.date.substring(5, 7)) - 1]++;
    });
    
    if (chartMensal) chartMensal.destroy();
    chartMensal = new Chart(document.getElementById('graficoMensal'), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [{
                label: 'Agendamentos',
                data: dadosMes,
                backgroundColor: '#2ADCA1'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    
    // Grafico por local
    const locais = { 'Salvador': 0, 'Lauro': 0, 'Domiciliar': 0 };
    agendamentos.forEach(a => {
        if (a.location) {
            if (a.location.includes('Salvador')) locais['Salvador']++;
            if (a.location.includes('Lauro')) locais['Lauro']++;
            if (a.location.includes('Domiciliar')) locais['Domiciliar']++;
        }
    });
    
    if (chartLocal) chartLocal.destroy();
    chartLocal = new Chart(document.getElementById('graficoLocal'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(locais),
            datasets: [{
                data: Object.values(locais),
                backgroundColor: ['#007bff', '#2ADCA1', '#f39c12']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function limparFiltros() {
    document.getElementById('filtro-ano').value = '';
    document.getElementById('filtro-mes').value = '';
    atualizarStats();
}

function abrirGerenciar() {
    document.getElementById('modal-gerenciar').style.display = 'flex';
    renderListaDados();
}

function renderListaDados() {
    const historico = JSON.parse(localStorage.getItem('historico') || '[]');
    const lista = document.getElementById('lista-dados');
    
    if (historico.length === 0) {
        lista.innerHTML = '<li style="text-align:center; padding: 40px; color:#999;">Nenhum dado registrado</li>';
        return;
    }
    
    historico.sort((a, b) => b.data.localeCompare(a.data));
    lista.innerHTML = historico.slice(0, 50).map((h, idx) => {
        const dataFmt = h.data ? new Date(h.data).toLocaleDateString('pt-BR') : '-';
        return '<li class="linha-grid"><div>' + h.paciente + '</div><div>' + h.tipo + '</div><div>' + dataFmt + '</div><div><button onclick="excluirItem(' + idx + ')" style="background:#fff0f0; color:#ff6b6b; border:1px solid #ff6b6b; padding:5px 8px; border-radius:5px; cursor:pointer;">X</button></div></li>';
    }).join('');
}

function excluirItem(idx) {
    if (confirm('Deseja excluir este item?')) {
        const historico = JSON.parse(localStorage.getItem('historico') || '[]');
        historico.splice(idx, 1);
        localStorage.setItem('historico', JSON.stringify(historico));
        renderListaDados();
        carregarStats();
    }
}

function excluirHistorico() {
    if (confirm('Deseja limpar todo o historico? Esta acao e irreversivel.')) {
        localStorage.removeItem('historico');
        alert('Historico limpo!');
        carregarStats();
    }
}

function excluirAgendamentos() {
    if (confirm('Deseja limpar todos os agendamentos? Esta acao e irreversivel.')) {
        localStorage.removeItem('agendamentos');
        localStorage.removeItem('disponibilidade');
        alert('Agendamentos limpos!');
        carregarStats();
        renderListaDados();
    }
}

function excluirPacientes() {
    if (confirm('Deseja limpar todos os pacientes? Esta acao e irreversivel.')) {
        localStorage.removeItem('pacientes');
        alert('Pacientes limpos!');
        carregarStats();
        renderListaDados();
    }
}

function excluirTudo() {
    if (confirm('Deseja limpar TODOS os dados? Esta acao e irreversivel.')) {
        localStorage.clear();
        alert('Todos os dados foram limpos!');
        carregarStats();
        renderListaDados();
    }
}

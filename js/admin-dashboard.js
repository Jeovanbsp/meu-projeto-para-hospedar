// Função para formatar data
function formatDate(dateStr) {
    if (!dateStr) return "-";
    const [year, month, day] = dateStr.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return day + "/" + months[parseInt(month) - 1] + "/" + year;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
    
    const API_ADMIN_BASE = 'https://aishageriatria.onrender.com';
    const API_URL = `${API_ADMIN_BASE}/api/admin/pacientes`;
    const API_PACIENTE_URL = `${API_ADMIN_BASE}/api/admin/paciente/`; 

    // Allow admin and secretary, but secretária goes to agenda.html
    if (!token) {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }
    
    // Check if it's a secretary logging in directly - redirect to agenda
    if (role === 'secretary') {
        window.location.href = 'agenda.html';
        return;
    }
    
    if (role !== 'admin') {
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
            pacientesGlobais = JSON.parse(localStorage.getItem('pacientes') || '[]');
            if (pacientesGlobais.length > 0) {
                renderTabela(pacientesGlobais);
                renderGrafico(pacientesGlobais);
            } else if (listaBody) {
                listaBody.innerHTML = `<li style="text-align:center; color:#ff6b6b; padding:40px;">Erro ao carregar dados.</li>`;
            }
        }
    };

    const renderTabela = (pacientes) => {
        if (!listaBody) return;
        
        // Also load and render secretarias
        const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
        
        listaBody.innerHTML = ''; 
        if (totalSpan) totalSpan.innerText = pacientes.length + secretarias.length;

        // Render secretarias first with tag "SECRETÁRIA"
        if (secretarias.length > 0) {
            secretarias.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(s => {
                const dataStr = s.createdAt ? new Date(s.createdAt).toLocaleDateString('pt-BR') : '-';
                const li = document.createElement('li');
                li.className = 'linha-grid'; 
                li.style.background = '#e8f4fd'; // Light blue background for secretaries
                li.innerHTML = `
                    <div style="display: flex; flex-direction: column; align-items: flex-start; overflow: hidden;">
                        <strong style="color:#007bff; font-size: 1.05rem; white-space: nowrap; text-overflow: ellipsis; width: 100%;">${s.nome} <span style="background: #007bff; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; margin-left: 5px;">SECRETÁRIA</span></strong>
                        <span style="color: #888; font-size: 0.85rem; margin-top: 2px;">Usuário: ${s.usuario}</span>
                    </div>
                    <div style="text-align: center;"><span class="status-badge status-ok" style="background: #e3f2fd; color: #007bff;"><i class="ph-fill ph-user"></i> Ativo</span></div>
                    <div style="text-align: center; color: #666; font-size: 0.85rem;">${dataStr}</div>
                    <div class="acoes-container">
                        <button class="btn-acao btn-edit" onclick="editarSecretaria('${s.id}', '${s.nome}', '${s.usuario}')">
                            <i class="ph ph-pencil"></i>
                        </button>
                        <button class="btn-acao btn-delete" onclick="excluirSecretaria('${s.id}', '${s.nome}')">
                            <i class="ph ph-trash"></i>
                        </button>
                    </div>
                `;
                listaBody.appendChild(li);
            });
        }

        if (pacientes.length === 0 && secretarias.length === 0) {
            listaBody.innerHTML = '<li style="text-align:center; padding:40px; color:#777;">Nenhum registro encontrado.</li>';
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
    
    window.abrirModalSecretaria = () => { document.getElementById('modal-secretaria').style.display = 'flex'; };
    window.fecharModalSecretaria = () => { document.getElementById('modal-secretaria').style.display = 'none'; document.getElementById('form-cadastro-secretaria').reset(); };
    
    document.getElementById('form-cadastro-secretaria').addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('secretaria-nome').value;
        const usuario = document.getElementById('secretaria-usuario').value;
        const senha = document.getElementById('secretaria-senha').value;
        
        // Salvar no localStorage
        const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
        if (secretarias.find(s => s.usuario === usuario)) {
            alert('Usuário já existe!');
            return;
        }
        secretarias.push({ id: Date.now(), nome, usuario, senha, createdAt: new Date().toISOString() });
        localStorage.setItem('secretarias', JSON.stringify(secretarias));
        
        alert('Secretária cadastrada com sucesso!');
        fecharModalSecretaria();
        fetchPacientes(); // Refresh list
    });
    
    // Funções para editar e excluir secretária
    window.editarSecretaria = (id, nome, usuario) => {
        // Abrir modal de edição
        document.getElementById('edit-secretaria-id').value = id;
        document.getElementById('edit-secretaria-nome').value = nome;
        document.getElementById('edit-secretaria-usuario').value = usuario;
        document.getElementById('edit-secretaria-senha').value = '';
        document.getElementById('modal-editar-secretaria').style.display = 'flex';
    };
    
    window.fecharModalEditarSecretaria = () => {
        document.getElementById('modal-editar-secretaria').style.display = 'none';
        document.getElementById('form-editar-secretaria').reset();
    };
    
    // Formulário de edição de secretária
    document.getElementById('form-editar-secretaria').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('edit-secretaria-id').value);
        const novaSenha = document.getElementById('edit-secretaria-senha').value;
        
        if (!novaSenha) {
            alert('Por favor, digite uma nova senha!');
            return;
        }
        
        const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
        const idx = secretarias.findIndex(s => s.id === id);
        if (idx >= 0) {
            secretarias[idx].senha = novaSenha;
            localStorage.setItem('secretarias', JSON.stringify(secretarias));
            alert('Senha atualizada com sucesso!');
            fecharModalEditarSecretaria();
            fetchPacientes();
        }
    });
    
    window.excluirSecretaria = (id, nome) => {
        if (!confirm(`Excluir secretária "${nome}"?`)) return;
        const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
        const filtered = secretarias.filter(s => s.id !== id);
        localStorage.setItem('secretarias', JSON.stringify(filtered));
        alert('Secretária excluída!');
        fetchPacientes();
    };
    
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
    let agendamentos = JSON.parse(localStorage.getItem('agendamentos') || '[]');
    let historico = JSON.parse(localStorage.getItem('historico') || '[]');
    let pacientes = JSON.parse(localStorage.getItem('pacientes') || '[]');
    const disponibilidade = JSON.parse(localStorage.getItem('disponibilidade') || '[]');
    const tags = JSON.parse(localStorage.getItem('tags') || '[]');
    
    if (typeof pacientesGlobais !== 'undefined' && pacientesGlobais.length > 0) {
        pacientes = pacientesGlobais;
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
    }

    const consultasRealizadas = historico.filter(h => h.status === 'realizado').length;
    document.getElementById('total-agendamentos').textContent = agendamentos.filter(a => a.status === 'pendente').length;
    document.getElementById('total-consultas').textContent = consultasRealizadas;
    document.getElementById('total-disponiveis').textContent = disponibilidade.length;
    document.getElementById('total-mensagens').textContent = historico.filter(h => h.tipo === 'mensagem').length;
    document.getElementById('total-pacientes').textContent = pacientes.length;
    
    // Alerta de mensagens pendentes (tags) - Mostrar organizado por data
    const alerta = document.getElementById('alerta-mensagens');
    const texto = document.getElementById('alerta-texto');
    
    if (tags.length > 0) {
        // Ordenar tags por data de contato
        const tagsOrdenadas = [...tags].sort((a, b) => {
            if (!a.dataContato) return 1;
            if (!b.dataContato) return -1;
            return new Date(a.dataContato) - new Date(b.dataContato);
        });
        
        // Criar lista organizada por data
        let listaHtml = '';
        tagsOrdenadas.forEach((tag, i) => {
            const dataTag = tag.dataContato ? formatDate(tag.dataContato) : 'Sem data';
            const jaPassou = tag.dataContato && new Date(tag.dataContato) < new Date();
            const corData = jaPassou ? '#ff6b6b' : '#2ADCA1';
            const icone = i === 0 ? '<i class="ph ph-bell" style="color:#f39c12;font-size:1.2rem;"></i>' : '<i class="ph ph-pin" style="color:#f39c12;font-size:1rem;"></i>';
            listaHtml += '<div style="display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #eee;">';
            listaHtml += '<span style="font-size:1.2rem;">' + icone + '</span>';
            listaHtml += '<div><span style="font-weight:700; color:' + corData + ';">DATA: ' + dataTag + '</span><br>';
            listaHtml += '<span style="color:#555;">' + tag.paciente + ' - ' + tag.titulo + '</span></div></div>';
        });
        
        alerta.style.display = 'block';
        texto.innerHTML = '<div style="max-height: 200px; overflow-y: auto;">' + listaHtml + '</div>';
    } else {
        alerta.style.display = 'none';
    }
    
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
    const historico = JSON.parse(localStorage.getItem('historico') || '[]');
    const consultasRealizadasFiltradas = historico.filter(h => {
        if (h.status !== 'realizado') return false;
        if (ano && h.realizadoEm && !h.realizadoEm.startsWith(ano)) return false;
        if (mes && h.realizadoEm && !h.realizadoEm.substring(5, 7).startsWith(mes)) return false;
        return true;
    });
    const disponibilidade = JSON.parse(localStorage.getItem('disponibilidade') || '[]');
    const dispFiltrada = disponibilidade.filter(d => {
        if (ano && d.date && !d.date.startsWith(ano)) return false;
        if (mes && d.date && !d.date.substring(5, 7).startsWith(mes)) return false;
        return true;
    });
    document.getElementById('total-agendamentos').textContent = agendamentos.filter(a => a.status === 'pendente').length;
    document.getElementById('total-consultas').textContent = consultasRealizadasFiltradas.length;
    document.getElementById('total-disponiveis').textContent = disponibilidade.length;
    document.getElementById('total-mensagens').textContent = historico.filter(h => h.tipo === 'mensagem').length;
    
    // Grafico por mes
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Maio', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dadosMes = new Array(12).fill(0);
    agendamentos.forEach(a => {
        if (a.date) dadosMes[parseInt(a.date.substring(5, 7)) - 1]++;
    });
    
    if (chartMensal) chartMensal.destroy();
    // Contagem de historico com status realizado
    const historicoCount = new Array(12).fill(0);
    historico.forEach(h => {
        if (h.realizadoEm) historicoCount[parseInt(h.realizadoEm.substring(5, 7)) - 1]++;
    });
    chartMensal = new Chart(document.getElementById('graficoMensal'), {
        type: 'bar',
        data: {
            labels: meses,
            datasets: [
                { label: 'Agendamentos', data: dadosMes, backgroundColor: '#007bff' },
                { label: 'Consultas Realizadas', data: historicoCount, backgroundColor: '#2ADCA1' }
            ]
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

function irParaTags() {
    window.location.href = 'agenda.html?tab=tags';
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

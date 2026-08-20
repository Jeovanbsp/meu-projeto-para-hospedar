document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');

    const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
    const API_URL = `${API_ADMIN_BASE}/api/admin/fichas`;

    if (!token) {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    if (role === 'secretary') {
        window.location.href = 'agenda.html';
        return;
    }

    if (role !== 'admin') {
        localStorage.clear();
        window.location.href = 'login.html';
        return;
    }

    const listaBody = document.getElementById('lista-fichas');
    const totalSpan = document.getElementById('texto-total');
    const inputPesquisa = document.getElementById('input-pesquisa');

    let fichasGlobais = [];
    let fichaAbertaId = null;

    function formatarDataHora(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function escapar(texto) {
        const div = document.createElement('div');
        div.textContent = texto == null ? '' : String(texto);
        return div.innerHTML;
    }

    const renderizarLista = (fichas) => {
        totalSpan.textContent = fichas.length;

        if (!fichas.length) {
            listaBody.innerHTML = '<li class="lista-vazia">Nenhuma ficha de pré-atendimento recebida ainda.</li>';
            return;
        }

        listaBody.innerHTML = fichas.map(f => `
            <li onclick="abrirFicha('${f._id}')">
                <span class="ficha-nome"><i class="ph ph-user-circle"></i> ${escapar(f.nome)}</span>
                <span class="ficha-data"><i class="ph ph-calendar-blank"></i> ${formatarDataHora(f.createdAt)}</span>
                <span><button class="btn-ver-ficha"><i class="ph ph-eye"></i> Ver ficha</button></span>
            </li>
        `).join('');
    };

    const fetchFichas = async () => {
        try {
            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.clear();
                window.location.href = 'login.html';
                return;
            }

            fichasGlobais = await response.json();
            renderizarLista(fichasGlobais);
        } catch (error) {
            console.error('Erro ao buscar fichas:', error);
            listaBody.innerHTML = '<li class="lista-vazia">Erro ao carregar as fichas. Tente novamente.</li>';
        }
    };

    inputPesquisa.addEventListener('input', () => {
        const termo = inputPesquisa.value.toLowerCase().trim();
        const filtradas = fichasGlobais.filter(f =>
            (f.nome || '').toLowerCase().includes(termo) ||
            (f.cpf || '').toLowerCase().includes(termo)
        );
        renderizarLista(filtradas);
    });

    // === MODAL: FICHA COMPLETA ===
    window.abrirFicha = async (id) => {
        fichaAbertaId = id;
        const modal = document.getElementById('modal-ficha');
        const body = document.getElementById('modal-ficha-body');
        body.innerHTML = '<p style="text-align:center;color:#888;">Carregando ficha...</p>';
        modal.style.display = 'flex';

        try {
            const response = await fetch(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const ficha = await response.json();

            if (!response.ok) throw new Error(ficha.message || 'Erro ao carregar ficha.');

            document.getElementById('modal-titulo').textContent = `Ficha de ${ficha.nome}`;

            const respostasHtml = (Array.isArray(ficha.respostas) ? ficha.respostas : []).map(r => `
                <div class="resposta-item">
                    <div class="resposta-pergunta">${escapar(r.pergunta)}</div>
                    <div class="resposta-texto ${r.resposta ? '' : 'resposta-vazia'}">${r.resposta ? escapar(r.resposta) : 'Sem resposta'}</div>
                </div>
            `).join('');

            body.innerHTML = `
                <div class="ficha-info-topo">
                    <div><strong>CPF:</strong> ${escapar(ficha.cpf) || '-'}</div>
                    <div><strong>Nascimento/Idade:</strong> ${escapar(ficha.dataNascimento) || '-'}</div>
                    <div><strong>Enviada em:</strong> ${formatarDataHora(ficha.createdAt)}</div>
                </div>
                ${respostasHtml || '<p style="color:#888;">Nenhuma resposta registrada.</p>'}
            `;
        } catch (error) {
            console.error('Erro ao abrir ficha:', error);
            body.innerHTML = `<p style="text-align:center;color:#c0392b;">${escapar(error.message)}</p>`;
        }
    };

    window.fecharModalFicha = () => {
        document.getElementById('modal-ficha').style.display = 'none';
        fichaAbertaId = null;
    };

    document.getElementById('modal-ficha').addEventListener('click', (e) => {
        if (e.target.id === 'modal-ficha') fecharModalFicha();
    });

    // === EXCLUIR FICHA ===
    document.getElementById('btn-excluir-ficha').addEventListener('click', async () => {
        if (!fichaAbertaId) return;
        if (!confirm('Tem certeza que deseja excluir esta ficha? Esta ação não pode ser desfeita.')) return;

        try {
            const response = await fetch(`${API_URL}/${fichaAbertaId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao excluir ficha.');

            fecharModalFicha();
            fetchFichas();
        } catch (error) {
            alert(error.message);
        }
    });

    fetchFichas();
});

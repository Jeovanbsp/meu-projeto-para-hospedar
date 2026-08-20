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
    let fichaAberta = null; // dados completos da ficha aberta (para PDF/edição)
    let modoEdicao = false;

    // === FETCH COM TIMEOUT (evita "travar" quando o Render está acordando) ===
    async function fetchComTimeout(url, options = {}, timeoutMs = 20000) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...options, signal: controller.signal });
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('O servidor demorou muito para responder (pode estar reiniciando). Tente novamente em alguns segundos.');
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

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
                <span class="acoes-linha">
                    <button class="btn-ver-ficha"><i class="ph ph-eye"></i> Ver ficha</button>
                    <button class="btn-apagar-linha" title="Apagar ficha" onclick="event.stopPropagation(); excluirFichaLista('${f._id}')"><i class="ph ph-trash"></i></button>
                </span>
            </li>
        `).join('');
    };

    const fetchFichas = async () => {
        try {
            const response = await fetchComTimeout(API_URL, {
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
            listaBody.innerHTML = `<li class="lista-vazia">${escapar(error.message)}</li>`;
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

    // === MODAL: VISUALIZAÇÃO ===
    function renderizarFicha(ficha) {
        document.getElementById('modal-titulo').textContent = `Ficha de ${ficha.nome}`;

        const respostas = Array.isArray(ficha.respostas) ? ficha.respostas : [];
        const respostasHtml = respostas.map(r => `
            <div class="resposta-item">
                <div class="resposta-pergunta">${escapar(r.pergunta)}</div>
                <div class="resposta-texto ${r.resposta ? '' : 'resposta-vazia'}">${r.resposta ? escapar(r.resposta) : 'Sem resposta'}</div>
            </div>
        `).join('');

        document.getElementById('modal-ficha-body').innerHTML = `
            <div class="ficha-info-topo">
                <div><strong>CPF:</strong> ${escapar(ficha.cpf) || '-'}</div>
                <div><strong>Nascimento/Idade:</strong> ${escapar(ficha.dataNascimento) || '-'}</div>
                <div><strong>Enviada em:</strong> ${formatarDataHora(ficha.createdAt)}</div>
            </div>
            ${respostasHtml || '<p style="color:#888;">Nenhuma resposta registrada.</p>'}
        `;
    }

    // === MODAL: MODO EDIÇÃO ===
    function renderizarEdicao(ficha) {
        document.getElementById('modal-titulo').textContent = `Editando ficha de ${ficha.nome}`;

        const respostas = Array.isArray(ficha.respostas) ? ficha.respostas : [];
        const respostasHtml = respostas.map((r, i) => `
            <div class="resposta-item">
                <div class="resposta-pergunta">${escapar(r.pergunta)}</div>
                <textarea class="campo-edicao" data-indice="${i}">${escapar(r.resposta || '')}</textarea>
            </div>
        `).join('');

        document.getElementById('modal-ficha-body').innerHTML = `
            <div class="ficha-info-topo">
                <div><strong>Nome:</strong><br><input class="campo-edicao" id="edicao-nome" value="${escapar(ficha.nome)}"></div>
                <div><strong>CPF:</strong><br><input class="campo-edicao" id="edicao-cpf" value="${escapar(ficha.cpf || '')}"></div>
                <div><strong>Nascimento/Idade:</strong><br><input class="campo-edicao" id="edicao-nascimento" value="${escapar(ficha.dataNascimento || '')}"></div>
            </div>
            ${respostasHtml}
        `;
    }

    function alternarBotoesEdicao(editando) {
        modoEdicao = editando;
        document.getElementById('modal-ficha-body').classList.toggle('editando', editando);
        document.querySelector('.footer-acoes').innerHTML = editando
            ? `<button class="btn-salvar-ficha" id="btn-salvar-ficha"><i class="ph ph-check"></i> Salvar</button>
               <button class="btn-cancelar-edicao" id="btn-cancelar-edicao"><i class="ph ph-x"></i> Cancelar</button>`
            : `<button class="btn-pdf-ficha" id="btn-pdf-ficha"><i class="ph ph-file-pdf"></i> Gerar PDF</button>
               <button class="btn-editar-ficha" id="btn-editar-ficha"><i class="ph ph-pencil-simple"></i> Editar</button>
               <button class="btn-excluir-ficha" id="btn-excluir-ficha"><i class="ph ph-trash"></i> Excluir ficha</button>`;
        vincularBotoesRodape();
    }

    function vincularBotoesRodape() {
        document.getElementById('btn-pdf-ficha')?.addEventListener('click', gerarPDF);
        document.getElementById('btn-editar-ficha')?.addEventListener('click', () => {
            if (fichaAberta) {
                renderizarEdicao(fichaAberta);
                alternarBotoesEdicao(true);
            }
        });
        document.getElementById('btn-excluir-ficha')?.addEventListener('click', excluirFicha);
        document.getElementById('btn-cancelar-edicao')?.addEventListener('click', () => {
            if (fichaAberta) {
                renderizarFicha(fichaAberta);
                alternarBotoesEdicao(false);
            }
        });
        document.getElementById('btn-salvar-ficha')?.addEventListener('click', salvarEdicao);
    }

    async function salvarEdicao() {
        const btn = document.getElementById('btn-salvar-ficha');
        btn.disabled = true;
        btn.innerHTML = '<i class="ph ph-circle-notch"></i> Salvando...';

        const respostas = (Array.isArray(fichaAberta.respostas) ? fichaAberta.respostas : []).map((r, i) => ({
            pergunta: r.pergunta,
            resposta: document.querySelector(`textarea[data-indice="${i}"]`)?.value || ''
        }));

        const payload = {
            nome: document.getElementById('edicao-nome').value.trim(),
            cpf: document.getElementById('edicao-cpf').value.trim(),
            dataNascimento: document.getElementById('edicao-nascimento').value.trim(),
            respostas
        };

        try {
            const response = await fetchComTimeout(`${API_URL}/${fichaAbertaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao salvar.');

            fichaAberta = data;
            renderizarFicha(fichaAberta);
            alternarBotoesEdicao(false);
            fetchFichas(); // atualiza nome/CPF na lista
        } catch (error) {
            alert(error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="ph ph-check"></i> Salvar';
        }
    }

    // === MODAL: ABRIR / FECHAR ===
    window.abrirFicha = async (id) => {
        fichaAbertaId = id;
        fichaAberta = null;
        alternarBotoesEdicao(false);

        const modal = document.getElementById('modal-ficha');
        const body = document.getElementById('modal-ficha-body');
        body.innerHTML = '<p style="text-align:center;color:#888;">Carregando ficha...</p>';
        modal.style.display = 'flex';

        try {
            const response = await fetchComTimeout(`${API_URL}/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const ficha = await response.json();

            if (!response.ok) throw new Error(ficha.message || 'Erro ao carregar ficha.');

            fichaAberta = ficha;
            renderizarFicha(ficha);
        } catch (error) {
            console.error('Erro ao abrir ficha:', error);
            body.innerHTML = `<p style="text-align:center;color:#c0392b;">${escapar(error.message)}</p>`;
        }
    };

    window.fecharModalFicha = () => {
        document.getElementById('modal-ficha').style.display = 'none';
        fichaAbertaId = null;
        fichaAberta = null;
        alternarBotoesEdicao(false);
    };

    document.getElementById('modal-ficha').addEventListener('click', (e) => {
        if (e.target.id === 'modal-ficha') fecharModalFicha();
    });

    // === GERAR PDF ===
    function gerarPDF() {
        if (!fichaAberta) return;

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const margemEsq = 15;
        const larguraUtil = 180;
        let y = 20;

        const quebrar = (texto) => doc.splitTextToSize(texto || '-', larguraUtil);

        function verificarPagina(linhasNecessarias = 1) {
            if (y + linhasNecessarias * 6 > 280) {
                doc.addPage();
                y = 20;
            }
        }

        // Cabeçalho
        doc.setFontSize(16);
        doc.setTextColor(26, 58, 42);
        doc.text('Ficha de Pré-Atendimento', margemEsq, y);
        y += 8;
        doc.setFontSize(11);
        doc.setTextColor(42, 220, 161);
        doc.text('Dra. Aishá Wenzinger - Geriatria', margemEsq, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text(`Nome: ${fichaAberta.nome || '-'}`, margemEsq, y); y += 6;
        doc.text(`CPF: ${fichaAberta.cpf || '-'}`, margemEsq, y); y += 6;
        doc.text(`Nascimento/Idade: ${fichaAberta.dataNascimento || '-'}`, margemEsq, y); y += 6;
        doc.text(`Enviada em: ${formatarDataHora(fichaAberta.createdAt)}`, margemEsq, y); y += 6;
        doc.text('Termo de privacidade (LGPD - Lei 13.709/2018): aceito no envio.', margemEsq, y); y += 8;

        doc.setDrawColor(42, 220, 161);
        doc.line(margemEsq, y, margemEsq + larguraUtil, y);
        y += 8;

        // Respostas
        const respostas = Array.isArray(fichaAberta.respostas) ? fichaAberta.respostas : [];
        respostas.forEach((r) => {
            const linhasPergunta = quebrar(r.pergunta || '');
            const linhasResposta = quebrar(r.resposta || 'Sem resposta');
            verificarPagina(linhasPergunta.length + linhasResposta.length + 1);

            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            doc.text(linhasPergunta, margemEsq, y);
            y += linhasPergunta.length * 4.5;

            doc.setFontSize(10.5);
            doc.setTextColor(40, 40, 40);
            doc.text(linhasResposta, margemEsq, y);
            y += linhasResposta.length * 5 + 4;
        });

        const nomeArquivo = `ficha-${(fichaAberta.nome || 'paciente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}.pdf`;
        doc.save(nomeArquivo);
    }

    // === EXCLUIR FICHA (pelo modal aberto) ===
    async function excluirFicha() {
        if (!fichaAbertaId) return;
        if (!confirm('Tem certeza que deseja excluir esta ficha? Esta ação não pode ser desfeita.')) return;

        try {
            await excluirFichaPorId(fichaAbertaId);
            fecharModalFicha();
        } catch (error) {
            alert(error.message);
        }
    }

    // === EXCLUIR FICHA (direto na lista) ===
    window.excluirFichaLista = async (id) => {
        const ficha = fichasGlobais.find(f => f._id === id);
        const nome = ficha ? ficha.nome : 'este paciente';
        if (!confirm(`Tem certeza que deseja apagar a ficha de "${nome}"? Esta ação não pode ser desfeita.`)) return;

        try {
            await excluirFichaPorId(id);
        } catch (error) {
            alert(error.message);
        }
    };

    async function excluirFichaPorId(id) {
        const response = await fetchComTimeout(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Erro ao excluir ficha.');

        fetchFichas();
    }

    vincularBotoesRodape();
    fetchFichas();
});

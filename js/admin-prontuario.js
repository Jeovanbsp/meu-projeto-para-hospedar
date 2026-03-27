// Arquivo: /js/admin-prontuario.js (Exclusivo para a Dra. Aisha editar pacientes)

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get('id');

    const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
    const API_URL_ADMIN = `${API_ADMIN_BASE}/api/admin/prontuario/${pacienteId}`;
    const API_URL_EVOLUCAO = `${API_ADMIN_BASE}/api/admin/prontuario/${pacienteId}/evolucao`;

    if (!token || !pacienteId) { 
        window.location.href = 'admin.html'; 
        return; 
    }

    // --- INICIALIZAÇÃO DO EDITOR QUILL ---
    const quill = new Quill('#editor-container', {
        modules: {
            toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['clean']
            ]
        },
        placeholder: 'Descreva a evolução aqui...',
        theme: 'snow'
    });

    // --- LOGOUT ---
    document.getElementById('btn-logout-admin')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });

    // Elementos Gerais
    const checkTermoAceite = document.getElementById('check-termo-aceite');
    const statusTermoTexto = document.getElementById('status-termo-texto');
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); 
    const idadeInput = document.getElementById('idade');
    const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
    const patologiasInput = document.getElementById('patologias');
    const examesInput = document.getElementById('exames');
    const adminNomeTopo = document.getElementById('admin-nome-paciente-topo');
    
    const radioComorbidadeSim = document.querySelector('input[name="temComorbidade"][value="sim"]');
    const listaComorbidades = document.getElementById('lista-comorbidades');
    const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
    const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');

    const radioAlergiaSim = document.querySelector('input[name="temAlergia"][value="sim"]');
    const containerAddAlergia = document.getElementById('container-add-alergia');
    const inputNovaAlergia = document.getElementById('input-nova-alergia');
    const btnAddAlergia = document.getElementById('btn-add-alergia');
    const listaAlergiasPills = document.getElementById('lista-alergias-pills');

    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
    const mensagemRetorno = document.getElementById('mensagem-retorno');
    
    let currentMedicacoes = []; 
    let currentMedicos = []; 
    let currentAlergias = []; 
    let currentEvolucoes = [];

    // --- RENDERIZAÇÕES ---

    const renderAlergiasList = () => {
        if (!listaAlergiasPills) return;
        listaAlergiasPills.innerHTML = '';
        currentAlergias.forEach((alergia, index) => {
            const li = document.createElement('li');
            li.className = 'pill-alergia';
            li.innerHTML = `
                <i class="ph-fill ph-warning-circle alergia-icone-pisca"></i>
                <span style="line-height: 1;">${alergia}</span>
                <button type="button" class="btn-remover-alergia no-print" onclick="removerAlergia(${index})">
                    <i class="ph ph-x"></i>
                </button>
            `;
            listaAlergiasPills.appendChild(li);
        });
    };

    const renderMedicosList = () => { 
        if (!listaMedicosPills) return;
        listaMedicosPills.innerHTML = ''; 
        currentMedicos.forEach((medico, index) => { 
            const telLimpo = medico.telefone ? medico.telefone.replace(/\D/g, '') : '';
            const temContato = telLimpo.length >= 8;

            const pill = `
                <li class="pill-medico">
                    <div class="medico-dados">
                        <div class="medico-nome-crm">
                            <i class="ph ph-user"></i> ${medico.nome} 
                            ${medico.crm ? `<span class="medico-crm-tag">(CRM: ${medico.crm})</span>` : ''}
                        </div>
                        ${medico.especialidade ? `<div class="medico-especialidade"><i class="ph ph-stethoscope"></i> ${medico.especialidade}</div>` : ''}
                        ${medico.telefone ? `<div class="medico-telefone-texto"><i class="ph ph-phone"></i> ${medico.telefone}</div>` : ''}
                        ${temContato ? `
                            <div class="medico-acoes-contato no-print">
                                <a href="https://wa.me/55${telLimpo}" target="_blank" class="btn-contato btn-whatsapp">
                                    <i class="ph-fill ph-whatsapp-logo"></i> WhatsApp
                                </a>
                                <a href="tel:${telLimpo}" class="btn-contato btn-ligar">
                                    <i class="ph-fill ph-phone"></i> Ligar
                                </a>
                            </div>` : ''}
                    </div>
                    <button type="button" class="btn-remover-medico no-print" onclick="removerMedico(${index})"><i class="ph ph-trash"></i></button>
                </li>`; 
            listaMedicosPills.insertAdjacentHTML('beforeend', pill); 
        }); 
    };

    const renderTabelaMedicacoes = () => { 
        if (!listaMedicacoesBody) return;
        listaMedicacoesBody.innerHTML = ''; 
        if (currentMedicacoes.length === 0) {
            listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ccc; padding: 20px;">Nenhuma medicação adicionada</td></tr>';
            return;
        }
        currentMedicacoes.sort((a, b) => (a.horarioEspecifico || '').localeCompare(b.horarioEspecifico || ''));
        currentMedicacoes.forEach((med, index) => { 
            const row = `<tr><td style="font-weight: 600; vertical-align: middle;">${med.nome}</td><td style="text-align: center; vertical-align: middle;">${med.quantidade || '-'}</td><td style="text-align: center; color: #2ADCA1; font-weight: bold; vertical-align: middle;"><i class="ph ph-clock"></i> ${med.horarioEspecifico}</td><td style="vertical-align: middle;">${med.turno ? `<span class="turno-badge-tabela">${med.turno}</span>` : '-'}</td><td class="no-print" style="text-align: center; width: 60px; vertical-align: middle;"><button type="button" class="btn-remover-linha" onclick="removerMedicacao(${index})"><i class="ph ph-trash"></i></button></td></tr>`;
            listaMedicacoesBody.insertAdjacentHTML('beforeend', row);
        }); 
    };

    const renderEvolucoes = () => {
        const listBody = document.getElementById('lista-evolucoes-body');
        if (!listBody) return;
        listBody.innerHTML = ''; 
        
        if (currentEvolucoes.length === 0) {
            listBody.innerHTML = '<p style="color: #888; text-align: center; padding: 20px; font-style: italic;">Nenhuma evolução registrada.</p>';
            return;
        }
        const sorted = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));
        
        sorted.forEach(evo => {
            const dateStr = new Date(evo.data).toLocaleString('pt-BR');
            const box = document.createElement('div');
            box.className = 'box-evolucao';
            box.innerHTML = `
                <div class="box-evolucao-header" onclick="toggleEvolucao(this)">
                    <div class="evolucao-info"><span class="box-evolucao-titulo">${evo.titulo}</span><span class="box-evolucao-data">${dateStr}</span></div>
                    <i class="ph ph-caret-down"></i>
                </div>
                <div class="box-evolucao-content">
                    <div class="box-evolucao-texto">${evo.texto}</div>
                    <div class="evolucao-acoes-btn no-print">
                        <button type="button" class="btn-editar-evolucao-btn-js" style="background:none; border:none; color:#007bff; font-weight:bold; cursor:pointer;"><i class="ph ph-pencil"></i> Editar</button>
                        <button type="button" onclick="removerEvolucao('${evo._id}')" style="background:none; border:none; color:#ef5350; font-weight:bold; cursor:pointer;"><i class="ph ph-trash"></i> Excluir</button>
                    </div>
                </div>`;
            
            box.querySelector('.btn-editar-evolucao-btn-js').addEventListener('click', (e) => {
                e.stopPropagation();
                prepararEdicaoEvo(evo._id, evo.titulo, evo.texto);
            });
            listBody.appendChild(box);
        });
    };

    window.toggleEvolucao = (el) => {
        const content = el.nextElementSibling;
        const icon = el.querySelector('i.ph-caret-down, i.ph-caret-up');
        const isOpen = content.style.display === 'block';
        document.querySelectorAll('.box-evolucao-content').forEach(c => c.style.display = 'none');
        document.querySelectorAll('.box-evolucao-header i.ph-caret-up').forEach(i => i.className = 'ph ph-caret-down');
        if (!isOpen) { content.style.display = 'block'; if(icon) icon.className = 'ph ph-caret-up'; }
    };

    const inputEvoId = document.getElementById('evolucao-id-editando');
    const inputEvoTitulo = document.getElementById('titulo-evolucao');
    const btnCancelarEvo = document.getElementById('btn-cancelar-edicao-evo');

    window.prepararEdicaoEvo = (id, titulo, texto) => {
        if(inputEvoId) inputEvoId.value = id;
        if(inputEvoTitulo) inputEvoTitulo.value = titulo;
        quill.root.innerHTML = texto;
        document.getElementById('txt-btn-evolucao').innerText = "Atualizar Evolução";
        if(btnCancelarEvo) btnCancelarEvo.style.display = 'inline-flex';
        window.scrollTo({ top: document.getElementById('area-form-evolucao').offsetTop - 120, behavior: 'smooth' });
    };

    if(btnCancelarEvo) {
        btnCancelarEvo.onclick = () => {
            if(inputEvoId) inputEvoId.value = "";
            if(inputEvoTitulo) inputEvoTitulo.value = "";
            quill.root.innerHTML = "";
            document.getElementById('txt-btn-evolucao').innerText = "Registrar Evolução";
            btnCancelarEvo.style.display = 'none';
        };
    }

    document.getElementById('btn-salvar-evolucao-quill').onclick = async () => {
        const id = inputEvoId.value;
        const payload = { titulo: inputEvoTitulo.value, texto: quill.root.innerHTML };
        if(!payload.titulo || payload.texto === '<p><br></p>') return alert("Preencha título e conteúdo.");
        const url = id ? `${API_URL_EVOLUCAO}/${id}` : API_URL_EVOLUCAO;
        const metodo = id ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, { method: metodo, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
            if(res.ok) {
                const data = await res.json();
                currentEvolucoes = data.prontuario.evolucoes;
                renderEvolucoes();
                if(btnCancelarEvo) btnCancelarEvo.onclick();
            }
        } catch (err) { console.error(err); }
    };

    // --- CARREGAMENTO INICIAL ---
    const fetchProntuario = async () => {
        try {
            const response = await fetch(API_URL_ADMIN, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            currentMedicacoes = data.medicacoes || [];
            currentMedicos = data.medicosAssistentes || [];
            currentEvolucoes = data.evolucoes || [];
            adminNomeTopo.innerText = `Paciente: ${data.nomePaciente || 'N/I'}`;
            nomePacienteInput.value = data.nomePaciente || '';
            rgPacienteInput.value = data.rg || '';
            idadeInput.value = data.idade || '';
            patologiasInput.value = data.patologias || '';
            examesInput.value = data.exames || '';
            if(data.termoAceite) { checkTermoAceite.checked = true; statusTermoTexto.innerHTML = 'ACEITO'; statusTermoTexto.style.color = '#2ADCA1'; }
            radiosMobilidade.forEach(r => { if (r.value === data.mobilidade) r.checked = true; });
            if (data.comorbidades?.temComorbidade) {
                radioComorbidadeSim.checked = true; listaComorbidades.style.display = 'block';
                inputOutrasComorbidades.value = data.comorbidades.outras || '';
                checkboxesComorbidades.forEach(cb => { if (data.comorbidades.lista?.includes(cb.value)) cb.checked = true; });
            }
            if (data.alergias?.temAlergia) {
                radioAlergiaSim.checked = true; containerAddAlergia.style.display = 'block';
                currentAlergias = data.alergias.quais ? data.alergias.quais.split(', ') : [];
                renderAlergiasList();
            }
            renderTabelaMedicacoes(); renderMedicosList(); renderEvolucoes();
        } catch (error) { console.error(error); }
    };

    // --- FUNÇÕES GLOBAIS ---
    window.removerAlergia = (i) => { currentAlergias.splice(i, 1); renderAlergiasList(); };
    window.removerMedico = (i) => { currentMedicos.splice(i, 1); renderMedicosList(); };
    window.removerMedicacao = (i) => { currentMedicacoes.splice(i, 1); renderTabelaMedicacoes(); };
    window.removerEvolucao = async (id) => {
        if(!confirm('Excluir permanentemente?')) return;
        const res = await fetch(`${API_URL_EVOLUCAO}/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) { const d = await res.json(); currentEvolucoes = d.prontuario.evolucoes; renderEvolucoes(); }
    };

    document.getElementById('form-add-medico')?.addEventListener('submit', (e) => {
        e.preventDefault();
        currentMedicos.push({ nome: document.getElementById('nome-medico').value, crm: document.getElementById('crm-medico').value, especialidade: document.getElementById('especialidade-medico').value, telefone: document.getElementById('telefone-medico').value });
        renderMedicosList(); e.target.reset();
    });

    document.getElementById('form-add-medicacao')?.addEventListener('submit', (e) => {
        e.preventDefault();
        currentMedicacoes.push({ nome: document.getElementById('nome-medicacao').value, quantidade: document.getElementById('qtd-medicacao').value, horarioEspecifico: document.getElementById('horario-especifico').value, turno: document.getElementById('turno-medicacao').value });
        renderTabelaMedicacoes(); e.target.reset();
    });

    btnSalvarTudo?.addEventListener('click', async () => {
        const payload = { nomePaciente: nomePacienteInput.value, rg: rgPacienteInput.value, idade: idadeInput.value, mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value, patologias: patologiasInput.value, exames: examesInput.value, medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, comorbidades: { temComorbidade: radioComorbidadeSim.checked, lista: Array.from(checkboxesComorbidades).filter(c => c.checked).map(c => c.value), outras: inputOutrasComorbidades.value }, alergias: { temAlergia: radioAlergiaSim.checked, quais: currentAlergias.join(', ') } };
        const res = await fetch(API_URL_ADMIN, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload) });
        if(res.ok) { mensagemRetorno.innerText = 'Prontuário salvo!'; setTimeout(() => mensagemRetorno.innerText = '', 3000); }
    });

    fetchProntuario();
});
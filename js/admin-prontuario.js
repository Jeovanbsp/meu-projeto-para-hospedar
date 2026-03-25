document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
    const pacienteId = new URLSearchParams(window.location.search).get('id');

    if (!token || role !== 'admin' || !pacienteId) { window.location.href = 'login.html'; return; }

    // --- SELETORES (IGUAIS AOS DO PACIENTE) ---
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); 
    const idadeInput = document.getElementById('idade');
    const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
    const patologiasInput = document.getElementById('patologias');
    const examesInput = document.getElementById('exames');
    
    const radioComorbidadeSim = document.getElementById('comorbidade-sim');
    const radioComorbidadeNao = document.getElementById('comorbidade-nao');
    const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
    const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');

    const radioAlergiaSim = document.getElementById('alergia-sim');
    const radioAlergiaNao = document.getElementById('alergia-nao');
    const inputAlergiasQuais = document.getElementById('alergias-quais');

    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const listaEvolucoesDiv = document.getElementById('lista-evolucoes');
    const badgeTermo = document.getElementById('badge-termo-status');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin');

    let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = [];
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    // --- POPULAR FORMULÁRIO (Sincronização) ---
    const populateForm = (data) => {
        if (nomePacienteInput) nomePacienteInput.value = data.nomePaciente || '';
        if (rgPacienteInput) rgPacienteInput.value = data.rg || ''; 
        if (idadeInput) idadeInput.value = data.idade || '';
        if (patologiasInput) patologiasInput.value = data.patologias || '';
        if (examesInput) examesInput.value = data.exames || '';

        if (data.mobilidade) radiosMobilidade.forEach(r => { if (r.value === data.mobilidade) r.checked = true; });

        const comorb = data.comorbidades || {};
        if (radioComorbidadeSim) {
            radioComorbidadeSim.checked = !!comorb.temComorbidade;
            radioComorbidadeNao.checked = !comorb.temComorbidade;
            if (inputOutrasComorbidades) inputOutrasComorbidades.value = comorb.outras || '';
            if (checkboxesComorbidades) checkboxesComorbidades.forEach(cb => { cb.checked = comorb.lista?.includes(cb.value); });
        }

        const alerg = data.alergias || {};
        if (radioAlergiaSim) {
            radioAlergiaSim.checked = !!alerg.temAlergia;
            radioAlergiaNao.checked = !alerg.temAlergia;
            if (inputAlergiasQuais) inputAlergiasQuais.value = alerg.quais || '';
        }

        if (badgeTermo) {
            badgeTermo.innerText = data.termoAceite ? "✅ TERMO ACEITO" : "❌ PENDENTE";
            badgeTermo.className = data.termoAceite ? "badge-termo aceito" : "badge-termo pendente";
        }

        currentMedicacoes = data.medicacoes || [];
        currentMedicos = data.medicosAssistentes || [];
        currentEvolucoes = data.evolucoes || [];

        renderTabelaMedicacoes();
        renderMedicosList();
        renderEvolucoes();
    };

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderTabelaMedicacoes = () => {
        if (!listaMedicacoesBody) return;
        listaMedicacoesBody.innerHTML = '';
        currentMedicacoes.forEach((med) => {
            let turnosHtml = '';
            if (med.horarios) {
                Object.entries(med.horarios).forEach(([key, val]) => {
                    if (val && mapTurnos[key]) turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`;
                });
            }
            listaMedicacoesBody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td>${med.nome}</td>
                    <td>${med.quantidade || '-'}</td>
                    <td>${turnosHtml || '-'}</td>
                    <td>${med.horarioEspecifico || '--:--'}</td>
                    <td style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td>
                </tr>`);
        });
    };

    const renderMedicosList = () => {
        if (!listaMedicosPills) return;
        listaMedicosPills.innerHTML = '';
        currentMedicos.forEach((m, i) => {
            listaMedicosPills.innerHTML += `<li class="pill-medico"><span>${m}</span><button class="btn-deletar-medico" data-index="${i}">✕</button></li>`;
        });
    };

    const renderEvolucoes = () => {
        if (!listaEvolucoesDiv) return;
        listaEvolucoesDiv.innerHTML = '';
        const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));
        list.forEach(evo => {
            const dataStr = new Date(evo.data).toLocaleString('pt-BR');
            listaEvolucoesDiv.insertAdjacentHTML('beforeend', `
                <div class="evolucao-item">
                    <div class="evo-header" onclick="toggleEvolucao('${evo._id}')">
                        <div class="evo-left"><span>${dataStr}</span><strong>${evo.titulo}</strong></div>
                    </div>
                    <div class="evo-body" id="body-${evo._id}"><p>${evo.texto}</p></div>
                </div>`);
        });
    };

    // --- BOTÃO SALVAR (ESPELHAMENTO REAL) ---
    btnSalvarTudo?.addEventListener('click', async (e) => {
        e.preventDefault();
        btnSalvarTudo.innerText = 'Salvando...';
        const payload = {
            nomePaciente: nomePacienteInput.value, rg: rgPacienteInput.value, idade: idadeInput.value,
            mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
            patologias: patologiasInput.value, exames: examesInput.value,
            comorbidades: { 
                temComorbidade: radioComorbidadeSim.checked, 
                lista: Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value), 
                outras: inputOutrasComorbidades.value 
            },
            alergias: { 
                temAlergia: radioAlergiaSim.checked, 
                quais: inputAlergiasQuais.value 
            },
            medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, termoAceite: true
        };
        const res = await fetch(API_ADMIN_BASE + pacienteId, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if(res.ok) alert('Prontuário atualizado para ambos!');
        btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
    });

    const fetchProntuario = async () => {
        const res = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        populateForm(data);
    };

    fetchProntuario();
});

window.toggleEvolucao = (id) => document.getElementById(`body-${id}`)?.classList.toggle('aberto');
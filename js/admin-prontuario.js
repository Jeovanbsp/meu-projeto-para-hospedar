document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
    const pacienteId = new URLSearchParams(window.location.search).get('id');

    if (!token || role !== 'admin' || !pacienteId) { window.location.href = 'login.html'; return; }

    // --- SELETORES GERAIS ---
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente');
    const idadeInput = document.getElementById('idade');
    const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
    const patologiasInput = document.getElementById('patologias');
    const examesInput = document.getElementById('exames');
    
    // --- COMORBIDADES E ALERGIAS ---
    const radioComorbidadeSim = document.getElementById('comorbidade-sim');
    const radioComorbidadeNao = document.getElementById('comorbidade-nao');
    const listaComorbidades = document.getElementById('lista-comorbidades');
    const radioAlergiaSim = document.getElementById('alergia-sim');
    const radioAlergiaNao = document.getElementById('alergia-nao');
    const inputAlergiasQuais = document.getElementById('alergias-quais');

    // --- TABELAS E LISTAS ---
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const listaEvolucoesDiv = document.getElementById('lista-evolucoes');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin');

    let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let editingEvolucaoId = null;
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    // --- FUNÇÕES DE INTERAÇÃO (Toggles) ---
    function toggleComorbidades() {
        if (listaComorbidades) listaComorbidades.style.display = radioComorbidadeSim?.checked ? 'block' : 'none';
    }
    function toggleAlergiaInput() {
        if (inputAlergiasQuais) inputAlergiasQuais.style.display = radioAlergiaSim?.checked ? 'block' : 'none';
    }

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
                    <td><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td>
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

    // --- ADICIONAR MÉDICO ---
    document.getElementById('form-add-medico')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-medico').value;
        const tel = document.getElementById('telefone-medico').value;
        currentMedicos.push(`${nome} ${tel ? '('+tel+')' : ''}`);
        renderMedicosList();
        e.target.reset();
    });

    // --- ADICIONAR MEDICAÇÃO ---
    document.getElementById('form-add-medicacao')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const horarios = {};
        document.querySelectorAll('input[name="horario"]').forEach(cb => horarios[cb.value] = cb.checked);
        currentMedicacoes.push({
            nome: document.getElementById('nome-medicacao').value,
            quantidade: document.getElementById('qtd-medicacao').value,
            horarioEspecifico: document.getElementById('horario-especifico').value,
            horarios: horarios
        });
        renderTabelaMedicacoes();
        e.target.reset();
        e.target.style.display = 'none';
    });

    // --- SALVAR TUDO (Espelhamento Perfeito) ---
    btnSalvarTudo?.addEventListener('click', async (e) => {
        e.preventDefault();
        const payload = {
            nomePaciente: nomePacienteInput.value, rg: rgPacienteInput.value, idade: idadeInput.value,
            mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
            patologias: patologiasInput.value, exames: examesInput.value,
            comorbidades: { 
                temComorbidade: radioComorbidadeSim.checked, 
                lista: Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value), 
                outras: document.getElementById('comorbidades-outras')?.value 
            },
            alergias: { temAlergia: radioAlergiaSim.checked, quais: inputAlergiasQuais.value },
            medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, termoAceite: true
        };
        await fetch(API_ADMIN_BASE + pacienteId, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        alert('Prontuário sincronizado com o paciente!');
    });

    // Listeners de Toggle
    radioComorbidadeSim?.addEventListener('change', toggleComorbidades);
    radioComorbidadeNao?.addEventListener('change', toggleComorbidades);
    radioAlergiaSim?.addEventListener('change', toggleAlergiaInput);
    radioAlergiaNao?.addEventListener('change', toggleAlergiaInput);

    const fetchProntuario = async () => {
        const res = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        
        // Popula campos e chama Toggles
        if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || '';
        if(rgPacienteInput) rgPacienteInput.value = data.rg || '';
        if(idadeInput) idadeInput.value = data.idade || '';
        
        currentMedicacoes = data.medicacoes || [];
        currentMedicos = data.medicosAssistentes || [];
        currentEvolucoes = data.evolucoes || [];
        
        renderTabelaMedicacoes();
        renderMedicosList();
        toggleComorbidades();
        toggleAlergiaInput();
    };

    fetchProntuario();
});
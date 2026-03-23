document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
    
    const pacienteId = new URLSearchParams(window.location.search).get('id');

    if (!token || role !== 'admin' || !pacienteId) { 
        localStorage.clear(); 
        window.location.href = 'login.html'; 
        return; 
    }

    // SELETORES
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); // RG ADICIONADO
    const idadeInput = document.getElementById('idade');
    const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
    const patologiasInput = document.getElementById('patologias');
    const examesInput = document.getElementById('exames');
    
    const radioComorbidadeSim = document.getElementById('comorbidade-sim');
    const radioComorbidadeNao = document.getElementById('comorbidade-nao');
    const listaComorbidades = document.getElementById('lista-comorbidades');
    const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
    const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');

    const radioAlergiaSim = document.getElementById('alergia-sim');
    const radioAlergiaNao = document.getElementById('alergia-nao');
    const inputAlergiasQuais = document.getElementById('alergias-quais');
    const sinalizadorAlergia = document.getElementById('sinalizador-alergia'); 

    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const listaEvolucoesDiv = document.getElementById('lista-evolucoes');

    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
    const badgeTermo = document.getElementById('badge-termo-status');

    let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let currentTermoAceite = false; 
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    // PREENCHIMENTO DO FORMULÁRIO (Igual ao do paciente)
    const populateForm = (data) => {
        if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || '';
        if(rgPacienteInput) rgPacienteInput.value = data.rg || ''; // Carrega o RG
        if(idadeInput) idadeInput.value = data.idade || '';
        if(patologiasInput) patologiasInput.value = data.patologias || '';
        if(examesInput) examesInput.value = data.exames || '';

        if (data.mobilidade && radiosMobilidade) {
            radiosMobilidade.forEach(r => { if(r.value === data.mobilidade) r.checked = true; });
        }

        const comorb = data.comorbidades || {};
        if (radioComorbidadeSim && radioComorbidadeNao) {
            radioComorbidadeSim.checked = !!comorb.temComorbidade;
            radioComorbidadeNao.checked = !comorb.temComorbidade;
            if(inputOutrasComorbidades) inputOutrasComorbidades.value = comorb.outras || '';
            if (checkboxesComorbidades && comorb.lista) {
                checkboxesComorbidades.forEach(cb => { cb.checked = comorb.lista.includes(cb.value); });
            }
            toggleComorbidades();
        }

        const alerg = data.alergias || {};
        if (radioAlergiaSim && radioAlergiaNao) {
            radioAlergiaSim.checked = !!alerg.temAlergia;
            radioAlergiaNao.checked = !alerg.temAlergia;
            if(inputAlergiasQuais) inputAlergiasQuais.value = alerg.quais || '';
            toggleAlergiaInput();
        }

        currentTermoAceite = data.termoAceite || false;
        if (badgeTermo) {
            badgeTermo.innerText = currentTermoAceite ? "✅ TERMO ACEITO" : "❌ PENDENTE";
            badgeTermo.className = currentTermoAceite ? "badge-termo aceito" : "badge-termo pendente";
        }

        currentMedicacoes = data.medicacoes || [];
        currentMedicos = data.medicosAssistentes || [];
        currentEvolucoes = data.evolucoes || [];

        renderTabelaMedicacoes();
        renderMedicosList();
        renderEvolucoes();
    };

    function toggleComorbidades() { 
        if (listaComorbidades && radioComorbidadeSim) {
            listaComorbidades.style.display = radioComorbidadeSim.checked ? 'block' : 'none';
        }
    }

    function toggleAlergiaInput() { 
        if (inputAlergiasQuais && radioAlergiaSim) {
            inputAlergiasQuais.style.display = radioAlergiaSim.checked ? 'block' : 'none';
            if(sinalizadorAlergia) sinalizadorAlergia.style.display = radioAlergiaSim.checked ? 'flex' : 'none';
        }
    }

    const fetchProntuario = async () => {
        try {
            const response = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Erro API');
            const data = await response.json();
            populateForm(data);
        } catch (error) { console.error("Erro ao carregar:", error); }
    };

    const renderTabelaMedicacoes = () => { 
        if(!listaMedicacoesBody) return;
        listaMedicacoesBody.innerHTML = ''; 
        currentMedicacoes.forEach((med) => { 
            let turnosHtml = ''; 
            if (med.horarios) {
                Object.entries(med.horarios).forEach(([key, val]) => { 
                    if (val && mapTurnos[key]) turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; 
                }); 
            }
            listaMedicacoesBody.insertAdjacentHTML('beforeend', `<tr><td>${med.nome}</td><td>${med.quantidade || '-'}</td><td>${turnosHtml || '-'}</td><td>${med.horarioEspecifico || '--:--'}</td><td style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td></tr>`); 
        }); 
    };

    const renderMedicosList = () => {
        if(!listaMedicosPills) return;
        listaMedicosPills.innerHTML = '';
        currentMedicos.forEach((m, i) => {
            listaMedicosPills.innerHTML += `<li class="pill-medico"><span>${m}</span><button class="btn-deletar-medico" data-index="${i}">✕</button></li>`;
        });
    };

    const renderEvolucoes = () => {
        if(!listaEvolucoesDiv) return;
        listaEvolucoesDiv.innerHTML = '';
        const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));
        list.forEach(evo => {
            const d = new Date(evo.data);
            const dataStr = d.toLocaleDateString('pt-BR') + ' ' + d.getHours() + ':' + d.getMinutes().toString().padStart(2, '0');
            listaEvolucoesDiv.insertAdjacentHTML('beforeend', `<div class="evolucao-item"><div class="evo-header" onclick="toggleEvolucao('${evo._id}')"><div class="evo-left"><span>${dataStr}</span><strong>${evo.titulo}</strong></div></div><div class="evo-body" id="body-${evo._id}"><p>${evo.texto.replace(/\n/g, '<br>')}</p></div></div>`);
        });
    };

    // BOTÃO SALVAR TUDO (Com todas as proteções anti-null)
    if(btnSalvarTudo) {
        btnSalvarTudo.addEventListener('click', async (e) => {
            e.preventDefault();
            btnSalvarTudo.innerText = 'Salvando...';

            const payload = {
                nomePaciente: nomePacienteInput?.value || '',
                rg: rgPacienteInput?.value || '', // Salvando o RG
                idade: idadeInput?.value || '',
                mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
                patologias: patologiasInput?.value || '',
                exames: examesInput?.value || '',
                comorbidades: { 
                    temComorbidade: radioComorbidadeSim ? radioComorbidadeSim.checked : false, 
                    lista: Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value), 
                    outras: inputOutrasComorbidades?.value || '' 
                },
                alergias: { 
                    temAlergia: radioAlergiaSim ? radioAlergiaSim.checked : false, 
                    quais: inputAlergiasQuais?.value || '' 
                },
                medicosAssistentes: currentMedicos,
                medicacoes: currentMedicacoes,
                termoAceite: currentTermoAceite
            };

            try {
                const res = await fetch(API_ADMIN_BASE + pacienteId, {
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });
                if(res.ok) alert('Prontuário salvo com sucesso!');
            } catch (e) { alert('Erro de conexão.'); }
            btnSalvarTudo.innerText = 'Salvar Edição';
        });
    }

    if(radioAlergiaSim) radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
    if(radioAlergiaNao) radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
    if(radioComorbidadeSim) radioComorbidadeSim.addEventListener('change', toggleComorbidades);
    if(radioComorbidadeNao) radioComorbidadeNao.addEventListener('change', toggleComorbidades);

    fetchProntuario();
});

window.toggleEvolucao = (id) => {
    document.getElementById(`body-${id}`)?.classList.toggle('aberto');
};
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
    const pacienteId = new URLSearchParams(window.location.search).get('id');

    if (!token || role !== 'admin' || !pacienteId) { window.location.href = 'login.html'; return; }

    // --- SELETORES (Sincronizados com Paciente) ---
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
    const listaComorbidades = document.getElementById('lista-comorbidades');

    const radioAlergiaSim = document.getElementById('alergia-sim');
    const radioAlergiaNao = document.getElementById('alergia-nao');
    const inputAlergiasQuais = document.getElementById('alergias-quais');

    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
    const badgeTermo = document.getElementById('badge-termo-status');

    // Evoluções
    const tituloEvolucaoInput = document.getElementById('titulo-evolucao');
    const textoEvolucaoInput = document.getElementById('texto-evolucao');
    const btnAddEvolucao = document.getElementById('btn-add-evolucao');
    const listaEvolucoesDiv = document.getElementById('lista-evolucoes');

    let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let editingEvolucaoId = null;
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    const populateForm = (data) => {
        if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || '';
        if(rgPacienteInput) rgPacienteInput.value = data.rg || '';
        if(idadeInput) idadeInput.value = data.idade || '';
        if(patologiasInput) patologiasInput.value = data.patologias || '';
        if(examesInput) examesInput.value = data.exames || '';

        if (data.mobilidade) radiosMobilidade.forEach(r => { if(r.value === data.mobilidade) r.checked = true; });

        const comorb = data.comorbidades || {};
        if (radioComorbidadeSim) {
            radioComorbidadeSim.checked = !!comorb.temComorbidade;
            radioComorbidadeNao.checked = !comorb.temComorbidade;
            if(inputOutrasComorbidades) inputOutrasComorbidades.value = comorb.outras || '';
            if(checkboxesComorbidades) checkboxesComorbidades.forEach(cb => { cb.checked = comorb.lista?.includes(cb.value); });
            toggleComorbidades();
        }

        const alerg = data.alergias || {};
        if (radioAlergiaSim) {
            radioAlergiaSim.checked = !!alerg.temAlergia;
            radioAlergiaNao.checked = !alerg.temAlergia;
            if(inputAlergiasQuais) inputAlergiasQuais.value = alerg.quais || '';
            toggleAlergiaInput();
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
            const dataStr = d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            listaEvolucoesDiv.insertAdjacentHTML('beforeend', `
                <div class="evolucao-item">
                    <div class="evo-header" onclick="toggleEvolucao('${evo._id}')">
                        <div class="evo-left"><span>${dataStr}</span><strong>${evo.titulo}</strong></div>
                        <div class="evo-btns" onclick="event.stopPropagation()">
                            <button class="btn-mini edit" onclick="startEditEvolucao('${evo._id}')">✎</button>
                            <button class="btn-mini delete" onclick="deleteEvolucao('${evo._id}')">✕</button>
                        </div>
                    </div>
                    <div class="evo-body" id="body-${evo._id}"><p>${evo.texto.replace(/\n/g, '<br>')}</p></div>
                </div>`);
        });
    };

    // CRUD Evoluções
    if(btnAddEvolucao) {
        btnAddEvolucao.addEventListener('click', async () => {
            const titulo = tituloEvolucaoInput.value;
            const texto = textoEvolucaoInput.value;
            const url = `${API_ADMIN_BASE}${pacienteId}/evolucao${editingEvolucaoId ? '/' + editingEvolucaoId : ''}`;
            const method = editingEvolucaoId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ titulo, texto })
            });

            if(res.ok) {
                const result = await res.json();
                currentEvolucoes = result.prontuario.evolucoes;
                renderEvolucoes();
                tituloEvolucaoInput.value = ''; textoEvolucaoInput.value = '';
                editingEvolucaoId = null;
                btnAddEvolucao.innerText = '+ Registrar Evolução';
            }
        });
    }

    window.startEditEvolucao = (id) => {
        const evo = currentEvolucoes.find(e => e._id === id);
        tituloEvolucaoInput.value = evo.titulo;
        textoEvolucaoInput.value = evo.texto;
        editingEvolucaoId = id;
        btnAddEvolucao.innerText = 'Salvar Alteração';
    };

    window.deleteEvolucao = async (id) => {
        if(!confirm("Apagar evolução?")) return;
        const res = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            const result = await res.json();
            currentEvolucoes = result.prontuario.evolucoes;
            renderEvolucoes();
        }
    };

    // Salvar Tudo
    if(btnSalvarTudo) {
        btnSalvarTudo.addEventListener('click', async (e) => {
            e.preventDefault();
            const payload = {
                nomePaciente: nomePacienteInput.value, rg: rgPacienteInput.value, idade: idadeInput.value,
                mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
                patologias: patologiasInput.value, exames: examesInput.value,
                comorbidades: { temComorbidade: radioComorbidadeSim.checked, lista: Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value), outras: inputOutrasComorbidades.value },
                alergias: { temAlergia: radioAlergiaSim.checked, quais: inputAlergiasQuais.value },
                medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, termoAceite: true
            };
            await fetch(API_ADMIN_BASE + pacienteId, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            alert('Salvo!');
        });
    }

    function toggleComorbidades() { if(listaComorbidades) listaComorbidades.style.display = radioComorbidadeSim.checked ? 'block' : 'none'; }
    function toggleAlergiaInput() { if(inputAlergiasQuais) inputAlergiasQuais.style.display = radioAlergiaSim.checked ? 'block' : 'none'; }

    const fetchProntuario = async () => {
        const res = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        populateForm(data);
    };

    fetchProntuario();
});

window.toggleEvolucao = (id) => document.getElementById(`body-${id}`)?.classList.toggle('aberto');
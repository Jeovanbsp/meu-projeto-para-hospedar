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

    // --- SELETORES GERAIS (Sincronizados com Perfil Paciente) ---
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); 
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

    // --- SELETORES MÉDICOS E MEDICAÇÕES ---
    const nomeMedicoInput = document.getElementById('nome-medico');
    const telefoneMedicoInput = document.getElementById('telefone-medico');
    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    
    const nomeMedicacaoInput = document.getElementById('nome-medicacao');
    const qtdMedicacaoInput = document.getElementById('qtd-medicacao');
    const horarioEspecificoInput = document.getElementById('horario-especifico'); 
    const checkboxesHorarios = document.querySelectorAll('input[name="horario"]');
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const btnToggleMedForm = document.getElementById('btn-toggle-med-form');
    const formAddMedicacao = document.getElementById('form-add-medicacao');

    // --- SELETORES EVOLUÇÃO (Exclusivo Admin) ---
    const tituloEvolucaoInput = document.getElementById('titulo-evolucao');
    const textoEvolucaoInput = document.getElementById('texto-evolucao');
    const btnAddEvolucao = document.getElementById('btn-add-evolucao');
    const listaEvolucoesDiv = document.getElementById('lista-evolucoes');

    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
    const tituloEdicao = document.getElementById('titulo-edicao');
    const badgeTermo = document.getElementById('badge-termo-status');

    let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let editingEvolucaoId = null;
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    // --- FUNÇÃO DE CARREGAMENTO (IGUAL AO PACIENTE + EVOLUÇÕES) ---
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

    // --- RENDERIZAÇÕES ---
    const renderMedicosList = () => {
        listaMedicosPills.innerHTML = '';
        currentMedicos.forEach((m, i) => {
            listaMedicosPills.innerHTML += `<li class="pill-medico"><span>${m}</span><button class="btn-deletar-medico" data-index="${i}">✕</button></li>`;
        });
    };
    
    const renderTabelaMedicacoes = () => { 
        listaMedicacoesBody.innerHTML = ''; 
        if (currentMedicacoes.length === 0) {
            listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Vazio</td></tr>';
            return;
        }
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

    const renderEvolucoes = () => {
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

    // --- LÓGICA DE EVOLUÇÃO (CRUD) ---
    if(btnAddEvolucao) {
        btnAddEvolucao.addEventListener('click', async () => {
            const titulo = tituloEvolucaoInput.value.trim();
            const texto = textoEvolucaoInput.value.trim();
            if(!titulo || !texto) return alert("Preencha título e texto");

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
        tituloEvolucaoInput.focus();
    };

    window.deleteEvolucao = async (id) => {
        if(!confirm("Deseja apagar esta evolução?")) return;
        const res = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(res.ok) {
            const result = await res.json();
            currentEvolucoes = result.prontuario.evolucoes;
            renderEvolucoes();
        }
    };

    // --- EVENTOS DE ADIÇÃO (MÉDICOS/MEDICAÇÕES) ---
    document.getElementById('form-add-medico')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const texto = `${nomeMedicoInput.value} ${telefoneMedicoInput.value ? '('+telefoneMedicoInput.value+')' : ''}`;
        currentMedicos.push(texto); renderMedicosList();
        nomeMedicoInput.value = ''; telefoneMedicoInput.value = '';
    });

    document.getElementById('form-add-medicacao')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const horarios = {}; checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked);
        currentMedicacoes.push({ nome: nomeMedicacaoInput.value, quantidade: qtdMedicacaoInput.value, horarioEspecifico: horarioEspecificoInput.value, horarios });
        renderTabelaMedicacoes(); formAddMedicacao.style.display = 'none';
        document.getElementById('form-add-medicacao').reset();
    });

    // --- SALVAR TUDO ---
    btnSalvarTudo?.addEventListener('click', async (e) => {
        e.preventDefault();
        btnSalvarTudo.innerText = 'Salvando...';
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
        alert('Salvo com sucesso!');
        btnSalvarTudo.innerText = 'Salvar Edição';
    });

    // Toggles
    function toggleComorbidades() { if(listaComorbidades) listaComorbidades.style.display = radioComorbidadeSim.checked ? 'block' : 'none'; }
    function toggleAlergiaInput() { if(inputAlergiasQuais) inputAlergiasQuais.style.display = radioAlergiaSim.checked ? 'block' : 'none'; }
    [radioComorbidadeSim, radioComorbidadeNao].forEach(r => r?.addEventListener('change', toggleComorbidades));
    [radioAlergiaSim, radioAlergiaNao].forEach(r => r?.addEventListener('change', toggleAlergiaInput));

    const fetchProntuario = async () => {
        const res = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        tituloEdicao.innerText = `Editando: ${data.nomePaciente || 'Paciente'}`;
        populateForm(data);
    };

    fetchProntuario();
});

window.toggleEvolucao = (id) => document.getElementById(`body-${id}`)?.classList.toggle('aberto');
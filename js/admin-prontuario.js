document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
    
    const pacienteId = new URLSearchParams(window.location.search).get('id');

    if (!token || role !== 'admin' || !pacienteId) { 
        localStorage.clear(); 
        window.location.href = 'login.html'; 
        return; 
    }

    // SELETORES (Com verificação de existência)
    const nomePacienteInput = document.getElementById('nome-paciente');
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

    const nomeMedicoInput = document.getElementById('nome-medico');
    const telefoneMedicoInput = document.getElementById('telefone-medico');
    const nomeMedicacaoInput = document.getElementById('nome-medicacao');
    const qtdMedicacaoInput = document.getElementById('qtd-medicacao');
    const horarioEspecificoInput = document.getElementById('horario-especifico'); 
    const checkboxesHorarios = document.querySelectorAll('input[name="horario"]');
    const btnToggleMedForm = document.getElementById('btn-toggle-med-form');
    const formAddMedicacao = document.getElementById('form-add-medicacao');
    
    const tituloEvolucaoInput = document.getElementById('titulo-evolucao');
    const textoEvolucaoInput = document.getElementById('texto-evolucao');
    const btnAddEvolucao = document.getElementById('btn-add-evolucao');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin'); 
    const badgeTermo = document.getElementById('badge-termo-status');

    // BOTÕES OPCIONAIS (Os que estão dando erro)
    const btnDownloadPDF = document.getElementById('btn-download-pdf');
    const btnGerarQRCode = document.getElementById('btn-gerar-qrcode');

    let currentMedicacoes = []; let currentMedicos = []; let currentEvolucoes = []; let editingEvolucaoId = null; let currentTermoAceite = false; 
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    const populateForm = (data) => {
        if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || '';
        if(idadeInput) idadeInput.value = data.idade || '';
        if(patologiasInput) patologiasInput.value = data.patologias || '';
        if(examesInput) examesInput.value = data.exames || '';

        if (data.mobilidade && radiosMobilidade) {
            radiosMobilidade.forEach(r => { if(r.value === data.mobilidade) r.checked = true; });
        }

        const comorb = data.comorbidades || {};
        if (radioComorbidadeSim && radioComorbidadeNao) {
            if (comorb.temComorbidade) {
                radioComorbidadeSim.checked = true;
                if(inputOutrasComorbidades) inputOutrasComorbidades.value = comorb.outras || '';
                if (comorb.lista && checkboxesComorbidades) {
                    checkboxesComorbidades.forEach(cb => { cb.checked = comorb.lista.includes(cb.value); });
                }
            } else {
                radioComorbidadeNao.checked = true;
            }
            toggleComorbidades();
        }

        const alerg = data.alergias || {};
        if (radioAlergiaSim && radioAlergiaNao) {
            if (alerg.temAlergia) {
                radioAlergiaSim.checked = true;
                if(inputAlergiasQuais) inputAlergiasQuais.value = alerg.quais || '';
            } else {
                radioAlergiaNao.checked = true;
            }
            toggleAlergiaInput();
        }

        currentTermoAceite = data.termoAceite || false;
        if (badgeTermo) {
            badgeTermo.innerText = currentTermoAceite ? "✅ TERMO ACEITO" : "❌ NÃO ACEITO";
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
            const display = radioAlergiaSim.checked ? 'block' : 'none';
            inputAlergiasQuais.style.display = display;
            if(sinalizadorAlergia) sinalizadorAlergia.style.display = radioAlergiaSim.checked ? 'flex' : 'none';
        }
    }

    const fetchProntuario = async () => {
        try {
            const response = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Erro API');
            const data = await response.json();
            populateForm(data);
        } catch (error) { console.error(error); }
    };

    const renderMedicosList = () => { 
        if(!listaMedicosPills) return;
        listaMedicosPills.innerHTML = ''; 
        currentMedicos.forEach((m, i) => { 
            listaMedicosPills.innerHTML += `<li class="pill-medico"><span>${m}</span><button class="btn-deletar-medico" data-index="${i}">✕</button></li>`; 
        }); 
    };
    
    const renderTabelaMedicacoes = () => { 
        if(!listaMedicacoesBody) return;
        listaMedicacoesBody.innerHTML = ''; 
        if (currentMedicacoes.length === 0) { 
            listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Nenhuma medicação.</td></tr>'; 
            return; 
        } 
        currentMedicacoes.forEach((med) => { 
            let turnosHtml = ''; 
            if (med.horarios) {
                for (const [key, value] of Object.entries(med.horarios)) { 
                    if (value === true && mapTurnos[key]) { turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; } 
                } 
            }
            const row = `<tr><td>${med.nome}</td><td>${med.quantidade || '-'}</td><td>${turnosHtml || '-'}</td><td>${med.horarioEspecifico || '--:--'}</td><td style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td></tr>`; 
            listaMedicacoesBody.insertAdjacentHTML('beforeend', row); 
        }); 
    };

    const renderEvolucoes = () => {
        if(!listaEvolucoesDiv) return;
        listaEvolucoesDiv.innerHTML = '';
        const list = [...currentEvolucoes].sort((a, b) => new Date(b.data) - new Date(a.data));
        list.forEach(evo => {
            const d = new Date(evo.data);
            const dataStr = d.toLocaleDateString('pt-BR') + ' ' + d.getHours() + ':' + d.getMinutes().toString().padStart(2, '0');
            const html = `
                <div class="evolucao-item">
                    <div class="evo-header" onclick="toggleEvolucao('${evo._id}')">
                        <div class="evo-left"><span>${dataStr}</span><strong>${evo.titulo}</strong></div>
                        <div class="evo-btns" onclick="event.stopPropagation()">
                            <button class="btn-mini edit" onclick="startEditEvolucao('${evo._id}')">✎</button>
                            <button class="btn-mini delete" onclick="deleteEvolucao('${evo._id}')">✕</button>
                        </div>
                    </div>
                    <div class="evo-body" id="body-${evo._id}"><p>${evo.texto.replace(/\n/g, '<br>')}</p></div>
                </div>`;
            listaEvolucoesDiv.insertAdjacentHTML('beforeend', html);
        });
    };

    // EVENT LISTENERS COM PROTEÇÃO (VERIFICA SE O ELEMENTO EXISTE)
    if(btnSalvarTudo) btnSalvarTudo.addEventListener('click', async (e) => {
        e.preventDefault();
        btnSalvarTudo.innerText = 'Salvando...';
        const mob = document.querySelector('input[name="mobilidade"]:checked')?.value || '';
        const cList = Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value);
        try {
            await fetch(API_ADMIN_BASE + pacienteId, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    nomePaciente: nomePacienteInput.value, idade: idadeInput.value, mobilidade: mob,
                    patologias: patologiasInput.value, exames: examesInput.value,
                    comorbidades: { temComorbidade: radioComorbidadeSim.checked, lista: cList, outras: inputOutrasComorbidades.value },
                    alergias: { temAlergia: radioAlergiaSim.checked, quais: inputAlergiasQuais.value },
                    medicosAssistentes: currentMedicos, medicacoes: currentMedicacoes, termoAceite: currentTermoAceite
                })
            });
            alert('Salvo!');
        } catch (e) { console.error(e); }
        btnSalvarTudo.innerText = 'Salvar Edição';
    });

    // Proteção para os botões que causaram o erro na linha 243
    if(btnDownloadPDF) btnDownloadPDF.addEventListener('click', () => window.print());
    if(btnGerarQRCode) btnGerarQRCode.addEventListener('click', () => alert('Funcionalidade em desenvolvimento para Admin'));

    // Toggles de visual
    if(radioAlergiaSim) radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
    if(radioAlergiaNao) radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
    if(radioComorbidadeSim) radioComorbidadeSim.addEventListener('change', toggleComorbidades);
    if(radioComorbidadeNao) radioComorbidadeNao.addEventListener('change', toggleComorbidades);

    fetchProntuario();
});

// Funções globais necessárias para o onclick do HTML
window.toggleEvolucao = (id) => {
    const body = document.getElementById(`body-${id}`);
    if(body) body.classList.toggle('aberto');
};
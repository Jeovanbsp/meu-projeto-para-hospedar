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

    // SELETORES
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
    const btnMinimizarComorbidades = document.getElementById('btn-minimizar-comorbidades');

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
    const tituloEdicao = document.getElementById('titulo-edicao');
    const badgeTermo = document.getElementById('badge-termo-status');

    let currentMedicacoes = []; 
    let currentMedicos = []; 
    let currentEvolucoes = []; 
    let editingEvolucaoId = null; 
    let currentTermoAceite = false; 
    
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    // FUNÇÃO QUE PREENCHE O FORMULÁRIO COM DADOS DO BANCO
    const populateForm = (data) => {
        nomePacienteInput.value = data.nomePaciente || '';
        idadeInput.value = data.idade || '';
        patologiasInput.value = data.patologias || '';
        examesInput.value = data.exames || '';

        if (data.mobilidade) {
            radiosMobilidade.forEach(r => { if(r.value === data.mobilidade) r.checked = true; });
        }

        // Comorbidades
        const comorb = data.comorbidades || {};
        if (comorb.temComorbidade) {
            radioComorbidadeSim.checked = true;
            inputOutrasComorbidades.value = comorb.outras || '';
            if (comorb.lista) {
                checkboxesComorbidades.forEach(cb => { 
                    cb.checked = comorb.lista.includes(cb.value); 
                });
            }
        } else {
            radioComorbidadeNao.checked = true;
        }
        toggleComorbidades();

        // Alergias
        const alerg = data.alergias || {};
        if (alerg.temAlergia) {
            radioAlergiaSim.checked = true;
            inputAlergiasQuais.value = alerg.quais || '';
        } else {
            radioAlergiaNao.checked = true;
        }
        toggleAlergiaInput();

        // CORREÇÃO DO ERRO: No Admin usamos apenas o Badge, não o Checkbox
        currentTermoAceite = data.termoAceite || false;
        if (badgeTermo) {
            badgeTermo.innerText = currentTermoAceite ? "✅ TERMO ACEITO" : "❌ NÃO ACEITO";
            badgeTermo.className = currentTermoAceite ? "badge-termo aceito" : "badge-termo pendente";
        }

        // Alimenta as listas globais para as tabelas aparecerem
        currentMedicacoes = data.medicacoes || [];
        currentMedicos = data.medicosAssistentes || [];
        currentEvolucoes = data.evolucoes || [];

        renderTabelaMedicacoes();
        renderMedicosList();
        renderEvolucoes();
    };

    // FUNÇÕES DE UI (Toggle/Expandir)
    function toggleComorbidades() { 
        if (radioComorbidadeSim.checked) { 
            listaComorbidades.style.display = 'block'; 
        } else { 
            listaComorbidades.style.display = 'none'; 
        } 
    }

    function toggleAlergiaInput() { 
        if (radioAlergiaSim.checked) { 
            inputAlergiasQuais.style.display = 'block'; 
            if(sinalizadorAlergia) sinalizadorAlergia.style.display = 'flex'; 
        } else { 
            inputAlergiasQuais.style.display = 'none'; 
            if(sinalizadorAlergia) sinalizadorAlergia.style.display = 'none'; 
        } 
    }

    // BUSCA OS DADOS NO SERVIDOR
    const fetchProntuario = async () => {
        try {
            const response = await fetch(API_ADMIN_BASE + pacienteId, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!response.ok) throw new Error('Erro API');
            const data = await response.json();
            
            if (tituloEdicao) tituloEdicao.innerText = `Editando: ${data.nomePaciente || 'Paciente'}`;
            populateForm(data);
        } catch (error) { 
            console.error(error); 
            alert("Erro ao carregar dados do paciente."); 
        }
    };

    // RENDERIZAÇÃO DE TABELAS
    const renderMedicosList = () => { 
        listaMedicosPills.innerHTML = ''; 
        currentMedicos.forEach((m, i) => { 
            listaMedicosPills.innerHTML += `<li class="pill-medico"><span>${m}</span><button class="btn-deletar-medico" data-index="${i}">✕</button></li>`; 
        }); 
    };
    
    const renderTabelaMedicacoes = () => { 
        listaMedicacoesBody.innerHTML = ''; 
        if (currentMedicacoes.length === 0) { 
            listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">Nenhuma medicação.</td></tr>'; 
            return; 
        } 
        
        currentMedicacoes.forEach((med) => { 
            let turnosHtml = ''; 
            if (med.horarios) {
                for (const [key, value] of Object.entries(med.horarios)) { 
                    if (value === true && mapTurnos[key]) { 
                        turnosHtml += `<span class="pill-turno">${mapTurnos[key]}</span>`; 
                    } 
                } 
            }
            const row = `<tr>
                <td>${med.nome}</td>
                <td>${med.quantidade || '-'}</td>
                <td>${turnosHtml || '-'}</td>
                <td>${med.horarioEspecifico || '--:--'}</td>
                <td style="text-align:center;"><button class="btn-deletar-medacao" data-nome="${med.nome}">✕</button></td>
            </tr>`; 
            listaMedicacoesBody.insertAdjacentHTML('beforeend', row); 
        }); 
    };

    const renderEvolucoes = () => {
        listaEvolucoesDiv.innerHTML = '';
        if (currentEvolucoes.length === 0) { 
            listaEvolucoesDiv.innerHTML = '<p style="text-align:center; color:#ccc;">Nenhuma evolução registrada.</p>'; 
            return; 
        }
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

    // AÇÕES GLOBAIS (SALVAR TUDO)
    const handleSalvarTudo = async (e) => {
        e.preventDefault(); 
        btnSalvarTudo.innerText = 'Salvando...';
        
        const mob = document.querySelector('input[name="mobilidade"]:checked')?.value || '';
        const cList = Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value);
        
        try {
            const res = await fetch(API_ADMIN_BASE + pacienteId, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    nomePaciente: nomePacienteInput.value, 
                    idade: idadeInput.value, 
                    mobilidade: mob,
                    patologias: patologiasInput.value, 
                    exames: examesInput.value,
                    comorbidades: { temComorbidade: radioComorbidadeSim.checked, lista: cList, outras: inputOutrasComorbidades.value },
                    alergias: { temAlergia: radioAlergiaSim.checked, quais: inputAlergiasQuais.value },
                    medicosAssistentes: currentMedicos, 
                    medicacoes: currentMedicacoes, 
                    termoAceite: currentTermoAceite
                })
            });
            if(res.ok) alert('Prontuário salvo com sucesso!');
        } catch (e) { alert('Erro ao salvar.'); }
        btnSalvarTudo.innerText = 'Salvar Edição do Paciente';
    };

    // Eventos de formulário
    document.getElementById('form-add-medico').addEventListener('submit', (e) => {
        e.preventDefault();
        const texto = `${nomeMedicoInput.value} (${telefoneMedicoInput.value})`;
        currentMedicos.push(texto);
        renderMedicosList();
        nomeMedicoInput.value = ''; telefoneMedicoInput.value = '';
    });

    listaMedicosPills.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-deletar-medico')) {
            currentMedicos.splice(e.target.dataset.index, 1);
            renderMedicosList();
        }
    });

    document.getElementById('form-add-medicacao').addEventListener('submit', (e) => {
        e.preventDefault();
        const horarios = {};
        checkboxesHorarios.forEach(cb => horarios[cb.value] = cb.checked);
        currentMedicacoes.push({
            nome: nomeMedicacaoInput.value,
            quantidade: qtdMedicacaoInput.value,
            horarioEspecifico: horarioEspecificoInput.value,
            horarios: horarios
        });
        renderTabelaMedicacoes();
        formAddMedicacao.style.display = 'none';
        document.getElementById('form-add-medicacao').reset();
    });

    listaMedicacoesBody.addEventListener('click', (e) => {
        if(e.target.classList.contains('btn-deletar-medacao')) {
            currentMedicacoes = currentMedicacoes.filter(m => m.nome !== e.target.dataset.nome);
            renderTabelaMedicacoes();
        }
    });

    // Evoluções - Funções de Apoio
    window.toggleEvolucao = (id) => {
        document.getElementById(`body-${id}`).classList.toggle('aberto');
    };

    window.startEditEvolucao = (id) => {
        const evo = currentEvolucoes.find(e => e._id === id);
        tituloEvolucaoInput.value = evo.titulo;
        textoEvolucaoInput.value = evo.texto;
        editingEvolucaoId = id;
        btnAddEvolucao.innerText = 'Salvar Alteração';
    };

    window.deleteEvolucao = async (id) => {
        if(!confirm('Excluir evolução?')) return;
        const res = await fetch(`${API_ADMIN_BASE}${pacienteId}/evolucao/${id}`, { 
            method: 'DELETE', headers: {'Authorization': `Bearer ${token}`} 
        });
        if(res.ok) { fetchProntuario(); }
    };

    if (btnAddEvolucao) btnAddEvolucao.addEventListener('click', async () => {
        const url = `${API_ADMIN_BASE}${pacienteId}/evolucao${editingEvolucaoId ? '/' + editingEvolucaoId : ''}`;
        const method = editingEvolucaoId ? 'PUT' : 'POST';
        
        await fetch(url, {
            method,
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ titulo: tituloEvolucaoInput.value, texto: textoEvolucaoInput.value })
        });
        tituloEvolucaoInput.value = ''; textoEvolucaoInput.value = '';
        editingEvolucaoId = null;
        btnAddEvolucao.innerText = '+ Registrar Evolução';
        fetchProntuario();
    });

    btnSalvarTudo.addEventListener('click', handleSalvarTudo);
    radioAlergiaNao.addEventListener('change', toggleAlergiaInput);
    radioAlergiaSim.addEventListener('change', toggleAlergiaInput);
    radioComorbidadeNao.addEventListener('change', toggleComorbidades);
    radioComorbidadeSim.addEventListener('change', toggleComorbidades);

    fetchProntuario();
});
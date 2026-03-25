document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Configuração da URL da API
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
    const pacienteId = new URLSearchParams(window.location.search).get('id');

    // Proteção de rota e verificação de permissão
    if (!token || role !== 'admin' || !pacienteId) { 
        window.location.href = 'login.html'; 
        return; 
    }

    // Seletores de Elementos
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); 
    const idadeInput = document.getElementById('idade');
    const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
    const patologiasInput = document.getElementById('patologias');
    const examesInput = document.getElementById('exames');
    
    const radioComorbidadeSim = document.querySelector('input[name="temComorbidade"][value="sim"]');
    const radioComorbidadeNao = document.querySelector('input[name="temComorbidade"][value="nao"]');
    const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
    const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');

    const radioAlergiaSim = document.querySelector('input[name="temAlergia"][value="sim"]');
    const radioAlergiaNao = document.querySelector('input[name="temAlergia"][value="nao"]');
    const inputAlergiasQuais = document.getElementById('alergias-quais');

    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const badgeTermo = document.getElementById('badge-termo-status');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin');

    let currentMedicacoes = []; 
    let currentMedicos = []; 
    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };

    // --- FUNÇÕES DE RENDERIZAÇÃO ---
    const renderTabelaMedicacoes = () => {
        if (!listaMedicacoesBody) return;
        listaMedicacoesBody.innerHTML = '';
        if (currentMedicacoes.length === 0) {
            listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ccc;">Sem medicações registadas</td></tr>';
            return;
        }
        currentMedicacoes.forEach((med) => {
            let turnosHtml = '';
            if (med.horarios) {
                Object.entries(med.horarios).forEach(([key, val]) => {
                    if (val && mapTurnos[key]) turnosHtml += `<span class="pill-turno" style="background:#e0f5ef; padding:2px 6px; border-radius:4px; font-size:10px; margin-right:4px;">${mapTurnos[key]}</span>`;
                });
            }
            listaMedicacoesBody.insertAdjacentHTML('beforeend', `
                <tr>
                    <td style="font-weight:600;">${med.nome}</td>
                    <td>${med.quantidade || '-'}</td>
                    <td>${turnosHtml || '-'}</td>
                    <td>${med.horarioEspecifico || '--:--'}</td>
                    <td style="text-align:center;"><button class="btn-excluir" style="width:30px; height:30px;" onclick="removerMedicacao('${med.nome}')">✕</button></td>
                </tr>`);
        });
    };

    const renderMedicosList = () => {
        if (!listaMedicosPills) return;
        listaMedicosPills.innerHTML = '';
        if (currentMedicos.length === 0) {
            listaMedicosPills.innerHTML = '<li style="color:#ccc; padding:10px;">Nenhum médico assistente.</li>';
            return;
        }
        currentMedicos.forEach((m, i) => {
            listaMedicosPills.innerHTML += `<li class="pill-medico" style="list-style:none; background:#f4f6f8; padding:8px; border-radius:8px; margin-bottom:5px; display:flex; justify-content:space-between;"><span>${m}</span><button onclick="removerMedico(${i})" style="border:none; background:none; color:red; cursor:pointer;">✕</button></li>`;
        });
    };

    // --- POPULAR FORMULÁRIO (Espelhamento) ---
    const populateForm = (data) => {
        nomePacienteInput.value = data.nomePaciente || '';
        if (rgPacienteInput) rgPacienteInput.value = data.rg || ''; 
        idadeInput.value = data.idade || '';
        patologiasInput.value = data.patologias || '';
        examesInput.value = data.exames || '';

        // Mobilidade
        radiosMobilidade.forEach(r => { if (r.value === data.mobilidade) r.checked = true; });

        // Comorbidades
        const comorb = data.comorbidades || {};
        if (radioComorbidadeSim) {
            radioComorbidadeSim.checked = !!comorb.temComorbidade;
            radioComorbidadeNao.checked = !comorb.temComorbidade;
            if (inputOutrasComorbidades) inputOutrasComorbidades.value = comorb.outras || '';
            checkboxesComorbidades.forEach(cb => { 
                cb.checked = comorb.lista && comorb.lista.includes(cb.value); 
            });
        }

        // Alergias (Ajustado para espelhamento correto)
        const alerg = data.alergias || {};
        if (radioAlergiaSim) {
            const temAlergia = !!alerg.temAlergia;
            radioAlergiaSim.checked = temAlergia;
            radioAlergiaNao.checked = !temAlergia;
            if (inputAlergiasQuais) {
                inputAlergiasQuais.value = alerg.quais || '';
                inputAlergiasQuais.style.display = temAlergia ? 'block' : 'none';
            }
        }

        // Status do Termo
        if (badgeTermo) {
            badgeTermo.innerHTML = data.termoAceite ? '<i class="ph ph-check-circle"></i> Termo Aceito' : '<i class="ph ph-warning"></i> Pendente';
            badgeTermo.className = data.termoAceite ? "status-badge status-ok" : "status-badge status-pendente";
        }

        // Carregar listas globais
        currentMedicacoes = data.medicacoes || [];
        currentMedicos = data.medicosAssistentes || [];

        renderTabelaMedicacoes();
        renderMedicosList();
    };

    // --- SALVAR ALTERAÇÕES ---
    btnSalvarTudo?.addEventListener('click', async (e) => {
        e.preventDefault();
        btnSalvarTudo.innerHTML = '<i class="ph ph-spinner-gap ph-spin"></i> Salvando...';
        
        const payload = {
            nomePaciente: nomePacienteInput.value, 
            rg: rgPacienteInput ? rgPacienteInput.value : '', 
            idade: idadeInput.value,
            mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
            patologias: patologiasInput.value, 
            exames: examesInput.value,
            comorbidades: { 
                temComorbidade: radioComorbidadeSim.checked, 
                lista: Array.from(document.querySelectorAll('input[name="comorbidade_item"]:checked')).map(cb => cb.value), 
                outras: inputOutrasComorbidades.value 
            },
            alergias: { 
                temAlergia: radioAlergiaSim.checked, 
                quais: inputAlergiasQuais.value 
            },
            medicosAssistentes: currentMedicos, 
            medicacoes: currentMedicacoes, 
            termoAceite: true
        };

        try {
            const res = await fetch(API_ADMIN_BASE + pacienteId, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            if(res.ok) alert('Prontuário atualizado com sucesso!');
        } catch (err) { console.error(err); }
        btnSalvarTudo.innerHTML = '<i class="ph ph-floppy-disk"></i> Salvar Edição do Paciente';
    });

    // Funções globais de remoção
    window.removerMedicacao = (nome) => {
        currentMedicacoes = currentMedicacoes.filter(m => m.nome !== nome);
        renderTabelaMedicacoes();
    };

    window.removerMedico = (index) => {
        currentMedicos.splice(index, 1);
        renderMedicosList();
    };

    // Inicialização
    const fetchProntuario = async () => {
        try {
            const res = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            populateForm(data);
        } catch (err) { console.error("Erro ao carregar:", err); }
    };

    fetchProntuario();
});
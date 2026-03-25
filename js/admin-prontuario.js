document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_ADMIN_BASE = isLocal ? 'http://localhost:3001/api/admin/prontuario/' : 'https://aishageriatria.onrender.com/api/admin/prontuario/';
    const pacienteId = new URLSearchParams(window.location.search).get('id');

    if (!token || role !== 'admin' || !pacienteId) { window.location.href = 'login.html'; return; }

    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); 
    const idadeInput = document.getElementById('idade');
    const patologiasInput = document.getElementById('patologias');
    const examesInput = document.getElementById('exames');
    const inputAlergiasQuais = document.getElementById('alergias-quais');
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo-admin');

    let currentMedicacoes = []; 
    let currentMedicos = []; 

    const renderTabelaMedicacoes = () => {
        if(!listaMedicacoesBody) return;
        listaMedicacoesBody.innerHTML = currentMedicacoes.length > 0 
            ? currentMedicacoes.map(med => `<tr><td>${med.nome}</td><td>${med.quantidade || '-'}</td><td>${med.horarioEspecifico || '--:--'}</td></tr>`).join('')
            : '<tr><td colspan="3" style="text-align:center; color:#ccc;">Vazio</td></tr>';
    };

    const renderMedicosList = () => {
        if(!listaMedicosPills) return;
        listaMedicosPills.innerHTML = currentMedicos.length > 0
            ? currentMedicos.map(m => `<li class="pill-medico"><span>${m}</span></li>`).join('')
            : '<li style="color:#ccc;">Nenhum médico assistente.</li>';
    };

    const populateForm = (data) => {
        nomePacienteInput.value = data.nomePaciente || '';
        if (rgPacienteInput) rgPacienteInput.value = data.rg || ''; 
        idadeInput.value = data.idade || '';
        patologiasInput.value = data.patologias || '';
        examesInput.value = data.exames || '';
        
        // CORREÇÃO: Espelhamento de Alergias para o Admin
        const alerg = data.alergias || {};
        const radioSim = document.querySelector('input[name="temAlergia"][value="sim"]');
        const radioNao = document.querySelector('input[name="temAlergia"][value="nao"]');
        
        if (alerg.temAlergia) {
            if(radioSim) radioSim.checked = true;
            if(inputAlergiasQuais) { inputAlergiasQuais.value = alerg.quais || ''; inputAlergiasQuais.style.display = 'block'; }
        } else {
            if(radioNao) radioNao.checked = true;
        }

        currentMedicacoes = data.medicacoes || [];
        currentMedicos = data.medicosAssistentes || [];
        renderTabelaMedicacoes();
        renderMedicosList();
    };

    const fetchProntuario = async () => {
        try {
            const res = await fetch(API_ADMIN_BASE + pacienteId, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            populateForm(data);
        } catch (err) { console.error("Erro ao carregar prontuário."); }
    };

    btnSalvarTudo?.addEventListener('click', async (e) => {
        e.preventDefault();
        const payload = {
            nomePaciente: nomePacienteInput.value, 
            rg: rgPacienteInput.value, 
            idade: idadeInput.value,
            patologias: patologiasInput.value,
            exames: examesInput.value,
            alergias: { 
                temAlergia: document.querySelector('input[name="temAlergia"][value="sim"]')?.checked || false, 
                quais: inputAlergiasQuais.value 
            },
            medicosAssistentes: currentMedicos, 
            medicacoes: currentMedicacoes, 
            termoAceite: true
        };
        await fetch(API_ADMIN_BASE + pacienteId, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
            body: JSON.stringify(payload) 
        });
        alert('Prontuário salvo e espelhado!');
    });

    fetchProntuario();
});
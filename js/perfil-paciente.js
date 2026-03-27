// Arquivo: /js/perfil-paciente.js (Versão Final Atualizada)

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
    const API_URL = `${API_ADMIN_BASE}/api/prontuario`;

    if (!token) { window.location.href = 'login.html'; return; }

    // Elementos
    const checkTermoAceite = document.getElementById('check-termo-aceite');
    const conteudoProntuario = document.getElementById('conteudo-prontuario');
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); 
    const idadeInput = document.getElementById('idade');
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
    const mensagemRetorno = document.getElementById('mensagem-retorno');
    
    let currentMedicacoes = []; 

    // --- RENDERIZAÇÃO COM ORDENAÇÃO AUTOMÁTICA 24H ---
    const renderTabelaMedicacoes = () => { 
        listaMedicacoesBody.innerHTML = ''; 
        if (currentMedicacoes.length === 0) {
            listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ccc; padding: 20px;">Nenhuma medicação adicionada</td></tr>';
            return;
        }

        // Ordenação Cronológica Automática
        currentMedicacoes.sort((a, b) => a.horarioEspecifico.localeCompare(b.horarioEspecifico));

        currentMedicacoes.forEach((med, index) => { 
            const row = `
                <tr>
                    <td style="font-weight: 600;">${med.nome}</td>
                    <td style="text-align: center;">${med.quantidade || '0'}</td>
                    <td class="col-hora-destaque"><i class="ph ph-clock"></i> ${med.horarioEspecifico}</td>
                    <td>${med.turno ? `<span class="turno-badge-tabela">${med.turno}</span>` : '-'}</td>
                    <td class="no-print" style="text-align: center;">
                        <button type="button" onclick="removerMedicacao(${index})" style="background: none; border: none; color: #ef5350; cursor: pointer; font-size: 1.2rem;">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                </tr>`; 
            listaMedicacoesBody.insertAdjacentHTML('beforeend', row); 
        }); 
    };

    // --- EVENTOS ---
    window.abrirModalTermo = () => {
        document.getElementById('termo-nome-paciente').innerText = nomePacienteInput.value || userName || 'Paciente';
        document.getElementById('termo-rg-paciente').innerText = rgPacienteInput.value || 'Não informado';
        document.getElementById('modal-termo').style.display = 'flex';
    };

    window.fecharModalTermo = () => { document.getElementById('modal-termo').style.display = 'none'; };

    window.aceitarTermo = () => {
        checkTermoAceite.checked = true;
        conteudoProntuario.style.display = 'block';
        window.fecharModalTermo();
    };

    window.removerMedicacao = (index) => { currentMedicacoes.splice(index, 1); renderTabelaMedicacoes(); };

    document.getElementById('form-add-medicacao')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-medicacao').value;
        const qtd = document.getElementById('qtd-medicacao').value;
        const hora = document.getElementById('horario-especifico').value;
        const turno = document.getElementById('turno-medicacao').value;

        if(!nome || !hora) return;

        currentMedicacoes.push({ nome, quantidade: qtd, horarioEspecifico: hora, turno });
        renderTabelaMedicacoes();
        e.target.reset();
        document.getElementById('qtd-medicacao').value = "1";
    });

    const fetchProntuario = async () => {
        try {
            const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            currentMedicacoes = data.medicacoes || [];
            if(data.termoAceite) {
                checkTermoAceite.checked = true;
                conteudoProntuario.style.display = 'block';
            }
            populateForm(data); 
            renderTabelaMedicacoes();
        } catch (error) { console.error('Erro ao buscar:', error); }
    };

    const populateForm = (data) => {
        nomePacienteInput.value = data.nomePaciente || userName || '';
        rgPacienteInput.value = data.rg || '';
        idadeInput.value = data.idade || '';
    };

    btnSalvarTudo?.addEventListener('click', async () => {
        const payload = {
            nomePaciente: nomePacienteInput.value,
            rg: rgPacienteInput.value,
            idade: idadeInput.value,
            medicacoes: currentMedicacoes,
            termoAceite: true
        };
        try {
            const res = await fetch(API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify(payload) 
            });
            if(res.ok) alert('Salvo com sucesso!');
        } catch (err) { console.error(err); }
    });

    fetchProntuario();
});
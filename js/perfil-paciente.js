// Arquivo: /js/perfil-paciente.js (Versão Final Organizada com QR e Botões de Link Oculto)

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const userName = localStorage.getItem('userName');
    const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
    const API_URL = `${API_ADMIN_BASE}/api/prontuario`;

    if (!token) { window.location.href = 'login.html'; return; }

    // --- BOTÃO DE SAIR (LOGOUT) ---
    document.getElementById('btn-logout-paciente')?.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        window.location.href = 'index.html';
    });

    // Elementos da Interface
    const checkTermoAceite = document.getElementById('check-termo-aceite');
    const conteudoProntuario = document.getElementById('conteudo-prontuario');
    const nomePacienteInput = document.getElementById('nome-paciente');
    const rgPacienteInput = document.getElementById('rg-paciente'); 
    const idadeInput = document.getElementById('idade');
    const radiosMobilidade = document.querySelectorAll('input[name="mobilidade"]');
    const patologiasInput = document.getElementById('patologias');
    const examesInput = document.getElementById('exames');
    
    const radioComorbidadeSim = document.querySelector('input[name="temComorbidade"][value="sim"]');
    const listaComorbidades = document.getElementById('lista-comorbidades');
    const inputOutrasComorbidades = document.getElementById('comorbidades-outras');
    const checkboxesComorbidades = document.querySelectorAll('input[name="comorbidade_item"]');

    // Elementos Alergia
    const radioAlergiaSim = document.querySelector('input[name="temAlergia"][value="sim"]');
    const containerAddAlergia = document.getElementById('container-add-alergia');
    const inputNovaAlergia = document.getElementById('input-nova-alergia');
    const btnAddAlergia = document.getElementById('btn-add-alergia');
    const listaAlergiasPills = document.getElementById('lista-alergias-pills');

    const listaMedicosPills = document.getElementById('lista-medicos-pills');
    const listaMedicacoesBody = document.getElementById('lista-medicacoes-body');
    const btnSalvarTudo = document.getElementById('btn-salvar-tudo');
    const mensagemRetorno = document.getElementById('mensagem-retorno');
    
    let currentMedicacoes = []; 
    let currentMedicos = []; 
    let currentAlergias = []; 

    // --- RENDERIZAÇÃO DE ALERGIAS ---
    const renderAlergiasList = () => {
        listaAlergiasPills.innerHTML = '';
        currentAlergias.forEach((alergia, index) => {
            const li = document.createElement('li');
            li.className = 'pill-alergia';
            li.innerHTML = `
                <i class="ph-fill ph-warning-circle alergia-icone-pisca"></i>
                <span style="line-height: 1;">${alergia}</span>
                <button type="button" class="btn-remover-alergia no-print" onclick="removerAlergia(${index})">
                    <i class="ph ph-x"></i>
                </button>
            `;
            listaAlergiasPills.appendChild(li);
        });
    };

    window.removerAlergia = (index) => { 
        currentAlergias.splice(index, 1); 
        renderAlergiasList(); 
    };

    btnAddAlergia?.addEventListener('click', () => {
        const val = inputNovaAlergia.value.trim();
        if(val) {
            currentAlergias.push(val);
            renderAlergiasList();
            inputNovaAlergia.value = '';
        }
    });

    inputNovaAlergia?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnAddAlergia.click();
        }
    });

    document.querySelectorAll('input[name="temAlergia"]').forEach(r => r.addEventListener('change', (e) => {
        containerAddAlergia.style.display = e.target.value === 'sim' ? 'block' : 'none';
    }));


    // --- RENDERIZAÇÃO DOS MÉDICOS ---
    const renderMedicosList = () => { 
        listaMedicosPills.innerHTML = ''; 
        currentMedicos.forEach((medico, index) => { 
            if (typeof medico === 'string') {
                const li = `
                <li class="pill-medico">
                    <div class="medico-dados">
                        <strong class="medico-nome-crm">${medico}</strong>
                    </div>
                    <button type="button" class="btn-remover-medico no-print" onclick="removerMedico(${index})"><i class="ph ph-trash"></i></button>
                </li>`;
                listaMedicosPills.insertAdjacentHTML('beforeend', li);
                return;
            }

            const telLimpo = medico.telefone ? medico.telefone.replace(/\D/g, '') : '';
            const temContato = telLimpo.length >= 8;

            const pill = `
                <li class="pill-medico">
                    <div class="medico-dados">
                        <div class="medico-nome-crm">
                            <i class="ph ph-user"></i> ${medico.nome}
                            ${medico.crm ? `<span class="medico-crm-tag">(CRM: ${medico.crm})</span>` : ''}
                        </div>
                        ${medico.especialidade ? `
                            <div class="medico-especialidade">
                                <i class="ph ph-stethoscope"></i> ${medico.especialidade}
                            </div>
                        ` : ''}
                        
                        ${medico.telefone ? `
                            <div class="medico-telefone-texto">
                                <i class="ph ph-phone"></i> ${medico.telefone}
                            </div>
                        ` : ''}
                        
                        ${temContato ? `
                            <div class="medico-acoes-contato no-print">
                                <a href="https://wa.me/55${telLimpo}" target="_blank" class="btn-contato btn-whatsapp">
                                    <i class="ph-fill ph-whatsapp-logo"></i> WhatsApp
                                </a>
                                <a href="tel:${telLimpo}" class="btn-contato btn-ligar">
                                    <i class="ph-fill ph-phone"></i> Ligar
                                </a>
                            </div>
                        ` : ''}
                    </div>
                    <button type="button" class="btn-remover-medico no-print" onclick="removerMedico(${index})">
                        <i class="ph ph-trash"></i>
                    </button>
                </li>
            `; 
            listaMedicosPills.insertAdjacentHTML('beforeend', pill); 
        }); 
    };

    // --- RENDERIZAÇÃO DA TABELA DE MEDICAÇÕES ---
    const renderTabelaMedicacoes = () => { 
        listaMedicacoesBody.innerHTML = ''; 
        
        if (currentMedicacoes.length === 0) {
            listaMedicacoesBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#ccc; padding: 20px;">Nenhuma medicação adicionada</td></tr>';
            return;
        }

        currentMedicacoes.sort((a, b) => a.horarioEspecifico.localeCompare(b.horarioEspecifico));

        currentMedicacoes.forEach((med, index) => { 
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="font-weight: 600; vertical-align: middle;">${med.nome}</td>
                <td style="text-align: center; vertical-align: middle;">${med.quantidade || '-'}</td>
                <td style="text-align: center; color: #2ADCA1; font-weight: bold; vertical-align: middle;"><i class="ph ph-clock"></i> ${med.horarioEspecifico}</td>
                <td style="vertical-align: middle;">${med.turno ? `<span class="turno-badge-tabela">${med.turno}</span>` : '-'}</td>
                <td class="no-print" style="text-align: center; width: 60px; vertical-align: middle;">
                    <button type="button" class="btn-remover-linha" onclick="removerMedicacao(${index})">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            `; 
            listaMedicacoesBody.appendChild(row); 
        }); 
    };

    // --- EXPOSIÇÃO GLOBAL ---
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

    window.removerMedico = (index) => { currentMedicos.splice(index, 1); renderMedicosList(); };
    window.removerMedicacao = (index) => { currentMedicacoes.splice(index, 1); renderTabelaMedicacoes(); };

    // --- EVENTOS DE FORMULÁRIO ---
    document.getElementById('form-add-medico')?.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const medicoObj = {
            nome: document.getElementById('nome-medico').value,
            crm: document.getElementById('crm-medico').value,
            especialidade: document.getElementById('especialidade-medico').value,
            telefone: document.getElementById('telefone-medico').value
        };

        if(!medicoObj.nome) return;

        currentMedicos.push(medicoObj);
        renderMedicosList();
        e.target.reset();
    });

    document.getElementById('form-add-medicacao')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-medicacao').value;
        const qtd = document.getElementById('qtd-medicacao').value;
        const hora = document.getElementById('horario-especifico').value;
        const turno = document.getElementById('turno-medicacao').value;

        if(!nome || !hora) return;

        currentMedicacoes.push({ 
            nome: nome, 
            quantidade: qtd, 
            horarioEspecifico: hora,
            turno: turno
        });

        renderTabelaMedicacoes();
        e.target.reset();
    });

    // --- GERADOR DE QR CODE E BOTÕES DE LINK ---
    const btnGerarQrcode = document.getElementById('btn-gerar-qrcode');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const linkContainer = document.getElementById('link-container');
    const btnAcessoRapido = document.getElementById('btn-acesso-rapido');
    const btnCopiar = document.getElementById('btn-copiar-link');

    btnGerarQrcode?.addEventListener('click', () => {
        qrcodeContainer.innerHTML = ''; 
        
        const baseUrl = window.location.origin; 
        const idPaciente = userName || 'desconhecido'; 
        const linkProntuario = `${baseUrl}/prontuario-publico.html?paciente=${encodeURIComponent(idPaciente)}`;

        try {
            new QRCode(qrcodeContainer, {
                text: linkProntuario,
                width: 200,
                height: 200,
                colorDark : "#2c3e50",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.L
            });
            qrcodeContainer.style.display = 'block';
            
            // Exibir os botões de link
            if (btnAcessoRapido && linkContainer) {
                btnAcessoRapido.href = linkProntuario; // O botão abrirá o link correto
                btnCopiar.dataset.link = linkProntuario; // Salva o link no botão de copiar
                linkContainer.style.display = 'block';
            }
            
        } catch(e) {
            console.error("Erro no QR Code:", e);
            qrcodeContainer.innerHTML = '<p style="color:red; font-size:0.9rem; font-weight:bold;">Erro ao gerar o QR Code.</p>';
            qrcodeContainer.style.display = 'block';
        }
    });

    // Função de Copiar Link via botão
    btnCopiar?.addEventListener('click', () => {
        const link = btnCopiar.dataset.link;
        if (!link) return;
        
        navigator.clipboard.writeText(link).then(() => {
            const icone = btnCopiar.querySelector('i');
            const textoOriginal = btnCopiar.innerHTML;
            
            // Feedback visual rápido
            btnCopiar.innerHTML = '<i class="ph-fill ph-check-circle" style="color: #2ADCA1; font-size: 1.1rem;"></i> Copiado!';
            
            setTimeout(() => {
                btnCopiar.innerHTML = textoOriginal;
            }, 2000);
        }).catch(err => {
            console.error('Erro ao copiar', err);
        });
    });

    // --- BOTÃO DE PDF ---
    document.getElementById('btn-download-pdf')?.addEventListener('click', () => {
        window.print(); 
    });

    // --- LÓGICA DE DADOS ---
    const fetchProntuario = async () => {
        try {
            const response = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await response.json();
            currentMedicacoes = data.medicacoes || [];
            currentMedicos = data.medicosAssistentes || [];
            
            if(data.termoAceite) {
                checkTermoAceite.checked = true;
                conteudoProntuario.style.display = 'block';
            }
            
            populateForm(data); 
            renderTabelaMedicacoes();
            renderMedicosList();
        } catch (error) { console.error('Erro ao buscar prontuário:', error); }
    };

    const populateForm = (data) => {
        if(nomePacienteInput) nomePacienteInput.value = data.nomePaciente || userName || '';
        if(rgPacienteInput) rgPacienteInput.value = data.rg || '';
        if(idadeInput) idadeInput.value = data.idade || '';
        if(patologiasInput) patologiasInput.value = data.patologias || '';
        if(examesInput) examesInput.value = data.exames || '';
        
        radiosMobilidade.forEach(radio => { if (radio.value === data.mobilidade) radio.checked = true; });

        if (data.comorbidades?.temComorbidade) {
            radioComorbidadeSim.checked = true;
            listaComorbidades.style.display = 'block';
            if(document.getElementById('comorbidades-outras')) {
                document.getElementById('comorbidades-outras').value = data.comorbidades.outras || '';
            }
            checkboxesComorbidades.forEach(cb => { if (data.comorbidades.lista?.includes(cb.value)) cb.checked = true; });
        }

        if (data.alergias?.temAlergia) {
            radioAlergiaSim.checked = true;
            containerAddAlergia.style.display = 'block';
            if (data.alergias.quais) {
                currentAlergias = data.alergias.quais.split(',').map(a => a.trim()).filter(Boolean);
            }
            renderAlergiasList();
        }
    };

    btnSalvarTudo?.addEventListener('click', async (e) => {
        e.preventDefault();
        const payload = {
            nomePaciente: nomePacienteInput.value,
            rg: rgPacienteInput.value,
            idade: idadeInput.value,
            mobilidade: document.querySelector('input[name="mobilidade"]:checked')?.value || '',
            patologias: patologiasInput.value,
            exames: examesInput.value,
            comorbidades: {
                temComorbidade: radioComorbidadeSim.checked,
                lista: Array.from(checkboxesComorbidades).filter(c => c.checked).map(c => c.value),
                outras: document.getElementById('comorbidades-outras') ? document.getElementById('comorbidades-outras').value : ''
            },
            alergias: { 
                temAlergia: radioAlergiaSim.checked, 
                quais: radioAlergiaSim.checked ? currentAlergias.join(', ') : '' 
            },
            medicosAssistentes: currentMedicos,
            medicacoes: currentMedicacoes,
            termoAceite: true
        };

        try {
            const res = await fetch(API_URL, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
                body: JSON.stringify(payload) 
            });
            if(res.ok) { 
                mensagemRetorno.innerText = 'Prontuário Salvo com Sucesso!'; 
                mensagemRetorno.style.color = '#2ADCA1'; 
            }
        } catch (err) { console.error(err); }
    });

    document.querySelectorAll('input[name="temComorbidade"]').forEach(r => r.addEventListener('change', (e) => {
        listaComorbidades.style.display = e.target.value === 'sim' ? 'block' : 'none';
    }));

    fetchProntuario();
});
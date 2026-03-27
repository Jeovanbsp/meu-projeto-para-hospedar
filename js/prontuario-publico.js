// Arquivo: /js/prontuario-publico.js

document.addEventListener('DOMContentLoaded', async () => {
    // Detecta URL automaticamente (Localhost ou Render)
    const API_BASE = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://aishageriatria.onrender.com';
    
    // Captura o ID do paciente da URL (ex: ?paciente=NOME_OU_ID)
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('paciente') || urlParams.get('id');

    const loadingDiv = document.getElementById('loading');
    const erroDiv = document.getElementById('erro-msg');
    const conteudoDiv = document.getElementById('conteudo-prontuario');

    if (!userId) {
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (erroDiv) {
            erroDiv.innerHTML = '<i class="ph-fill ph-warning-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i> Nenhum identificador de paciente fornecido na URL.';
            erroDiv.style.display = 'block';
        }
        return;
    }

    try {
        // Busca os dados na rota pública do backend
        const response = await fetch(`${API_BASE}/api/prontuario/publico/${encodeURIComponent(userId)}`);
        
        if (!response.ok) {
            throw new Error('Prontuário não encontrado ou inativo.');
        }

        const data = await response.json();
        if (loadingDiv) loadingDiv.style.display = 'none';
        
        // --- 1. IDENTIFICAÇÃO ---
        document.getElementById('pub-nome').innerText = data.nomePaciente || 'Não informado';
        document.getElementById('pub-idade').innerText = data.idade ? `${data.idade} anos` : 'Não informada';
        document.getElementById('pub-rg').innerText = data.rg || 'Não informado';
        document.getElementById('pub-mobilidade').innerText = data.mobilidade || 'Não declarada';

        // --- 2. ALERGIAS (CRÍTICO) ---
        if (data.alergias && data.alergias.temAlergia === true && data.alergias.quais) {
            document.getElementById('secao-alergias').style.display = 'block';
            const alergiasArray = data.alergias.quais.split(',').map(a => a.trim()).filter(Boolean);
            const containerAlergias = document.getElementById('pub-alergias');
            
            alergiasArray.forEach(alergia => {
                containerAlergias.innerHTML += `<div class="alerta-alergia-emergencia"><i class="ph-fill ph-warning"></i> ${alergia}</div>`;
            });
        }

        // --- 3. COMORBIDADES ---
        if (data.comorbidades && data.comorbidades.temComorbidade === true) {
            let temDado = false;
            
            if (data.comorbidades.lista && data.comorbidades.lista.length > 0) {
                document.getElementById('secao-comorbidades').style.display = 'block';
                const containerComorbidades = document.getElementById('pub-comorbidades');
                data.comorbidades.lista.forEach(comorbidade => {
                    containerComorbidades.innerHTML += `<span class="tag-item"><i class="ph-fill ph-check-circle"></i> ${comorbidade}</span>`;
                });
                temDado = true;
            }

            if (data.comorbidades.outras && data.comorbidades.outras.trim() !== '') {
                document.getElementById('secao-comorbidades').style.display = 'block';
                document.getElementById('pub-comorbidades-outras').style.display = 'block';
                document.getElementById('txt-comorbidades-outras').innerText = data.comorbidades.outras;
                temDado = true;
            }
        }

        // --- 4. PATOLOGIAS E EXAMES ---
        if (data.patologias && data.patologias.trim() !== '') {
            document.getElementById('secao-patologias').style.display = 'block';
            document.getElementById('pub-patologias').innerText = data.patologias;
        }

        if (data.exames && data.exames.trim() !== '') {
            document.getElementById('secao-exames').style.display = 'block';
            document.getElementById('pub-exames').innerText = data.exames;
        }

        // --- 5. MEDICAÇÕES ---
        const tbodyMed = document.getElementById('pub-medicacoes-body');
        if (data.medicacoes && data.medicacoes.length > 0) {
            // Ordena por horário para facilitar a leitura do socorrista
            const medsOrdenadas = data.medicacoes.sort((a, b) => (a.horarioEspecifico || '').localeCompare(b.horarioEspecifico || ''));
            
            medsOrdenadas.forEach(med => {
                let horarioTxt = '';
                if (med.horarioEspecifico) horarioTxt += `<strong><i class="ph ph-clock"></i> ${med.horarioEspecifico}</strong> `;
                if (med.turno) horarioTxt += `<span class="turno-badge">${med.turno}</span>`;
                if (!horarioTxt) horarioTxt = '<span style="color:#aaa;">Uso contínuo/S.N.</span>';

                tbodyMed.innerHTML += `
                    <tr>
                        <td style="font-weight: 700; color: #2c3e50;">${med.nome}</td>
                        <td>${med.quantidade || 'Não especificado'}</td>
                        <td>${horarioTxt}</td>
                    </tr>
                `;
            });
        } else {
            tbodyMed.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #888; padding: 30px;"><i class="ph ph-info"></i> Nenhuma medicação em uso registrada.</td></tr>';
        }

        // --- 6. MÉDICOS ASSISTENTES ---
        if (data.medicosAssistentes && data.medicosAssistentes.length > 0) {
            document.getElementById('secao-medicos').style.display = 'block';
            const listaMedicos = document.getElementById('pub-medicos-lista');
            
            data.medicosAssistentes.forEach(medico => {
                // Compatibilidade: se for string antiga salva no banco
                if (typeof medico === 'string') {
                    listaMedicos.innerHTML += `
                        <div class="medico-card">
                            <div class="medico-info"><strong><i class="ph-fill ph-user"></i> ${medico}</strong></div>
                        </div>`;
                    return;
                }

                // Novo formato Objeto
                const telLimpo = medico.telefone ? medico.telefone.replace(/\D/g, '') : '';
                const btnWhats = telLimpo ? `<a href="https://wa.me/55${telLimpo}" target="_blank" class="btn-whatsapp"><i class="ph-fill ph-whatsapp-logo"></i> WhatsApp</a>` : '';
                const btnLigar = telLimpo ? `<a href="tel:${telLimpo}" class="btn-ligar"><i class="ph-fill ph-phone"></i> Ligar</a>` : '';

                listaMedicos.innerHTML += `
                    <div class="medico-card">
                        <div class="medico-info">
                            <strong><i class="ph-fill ph-user"></i> ${medico.nome} ${medico.crm ? `<span style="display:inline;font-size:0.85em;color:#888;font-weight:normal;">(CRM: ${medico.crm})</span>` : ''}</strong>
                            ${medico.especialidade ? `<span><i class="ph-fill ph-stethoscope" style="color:#2ADCA1;"></i> ${medico.especialidade}</span>` : ''}
                            ${medico.telefone ? `<span><i class="ph-fill ph-phone"></i> ${medico.telefone}</span>` : ''}
                        </div>
                        ${(btnWhats || btnLigar) ? `<div class="medico-contato">${btnWhats}${btnLigar}</div>` : ''}
                    </div>
                `;
            });
        }

        // Exibir o conteúdo final com animação
        if (conteudoDiv) conteudoDiv.style.display = 'block';

    } catch (error) {
        console.error(error);
        if (loadingDiv) loadingDiv.style.display = 'none';
        if (erroDiv) {
            erroDiv.innerHTML = '<i class="ph-fill ph-warning-circle" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i> Prontuário não encontrado, inativo ou link incorreto.';
            erroDiv.style.display = 'block';
        }
    }
});
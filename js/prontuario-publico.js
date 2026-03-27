    // Arquivo: /js/prontuario-publico.js

    document.addEventListener('DOMContentLoaded', async () => {
        // Detecta URL automaticamente (Localhost ou Render)
        const API_BASE = (window.location.hostname === 'localhost' || window.location.protocol === 'file:') 
            ? 'http://localhost:3001' 
            : 'https://aishageriatria.onrender.com';
        
        // Captura o ID do paciente da URL (ex: ?id=12345)
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');

        const loadingDiv = document.getElementById('loading');
        const erroDiv = document.getElementById('erro-msg');
        const conteudoDiv = document.getElementById('conteudo-prontuario');

        if (!userId) {
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (erroDiv) {
                erroDiv.innerHTML = '<i class="ph ph-x-circle"></i> Nenhum código de paciente fornecido.';
                erroDiv.style.display = 'block';
            }
            return;
        }

        try {
            // Busca os dados na rota pública do backend
            const response = await fetch(`${API_BASE}/api/prontuario/publico/${userId}`);
            
            if (!response.ok) {
                throw new Error('Prontuário não encontrado.');
            }

            const data = await response.json();
            if (loadingDiv) loadingDiv.style.display = 'none';
            
            // --- PREENCHER DADOS PESSOAIS ---
            const elNome = document.getElementById('pub-nome');
            const elIdade = document.getElementById('pub-idade');
            const elRG = document.getElementById('pub-rg');
            const elMob = document.getElementById('pub-mobilidade');

            if(elNome) elNome.innerText = data.nomePaciente || 'Não informado';
            if(elIdade) elIdade.innerText = data.idade ? `${data.idade} anos` : 'Não informada';
            if(elRG) elRG.innerText = data.rg || 'Não informado';
            if(elMob) elMob.innerText = data.mobilidade || 'Não informada';

            // --- ALERGIAS (Crítico) ---
            if (data.alergias && data.alergias.temAlergia === true) {
                const alertaAlergia = document.getElementById('alerta-alergia');
                const pubAlergias = document.getElementById('pub-alergias');
                if (alertaAlergia) alertaAlergia.style.display = 'block';
                if (pubAlergias) pubAlergias.innerHTML = `<i class="ph ph-warning-octagon"></i> ${data.alergias.quais || 'Não especificadas.'}`;
            }

            // --- MEDICAÇÕES ---
            const tbodyMed = document.getElementById('pub-medicacoes-body');
            if (tbodyMed) {
                if (data.medicacoes && data.medicacoes.length > 0) {
                    const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };
                    
                    tbodyMed.innerHTML = ''; // Limpa o loader
                    data.medicacoes.forEach(med => {
                        let turnosText = [];
                        // Ícone de relógio do Phosphor para horário específico
                        if (med.horarioEspecifico) turnosText.push(`<i class="ph ph-clock"></i> ${med.horarioEspecifico}`);
                        
                        if(med.horarios) {
                            for (const [key, value] of Object.entries(med.horarios)) {
                                if (value) turnosText.push(`<span class="pill-med">${mapTurnos[key]}</span>`);
                            }
                        }
                        
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td style="font-weight: 600; color: #2c3e50;">${med.nome}</td>
                            <td>${med.quantidade || '-'}</td>
                            <td>${turnosText.join(' ') || '-'}</td>
                        `;
                        tbodyMed.appendChild(tr);
                    });
                } else {
                    tbodyMed.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #888; padding: 20px;">Nenhuma medicação registrada.</td></tr>';
                }
            }

            // --- MÉDICOS ASSISTENTES ---
            const ulMedicos = document.getElementById('pub-medicos');
            if (ulMedicos) {
                ulMedicos.innerHTML = '';
                if (data.medicosAssistentes && data.medicosAssistentes.length > 0) {
                    data.medicosAssistentes.forEach(medico => {
                        const li = document.createElement('li');
                        li.className = 'pill-medico-publico'; // Estilizado via CSS
                        li.innerHTML = `<i class="ph ph-stethoscope"></i> ${medico}`;
                        ulMedicos.appendChild(li);
                    });
                } else {
                    ulMedicos.innerHTML = '<li style="color: #888; list-style: none;"><i class="ph ph-info"></i> Nenhum médico assistente registrado.</li>';
                }
            }

            // Exibir o conteúdo final
            if (conteudoDiv) conteudoDiv.style.display = 'block';

        } catch (error) {
            console.error(error);
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (erroDiv) {
                erroDiv.innerHTML = '<i class="ph ph-warning-circle"></i> Prontuário não encontrado ou link inválido.';
                erroDiv.style.display = 'block';
            }
        }
    });
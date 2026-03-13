document.addEventListener('DOMContentLoaded', async () => {
    // Detecta URL automaticamente (Localhost ou Render)
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
    
    // Captura o ID do paciente da URL (ex: ?id=12345)
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    const loadingDiv = document.getElementById('loading');
    const erroDiv = document.getElementById('erro-msg');
    const conteudoDiv = document.getElementById('conteudo-prontuario');

    if (!userId) {
        loadingDiv.style.display = 'none';
        erroDiv.innerText = "Nenhum código de paciente fornecido no link.";
        erroDiv.style.display = 'block';
        return;
    }

    try {
        // Usa a rota pública (que deve existir no backend)
        const response = await fetch(`${API_BASE}/api/prontuario/publico/${userId}`);
        
        if (!response.ok) {
            throw new Error('Prontuário não encontrado.');
        }

        const data = await response.json();
        loadingDiv.style.display = 'none';
        
        // PREENCHER DADOS PESSOAIS
        document.getElementById('pub-nome').innerText = data.nomePaciente || 'Não informado';
        document.getElementById('pub-idade').innerText = data.idade ? `${data.idade} anos` : 'Não informada';
        document.getElementById('pub-rg').innerText = data.rg || 'Não informado';
        document.getElementById('pub-mobilidade').innerText = data.mobilidade || 'Não informada';

        // ALERGIAS (Crítico)
        if (data.alergias && data.alergias.temAlergia === true) {
            document.getElementById('alerta-alergia').style.display = 'block';
            document.getElementById('pub-alergias').innerText = data.alergias.quais || 'Não especificadas.';
        }

        // CLINICO
        if (data.patologias) document.getElementById('pub-patologias').innerText = data.patologias;
        if (data.exames) document.getElementById('pub-exames').innerText = data.exames;

        // COMORBIDADES
        if (data.comorbidades && data.comorbidades.temComorbidade) {
            let comorbText = [];
            if (data.comorbidades.lista && data.comorbidades.lista.length > 0) {
                comorbText.push(data.comorbidades.lista.join(', '));
            }
            if (data.comorbidades.outras) {
                comorbText.push(data.comorbidades.outras);
            }
            document.getElementById('pub-comorbidades').innerText = comorbText.join(' | ') || 'Não detalhadas.';
        } else {
            document.getElementById('pub-comorbidades').innerText = 'Nenhuma declarada.';
        }

        // MEDICAÇÕES
        const tbodyMed = document.getElementById('pub-medicacoes-body');
        if (data.medicacoes && data.medicacoes.length > 0) {
            const mapTurnos = { antes_cafe: 'Antes Café', depois_cafe: 'Depois Café', almoco: 'Almoço', tarde: 'Tarde', antes_jantar: 'Antes Jantar', antes_dormir: 'Antes Dormir' };
            
            data.medicacoes.forEach(med => {
                let turnosText = [];
                if (med.horarioEspecifico) turnosText.push(`🕒 ${med.horarioEspecifico}`);
                
                if(med.horarios) {
                    for (const [key, value] of Object.entries(med.horarios)) {
                        if (value) turnosText.push(`<span class="pill-med">${mapTurnos[key]}</span>`);
                    }
                }
                
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: 600;">${med.nome}</td>
                    <td>${med.quantidade || '-'}</td>
                    <td>${turnosText.join(' ') || '-'}</td>
                `;
                tbodyMed.appendChild(tr);
            });
        } else {
            tbodyMed.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #888;">Nenhuma medicação registada.</td></tr>';
        }

        // MÉDICOS
        const ulMedicos = document.getElementById('pub-medicos');
        if (data.medicosAssistentes && data.medicosAssistentes.length > 0) {
            data.medicosAssistentes.forEach(medico => {
                const li = document.createElement('li');
                li.style.padding = '10px 15px';
                li.style.backgroundColor = '#f9f9f9';
                li.style.border = '1px solid #eee';
                li.style.borderRadius = '6px';
                li.style.marginBottom = '8px';
                li.style.fontWeight = '500';
                li.innerText = medico;
                ulMedicos.appendChild(li);
            });
        } else {
            ulMedicos.innerHTML = '<li style="color: #888;">Nenhum médico assistente registado.</li>';
        }

        // Exibir o conteúdo final
        conteudoDiv.style.display = 'block';

    } catch (error) {
        console.error(error);
        loadingDiv.style.display = 'none';
        erroDiv.style.display = 'block';
    }
});
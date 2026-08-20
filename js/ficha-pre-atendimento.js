document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';

    const form = document.getElementById('form-ficha');
    const btnEnviar = document.getElementById('btn-enviar');
    const msgFeedback = document.getElementById('msg-feedback');

    // === CAMPOS CONDICIONAIS ("Caso sim, QUAIS?") ===
    document.querySelectorAll('input[type="radio"][data-detalhe]').forEach(radio => {
        radio.addEventListener('change', () => {
            // Esconde os detalhes do mesmo card e mostra o selecionado
            const card = radio.closest('.pergunta-card');
            card.querySelectorAll('.campo-detalhe').forEach(c => c.classList.remove('visivel'));
            const alvo = document.getElementById(radio.dataset.detalhe);
            if (alvo) alvo.classList.add('visivel');
        });
    });

    // === MÁSCARA DE CPF ===
    const cpfInput = document.getElementById('cpf');
    cpfInput.addEventListener('input', () => {
        let v = cpfInput.value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
        else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        cpfInput.value = v;
    });

    // === MONTAGEM DAS RESPOSTAS (perguntas + respostas legíveis) ===
    const PERGUNTAS = {
        motivoConsulta: 'Motivo da consulta',
        formacao: 'Formação Profissional / Escolaridade',
        moraSozinho: 'Mora sozinho(a)? Caso não, com quem?',
        religiao: 'Religião',
        atividadeFisica: 'Atividade física',
        hobbys: 'Hobbys',
        alergias: 'Alergias',
        comorbidades: 'Problemas de Saúde / Comorbidades',
        medicacoes: 'Medicações de uso contínuo',
        cirurgias: 'Cirurgias prévias',
        vacinaCovid: 'Já tomou a vacina de COVID? Quantas doses?',
        teveCovid: 'Já teve COVID? Quantas vezes? Precisou ficar internado?',
        vacinaGripe: 'Influenza (Gripe): última dose?',
        vacinaPneumococo: 'Vacina de Pneumococo?',
        vacinaTetano: 'Vacina de Dt (Tétano)?',
        vacinaHepB: 'Vacina de Hep. B?',
        pacienteMaisEsquecido: 'Paciente considera que está mais esquecido que o habitual?',
        familiarMaisEsquecido: 'Familiar considera que o paciente está mais esquecido que o normal?',
        maisEsquecido: 'Está mais esquecido que o habitual?',
        diagnosticoDemencia: 'Já tem diagnóstico prévio de demência?',
        andar: 'Capaz de andar',
        banho: 'É capaz de tomar banho só',
        trocarRoupa: 'Trocar de roupa',
        higienePessoal: 'Higiene pessoal (após uso do vaso)',
        fraldas: 'Uso de fraldas',
        talheres: 'Usar os talheres',
        sairSozinho: 'É capaz de sair sozinho de casa e voltar sem problemas?',
        usarTelefone: 'É capaz de usar o telefone/celular sem ajuda?',
        pagarContas: 'É capaz de pagar as próprias contas?',
        cozinhar: 'É capaz de cozinhar seguindo uma receita ou sem receita?',
        tomarMedicacoes: 'É capaz de tomar as medicações por conta própria?',
        observacoes: 'Algo a mais que queira acrescentar antes da consulta?'
    };

    // Detalhes vinculados a uma resposta "Sim/Outro" (campo de texto extra)
    const DETALHES = {
        motivoConsulta: 'motivoConsultaOutro',
        moraSozinho: 'moraSozinhoDetalhe',
        religiao: 'religiaoDetalhe',
        atividadeFisica: 'atividadeFisicaDetalhe',
        hobbys: 'hobbysDetalhe',
        alergias: 'alergiasDetalhe',
        comorbidades: 'comorbidadesDetalhe',
        vacinaCovid: 'vacinaCovidDetalhe',
        teveCovid: 'teveCovidDetalhe',
        vacinaGripe: 'vacinaGripeDetalhe',
        maisEsquecido: 'maisEsquecidoDetalhe',
        diagnosticoDemencia: 'diagnosticoDemenciaDetalhe'
    };

    // Condição para incluir o detalhe: valor que ativa o campo extra
    const ATIVA_DETALHE = {
        motivoConsulta: 'Outro',
        moraSozinho: 'Não'
    };

    function montarRespostas() {
        const respostas = [];

        Object.keys(PERGUNTAS).forEach(nome => {
            const pergunta = PERGUNTAS[nome];
            let resposta = '';

            const radioMarcado = form.querySelector(`input[name="${nome}"]:checked`);
            const campoTexto = form.querySelector(`[name="${nome}"]`);

            if (radioMarcado) {
                resposta = radioMarcado.value;
                const detalheNome = DETALHES[nome];
                if (detalheNome) {
                    const detalheValor = (form.querySelector(`[name="${detalheNome}"]`)?.value || '').trim();
                    const ativador = ATIVA_DETALHE[nome] || 'Sim';
                    if (resposta === ativador && detalheValor) {
                        resposta += ` — ${detalheValor}`;
                    }
                }
            } else if (campoTexto && campoTexto.value.trim()) {
                resposta = campoTexto.value.trim();
            }

            respostas.push({ pergunta, resposta });
        });

        return respostas;
    }

    // === ENVIO ===
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        msgFeedback.className = 'msg-feedback';
        msgFeedback.textContent = '';

        // Validação nativa (campos required)
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        if (!document.getElementById('lgpdAceite').checked) {
            mostrarMensagem('erro', 'É necessário aceitar o termo de privacidade (LGPD) para enviar a ficha.');
            return;
        }

        const payload = {
            nome: document.getElementById('nome').value.trim(),
            cpf: document.getElementById('cpf').value.trim(),
            dataNascimento: document.getElementById('dataNascimento').value.trim(),
            lgpdAceite: true,
            respostas: montarRespostas()
        };

        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<i class="ph ph-circle-notch"></i> Enviando...';

        try {
            const response = await fetch(`${API_BASE}/api/ficha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao enviar a ficha.');
            }

            form.style.display = 'none';
            document.querySelector('.ficha-intro').style.display = 'none';
            document.getElementById('tela-sucesso').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Erro ao enviar ficha:', error);
            mostrarMensagem('erro', error.message || 'Não foi possível enviar a ficha. Verifique sua conexão e tente novamente.');
            btnEnviar.disabled = false;
            btnEnviar.innerHTML = '<i class="ph ph-paper-plane-tilt"></i> Enviar Ficha';
        }
    });

    function mostrarMensagem(tipo, texto) {
        msgFeedback.className = `msg-feedback ${tipo}`;
        msgFeedback.textContent = texto;
        msgFeedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
});

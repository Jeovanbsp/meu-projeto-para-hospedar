// Wrapper global de fetch com timeout.
// O servidor do Render (plano gratuito) "dorme" sem uso e demora para acordar;
// sem limite de tempo, a página fica travada esperando a resposta.
window.fetchSeguro = function (url, options = {}, timeoutMs = 40000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return fetch(url, { ...options, signal: controller.signal })
        .catch(error => {
            if (error.name === 'AbortError') {
                throw new Error('O servidor demorou muito para responder. Aguarde alguns segundos e tente novamente.');
            }
            throw error;
        })
        .finally(() => clearTimeout(timer));
};

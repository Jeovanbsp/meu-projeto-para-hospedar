document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Pegando os valores dos inputs exatamente como estão no seu HTML
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');

    try {
        // Chamada para o seu servidor no Render
        const res = await fetch('https://aishageriatria.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }) // Enviando campos padrão
        });

        const data = await res.json();

        if (res.ok) {
            // Salva o token e o cargo (role) para o sistema saber quem logou
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);

            // Redirecionamento baseado no que você já tinha
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            // Se der erro 400, ele vai mostrar a mensagem real aqui
            msgErro.innerText = data.message || "Erro no login";
            msgErro.style.display = 'block';
        }
    } catch (err) {
        msgErro.innerText = "Erro de conexão com o servidor.";
        msgErro.style.display = 'block';
    }
});
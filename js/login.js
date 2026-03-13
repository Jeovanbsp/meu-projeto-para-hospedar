const API_BASE = 'https://aishageriatria.onrender.com';

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');
    
    msgErro.style.display = 'none';

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: senha })
        });

        const data = await res.json();

        if (res.ok) {
            // Guardar dados no localStorage conforme a nova estrutura
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);

            // Redirecionamento
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            msgErro.innerText = data.message || 'Erro ao entrar.';
            msgErro.style.display = 'block';
        }
    } catch (err) {
        msgErro.innerText = 'Servidor a ligar... Tente novamente.';
        msgErro.style.display = 'block';
    }
});
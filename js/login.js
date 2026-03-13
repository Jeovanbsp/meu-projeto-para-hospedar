const API_BASE = 'https://aishageriatria.onrender.com';

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');
    const btn = document.querySelector('.btn-entrar');

    msgErro.style.display = 'none';
    btn.innerText = 'A conectar...';

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: senha })
        });

        const data = await res.json();

        if (res.ok) {
            // Guardar os dados corretamente (o servidor envia dentro de data.user)
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);

            // Redirecionar
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            msgErro.innerText = data.message || 'Credenciais inválidas.';
            msgErro.style.display = 'block';
            btn.innerText = 'Entrar';
        }
    } catch (err) {
        console.error(err);
        msgErro.innerText = 'Erro de conexão. Verifique se o servidor está online.';
        msgErro.style.display = 'block';
        btn.innerText = 'Entrar';
    }
});
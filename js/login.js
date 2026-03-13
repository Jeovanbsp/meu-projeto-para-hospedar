const API_BASE = 'https://aishageriatria.onrender.com';

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');
    const btn = document.querySelector('.btn-entrar');

    msgErro.style.display = 'none';
    btn.innerText = 'Processando...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: senha })
        });

        const data = await res.json();

        if (res.ok) {
            // Salva no LocalStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);

            // Redireciona conforme o cargo
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            msgErro.innerText = data.message || 'Erro ao fazer login.';
            msgErro.style.display = 'block';
        }
    } catch (err) {
        msgErro.innerText = 'O servidor está ligando. Tente novamente em 20 segundos.';
        msgErro.style.display = 'block';
    } finally {
        btn.innerText = 'Entrar';
        btn.disabled = false;
    }
});
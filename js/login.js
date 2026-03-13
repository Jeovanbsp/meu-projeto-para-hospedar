const API_BASE = 'https://aishageriatria.onrender.com';

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');
    const btnEntrar = document.querySelector('.btn-entrar');

    msgErro.style.display = 'none';
    btnEntrar.innerText = 'A entrar...';
    btnEntrar.disabled = true;

    try {
        // Ajustado para incluir /api/ antes de /auth/login para coincidir com o index.js
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: senha })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);

            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            msgErro.innerText = data.message || 'Credenciais inválidas.';
            msgErro.style.display = 'block';
            btnEntrar.innerText = 'Entrar';
            btnEntrar.disabled = false;
        }
    } catch (err) {
        console.error(err);
        msgErro.innerText = 'Erro ao conectar ao servidor. Verifique se o backend está online.';
        msgErro.style.display = 'block';
        btnEntrar.innerText = 'Entrar';
        btnEntrar.disabled = false;
    }
});
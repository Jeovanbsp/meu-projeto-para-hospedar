// js/login.js
const API_BASE = 'https://aishageriatria.onrender.com';

document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');
    const btn = document.querySelector('.btn-entrar');
    
    msgErro.style.display = 'none';
    btn.innerText = 'Conectando...';

    try {
        // ADICIONADO O /api/ para bater com o seu index.js do backend
        const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, password: senha })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);
            
            // Redirecionamento baseado no role vindo do banco
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            msgErro.innerText = data.message || 'Erro ao entrar.';
            msgErro.style.display = 'block';
            btn.innerText = 'Entrar';
        }
    } catch (err) {
        console.error(err);
        msgErro.innerText = 'Servidor fora do ar ou acordando... Tente novamente em 30 segundos.';
        msgErro.style.display = 'block';
        btn.innerText = 'Entrar';
    }
});
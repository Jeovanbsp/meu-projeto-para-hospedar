document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');
    
    msgErro.style.display = 'none';

    try {
        const res = await fetch('https://aishageriatria.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: senha })
        });

        const data = await res.json();

        if (res.ok) {
            // Guarda os dados exatamente como o backend envia
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
            msgErro.innerText = data.message || 'Falha no login';
            msgErro.style.display = 'block';
        }
    } catch (err) {
        msgErro.innerText = 'Servidor em manutenção ou a iniciar...';
        msgErro.style.display = 'block';
    }
});
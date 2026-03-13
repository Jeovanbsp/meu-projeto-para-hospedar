document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');

    try {
        const res = await fetch('https://aishageriatria.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: senha })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            
            // Redireciona
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            msgErro.innerText = data.message;
            msgErro.style.display = 'block';
        }
    } catch (err) {
        msgErro.innerText = "Erro ao conectar. Tente novamente.";
        msgErro.style.display = 'block';
    }
});
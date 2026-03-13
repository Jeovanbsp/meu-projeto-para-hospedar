document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email').value;
    const senhaInput = document.getElementById('senha').value;
    const msgErro = document.getElementById('msg-erro');
    
    msgErro.style.display = 'none';

    try {
        const res = await fetch('https://aishageriatria.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: emailInput.toLowerCase().trim(), 
                password: senhaInput 
            })
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
            msgErro.innerText = data.message;
            msgErro.style.display = 'block';
        }
    } catch (err) {
        msgErro.innerText = 'Erro de conexão. Tente novamente.';
        msgErro.style.display = 'block';
    }
});
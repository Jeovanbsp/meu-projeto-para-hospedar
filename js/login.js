document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('senha').value;

    try {
        const response = await fetch('https://aishageriatria.onrender.com/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            window.location.href = data.user.role === 'admin' ? 'admin-dashboard.html' : 'perfil-paciente.html';
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Erro ao conectar com o servidor.");
    }
});
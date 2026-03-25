// Arquivo: /js/login.js

document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('senha').value;
      const msgErro = document.getElementById('msg-erro');
      const btnEntrar = e.submitter; // Pega o botão que disparou o envio

      const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';

      // Feedback visual de carregamento
      if (btnEntrar) {
        btnEntrar.disabled = true;
        btnEntrar.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Entrando...';
      }
      
      if (msgErro) msgErro.style.display = 'none';

      try {
        const res = await fetch(`${API_ADMIN_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Salva dados essenciais no LocalStorage
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.nome);

            // Redirecionamento baseado no cargo
            if (data.user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'perfil-paciente.html';
            }
        } else {
            if (msgErro) {
              msgErro.innerText = data.message || "E-mail ou senha incorretos.";
              msgErro.style.display = 'block';
            }
        }
      } catch (err) {
          if (msgErro) {
            msgErro.innerText = "Erro de conexão com o servidor.";
            msgErro.style.display = 'block';
          }
      } finally {
        if (btnEntrar) {
          btnEntrar.disabled = false;
          btnEntrar.innerHTML = 'Entrar <i class="ph ph-sign-in"></i>';
        }
      }
    });
  }
});
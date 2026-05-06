document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('senha').value;
      const msgErro = document.getElementById('msg-erro');
      const btnEntrar = e.submitter;
      if (btnEntrar) { btnEntrar.disabled = true; btnEntrar.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Entrando...'; }
      if (msgErro) msgErro.style.display = 'none';
      
      // Verificar Secretária local
      const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
      const secretaria = secretarias.find(s => s.usuario === email && s.senha === password);
      if (secretaria) { localStorage.setItem('usuarioLogado', JSON.stringify(secretaria)); window.location.href = 'agenda.html'; return; }

      // API externa
      const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
      try {
        const res = await fetch(`${API_ADMIN_BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userName', data.user.name);
            if (data.user.role === 'admin') { window.location.href = 'admin-dashboard.html'; } else { window.location.href = 'perfil-paciente.html'; }
        } else { if (msgErro) { msgErro.innerText = data.message || "E-mail ou senha incorretos."; msgErro.style.display = 'block'; } }
      } catch (err) { if (msgErro) { msgErro.innerText = "Erro de conexão."; msgErro.style.display = 'block'; } }
      finally { if (btnEntrar) { btnEntrar.disabled = false; btnEntrar.innerHTML = 'Entrar <i class="ph ph-sign-in"></i>'; } }
    });
  }
});

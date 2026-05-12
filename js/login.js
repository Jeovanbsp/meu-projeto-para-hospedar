document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('senha').value;
      const msgErro = document.getElementById('msg-erro');
      const btnEntrar = e.submitter;
      if (btnEntrar) { btnEntrar.disabled = true; btnEntrar.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Entrando...'; }
      if (msgErro) msgErro.style.display = 'none';
      
      const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
      
      // ========== SECRETARIA (LOCAL PRIMEIRO) ==========
      const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
      const secretariaLocal = secretarias.find(s => (s.email || '').toLowerCase().trim() === email && s.senha === password);
      if (secretariaLocal) { 
        localStorage.setItem('usuarioLogado', JSON.stringify(secretariaLocal));
        localStorage.setItem('userRole', 'secretary'); 
        localStorage.setItem('userName', secretariaLocal.nome);
        window.location.href = 'agenda.html'; 
        return; 
      }

      // ========== TENTAR API ==========
      try {
        const res = await fetch(`${API_ADMIN_BASE}/api/auth/login`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ email, password }) 
        });
        
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('userRole', data.user.role);
          localStorage.setItem('userName', data.user.name);
          
          if (data.user.role === 'admin') { 
            window.location.href = 'admin-dashboard.html'; 
          } else if (data.user.role === 'secretary') { 
            // Salvar no localStorage também para próximas vezes já que tem acesso via API
            const novaSecretaria = { id: Date.now(), nome: data.user.name, email, senha: password, role: 'secretary' };
            const existentes = JSON.parse(localStorage.getItem('secretarias') || '[]');
            if (!existentes.find(s => s.email === email)) {
              existentes.push(novaSecretaria);
              localStorage.setItem('secretarias', JSON.stringify(existentes));
            }
            window.location.href = 'agenda.html'; 
          } else { 
            window.location.href = 'perfil-paciente.html'; 
          }
          return;
        }
      } catch (err) { 
        console.error('Erro API:', err); 
      }
      
      // ========== SE NAO ACHOU ==========
      if (msgErro) { 
        msgErro.innerText = "E-mail ou senha incorretos."; 
        msgErro.style.display = 'block'; 
      }
      if (btnEntrar) { btnEntrar.disabled = false; btnEntrar.innerHTML = 'Entrar <i class="ph ph-sign-in"></i>'; }
    });
  }
});

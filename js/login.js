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
      
      // ========== TENTAR LOGIN API DIRETO ==========
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
          
          // Redirecionar conforme role
          if (data.user.role === 'admin') { 
            window.location.href = 'admin-dashboard.html'; 
            return;
          } else if (data.user.role === 'secretary') { 
            // Buscar dados da secretary
            const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
            let sec = secretarias.find(s => s.email === email);
            if (!sec) {
              sec = { id: Date.now(), nome: data.user.name, email, senha: password, role: 'secretary' };
              secretarias.push(sec);
              localStorage.setItem('secretarias', JSON.stringify(secretarias));
            }
            localStorage.setItem('usuarioLogado', JSON.stringify(sec));
            window.location.href = 'agenda.html'; 
            return;
          } else { 
            window.location.href = 'perfil-paciente.html'; 
            return;
          }
        }
      } catch (err) { 
        // API falhou, tentar local
      }
      
      // ========== SE API FALHOU, TENTAR LOCAL ==========
      const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
      const secretaria = secretarias.find(s => (s.email || '').toLowerCase().trim() === email && s.senha === password);
      if (secretaria) { 
        localStorage.setItem('usuarioLogado', JSON.stringify(secretaria));
        localStorage.setItem('userRole', 'secretary'); 
        localStorage.setItem('userName', secretaria.nome);
        window.location.href = 'agenda.html'; 
        return; 
      }

      // ========== SE NADA FUNCIONOU ==========
      if (msgErro) { 
        msgErro.innerText = "E-mail ou senha incorretos."; 
        msgErro.style.display = 'block'; 
      }
      if (btnEntrar) { btnEntrar.disabled = false; btnEntrar.innerHTML = 'Entrar <i class="ph ph-sign-in"></i>'; }
    });
  }
});

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
      
      // ========== PRIMEIRO: TENTAR LOCAL ==========
      let secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
      let secretaria = secretarias.find(s => (s.email || '').toLowerCase().trim() === email && s.senha === password);
      if (secretaria) { 
        localStorage.setItem('usuarioLogado', JSON.stringify(secretaria));
        localStorage.setItem('userRole', 'secretary'); 
        localStorage.setItem('userName', secretaria.nome);
        window.location.href = 'agenda.html'; 
        return; 
      }

      // ========== SEGUNDO: TENTAR API ==========
      let loginOk = false;
      let userRole = '';
      let userName = '';
      let token = '';
      
      try {
        const payload = { email, password };
        const res = await fetch(`${API_ADMIN_BASE}/api/auth/login`, { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ email, password }) 
        });
        
        if (res.ok) {
          const data = await res.json();
          token = data.token;
          userRole = data.user.role;
          userName = data.user.name;
          loginOk = true;
        }
      } catch (err) { 
        // API falhou
      }
      
      // ========== SE API FALHOU mas LOCAL TEM, LOGAR ASSIM MESMO ==========
      if (!loginOk && secretarias.length > 0) {
        let sec = secretarias.find(s => s.email.toLowerCase() === email);
        if (sec) {
          // Login local funciona mesmo se API falhar
          localStorage.setItem('usuarioLogado', JSON.stringify(sec));
          localStorage.setItem('userRole', 'secretary'); 
          localStorage.setItem('userName', sec.nome);
          window.location.href = 'agenda.html'; 
          return;
        }
      }
      
      // ========== SE LOGIN API OK ==========
      if (loginOk) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', userRole);
        localStorage.setItem('userName', userName);
        
        if (userRole === 'admin') { 
          window.location.href = 'admin-dashboard.html'; 
          return;
        } else if (userRole === 'secretary') { 
          // Adicionar na lista local se não existir
          let sec = secretarias.find(s => s.email.toLowerCase() === email);
          if (!sec) {
            sec = { id: Date.now(), nome: userName, email, senha: password, role: 'secretary' };
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
      
      // ========== SE NADA FUNCIONOU ==========
      if (msgErro) { 
        msgErro.innerText = "E-mail ou senha incorretos."; 
        msgErro.style.display = 'block'; 
      }
      if (btnEntrar) { btnEntrar.disabled = false; btnEntrar.innerHTML = 'Entrar <i class="ph ph-sign-in"></i>'; }
    });
  }
});

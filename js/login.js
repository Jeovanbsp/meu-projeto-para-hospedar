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
      
      // ========== SECRETARIA (LOCAL) ==========
      const secretarias = JSON.parse(localStorage.getItem('secretarias') || '[]');
      const secretaria = secretarias.find(s => (s.email || '').toLowerCase().trim() === email && s.senha === password);
      if (secretaria) { 
        localStorage.setItem('usuarioLogado', JSON.stringify(secretaria));
        localStorage.setItem('userRole', 'secretary'); 
        localStorage.setItem('userName', secretaria.nome);
        window.location.href = 'agenda.html'; 
        return; 
      }

      // ========== ADMIN (LOCAL) ==========
      const adminEmail = 'admin@aisha.com';
      const adminSenha = 'aisha123';
      if (email === adminEmail && password === adminSenha) {
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('userName', 'Admin Dra. Aisha');
        window.location.href = 'admin-dashboard.html';
        return;
      }

      // ========== SE NAO ACHOU LOCAL, MOSTRA ERRO ==========
      // NAO tenta API se nao Achou localmente
      if (msgErro) { 
        msgErro.innerText = "Secretária não encontrada. Cadastre no Dashboard."; 
        msgErro.style.display = 'block'; 
      }
      if (btnEntrar) { btnEntrar.disabled = false; btnEntrar.innerHTML = 'Entrar <i class="ph ph-sign-in"></i>'; }
    });
  }
});

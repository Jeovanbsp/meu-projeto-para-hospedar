// Arquivo: /js/login.js

document.addEventListener('DOMContentLoaded', () => {
  const formLogin = document.getElementById('form-login');
  if (!formLogin) {
    console.error("Erro no Login: Elemento 'form-login' não encontrado.");
    return;
  }

  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnLogin = document.getElementById('btn-login');
  const mensagemRetorno = document.getElementById('mensagem-retorno');

  // *** CORREÇÃO AQUI: Adicionado /auth/login ***
  const API_URL = 'https://aishageriatria.onrender.com/auth/login';

  formLogin.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    const email = emailInput.value;
    const senha = senhaInput.value;

    btnLogin.disabled = true;
    btnLogin.innerText = 'Entrando...';
    mensagemRetorno.innerText = ''; 

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, senha: senha })
      });

      const data = await response.json(); 

      if (response.ok) { 
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userName', data.userName);
        localStorage.setItem('userRole', data.role); 

        mensagemRetorno.innerText = data.message; 
        mensagemRetorno.style.color = '#2ADCA1'; 

        setTimeout(() => {
          if (data.role === 'admin') {
            window.location.href = 'admin-dashboard.html'; 
          } else {
            window.location.href = 'perfil-paciente.html'; 
          }
        }, 1000); 

      } else {
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#e74c3c'; 
        btnLogin.disabled = false;
        btnLogin.innerText = 'Entrar';
      }
    } catch (error) {
      console.error('Erro ao logar:', error);
      mensagemRetorno.innerText = 'Não foi possível conectar ao servidor. Verifique sua conexão.';
      mensagemRetorno.style.color = '#e74c3c';
      btnLogin.disabled = false;
      btnLogin.innerText = 'Entrar';
    }
  });
});
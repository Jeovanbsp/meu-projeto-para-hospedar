// Arquivo: /js/login.js (Completo e Corrigido para Redirecionamento Admin)

document.addEventListener('DOMContentLoaded', () => {

  const formLogin = document.getElementById('form-login');
  // Se o formLogin não for encontrado, o script para aqui.
  if (!formLogin) {
    console.error("Erro no Login: Elemento 'form-login' não encontrado.");
    return;
  }

  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnLogin = document.getElementById('btn-login');
  const mensagemRetorno = document.getElementById('mensagem-retorno');

  // Define a URL da nossa API
  const API_URL = 'https://aishageriatria.onrender.com';

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

      if (response.ok) { // Sucesso! (Status 200)
        
        // 1. Salva o token, nome e, crucialmente, o role (cargo)
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userName', data.userName);
        localStorage.setItem('userRole', data.role); 

        mensagemRetorno.innerText = data.message; 
        mensagemRetorno.style.color = '#2ADCA1'; 

        // 2. O GPS que redireciona baseado no cargo
        setTimeout(() => {
          if (data.role === 'admin') {
            window.location.href = 'admin-dashboard.html'; // MANDA ADMIN PARA O PAINEL
          } else {
            window.location.href = 'perfil-paciente.html'; // MANDA PACIENTE PARA O PERFIL
          }
        }, 1000); 

      } else {
        // Se a API retornou erro (ex: senha inválida)
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#e74c3c'; 
        btnLogin.disabled = false;
        btnLogin.innerText = 'Entrar';
      }

    } catch (error) {
      // Se a API estiver offline (Erro de rede)
      console.error('Erro ao logar:', error);
      mensagemRetorno.innerText = 'Não foi possível conectar ao servidor. Verifique se sua API está rodando (node index.js).';
      mensagemRetorno.style.color = '#e74c3c';
      btnLogin.disabled = false;
      btnLogin.innerText = 'Entrar';
    }
  });
});
// Arquivo: /js/cadastro.js

document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.getElementById('form-cadastro');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnCadastrar = document.getElementById('btn-cadastrar');
  const mensagemRetorno = document.getElementById('mensagem-retorno');

  const API_ADMIN_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://aishageriatria.onrender.com';
  
  // Rota de registro conforme a estrutura do seu backend
  const API_URL = `${API_ADMIN_BASE}/api/auth/register`; 
  
  if (formCadastro) {
    formCadastro.addEventListener('submit', async (event) => {
      event.preventDefault(); 
      
      const nome = nomeInput.value.trim();
      const email = emailInput.value.trim();
      const senha = senhaInput.value;

      // Feedback visual no botão usando os novos ícones
      btnCadastrar.disabled = true;
      btnCadastrar.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Cadastrando...';
      
      if (mensagemRetorno) {
        mensagemRetorno.innerText = '';
        mensagemRetorno.style.color = 'black';
      }

      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // Nota: Certifique-se que o backend espera 'senha' ou 'password'
          body: JSON.stringify({ nome, email, password: senha }) 
        });

        const data = await response.json();

        if (response.ok) {
          if (mensagemRetorno) {
            mensagemRetorno.innerText = data.message || "Cadastro realizado com sucesso!";
            mensagemRetorno.style.color = '#2ADCA1'; 
          }
          formCadastro.reset();
          setTimeout(() => {
            window.location.href = 'login.html'; 
          }, 2000);
        } else {
          if (mensagemRetorno) {
            mensagemRetorno.innerText = data.message || "Erro ao realizar cadastro.";
            mensagemRetorno.style.color = '#e74c3c'; 
          }
        }
      } catch (error) {
        console.error('Erro ao cadastrar:', error);
        if (mensagemRetorno) {
          mensagemRetorno.innerText = 'Não foi possível conectar ao servidor.';
          mensagemRetorno.style.color = '#e74c3c'; 
        }
      } finally {
        btnCadastrar.disabled = false;
        btnCadastrar.innerHTML = 'Criar Minha Conta <i class="ph ph-user-plus"></i>';
      }
    });
  }
});
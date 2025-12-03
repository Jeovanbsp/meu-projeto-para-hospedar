// Arquivo: /js/cadastro.js

document.addEventListener('DOMContentLoaded', () => {
  const formCadastro = document.getElementById('form-cadastro');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnCadastrar = document.getElementById('btn-cadastrar');
  const mensagemRetorno = document.getElementById('mensagem-retorno');

  // *** CORREÇÃO AQUI: Adicionado /auth/register ***
  const API_URL = 'https://aishageriatria.onrender.com/auth/register'; 
  
  formCadastro.addEventListener('submit', async (event) => {
    event.preventDefault(); 
    const nome = nomeInput.value;
    const email = emailInput.value;
    const senha = senhaInput.value;

    btnCadastrar.disabled = true;
    btnCadastrar.innerText = 'Cadastrando...';
    mensagemRetorno.innerText = '';
    mensagemRetorno.style.color = 'black';

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nome, email, senha })
      });

      const data = await response.json();

      if (response.ok) {
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#2ADCA1'; 
        formCadastro.reset();
        setTimeout(() => {
          window.location.href = 'login.html'; 
        }, 2000);
      } else {
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#e74c3c'; 
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      mensagemRetorno.innerText = 'Não foi possível conectar ao servidor. Tente mais tarde.';
      mensagemRetorno.style.color = '#e74c3c'; 
    }
    btnCadastrar.disabled = false;
    btnCadastrar.innerText = 'Criar Minha Conta';
  });
});
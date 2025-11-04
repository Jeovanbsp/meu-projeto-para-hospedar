// Arquivo: /js/cadastro.js

// 1. Espera o HTML carregar completamente
document.addEventListener('DOMContentLoaded', () => {
  
  // 2. Seleciona os elementos do formulário
  const formCadastro = document.getElementById('form-cadastro');
  const nomeInput = document.getElementById('nome');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnCadastrar = document.getElementById('btn-cadastrar');
  const mensagemRetorno = document.getElementById('mensagem-retorno');

  // 3. Define a URL da nossa API (backend)
  const API_URL = 'http://localhost:3000/auth/register'; 
  
  // 4. Adiciona o "ouvinte" de evento no formulário
  formCadastro.addEventListener('submit', async (event) => {
    // Impede o formulário de recarregar a página (comportamento padrão)
    event.preventDefault(); 
    
    // Pega os valores dos campos
    const nome = nomeInput.value;
    const email = emailInput.value;
    const senha = senhaInput.value;

    // Muda o texto do botão para dar feedback
    btnCadastrar.disabled = true;
    btnCadastrar.innerText = 'Cadastrando...';
    mensagemRetorno.innerText = ''; // Limpa mensagens antigas
    mensagemRetorno.style.color = 'black';

    // 5. Envia os dados para a API (o "fetch")
    try {
      const response = await fetch(API_URL, {
        method: 'POST', // Método HTTP
        headers: {
          'Content-Type': 'application/json', // Avisa que estamos enviando JSON
        },
        body: JSON.stringify({ // Converte nosso objeto JS em texto JSON
          nome: nome,
          email: email,
          senha: senha 
        })
      });

      const data = await response.json(); // Pega a resposta da API

      // 6. Analisa a resposta da API
      if (response.ok) { // 'ok' significa status 200-299 (sucesso!)
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#2ADCA1'; // Verde (sucesso)
        
        // Limpa o formulário
        formCadastro.reset();

        // Opcional: Redireciona para o login após 2 segundos
        setTimeout(() => {
          window.location.href = 'login.html'; // Envia o usuário para a página de login
        }, 2000);

      } else {
        // Se a API retornou um erro (ex: e-mail já existe, senha curta)
        mensagemRetorno.innerText = data.message;
        mensagemRetorno.style.color = '#e74c3c'; // Vermelho (erro)
      }
    
    } catch (error) {
      // Se a API estiver offline ou houver erro de rede
      console.error('Erro ao cadastrar:', error);
      mensagemRetorno.innerText = 'Não foi possível conectar ao servidor. Tente mais tarde.';
      mensagemRetorno.style.color = '#e74c3c'; // Vermelho (erro)
    }

    // Reabilita o botão
    btnCadastrar.disabled = false;
    btnCadastrar.innerText = 'Criar Minha Conta';
  });

});
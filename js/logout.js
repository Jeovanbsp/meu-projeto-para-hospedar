// Arquivo: /js/logout.js

document.addEventListener('DOMContentLoaded', () => {
  // Lista de possíveis IDs de botões de logout no projeto (Dashboard, Admin e Paciente)
  const logoutIds = ['btn-logout', 'btn-logout-admin', 'btn-logout-paciente'];

  const logoutAction = () => {
    localStorage.clear(); // Limpa token, cargo e nome do utilizador
    window.location.href = 'login.html'; // Redireciona para a página de login
  };

  // Atribui o evento de clique a qualquer um dos IDs encontrados na página atual
  logoutIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', logoutAction);
    }
  });
});
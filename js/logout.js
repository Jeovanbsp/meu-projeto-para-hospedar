// Arquivo: /js/logout-simples.js (Corrigido o ID do Botão)

document.addEventListener('DOMContentLoaded', () => {
  // Pega o ID do botão de sair da página de dashboard (ID: btn-logout)
  const btnLogoutDashboard = document.getElementById('btn-logout'); 
  
  // Pega o ID do botão de sair da página de edição (ID: btn-logout-admin)
  const btnLogoutAdmin = document.getElementById('btn-logout-admin');

  const logoutAction = () => {
    localStorage.clear(); // Apaga o token e o role
    window.location.href = 'login.html'; // Volta para o login
  };

  // Liga a ação ao botão do Dashboard
  if (btnLogoutDashboard) {
    btnLogoutDashboard.addEventListener('click', logoutAction);
  }

  // Liga a ação ao botão da Página de Edição
  if (btnLogoutAdmin) {
    btnLogoutAdmin.addEventListener('click', logoutAction);
  }
});
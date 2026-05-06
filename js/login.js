document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    
    if (formLogin) {
        formLogin.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const usuario = document.getElementById('usuario').value.trim();
            const senha = document.getElementById('senha').value;
            const msgErro = document.getElementById('msg-erro');
            
            if (msgErro) msgErro.style.display = 'none';
            
            // Sistema local de login
            const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const user = usuarios.find(u => u.usuario === usuario && u.senha === senha);
            
            if (user) {
                localStorage.setItem('usuarioLogado', JSON.stringify(user));
                // Todos vão para agenda
                window.location.href = 'agenda.html';
            } else {
                if (msgErro) {
                    msgErro.innerText = "Usuário ou senha incorretos.";
                    msgErro.style.display = 'block';
                }
            }
        });
    }
});

function criarConta() {
    const usuario = prompt('Nome de usuário:');
    if (!usuario) return;
    const senha = prompt('Senha:');
    if (!senha) return;
    const nome = prompt('Nome completo:');
    if (!nome) return;
    
    const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    if (usuarios.find(u => u.usuario === usuario)) {
        alert('Usuário já existe!');
        return;
    }
    
    usuarios.push({ id: Date.now(), usuario: usuario, senha: senha, nome: nome, createdAt: new Date().toISOString() });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    alert('Conta criada! Agora faça login.');
}

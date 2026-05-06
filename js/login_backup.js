let perfilSelecionado = 'admin';

function selecionarPerfil(perfil) {
    perfilSelecionado = perfil;
    document.getElementById('btn-admin').classList.toggle('active', perfil === 'admin');
    document.getElementById('btn-secretaria').classList.toggle('active', perfil === 'secretaria');
}

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const usuario = document.getElementById('usuario').value.trim();
            const senha = document.getElementById('senha').value;
            const msgErro = document.getElementById('msg-erro');
            const btnEntrar = e.submitter;
            
            if (btnEntrar) {
                btnEntrar.disabled = true;
                btnEntrar.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Entrando...';
            }
            
            if (msgErro) msgErro.style.display = 'none';
            
            // Sistema local de login
            const usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
            const user = usuarios.find(u => u.usuario === usuario && u.senha === senha);
            
            if (user) {
                localStorage.setItem('usuarioLogado', JSON.stringify(user));
                
                if (user.perfil === 'secretaria') {
                    window.location.href = 'agenda.html';
                } else {
                    window.location.href = 'admin-dashboard.html';
                }
            } else {
                if (msgErro) {
                    msgErro.innerText = "Usuário ou senha incorretos.";
                    msgErro.style.display = 'block';
                }
            }
            
            if (btnEntrar) {
                btnEntrar.disabled = false;
                btnEntrar.innerHTML = 'Entrar <i class="ph ph-sign-in"></i>';
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
    
    usuarios.push({ id: Date.now(), usuario: usuario, senha: senha, nome: nome, perfil: perfilSelecionado, createdAt: new Date().toISOString() });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    alert('Conta criada! Agora faça login.');
}

// Header scroll effect
let ultimoScroll = window.scrollY;
const topo = document.querySelector('header'); 

if (topo) {
    window.addEventListener('scroll', () => {
        let scrollAtual = window.scrollY;
        if (scrollAtual > ultimoScroll && scrollAtual > 100) {
            topo.classList.add('esconder-topo');
        } else {
            topo.classList.remove('esconder-topo');
        }
        ultimoScroll = scrollAtual;
    });
}

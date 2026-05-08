// Script para limpar localStorage
// Execute no console do navegador

function clearAgendaData() {
    const keys = ['agendamentos', 'disponibilidade', 'pacientes', 'historico', 'tags', 'mensagens'];
    keys.forEach(key => localStorage.removeItem(key));
    console.log('✅ Dados da agenda limpos!');
    location.reload();
}

// Executar automaticamente
clearAgendaData();

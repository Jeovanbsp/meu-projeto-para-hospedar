// Agenda System - Dra. Aisha

const API_BASE = 'https://aishageriatria.onrender.com';
const API_ENDPOINTS = {
    disponibilidade: `${API_BASE}/api/disponibilidade`,
    agendamentos: `${API_BASE}/api/appointments`,
    pacientes: `${API_BASE}/api/pacientes`,
    historico: `${API_BASE}/api/historico`
};

let currentDate = new Date();
let selectedDate = null;
let selectedBlocks = [];
let selectedLocations = [];
let disponibilidade = [];
let agendamentos = [];
let pacientes = [];
let tags = [];
let mensagens = [];
let historico = [];

async function loadFromAPI(key) {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    try {
        const res = await fetch(API_ENDPOINTS[key], { headers: { 'Authorization': `Bearer ${token}` } });
        return res.ok ? await res.json() : null;
    } catch { return null; }
}

async function saveToAPI(key, data) {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
        await fetch(API_ENDPOINTS[key], {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(data)
        });
    } catch {}
}

async function init() {
    // Try load from API, fallback to localStorage
    const [apiDisp, apiAgend, apiPats, apiHist] = await Promise.all([
        loadFromAPI('disponibilidade'),
        loadFromAPI('agendamentos'),
        loadFromAPI('pacientes'),
        loadFromAPI('historico')
    ]);
    
    if (apiDisp) { disponibilidade = apiDisp; localStorage.setItem('disponibilidade', JSON.stringify(apiDisp)); }
    else { const d = localStorage.getItem('disponibilidade'); if (d) disponibilidade = JSON.parse(d); }
    
    if (apiAgend) { agendamentos = apiAgend; localStorage.setItem('agendamentos', JSON.stringify(apiAgend)); }
    else { const a = localStorage.getItem('agendamentos'); if (a) agendamentos = JSON.parse(a); }
    
    if (apiPats) { pacientes = apiPats; localStorage.setItem('pacientes', JSON.stringify(apiPats)); }
    else { const p = localStorage.getItem('pacientes'); if (p) pacientes = JSON.parse(p); }
    
    if (apiHist) { historico = apiHist; localStorage.setItem('historico', JSON.stringify(apiHist)); }
    else { const h = localStorage.getItem('historico'); if (h) historico = JSON.parse(h); }
    
    const tgs = localStorage.getItem('tags');
    if (tgs) tags = JSON.parse(tgs);
    const msgs = localStorage.getItem('mensagens');
    if (msgs) mensagens = JSON.parse(msgs);
    
    renderCalendar();
    renderAvailabilityTable();
    renderAppointmentsList();
    setupLocationCheckboxes();
    renderPacientesLista();
    carregarPacientesSelect();
    renderMensagens();
    renderTags();
    renderHistoricoConsultas();
    renderHistorico();
    atualizarContador();
    // Contador
    if (c) c.textContent = agendamentos.length;
    
    document.getElementById('btn-logout').addEventListener('click', () => { atualizarContador(); window.location.href = 'index.html' }); /// atualizarContador();('click', () => window.location.href = 'index.html');
}

// CALENDAR
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('calendar-title').textContent = monthNames[month] + ' ' + year;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        if (disponibilidade.some(d => d.date === dateStr)) dayEl.classList.add('has-slots');
        if (selectedDate === dateStr) dayEl.classList.add('selected');
        const dateObj = new Date(year, month, day);
        if (dateObj < today) { dayEl.classList.add('past'); }
        dayEl.onclick = () => selectDate(dateStr);
        calendarDays.appendChild(dayEl);
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    renderCalendar();
}

function selectDate(dateStr) {
    selectedDate = dateStr;
    selectedBlocks = [];
    selectedLocations = [];
    document.getElementById('selected-date-title').textContent = 'Data: ' + formatDate(dateStr);
    document.getElementById('location-section').style.display = 'none';
    document.getElementById('btn-salvar').disabled = true;
    renderBlocks();
    renderCalendar();
    document.querySelectorAll('.location-checkbox').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('input').checked = false;
    });
}

function renderBlocks() {
    const list = document.getElementById('blocks-list');
    list.innerHTML = selectedBlocks.length === 0 ? '<span style="color: #999;">Nenhum bloco adicionado</span>' : '';
    selectedBlocks.forEach((block, idx) => {
        const chip = document.createElement('div');
        chip.className = 'block-chip';
        chip.innerHTML = block.inicio + ' - ' + block.fim + ' <span class="remove" onclick="removerBloco(' + idx + ')">x</span>';
        list.appendChild(chip);
    });
}

function adicionarBloco() {
    const inicio = document.getElementById('block-inicio').value;
    const fim = document.getElementById('block-fim').value;
    if (!inicio || !fim) return alert('Preencha os horarios.');
    if (inicio >= fim) return alert('Horario de inicio deve ser menor que o fim.');
    selectedBlocks.push({ inicio: inicio, fim: fim });
    renderBlocks();
    showLocationSection();
}

function removerBloco(idx) {
    selectedBlocks.splice(idx, 1);
    renderBlocks();
    updateSaveButton();
}

function showLocationSection() {
    document.getElementById('location-section').style.display = selectedBlocks.length > 0 ? 'block' : 'none';
    updateSaveButton();
}

function setupLocationCheckboxes() {
    document.querySelectorAll('.location-checkbox').forEach(label => {
        const checkbox = label.querySelector('input');
        const value = checkbox.value;
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                label.classList.add('selected');
                if (!selectedLocations.includes(value)) selectedLocations.push(value);
            } else {
                label.classList.remove('selected');
                selectedLocations = selectedLocations.filter(l => l !== value);
            }
            updateSaveButton();
        });
    });
}

function updateSaveButton() {
    document.getElementById('btn-salvar').disabled = !(selectedBlocks.length > 0 && selectedLocations.length > 0);
}

function salvarDisponibilidade() {
    if (!selectedDate || selectedBlocks.length === 0 || selectedLocations.length === 0) {
        return alert('Selecione a data, adicione blocos de horario e selecione o local.');
    }
    selectedBlocks.forEach(block => {
        disponibilidade.push({ date: selectedDate, time: block.inicio + ' - ' + block.fim, location: selectedLocations.join(', ') });
    });
    localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
        saveToAPI('disponibilidade', disponibilidade);
    selectedBlocks = [];
    selectedLocations = [];
    document.querySelectorAll('.location-checkbox').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('input').checked = false;
    });
    document.getElementById('location-section').style.display = 'none';
    document.getElementById('btn-salvar').disabled = true;
    renderCalendar();
    renderAvailabilityTable();
    alert('Disponibilidade salva!');
}

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return day + '/' + months[parseInt(month) - 1] + '/' + year;
}

function getLocationLabel(location) {
    if (location.includes(',')) return location;
    const labels = { 'Salvador': 'Salvador', 'Lauro': 'Lauro de Freitas', 'Domiciliar': 'Domiciliar' };
    return labels[location] || location;
}

function renderAvailabilityTable() {
    const tbody = document.getElementById('availability-table-body');
    if (!tbody) return;
    const today = new Date().toISOString().split('T')[0];
    disponibilidade = disponibilidade.filter(d => d.date >= today);
    const filterMonth = document.getElementById('filter-month').value;
    const filterLocation = document.getElementById('filter-location').value;
    let filtered = [...disponibilidade];
    if (filterMonth) filtered = filtered.filter(d => d.date.startsWith(filterMonth));
    if (filterLocation) filtered = filtered.filter(d => d.location.includes(filterLocation));
    filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    tbody.innerHTML = filtered.length === 0 ? 
        '<tr><td colspan="4" style="text-align: center; color: #999; padding: 40px;">Nenhuma disponibilidade</td></tr>' :
        filtered.map((d, idx) => {
            const realIndex = disponibilidade.indexOf(d);
            const badgeClass = d.location.includes(',') ? 'misto' : d.location.toLowerCase().trim();
            return '<tr><td>' + formatDate(d.date) + '</td><td>' + d.time + '</td><td><span class="location-badge ' + badgeClass + '">' + getLocationLabel(d.location) + '</span></td><td class="action-btns"><button class="btn-agendar" onclick="abrirModalAgendar(\'' + d.date + '\', \'' + d.time + '\', \'' + d.location + '\')">Agendar</button><button class="btn-editar" onclick="abrirModalEditar(' + realIndex + ')">E</button><button class="btn-excluir" onclick="excluirDisponibilidade(' + realIndex + ')">X</button></td></tr>';
        }).join('');
}

function filtrarDisponibilidade() { renderAvailabilityTable(); }

// APPOINTMENTS
function abrirModalAgendar(date, time, location) {
    document.getElementById('agendar-date').value = date;
    document.getElementById('agendar-time').value = time;
    document.getElementById('agendar-location').value = location;
    document.getElementById('agendar-datahora').value = formatDate(date) + ' - ' + time + ' - ' + getLocationLabel(location);
    document.getElementById('agendar-nome').value = '';
    document.getElementById('agendar-whatsapp').value = '';
    document.getElementById('agendar-endereco').value = '';
    document.getElementById('agendar-paciente-select').value = '';
    
    // Preencher select com pacientes
    const select = document.getElementById('agendar-paciente-select');
    select.innerHTML = '<option value="">Selecione...</option>' + 
        pacientes.map(p => '<option value="' + p.nome + '">' + p.nome + '</option>').join('');
    
    document.getElementById('modal-agendar').classList.add('active');
}

function preencherPaciente(nome) {
    if (!nome) return;
    const p = pacientes.find(pac => pac.nome === nome);
    if (p) {
        document.getElementById('agendar-nome').value = p.nome;
        document.getElementById('agendar-whatsapp').value = p.whatsapp || '';
        document.getElementById('agendar-endereco').value = p.endereco || '';
    }
}

function fecharModalAgendar() {
    document.getElementById('modal-agendar').classList.remove('active');
}

document.getElementById('form-agendar').addEventListener('submit', function(e) {
    e.preventDefault();
    const date = document.getElementById('agendar-date').value;
    const time = document.getElementById('agendar-time').value;
    const location = document.getElementById('agendar-location').value;
    const nome = document.getElementById('agendar-nome').value;
    const whatsapp = document.getElementById('agendar-whatsapp').value;
    const endereco = document.getElementById('agendar-endereco').value;
    disponibilidade = disponibilidade.filter(d => !(d.date === date && d.time === time && d.location === location));
    agendamentos.push({ date: date, time: time, location: location, patientName: nome, whatsapp: whatsapp, endereco: endereco, status: 'pendente' });
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        saveToAPI('agendamentos', agendamentos);
        atualizarContador();
    localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
        saveToAPI('disponibilidade', disponibilidade);
    if (!pacientes.find(p => p.nome === nome)) {
        pacientes.push({ id: Date.now(), nome: nome, whatsapp: whatsapp, endereco: endereco, createdAt: new Date().toISOString() });
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        saveToAPI('pacientes', pacientes);
        renderPacientesLista();
        carregarPacientesSelect();
    }
    fecharModalAgendar();
    renderAvailabilityTable();
    renderAppointmentsList();
    alert('Consulta agendada!');
});

function renderAppointmentsList() {
    const container = document.getElementById('appointments-list');
    if (!container) return;
    const filterMonth = document.getElementById('filter-appointment-month').value;
    const filterStatus = document.getElementById('filter-appointment-status').value;
    let filtered = [...agendamentos];
    if (filterMonth) filtered = filtered.filter(a => a.date.startsWith(filterMonth));
    if (filterStatus) filtered = filtered.filter(a => a.status === filterStatus);
    container.innerHTML = filtered.length === 0 ? '<div class="empty-state">Nenhuma consulta agendada</div>' :
        filtered.map((a, idx) => {
            const realIndex = agendamentos.indexOf(a);
            return '<div class="appointment-row ' + (a.status === 'realizado' ? 'realizado' : '') + '"><input type="checkbox" class="status-checkbox" ' + (a.status === 'realizado' ? 'checked' : '') + ' onchange="toggleStatus(' + realIndex + ')"><div class="appointment-info"><div class="appointment-name">' + a.patientName + '</div><div class="appointment-details"><span>' + formatDate(a.date) + '</span><span>' + a.time + '</span><span>' + a.whatsapp + '</span></div></div><button class="btn-excluir" onclick="excluirAgendamento(' + realIndex + ')">X</button></div>';
        }).join('');
}

function filtrarAgendamentos() { renderAppointmentsList(); }

function toggleStatus(index) {
    const a = agendamentos[index];
    if (a.status === 'pendente') {
        a.status = 'realizado';
        a.realizadoEm = new Date().toISOString();
        // Add to historico
        historico.push({ ...a });
        localStorage.setItem('historico', JSON.stringify(historico));
        saveToAPI('historico', historico);
    } else {
        a.status = 'pendente';
        // Remove from historico
        historico = historico.filter(h => h.date !== a.date || h.time !== a.time);
        localStorage.setItem('historico', JSON.stringify(historico));
        saveToAPI('historico', historico);
    }
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
    saveToAPI('agendamentos', agendamentos);
    atualizarContador();
    renderAppointmentsList();
    renderHistoricoConsultas();
}

function renderHistoricoConsultas() {
    const container = document.getElementById('historico-list');
    if (!container) return;
    container.innerHTML = historico.length === 0 ? '<div class="empty-state">Nenhuma consulta realizada</div>' :
        historico.map((h, idx) => '<div class="appointment-row realizado"><div class="appointment-info"><div class="appointment-name">' + h.patientName + '</div><div class="appointment-details"><span>' + formatDate(h.date) + '</span><span>' + h.time + '</span></div></div><button class="btn-excluir" onclick="excluirHistorico(' + idx + ')">X</button></div>').join('');
}

function excluirHistorico(index) {
    if (confirm('Remover do historico?')) {
        historico.splice(index, 1);
        localStorage.setItem('historico', JSON.stringify(historico));
        renderHistoricoConsultas();
    }
}

function atualizarContador() {
    const c1 = document.getElementById('contador-consultas');
    if (c1) c1.textContent = agendamentos.length;
    const c2 = document.getElementById('contador-disponibilidade');
    if (c2) c2.textContent = disponibilidade.length;
}

function excluirAgendamento(index) {
    if (confirm('Deseja cancelar esta consulta?')) {
        const a = agendamentos[index];
        disponibilidade.push({ date: a.date, time: a.time, location: a.location });
        agendamentos.splice(index, 1);
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        saveToAPI('agendamentos', agendamentos);
        atualizarContador();
        localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
        saveToAPI('disponibilidade', disponibilidade);
        renderAvailabilityTable();
        renderAppointmentsList();
    }
}

function abrirModalEditar(index) {
    const d = disponibilidade[index];
    document.getElementById('editar-index').value = index;
    document.getElementById('editar-data').value = d.date;
    const [inicio, fim] = d.time.split(' - ');
    document.getElementById('editar-inicio').value = inicio;
    document.getElementById('editar-fim').value = fim;
    document.getElementById('editar-local').value = d.location;
    document.getElementById('modal-editar').classList.add('active');
}

function fecharModalEditar() {
    document.getElementById('modal-editar').classList.remove('active');
}

function excluirDisponibilidade(index) {
    if (confirm('Deseja excluir esta disponibilidade?')) {
        disponibilidade.splice(index, 1);
        localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
        saveToAPI('disponibilidade', disponibilidade);
        renderAvailabilityTable();
        renderCalendar();
    }
}

document.getElementById('form-editar').addEventListener('submit', function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('editar-index').value);
    const inicio = document.getElementById('editar-inicio').value;
    const fim = document.getElementById('editar-fim').value;
    disponibilidade[index] = { date: document.getElementById('editar-data').value, time: inicio + ' - ' + fim, location: document.getElementById('editar-local').value };
    localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
        saveToAPI('disponibilidade', disponibilidade);
    fecharModalEditar();
    renderAvailabilityTable();
    renderCalendar();
    alert('Disponibilidade atualizada!');
});

// PACIENTES
function carregarPacientesSelect() {
    const select = document.getElementById('tag-paciente');
    const filterSelect = document.getElementById('filter-tag-paciente');
    if (select) {
        select.innerHTML = '<option value="">Selecione um paciente...</option>';
        pacientes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.nome;
            option.textContent = p.nome;
            select.appendChild(option);
        });
    }
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">Todos os Pacientes</option>';
        pacientes.forEach(p => {
            const option = document.createElement('option');
            option.value = p.nome;
            option.textContent = p.nome;
            filterSelect.appendChild(option);
        });
    }
}

function renderPacientesLista() {
    const container = document.getElementById('pacientes-lista');
    if (!container) return;
    const total = pacientes.length;
    container.innerHTML = '<div style="grid-column: 1/-1; margin-bottom: 15px; padding: 15px; background: #e8f9f4; border-radius: 8px;"><strong style="color: #2ADCA1;">' + total + ' paciente' + (total !== 1 ? 's' : '') + ' cadastrado' + (total !== 1 ? 's' : '') + '</strong></div>';
    if (pacientes.length === 0) {
        container.innerHTML += '<div class="empty-state" style="grid-column: 1/-1;">Nenhum paciente cadastrado</div>';
        return;
    }
    container.innerHTML += pacientes.map(p => {
        const consultas = agendamentos.filter(a => a.patientName === p.nome);
        const ultimaConsulta = consultas.length > 0 ? consultas[consultas.length - 1].date : null;
        const pacienteTags = tags.filter(t => t.paciente === p.nome);
        const obsBtn = '<button onclick="abrirObsPaciente(\'' + p.nome + '\')" style="background: #6c757d; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Obs</button>';
        return '<div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee;"><div style="font-weight: 700; color: #2c3e50; font-size: 1.1rem;">' + p.nome + '</div><div style="font-size: 0.9rem; color: #666; margin-top: 5px;">WhatsApp: ' + (p.whatsapp || 'Nao Informado') + '</div><div style="font-size: 0.9rem; color: #666;">Responsavel: ' + (p.responsavel || 'Nao Informado') + '</div><div style="font-size: 0.9rem; color: #666;">Endereco: ' + (p.endereco || 'Nao Informado') + '</div><div style="font-size: 0.8rem; color: #888; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">Consultas: ' + consultas.length + ' | Ultima: ' + (ultimaConsulta ? formatDate(ultimaConsulta) : '-') + ' | Tags: ' + pacienteTags.length + '</div><div style="display: flex; gap: 5px; margin-top: 10px;"><button onclick="agendarPaciente(\'' + p.nome + '\')" style="background: #007bff; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Agendar</button><button onclick="criarTagPaciente(\'' + p.nome + '\')" style="background: #2ADCA1; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Tag</button><button onclick="enviarMsgPaciente(\'' + p.nome + '\')" style="background: #25c095; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Msg</button>' + obsBtn + '<button onclick="excluirPaciente(\'' + p.nome + '\')" style="background: #fff0f0; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 5px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">X</button></div></div>';
    }).join('');
}

function cadastrarPaciente() {
    const nome = document.getElementById('novo-paciente-nome').value;
    const whatsapp = document.getElementById('novo-paciente-whatsapp').value;
    const endereco = document.getElementById('novo-paciente-endereco').value;
    const responsavel = document.getElementById('novo-paciente-responsavel').value;
    const obs = document.getElementById('novo-paciente-obs').value;
    if (!nome) return alert('Informe o nome do paciente.');
    pacientes.push({ id: Date.now(), nome: nome, whatsapp: whatsapp, endereco: endereco, responsavel: responsavel, obs: obs, createdAt: new Date().toISOString() });
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
        saveToAPI('pacientes', pacientes);
    document.getElementById('novo-paciente-nome').value = '';
    document.getElementById('novo-paciente-whatsapp').value = '';
    document.getElementById('novo-paciente-endereco').value = '';
    document.getElementById('novo-paciente-responsavel').value = '';
    document.getElementById('novo-paciente-obs').value = '';
    renderPacientesLista();
    carregarPacientesSelect();
    alert('Paciente cadastrado!');
}

function agendarPaciente(nome) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="disponibilidade"]').classList.add('active');
    document.getElementById('tab-disponibilidade').classList.add('active');
    document.getElementById('agendar-nome').value = nome;
    // Preencher dados do paciente
    const p = pacientes.find(pac => pac.nome === nome);
    if (p) {
        document.getElementById('agendar-whatsapp').value = p.whatsapp || '';
        document.getElementById('agendar-endereco').value = p.endereco || '';
    }
    // Abre modal para selecionar horário
    document.getElementById('agendar-date').value = '';
    document.getElementById('agendar-time').value = '';
    document.getElementById('agendar-location').value = 'salvador';
    document.getElementById('modal-agendar').classList.add('active');
}

function criarTagPaciente(nome) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="tags"]').classList.add('active');
    document.getElementById('tab-tags').classList.add('active');
    document.getElementById('tag-paciente').value = nome;
    alert('Paciente selecionado! Agora crie a tag.');
}

let pacienteMsgAtual = null;

function enviarMsgPaciente(nome) {
    const paciente = pacientes.find(p => p.nome === nome);
    if (!paciente || !paciente.whatsapp) {
        alert('Paciente sem WhatsApp cadastrado. Cadastre primeiro.');
        return;
    }
    pacienteMsgAtual = { nome: nome, whatsapp: paciente.whatsapp };
    const lista = document.getElementById('msg-selecionar-lista');
    lista.innerHTML = mensagens.length === 0 ? 
        '<div class="empty-state">Nenhuma mensagem salva. Crie primeiro.</div>' :
        mensagens.map(m => '<div class="block-chip" style="cursor: pointer; padding: 12px 15px;" onclick="enviarMsgPacienteSelecionada(' + m.id + ')">' + m.titulo + '</div>').join('');
    document.getElementById('modal-selecionar-msg').classList.add('active');
}

function enviarMsgPacienteSelecionada(id) {
    const msg = mensagens.find(m => m.id === id);
    if (msg && pacienteMsgAtual) {
        const texto = encodeURIComponent(msg.texto);
        const tel = pacienteMsgAtual.whatsapp.replace(/\D/g, '');
        window.open('https://wa.me/' + tel + '?text=' + texto, '_blank');
        
        // Salvar no historico
        historico.push({
            id: Date.now(),
            paciente: pacienteMsgAtual.nome,
            tipo: 'mensagem',
            titulo: msg.titulo,
            data: new Date().toISOString()
        });
        localStorage.setItem('historico', JSON.stringify(historico));
        
        document.getElementById('modal-selecionar-msg').classList.remove('active');
    }
}

function fecharModalMsg() {
    document.getElementById('modal-selecionar-msg').classList.remove('active');
}

function excluirPaciente(nome) {
    if (confirm('Deseja excluir este paciente?')) {
        pacientes = pacientes.filter(p => p.nome !== nome);
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        saveToAPI('pacientes', pacientes);
        renderPacientesLista();
        carregarPacientesSelect();
    }
}

// TAGS
function salvarTag() {
    const paciente = document.getElementById('tag-paciente').value;
    const titulo = document.getElementById('tag-titulo').value;
    const dataContato = document.getElementById('tag-data-contato').value;
    const observacao = document.getElementById('tag-observacao').value;
    const tagColor = document.getElementById('tag-cor').value;
    if (!paciente || !titulo) return alert('Selecione o paciente e informe o titulo da tag.');
    const novaTag = { id: Date.now(), paciente: paciente, titulo: titulo, dataContato: dataContato || null, observacao: observacao, color: tagColor, createdAt: new Date().toISOString() };
    tags.push(novaTag);
    localStorage.setItem('tags', JSON.stringify(tags));
    document.getElementById('tag-paciente').value = '';
    document.getElementById('tag-titulo').value = '';
    document.getElementById('tag-data-contato').value = '';
    document.getElementById('tag-observacao').value = '';
    mostrarTagDetalhes(novaTag);
    renderTags();
    renderHistoricoConsultas();
    renderPacientesLista();
}

function renderTags() {
    const container = document.getElementById('tags-lista');
    if (!container) return;
    const filterPaciente = document.getElementById('filter-tag-paciente').value;
    let filtered = [...tags];
    if (filterPaciente) filtered = filtered.filter(t => t.paciente === filterPaciente);
    container.innerHTML = filtered.length === 0 ? '<div class="empty-state">Nenhuma tag criada</div>' :
        filtered.map(t => {
            var html = '<div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ' + t.color + '; cursor: pointer;" onclick="mostrarTagDetalhesById(' + t.id + ')"><div style="display: flex; justify-content: space-between;"><div><strong>' + t.paciente + '</strong><div style="color: ' + t.color + '; font-weight: 600; margin-top: 5px;">' + t.titulo + '</div>';
            if (t.dataContato) html += '<div style="font-size: 0.9rem; color: #666; margin-top: 5px;">Contato: ' + formatDate(t.dataContato) + '</div>';
            if (t.observacao) html += '<div style="font-size: 0.9rem; color: #666; margin-top: 5px;">' + t.observacao + '</div>';
            html += '</div><div style="display: flex; flex-direction: column; gap: 5px;"><button onclick="event.stopPropagation(); enviarMsgPaciente(\'' + t.paciente + '\')" style="background: #25c095; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">Msg</button><button onclick="event.stopPropagation(); marcarContato(\'' + t.paciente + '\')" style="background: #2ADCA1; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">OK</button><button onclick="event.stopPropagation(); excluirTag(' + t.id + ')" style="background: #fff0f0; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.7rem;">X</button></div></div></div>';
            return html;
        }).join('');
}

function mostrarTagDetalhesById(id) {
    const tag = tags.find(t => t.id === id);
    if (tag) mostrarTagDetalhes(tag);
}

function mostrarTagDetalhes(tag) {
    const detalhes = document.getElementById('tag-detalhes');
    var html = '<div style="font-size: 1.5rem; font-weight: 700; color: ' + tag.color + ';">' + tag.titulo + '</div>';
    html += '<div style="font-size: 1.2rem; margin-top: 10px;">' + tag.paciente + '</div>';
    if (tag.dataContato) html += '<div style="color: #666; margin-top: 10px;">Contato: ' + formatDate(tag.dataContato) + '</div>';
    if (tag.observacao) html += '<div style="color: #666; margin-top: 10px;">' + tag.observacao + '</div>';
    html += '<div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;"><button onclick="enviarMsgPaciente(\'' + tag.paciente + '\')" style="background: #25c095; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Enviar Msg</button><button onclick="marcarContato(\'' + tag.paciente + '\')" style="background: #2ADCA1; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Marcar OK</button></div>';
    html += '<button onclick="fecharModalVerTag()" style="margin-top: 10px; padding: 10px 20px; background: #ccc; color: #333; border: none; border-radius: 8px; cursor: pointer;">Fechar</button>';
    detalhes.innerHTML = html;
    document.getElementById('modal-ver-tag').classList.add('active');
}

function fecharModalVerTag() {
    document.getElementById('modal-ver-tag').classList.remove('active');
}

function filtrarTags() { renderTags(); }

function excluirTag(id) {
    if (confirm('Deseja excluir esta tag?')) {
        tags = tags.filter(t => t.id !== id);
        localStorage.setItem('tags', JSON.stringify(tags));
        renderTags();
    renderHistoricoConsultas();
        renderPacientesLista();
    }
}

// MENSAGENS
function salvarMensagem() {
    const titulo = document.getElementById('msg-titulo').value;
    const texto = document.getElementById('msg-texto').value;
    if (!titulo || !texto) return alert('Informe o titulo e a mensagem.');
    mensagens.push({ id: Date.now(), titulo: titulo, texto: texto });
    localStorage.setItem('mensagens', JSON.stringify(mensagens));
    document.getElementById('msg-titulo').value = '';
    document.getElementById('msg-texto').value = '';
    renderMensagens();
    alert('Mensagem salva!');
}

function renderMensagens() {
    const container = document.getElementById('mensagens-lista');
    if (!container) return;
    container.innerHTML = mensagens.length === 0 ? '<span style="color: #999;">Nenhuma mensagem salva</span>' :
        mensagens.map(m => '<div class="block-chip" style="cursor: pointer;" onclick="copiarMensagem(' + m.id + ')" title="Clique para copiar">' + m.titulo + ' <span class="remove" onclick="event.stopPropagation(); editarMensagem(' + m.id + ')">&#9998;</span><span class="remove" onclick="event.stopPropagation(); excluirMensagem(' + m.id + ')">x</span></div>').join('');
}

function editarMensagem(id) {
    const msg = mensagens.find(m => m.id === id);
    if (!msg) return;
    document.getElementById('editar-mensagem-id').value = id;
    document.getElementById('editar-mensagem-titulo').value = msg.titulo;
    document.getElementById('editar-mensagem-texto').value = msg.texto;
    document.getElementById('modal-editar-mensagem').classList.add('active');
}

function salvarEditarMensagem() {
    const id = parseInt(document.getElementById('editar-mensagem-id').value);
    const msg = mensagens.find(m => m.id === id);
    if (msg) {
        msg.titulo = document.getElementById('editar-mensagem-titulo').value;
        msg.texto = document.getElementById('editar-mensagem-texto').value;
        localStorage.setItem('mensagens', JSON.stringify(mensagens));
        renderMensagens();
    }
    document.getElementById('modal-editar-mensagem').classList.remove('active');
    alert('Mensagem atualizada!');
}

function copiarMensagem(id) {
    const msg = mensagens.find(m => m.id === id);
    if (msg) {
        navigator.clipboard.writeText(msg.texto).then(() => {
            alert('Mensagem copiada! Agora voce pode colar no WhatsApp.');
        });
    }
}

function excluirMensagem(id) {
    if (confirm('Deseja excluir esta mensagem?')) {
        mensagens = mensagens.filter(m => m.id !== id);
        localStorage.setItem('mensagens', JSON.stringify(mensagens));
        renderMensagens();
    }
}

// HISTORICO
function renderHistoricoConsultas() {
    const container = document.getElementById('historico-list');
    if (!container) return;
    if (historico.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum contato registrado</div>';
        return;
    }
    const filterPaciente = document.getElementById('filter-tag-paciente').value;
    let filtered = [...historico];
    if (filterPaciente) filtered = filtered.filter(h => h.paciente === filterPaciente);
    filtered.sort((a, b) => b.data.localeCompare(a.data));
    
    container.innerHTML = filtered.map(h => '<div style="background: white; padding: 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #25c095;"><div style="font-weight: 600;">' + h.paciente + '</div><div style="font-size: 0.85rem; color: #25c095;">' + h.tipo + ': ' + h.titulo + '</div><div style="font-size: 0.75rem; color: #888;">' + new Date(h.data).toLocaleDateString('pt-BR') + '</div></div>').join('');
}

function marcarContato(paciente) {
    historico.push({
        id: Date.now(),
        paciente: paciente,
        tipo: 'contato',
        titulo: 'Contato realizado',
        data: new Date().toISOString()
    });
    localStorage.setItem('historico', JSON.stringify(historico));
    alert('Contato registrado no historico!');
    fecharModalVerTag();
    renderHistorico();
    atualizarContador();
    // Contador
    if (c) c.textContent = agendamentos.length;
}

init();
// Observation modal functions
function abrirObsPaciente(nome) {
    document.getElementById('obs-paciente-nome').value = nome;
    const p = pacientes.find(pac => pac.nome === nome);
    document.getElementById('obs-paciente-texto').value = p?.obs || '';
    document.getElementById('modal-obs-paciente').classList.add('active');
}

function salvarObsPaciente() {
    const nome = document.getElementById('obs-paciente-nome').value;
    const obs = document.getElementById('obs-paciente-texto').value;
    const p = pacientes.find(pac => pac.nome === nome);
    if (p) {
        p.obs = obs;
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        saveToAPI('pacientes', pacientes);
        renderPacientesLista();
    }
    document.getElementById('modal-obs-paciente').classList.remove('active');
}

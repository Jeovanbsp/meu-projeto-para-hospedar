// Agenda System - Dra. Aisha

// === STATE ===
let currentDate = new Date();
let selectedDate = null;
let selectedBlocks = [];
let selectedLocations = [];
let disponibilidade = [];
let agendamentos = [];
let pacientes = [];
let tags = [];
let mensagens = [];

function init() {
    // Carregar dados do localStorage
    const disp = localStorage.getItem('disponibilidade');
    if (disp) disponibilidade = JSON.parse(disp);
    
    const agend = localStorage.getItem('agendamentos');
    if (agend) agendamentos = JSON.parse(agend);
    
    const pats = localStorage.getItem('pacientes');
    if (pats) pacientes = JSON.parse(pats);
    
    const tgs = localStorage.getItem('tags');
    if (tgs) tags = JSON.parse(tgs);
    
    const msgs = localStorage.getItem('mensagens');
    if (msgs) mensagens = JSON.parse(msgs);
    
    renderCalendar();
    renderAvailabilityTable();
    renderAppointmentsList();
    setupLocationCheckboxes();
    renderPacientesLista();
    renderMensagens();
    renderTags();
    
    document.getElementById('btn-logout').addEventListener('click', () => window.location.href = 'index.html');
}

// === CALENDAR ===
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;
    
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
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        if (disponibilidade.some(d => d.date === dateStr)) dayEl.classList.add('has-slots');
        if (selectedDate === dateStr) dayEl.classList.add('selected');
        
        const dateObj = new Date(year, month, day);
        if (dateObj < today) {
            dayEl.classList.add('past');
        } else {
            dayEl.onclick = () => selectDate(dateStr);
        }
        
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
    
    document.getElementById('selected-date-title').textContent = `Data: ${formatDate(dateStr)}`;
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
        chip.innerHTML = `${block.inicio} - ${block.fim} <span class="remove" onclick="removerBloco(${idx})">×</span>`;
        list.appendChild(chip);
    });
}

function adicionarBloco() {
    const inicio = document.getElementById('block-inicio').value;
    const fim = document.getElementById('block-fim').value;
    
    if (!inicio || !fim) return alert('Preencha os horários.');
    if (inicio >= fim) return alert('Horário de início deve ser menor que o fim.');
    
    selectedBlocks.push({ inicio, fim });
    renderBlocks();
    showLocationSection();
}

function removerBloco(idx) {
    selectedBlocks.splice(idx, 1);
    renderBlocks();
    updateSaveButton();
}

function showLocationSection() {
    const section = document.getElementById('location-section');
    section.style.display = selectedBlocks.length > 0 ? 'block' : 'none';
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
        return alert('Selecione a data, adicione blocos de horário e selecione o local.');
    }
    
    selectedBlocks.forEach(block => {
        disponibilidade.push({
            date: selectedDate,
            time: `${block.inicio} - ${block.fim}`,
            location: selectedLocations.join(', ')
        });
    });
    
    localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
    
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
    return `${day}/${months[parseInt(month) - 1]}/${year}`;
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
    
    filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
    
    tbody.innerHTML = filtered.length === 0 ? 
        '<tr><td colspan="4" style="text-align: center; color: #999; padding: 40px;">Nenhuma disponibilidade</td></tr>' :
        filtered.map((d, idx) => {
            const realIndex = disponibilidade.indexOf(d);
            const badgeClass = d.location.includes(',') ? 'misto' : d.location.toLowerCase().trim();
            return `
                <tr>
                    <td>${formatDate(d.date)}</td>
                    <td>${d.time}</td>
                    <td><span class="location-badge ${badgeClass}">${getLocationLabel(d.location)}</span></td>
                    <td class="action-btns">
                        <button class="btn-agendar" onclick="abrirModalAgendar('${d.date}', '${d.time}', '${d.location}')">Agendar</button>
                        <button class="btn-editar" onclick="abrirModalEditar(${realIndex})">✎</button>
                        <button class="btn-excluir" onclick="excluirDisponibilidade(${realIndex})">✕</button>
                    </td>
                </tr>
            `;
        }).join('');
}

function filtrarDisponibilidade() { renderAvailabilityTable(); }

// === APPOINTMENTS ===
function abrirModalAgendar(date, time, location) {
    document.getElementById('agendar-date').value = date;
    document.getElementById('agendar-time').value = time;
    document.getElementById('agendar-location').value = location;
    document.getElementById('agendar-datahora').value = `${formatDate(date)} - ${time} - ${getLocationLabel(location)}`;
    document.getElementById('agendar-nome').value = '';
    document.getElementById('agendar-whatsapp').value = '';
    document.getElementById('agendar-endereco').value = '';
    document.getElementById('modal-agendar').classList.add('active');
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
    
    agendamentos.push({
        date, time, location,
        patientName: nome,
        whatsapp,
        endereco,
        status: 'pendente'
    });
    
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
    localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
    
    // Adicionar paciente se não existir
    if (!pacientes.find(p => p.nome === nome)) {
        pacientes.push({ id: Date.now(), nome, whatsapp, endereco, createdAt: new Date().toISOString() });
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        renderPacientesLista();
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
    
    container.innerHTML = filtered.length === 0 ? 
        '<div class="empty-state">Nenhuma consulta agendada</div>' :
        filtered.map((a, idx) => {
            const realIndex = agendamentos.indexOf(a);
            return `
                <div class="appointment-row ${a.status === 'realizado' ? 'realizado' : ''}">
                    <input type="checkbox" class="status-checkbox" ${a.status === 'realizado' ? 'checked' : ''} 
                           onchange="toggleStatus(${realIndex})">
                    <div class="appointment-info">
                        <div class="appointment-name">${a.patientName}</div>
                        <div class="appointment-details">
                            <span>${formatDate(a.date)}</span>
                            <span>${a.time}</span>
                            <span>${a.whatsapp}</span>
                        </div>
                    </div>
                    <button class="btn-excluir" onclick="excluirAgendamento(${realIndex})">✕</button>
                </div>
            `;
        }).join('');
}

function filtrarAgendamentos() { renderAppointmentsList(); }

function toggleStatus(index) {
    agendamentos[index].status = agendamentos[index].status === 'pendente' ? 'realizado' : 'pendente';
    localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
    renderAppointmentsList();
}

function excluirAgendamento(index) {
    if (confirm('Deseja cancelar esta consulta?')) {
        const a = agendamentos[index];
        disponibilidade.push({ date: a.date, time: a.time, location: a.location });
        agendamentos.splice(index, 1);
        
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
        
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
    document.getElementById('editar-fim').value =fim;
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
        renderAvailabilityTable();
        renderCalendar();
    }
}

document.getElementById('form-editar').addEventListener('submit', function(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('editar-index').value);
    const inicio = document.getElementById('editar-inicio').value;
    const fim = document.getElementById('editar-fim').value;
    
    disponibilidade[index] = {
        date: document.getElementById('editar-data').value,
        time: `${inicio} - ${fim}`,
        location: document.getElementById('editar-local').value
    };
    
    localStorage.setItem('disponibilidade', JSON.stringify(disponibilidade));
    fecharModalEditar();
    renderAvailabilityTable();
    renderCalendar();
    alert('Disponibilidade atualizada!');
});

// === PACIENTES ===
function renderPacientesLista() {
    const container = document.getElementById('pacientes-lista');
    if (!container) return;
    
    container.innerHTML = pacientes.length === 0 ?
        '<div class="empty-state" style="grid-column: 1/-1;">Nenhum paciente cadastrado</div>' :
        pacientes.map(p => `
            <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #eee;">
                <div style="font-weight: 700; color: #2c3e50;">${p.nome}</div>
                <div style="font-size: 0.9rem; color: #666; margin-top: 5px;">📱 ${p.whatsapp || 'Não informado'}</div>
                <div style="font-size: 0.9rem; color: #666;">📍 ${p.endereco || 'Não informado'}</div>
                <div style="display: flex; gap: 8px; margin-top: 10px;">
                    <button onclick="agendarPaciente('${p.nome}')" style="background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">Agendar</button>
                    <button onclick="criarTagPaciente('${p.nome}')" style="background: #2ADCA1; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">Criar Tag</button>
                    <button onclick="excluirPaciente('${p.nome}')" style="background: #fff0f0; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">✕</button>
                </div>
            </div>
        `).join('');
}

function cadastrarPaciente() {
    const nome = document.getElementById('novo-paciente-nome').value;
    const whatsapp = document.getElementById('novo-paciente-whatsapp').value;
    const endereco = document.getElementById('novo-paciente-endereco').value;
    
    if (!nome) return alert('Informe o nome do paciente.');
    
    pacientes.push({ id: Date.now(), nome, whatsapp, endereco, createdAt: new Date().toISOString() });
    localStorage.setItem('pacientes', JSON.stringify(pacientes));
    
    document.getElementById('novo-paciente-nome').value = '';
    document.getElementById('novo-paciente-whatsapp').value = '';
    document.getElementById('novo-paciente-endereco').value = '';
    
    renderPacientesLista();
    alert('Paciente cadastrado!');
}

function agendarPaciente(nome) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="disponibilidade"]').classList.add('active');
    document.getElementById('tab-disponibilidade').classList.add('active');
    document.getElementById('agendar-nome').value = nome;
    alert('Paciente selecionado! Agora agende o horário.');
}

function criarTagPaciente(nome) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector('[data-tab="tags"]').classList.add('active');
    document.getElementById('tab-tags').classList.add('active');
    document.getElementById('tag-paciente').value = nome;
    alert('Paciente selecionado! Agora crie a tag.');
}

function excluirPaciente(nome) {
    if (confirm('Deseja excluir este paciente?')) {
        pacientes = pacientes.filter(p => p.nome !== nome);
        localStorage.setItem('pacientes', JSON.stringify(pacientes));
        renderPacientesLista();
    }
}

// === TAGS ===
function salvarTag() {
    const paciente = document.getElementById('tag-paciente').value;
    const titulo = document.getElementById('tag-titulo').value;
    const dataContato = document.getElementById('tag-data-contato').value;
    const observacao = document.getElementById('tag-observacao').value;
    const tagColor = document.getElementById('tag-cor').value;
    
    if (!paciente || !titulo) return alert('Selecione o paciente e informe o título da tag.');
    
    tags.push({
        id: Date.now(),
        paciente,
        titulo,
        dataContato: dataContato || null,
        observacao,
        color: tagColor,
        createdAt: new Date().toISOString()
    });
    
    localStorage.setItem('tags', JSON.stringify(tags));
    
    document.getElementById('tag-paciente').value = '';
    document.getElementById('tag-titulo').value = '';
    document.getElementById('tag-data-contato').value = '';
    document.getElementById('tag-observacao').value = '';
    
    renderTags();
    alert('Tag criada com sucesso!');
}

function renderTags() {
    const container = document.getElementById('tags-lista');
    if (!container) return;
    
    const filterPaciente = document.getElementById('filter-tag-paciente').value;
    let filtered = [...tags];
    if (filterPaciente) filtered = filtered.filter(t => t.paciente === filterPaciente);
    
    container.innerHTML = filtered.length === 0 ?
        '<div class="empty-state">Nenhuma tag criada</div>' :
        filtered.map(t => `
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid ${t.color};">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>${t.paciente}</strong>
                        <div style="color: ${t.color}; font-weight: 600; margin-top: 5px;">${t.titulo}</div>
                        ${t.dataContato ? `<div style="font-size: 0.9rem; color: #666; margin-top: 5px;">📅 Contato: ${formatDate(t.dataContato)}</div>` : ''}
                        ${t.observacao ? `<div style="font-size: 0.9rem; color: #666; margin-top: 5px;">${t.observacao}</div>` : ''}
                    </div>
                    <button onclick="excluirTag(${t.id})" style="background: #fff0f0; color: #ff6b6b; border: 1px solid #ff6b6b; padding: 5px 10px; border-radius: 5px; cursor: pointer;">✕</button>
                </div>
            </div>
        `).join('');
}

function filtrarTags() { renderTags(); }

function excluirTag(id) {
    if (confirm('Deseja excluir esta tag?')) {
        tags = tags.filter(t => t.id !== id);
        localStorage.setItem('tags', JSON.stringify(tags));
        renderTags();
    }
}

// === MENSAGENS ===
function salvarMensagem() {
    const titulo = document.getElementById('msg-titulo').value;
    const texto = document.getElementById('msg-texto').value;
    
    if (!titulo || !texto) return alert('Informe o título e a mensagem.');
    
    mensagens.push({ id: Date.now(), titulo, texto });
    localStorage.setItem('mensagens', JSON.stringify(mensagens));
    
    document.getElementById('msg-titulo').value = '';
    document.getElementById('msg-texto').value = '';
    
    renderMensagens();
    alert('Mensagem salva!');
}

function renderMensagens() {
    const container = document.getElementById('mensagens-lista');
    if (!container) return;
    
    container.innerHTML = mensagens.length === 0 ?
        '<span style="color: #999;">Nenhuma mensagem salva</span>' :
        mensagens.map(m => `
            <div class="block-chip" style="cursor: pointer;" onclick="copiarMensagem(${m.id})" title="Clique para copiar">
                ${m.titulo} <span class="remove" onclick="event.stopPropagation(); excluirMensagem(${m.id})">×</span>
            </div>
        `).join('');
}

function copiarMensagem(id) {
    const msg = mensagens.find(m => m.id === id);
    if (msg) {
        navigator.clipboard.writeText(msg.texto).then(() => {
            alert('Mensagem copiada! Agora você pode colar no WhatsApp.');
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

// Iniciar
init();
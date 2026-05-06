// Agenda System - Dra. Aisha

let currentDate = new Date();
let selectedDate = null;
let selectedBlocks = [];
let selectedLocations = [];
let disponibilidade = [];
let agendamentos = [];

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
        
        const hasSlots = disponibilidade.some(d => d.date === dateStr);
        if (hasSlots) dayEl.classList.add('has-slots');
        
        if (selectedDate === dateStr) dayEl.classList.add('selected');
        
        const dateObj = new Date(year, month, day);
        
        if (dateObj < today) {
            dayEl.classList.add('past');
        } else {
            dayEl.onclick = () => selectDate(dateStr);
        }
        
        calendarDays.appendChild(dayEl);
    }
    
    updateFilterOptions();
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
    list.innerHTML = '';
    
    if (selectedBlocks.length === 0) {
        list.innerHTML = '<span style="color: #999;">Nenhum bloco adicionado</span>';
        return;
    }
    
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
    
    if (!inicio || !fim) {
        alert('Preencha os horários de início e fim.');
        return;
    }
    
    if (inicio >= fim) {
        alert('O horário de início deve ser menor que o horário de fim.');
        return;
    }
    
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
    if (selectedBlocks.length > 0) {
        section.style.display = 'block';
    } else {
        section.style.display = 'none';
    }
    updateSaveButton();
}

function setupLocationCheckboxes() {
    document.querySelectorAll('.location-checkbox').forEach(label => {
        const checkbox = label.querySelector('input');
        const value = checkbox.value;
        
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                label.classList.add('selected');
                if (!selectedLocations.includes(value)) {
                    selectedLocations.push(value);
                }
            } else {
                label.classList.remove('selected');
                selectedLocations = selectedLocations.filter(l => l !== value);
            }
            updateSaveButton();
        });
    });
}

function updateSaveButton() {
    const btn = document.getElementById('btn-salvar');
    btn.disabled = !(selectedBlocks.length > 0 && selectedLocations.length > 0);
}

function salvarDisponibilidade() {
    if (!selectedDate || selectedBlocks.length === 0 || selectedLocations.length === 0) {
        alert('Selecione a data, adicione blocos de horário e selecione o local.');
        return;
    }
    
    selectedBlocks.forEach(block => {
        selectedLocations.forEach(location => {
            disponibilidade.push({
                date: selectedDate,
                time: `${block.inicio} - ${block.fim}`,
                location: location
            });
        });
    });
    
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
    
    alert('Disponibilidade salva com sucesso!');
}

function formatDate(dateStr) {
    const [year, month, day] = dateStr.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${day}/${months[parseInt(month) - 1]}/${year}`;
}

function getLocationLabel(location) {
    const labels = {
        'Salvador': 'Salvador',
        'Lauro': 'Lauro de Freitas',
        'Domiciliar': 'Domiciliar'
    };
    return labels[location] || location;
}

function renderAvailabilityTable() {
    const tbody = document.getElementById('availability-table-body');
    
    const today = new Date().toISOString().split('T')[0];
    disponibilidade = disponibilidade.filter(d => d.date >= today);
    
    const filterMonth = document.getElementById('filter-month').value;
    const filterLocation = document.getElementById('filter-location').value;
    
    let filtered = [...disponibilidade];
    
    if (filterMonth) filtered = filtered.filter(d => d.date.startsWith(filterMonth));
    if (filterLocation) filtered = filtered.filter(d => d.location === filterLocation);
    
    filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999; padding: 40px;">Nenhuma disponibilidade</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map((d, idx) => {
        const realIndex = disponibilidade.indexOf(d);
        return `
            <tr>
                <td>${formatDate(d.date)}</td>
                <td>${d.time}</td>
                <td><span class="location-badge ${d.location.toLowerCase()}">${getLocationLabel(d.location)}</span></td>
                <td class="action-btns">
                    <button class="btn-agendar" onclick="abrirModalAgendar('${d.date}', '${d.time}', '${d.location}')">Agendar</button>
                    <button class="btn-editar" onclick="abrirModalEditar(${realIndex})">✎</button>
                    <button class="btn-excluir" onclick="excluirDisponibilidade(${realIndex})">✕</button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarDisponibilidade() {
    renderAvailabilityTable();
}

function updateFilterOptions() {
    const filterMonth = document.getElementById('filter-month');
    const filterAppointment = document.getElementById('filter-appointment-month');
    
    const months = new Set();
    [...disponibilidade, ...agendamentos].forEach(d => {
        months.add(d.date.substring(0, 7));
    });
    
    const options = Array.from(months).sort().map(m => {
        const [year, mon] = m.split('-');
        const monthsArr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `<option value="${m}">${monthsArr[parseInt(mon) - 1]}/${year}</option>`;
    });
    
    filterMonth.innerHTML = '<option value="">Todos os Meses</option>' + options.join('');
    filterAppointment.innerHTML = '<option value="">Todos os Meses</option>' + options.join('');
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
    
    disponibilidade.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
    
    fecharModalEditar();
    renderAvailabilityTable();
    renderCalendar();
    
    alert('Disponibilidade atualizada!');
});

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
    
    agendamentos.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
    
    fecharModalAgendar();
    renderAvailabilityTable();
    renderAppointmentsList();
    
    alert('Consulta agendada!');
});

function renderAppointmentsList() {
    const container = document.getElementById('appointments-list');
    
    const filterMonth = document.getElementById('filter-appointment-month').value;
    const filterStatus = document.getElementById('filter-appointment-status').value;
    
    let filtered = [...agendamentos];
    
    if (filterMonth) filtered = filtered.filter(a => a.date.startsWith(filterMonth));
    if (filterStatus) filtered = filtered.filter(a => a.status === filterStatus);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhuma consulta agendada</div>';
        return;
    }
    
    container.innerHTML = filtered.map((a, idx) => {
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

function filtrarAgendamentos() {
    renderAppointmentsList();
}

function toggleStatus(index) {
    const a = agendamentos[index];
    a.status = a.status === 'pendente' ? 'realizado' : 'pendente';
    renderAppointmentsList();
}

function excluirAgendamento(index) {
    if (confirm('Deseja cancelar esta consulta?')) {
        const a = agendamentos[index];
        
        disponibilidade.push({
            date: a.date,
            time: a.time,
            location: a.location
        });
        
        agendamentos.splice(index, 1);
        
        renderAvailabilityTable();
        renderAppointmentsList();
    }
}

renderCalendar();
renderAvailabilityTable();
renderAppointmentsList();
setupLocationCheckboxes();

document.getElementById('btn-logout').addEventListener('click', () => {
    window.location.href = 'index.html';
});
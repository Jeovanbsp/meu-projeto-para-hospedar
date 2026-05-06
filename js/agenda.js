// Agenda System - Dra. Aisha

// === STATE ===
let currentDate = new Date();
let selectedDate = null;
let selectedTimeSlots = [];
let selectedLocation = null;
let disponibilidade = [];
let agendamentos = [];

// === CALENDAR ===
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['Janeiro', 'Feveriro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
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
    selectedTimeSlots = [];
    selectedLocation = null;
    
    document.getElementById('selected-date-title').textContent = `Selecione os horários para ${formatDate(dateStr)}`;
    document.getElementById('location-section').style.display = 'none';
    
    renderTimeSlots();
    
    document.querySelectorAll('.location-option').forEach(el => el.classList.remove('selected'));
    updateSaveButton();
    
    renderCalendar();
}

function renderTimeSlots() {
    const grid = document.getElementById('time-slots-grid');
    grid.innerHTML = '';
    
    const times = [];
    for (let h = 8; h <= 18; h++) {
        times.push(`${String(h).padStart(2, '0')}:00`);
        times.push(`${String(h).padStart(2, '0')}:30`);
    }
    
    times.forEach(time => {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.textContent = time;
        slot.dataset.time = time;
        
        if (selectedTimeSlots.includes(time)) slot.classList.add('selected');
        
        slot.onclick = () => toggleTimeSlot(time);
        grid.appendChild(slot);
    });
}

function toggleTimeSlot(time) {
    const index = selectedTimeSlots.indexOf(time);
    if (index > -1) {
        selectedTimeSlots.splice(index, 1);
    } else {
        selectedTimeSlots.push(time);
    }
    
    renderTimeSlots();
    updateSaveButton();
}

function adicionarRange() {
    const inicio = document.getElementById('time-inicio').value;
    const fim = document.getElementById('time-fim').value;
    
    if (!inicio || !fim) {
        alert('Preencha os horários de início e fim.');
        return;
    }
    
    if (inicio >= fim) {
        alert('O horário de início deve ser menor que o horário de fim.');
        return;
    }
    
    // Add times in 30 min intervals
    let current = inicio;
    while (current < fim) {
        if (!selectedTimeSlots.includes(current)) {
            selectedTimeSlots.push(current);
        }
        
        // Add 30 minutes
        const [h, m] = current.split(':').map(Number);
        if (m === 30) {
            current = `${String(h + 1).padStart(2, '0')}:00`;
        } else {
            current = `${String(h).padStart(2, '0')}:30`;
        }
    }
    
    renderTimeSlots();
    updateSaveButton();
}

function selectLocation(el) {
    document.querySelectorAll('.location-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    selectedLocation = el.dataset.location;
    updateSaveButton();
}

function updateSaveButton() {
    const btn = document.getElementById('btn-salvar');
    const locationSection = document.getElementById('location-section');
    
    if (selectedDate && selectedTimeSlots.length > 0) {
        locationSection.style.display = 'block';
        btn.disabled = !(selectedTimeSlots.length > 0 && selectedLocation);
    } else {
        locationSection.style.display = 'none';
        btn.disabled = true;
    }
}

function salvarDisponibilidade() {
    if (!selectedDate || selectedTimeSlots.length === 0 || !selectedLocation) {
        alert('Selecione a data, pelo menos um horário e o local.');
        return;
    }
    
    selectedTimeSlots.forEach(time => {
        disponibilidade = disponibilidade.filter(d => !(d.date === selectedDate && d.time === time));
        
        disponibilidade.push({
            date: selectedDate,
            time: time,
            location: selectedLocation
        });
    });
    
    selectedTimeSlots = [];
    selectedLocation = null;
    document.querySelectorAll('.location-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('btn-salvar').disabled = true;
    document.getElementById('location-section').style.display = 'none';
    
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

// === AVAILABILITY TABLE ===
function renderAvailabilityTable() {
    const tbody = document.getElementById('availability-table-body');
    
    // Remove past dates automatically
    const today = new Date().toISOString().split('T')[0];
    disponibilidade = disponibilidade.filter(d => d.date >= today);
    
    const filterMonth = document.getElementById('filter-month').value;
    const filterLocation = document.getElementById('filter-location').value;
    
    let filtered = [...disponibilidade];
    
    if (filterMonth) {
        filtered = filtered.filter(d => d.date.startsWith(filterMonth));
    }
    
    if (filterLocation) {
        filtered = filtered.filter(d => d.location === filterLocation);
    }
    
    filtered.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
    });
    
    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; color: #999; padding: 40px;">
                    <i class="ph ph-calendar-blank" style="font-size: 2rem; margin-bottom: 10px; display: block; opacity: 0.3;"></i>
                    Nenhuma disponibilidade cadastrada
                </td>
            </tr>
        `;
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
                    <button class="btn-agendar" onclick="abrirModalAgendar('${d.date}', '${d.time}', '${d.location}')">
                        <i class="ph ph-calendar-plus"></i> Agendar
                    </button>
                    <button class="btn-editar" onclick="abrirModalEditar(${realIndex})">
                        <i class="ph ph-pencil"></i>
                    </button>
                    <button class="btn-excluir" onclick="excluirDisponibilidade(${realIndex})">
                        <i class="ph ph-trash"></i>
                    </button>
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
        const month = d.date.substring(0, 7);
        months.add(month);
    });
    
    const options = Array.from(months).sort().map(m => {
        const [year, mon] = m.split('-');
        const monthsArr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return `<option value="${m}">${monthsArr[parseInt(mon) - 1]}/${year}</option>`;
    });
    
    filterMonth.innerHTML = '<option value="">Todos os Meses</option>' + options.join('');
    filterAppointment.innerHTML = '<option value="">Todos os Meses</option>' + options.join('');
}

// === EDIT/DELETE ===
function abrirModalEditar(index) {
    const d = disponibilidade[index];
    document.getElementById('editar-index').value = index;
    document.getElementById('editar-data').value = d.date;
    document.getElementById('editar-horario').value = d.time;
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
    
    disponibilidade[index] = {
        date: document.getElementById('editar-data').value,
        time: document.getElementById('editar-horario').value,
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

// === APPOINTMENTS ===
function abrirModalAgendar(date, time, location) {
    document.getElementById('agendar-date').value = date;
    document.getElementById('agendar-time').value = time;
    document.getElementById('agendar-location').value = location;
    document.getElementById('agendar-datahora').value = `${formatDate(date)} às ${time} - ${getLocationLabel(location)}`;
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
        date,
        time,
        location,
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
    
    alert('Consulta agendada com sucesso!');
});

function renderAppointmentsList() {
    const container = document.getElementById('appointments-list');
    
    const filterMonth = document.getElementById('filter-appointment-month').value;
    const filterStatus = document.getElementById('filter-appointment-status').value;
    
    let filtered = [...agendamentos];
    
    if (filterMonth) {
        filtered = filtered.filter(a => a.date.startsWith(filterMonth));
    }
    
    if (filterStatus) {
        filtered = filtered.filter(a => a.status === filterStatus);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="ph ph-calendar-x"></i>
                <p>Nenhuma consulta agendada</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map((a, idx) => {
        const realIndex = agendamentos.indexOf(a);
        return `
            <div class="appointment-row ${a.status === 'realizado' ? 'realizado' : ''}">
                <input type="checkbox" class="status-checkbox" ${a.status === 'realizado' ? 'checked' : ''} 
                       onchange="toggleStatus(${realIndex})" title="Marcar como realizado">
                <div class="appointment-info">
                    <div class="appointment-name">
                        ${a.patientName}
                        <span class="appointment-location location-badge ${a.location.toLowerCase()}" style="margin-left: 10px;">
                            ${getLocationLabel(a.location)}
                        </span>
                    </div>
                    <div class="appointment-details">
                        <span><i class="ph ph-calendar"></i> ${formatDate(a.date)}</span>
                        <span><i class="ph ph-clock"></i> ${a.time}</span>
                        <span><i class="ph ph-phone"></i> ${a.whatsapp}</span>
                        ${a.endereco ? `<span><i class="ph ph-map-pin"></i> ${a.endereco}</span>` : ''}
                    </div>
                </div>
                <button class="btn-excluir" onclick="excluirAgendamento(${realIndex})" title="Cancelar">
                    <i class="ph ph-trash"></i>
                </button>
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

// === INIT ===
renderCalendar();
renderAvailabilityTable();
renderAppointmentsList();

document.getElementById('btn-logout').addEventListener('click', () => {
    window.location.href = 'index.html';
});
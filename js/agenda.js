// Agenda System - Dra. Aisha

// === STATE ===
let currentDate = new Date();
let selectedDate = null;
let selectedTimeSlots = [];
let selectedLocation = null;
let disponibilidade = []; // Array of {date, time, location}
let agendamentos = []; // Array of {date, time, location, patientName, whatsapp, endereco, status}

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
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        // Check if has availability
        const hasSlots = disponibilidade.some(d => d.date === dateStr);
        if (hasSlots) {
            dayEl.classList.add('has-slots');
        }
        
        // Check if selected
        if (selectedDate === dateStr) {
            dayEl.classList.add('selected');
        }
        
        // Check if date is in past
        const dateObj = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (dateObj < today) {
            dayEl.style.opacity = '0.4';
            dayEl.style.cursor = 'not-allowed';
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
    
    // Update UI
    document.getElementById('time-slots-section').classList.add('active');
    document.getElementById('selected-date-title').textContent = `Selecione os horários para ${formatDate(dateStr)}`;
    
    // Render time slots (8h as 18h)
    renderTimeSlots();
    
    // Clear location selection
    document.querySelectorAll('.location-option').forEach(el => el.classList.remove('selected'));
    
    // Enable/disable save button
    updateSaveButton();
    
    // Update calendar highlight
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
        
        // Check if already selected
        if (selectedTimeSlots.includes(time)) {
            slot.classList.add('selected');
        }
        
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

function selectLocation(el) {
    document.querySelectorAll('.location-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    selectedLocation = el.dataset.location;
    updateSaveButton();
}

function updateSaveButton() {
    const btn = document.getElementById('btn-salvar');
    btn.disabled = !(selectedDate && selectedTimeSlots.length > 0 && selectedLocation);
}

function salvarDisponibilidade() {
    if (!selectedDate || selectedTimeSlots.length === 0 || !selectedLocation) {
        alert('Selecione a data, pelo menos um horário e o local.');
        return;
    }
    
    // Add new availability
    selectedTimeSlots.forEach(time => {
        // Remove existing for same date/time if any
        disponibilidade = disponibilidade.filter(d => !(d.date === selectedDate && d.time === time));
        
        disponibilidade.push({
            date: selectedDate,
            time: time,
            location: selectedLocation
        });
    });
    
    // Clear selection
    selectedTimeSlots = [];
    selectedLocation = null;
    document.querySelectorAll('.location-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('btn-salvar').disabled = true;
    
    // Re-render
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
    
    // Apply filters
    const filterMonth = document.getElementById('filter-month').value;
    const filterLocation = document.getElementById('filter-location').value;
    
    let filtered = [...disponibilidade];
    
    if (filterMonth) {
        filtered = filtered.filter(d => d.date.startsWith(filterMonth));
    }
    
    if (filterLocation) {
        filtered = filtered.filter(d => d.location === filterLocation);
    }
    
    // Sort by date and time
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
    
    tbody.innerHTML = filtered.map(d => `
        <tr>
            <td>${formatDate(d.date)}</td>
            <td>${d.time}</td>
            <td><span class="location-badge ${d.location.toLowerCase()}">${getLocationLabel(d.location)}</span></td>
            <td>
                <button class="btn-agendar" onclick="abrirModalAgendar('${d.date}', '${d.time}', '${d.location}')">
                    <i class="ph ph-calendar-plus"></i> Agendar
                </button>
            </td>
        </tr>
    `).join('');
}

function filtrarDisponibilidade() {
    renderAvailabilityTable();
}

function updateFilterOptions() {
    const filterMonth = document.getElementById('filter-month');
    const filterAppointment = document.getElementById('filter-appointment-month');
    
    // Get unique months from disponibilidade and agendamentos
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

// Handle form submit
document.getElementById('form-agendar').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const date = document.getElementById('agendar-date').value;
    const time = document.getElementById('agendar-time').value;
    const location = document.getElementById('agendar-location').value;
    const nome = document.getElementById('agendar-nome').value;
    const whatsapp = document.getElementById('agendar-whatsapp').value;
    const endereco = document.getElementById('agendar-endereco').value;
    
    // Remove from disponibilidade
    disponibilidade = disponibilidade.filter(d => !(d.date === date && d.time === time && d.location === location));
    
    // Add to agendamentos
    agendamentos.push({
        date,
        time,
        location,
        patientName: nome,
        whatsapp,
        endereco,
        status: 'pendente'
    });
    
    // Sort agendamentos
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
    
    // Apply filters
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
    
    container.innerHTML = filtered.map((a, index) => `
        <div class="appointment-row" style="opacity: ${a.status === 'realizado' ? '0.6' : '1'};">
            <input type="checkbox" class="status-checkbox" ${a.status === 'realizado' ? 'checked' : ''} 
                   onchange="toggleStatus(${agendamentos.indexOf(a)})" title="Marcar como realizado">
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
            <button class="btn-excluir" onclick="excluirAgendamento(${agendamentos.indexOf(a)})" title="Cancelar">
                <i class="ph ph-trash"></i>
            </button>
        </div>
    `).join('');
}

function filtrarAgendamentos() {
    renderAppointmentsList();
}

function toggleStatus(index) {
    const a = agendamentos[index];
    if (a.status === 'pendente') {
        a.status = 'realizado';
    } else {
        a.status = 'pendente';
    }
    renderAppointmentsList();
}

function excluirAgendamento(index) {
    if (confirm('Deseja cancelar esta consulta?')) {
        const a = agendamentos[index];
        
        // Optionally return to disponibilidade
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

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    window.location.href = 'index.html';
});
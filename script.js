var SUPABASE_URL = 'https://fysjierhimzjpotfwbkf.supabase.co';
var SUPABASE_KEY = 'sb_publishable_msOvy_8roFVAn_eDmVRGHQ__MfBNzV3';
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

var allTasks = [];
var allClients = [];
var selectedFilterDate = (function () {
    var today = new Date();
    return today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0');
})();
var toastTimer = null;

function getClienteName(clienteId) {
    for (var i = 0; i < allClients.length; i++) {
        if (allClients[i].id === clienteId) return allClients[i].nombre;
    }
    return 'Sin cliente';
}

// ===== NAVEGACION SIDEBAR =====
var sidebarBtns = document.querySelectorAll('.sidebar-btn');
var panels = document.querySelectorAll('.panel');

sidebarBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
        var panelId = this.dataset.panel;
        sidebarBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        panels.forEach(function (p) { p.classList.remove('active'); });
        document.getElementById('panel-' + panelId).classList.add('active');

        if (panelId === 'actividades') {
            if (selectedFilterDate) {
                var parts = selectedFilterDate.split('-');
                actCurrentMonth = parseInt(parts[1]) - 1;
                actCurrentYear = parseInt(parts[0]);
            }
            renderActividadesCalendar();
            updateFilterTitle();
        }
        if (panelId === 'historial') {
            renderHistorial();
        }
    });
});

// ===== TOAST =====
function showToast(msg) {
    var toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
        toast.classList.remove('show');
    }, 2500);
}

// ===== CALENDARIO DEL FORMULARIO =====
var dateInput = document.getElementById('fecha');
var calendarDropdown = document.getElementById('calendar-dropdown');
var calMonthYear = document.getElementById('cal-month-year');
var calendarDays = document.getElementById('calendar-days');
var calPrev = document.getElementById('cal-prev');
var calNext = document.getElementById('cal-next');

var currentDate = new Date();
var selectedDate = null;
var currentMonth = currentDate.getMonth();
var currentYear = currentDate.getFullYear();

function renderFormCalendar() {
    calendarDays.innerHTML = '';
    calMonthYear.textContent = MONTHS[currentMonth] + ' ' + currentYear;

    var firstDay = new Date(currentYear, currentMonth, 1).getDay();
    var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    var daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    for (var i = firstDay - 1; i >= 0; i--) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = daysInPrevMonth - i;
        btn.className = 'other-month';
        calendarDays.appendChild(btn);
    }

    for (var day = 1; day <= daysInMonth; day++) {
        (function (dayNum) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = dayNum;

            var isToday = (
                dayNum === currentDate.getDate() &&
                currentMonth === currentDate.getMonth() &&
                currentYear === currentDate.getFullYear()
            );
            if (isToday) btn.classList.add('today');

            if (
                selectedDate &&
                dayNum === selectedDate.getDate() &&
                currentMonth === selectedDate.getMonth() &&
                currentYear === selectedDate.getFullYear()
            ) {
                btn.classList.add('selected');
            }

            btn.addEventListener('click', function () {
                selectedDate = new Date(currentYear, currentMonth, dayNum);
                dateInput.value = selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                dateInput.dataset.iso = selectedDate.toISOString().split('T')[0];
                renderFormCalendar();
                calendarDropdown.classList.remove('active');
            });

            calendarDays.appendChild(btn);
        })(day);
    }

    var totalCells = firstDay + daysInMonth;
    var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (var i = 1; i <= remaining; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = i;
        btn.className = 'other-month';
        calendarDays.appendChild(btn);
    }
}

dateInput.addEventListener('click', function (e) {
    e.stopPropagation();
    calendarDropdown.classList.toggle('active');
    if (selectedDate) {
        currentMonth = selectedDate.getMonth();
        currentYear = selectedDate.getFullYear();
    }
    renderFormCalendar();
});

calPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderFormCalendar();
});

calNext.addEventListener('click', function (e) {
    e.stopPropagation();
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderFormCalendar();
});

document.addEventListener('click', function (e) {
    if (!calendarDropdown.contains(e.target) && e.target !== dateInput) {
        calendarDropdown.classList.remove('active');
    }
});

// ===== CLIENTES =====
async function loadClients() {
    var result = await supabaseClient
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

    if (result.error) {
        console.error('Error al cargar clientes:', result.error);
        return;
    }
    allClients = result.data;
    populateClienteSelect();
    populateHistorialClienteFilter();
    renderClientesList();
}

function populateClienteSelect() {
    var sel = document.getElementById('cliente-select');
    sel.innerHTML = '<option value="">Selecciona un cliente...</option>';
    allClients.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        sel.appendChild(opt);
    });
}

function populateHistorialClienteFilter() {
    var sel = document.getElementById('historial-cliente-filter');
    sel.innerHTML = '<option value="todas">Todos los clientes</option>';
    allClients.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        sel.appendChild(opt);
    });
}

function renderClientesList() {
    var container = document.getElementById('clientes-list');
    container.innerHTML = '';
    if (allClients.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8;text-align:center;padding:30px;">No hay clientes registrados</p>';
        return;
    }
    allClients.forEach(function (c) {
        var card = document.createElement('div');
        card.className = 'cliente-card';
        card.innerHTML =
            '<div class="cliente-card-info">' +
                '<span class="cliente-nombre">' + escapeHtml(c.nombre) + '</span>' +
                '<span class="cliente-telefono">' + (c.telefono ? escapeHtml(c.telefono) : 'Sin teléfono') + '</span>' +
            '</div>' +
            '<div class="cliente-card-actions">' +
                '<button class="btn-edit-cliente" data-id="' + c.id + '">Editar</button>' +
                '<button class="btn-del-cliente" data-id="' + c.id + '">Eliminar</button>' +
            '</div>';
        container.appendChild(card);
    });

    container.querySelectorAll('.btn-del-cliente').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = parseInt(this.dataset.id);
            if (!confirm('¿Eliminar este cliente?')) return;
            supabaseClient.from('clientes').delete().eq('id', id).then(function () {
                allClients = allClients.filter(function (c) { return c.id !== id; });
                populateClienteSelect();
                populateHistorialClienteFilter();
                renderClientesList();
                showToast('Cliente eliminado');
            });
        });
    });

    container.querySelectorAll('.btn-edit-cliente').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var id = parseInt(this.dataset.id);
            var cliente = null;
            for (var i = 0; i < allClients.length; i++) {
                if (allClients[i].id === id) { cliente = allClients[i]; break; }
            }
            if (!cliente) return;
            var nombre = prompt('Nombre:', cliente.nombre);
            if (!nombre || !nombre.trim()) return;
            var telefono = prompt('Teléfono:', cliente.telefono || '');
            supabaseClient.from('clientes').update({
                nombre: nombre.trim(),
                telefono: telefono.trim() || null
            }).eq('id', id).then(function () {
                loadClients();
                showToast('Cliente actualizado');
            });
        });
    });
}

document.getElementById('btn-add-cliente').addEventListener('click', async function () {
    var nombre = document.getElementById('cliente-nombre').value.trim();
    if (!nombre) { showToast('Ingresa un nombre'); return; }
    var telefono = document.getElementById('cliente-telefono').value.trim();

    var result = await supabaseClient
        .from('clientes')
        .insert([{ nombre: nombre, telefono: telefono || null }])
        .select()
        .single();

    if (result.error) {
        showToast('Error al guardar cliente');
        return;
    }
    allClients.push(result.data);
    document.getElementById('cliente-nombre').value = '';
    document.getElementById('cliente-telefono').value = '';
    populateClienteSelect();
    populateHistorialClienteFilter();
    renderClientesList();
    showToast('Cliente agregado');
});

// Inline add cliente
document.getElementById('btn-add-cliente-inline').addEventListener('click', function () {
    var formEl = document.getElementById('inline-cliente-form');
    formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('btn-cancel-inline').addEventListener('click', function () {
    document.getElementById('inline-cliente-form').style.display = 'none';
    document.getElementById('inline-nombre').value = '';
    document.getElementById('inline-telefono').value = '';
});

document.getElementById('btn-save-inline').addEventListener('click', async function () {
    var nombre = document.getElementById('inline-nombre').value.trim();
    if (!nombre) { showToast('Ingresa un nombre'); return; }
    var telefono = document.getElementById('inline-telefono').value.trim();

    var result = await supabaseClient
        .from('clientes')
        .insert([{ nombre: nombre, telefono: telefono || null }])
        .select()
        .single();

    if (result.error) {
        showToast('Error al guardar cliente');
        return;
    }
    allClients.push(result.data);
    populateClienteSelect();
    populateHistorialClienteFilter();
    renderClientesList();
    document.getElementById('cliente-select').value = result.data.id;
    document.getElementById('inline-cliente-form').style.display = 'none';
    document.getElementById('inline-nombre').value = '';
    document.getElementById('inline-telefono').value = '';
    showToast('Cliente agregado');
});

// ===== CALENDARIO DE ACTIVIDADES =====
var actCalMonthYear = document.getElementById('act-cal-month-year');
var actCalendarDays = document.getElementById('act-calendar-days');
var actCalPrev = document.getElementById('act-cal-prev');
var actCalNext = document.getElementById('act-cal-next');
var btnClearDate = document.getElementById('btn-clear-date');
var filterTitle = document.getElementById('filter-title');

var actCurrentMonth = currentDate.getMonth();
var actCurrentYear = currentDate.getFullYear();

function getTasksForDay(day, month, year) {
    return allTasks.filter(function (t) {
        if (!t.fecha_iso) return false;
        var parts = t.fecha_iso.split('-');
        return parseInt(parts[0]) === year &&
               parseInt(parts[1]) === month + 1 &&
               parseInt(parts[2]) === day;
    });
}

function renderActividadesCalendar() {
    actCalendarDays.innerHTML = '';
    actCalMonthYear.textContent = MONTHS[actCurrentMonth] + ' ' + actCurrentYear;

    var firstDay = new Date(actCurrentYear, actCurrentMonth, 1).getDay();
    var daysInMonth = new Date(actCurrentYear, actCurrentMonth + 1, 0).getDate();
    var daysInPrevMonth = new Date(actCurrentYear, actCurrentMonth, 0).getDate();

    for (var i = firstDay - 1; i >= 0; i--) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = daysInPrevMonth - i;
        btn.className = 'other-month';
        actCalendarDays.appendChild(btn);
    }

    for (var day = 1; day <= daysInMonth; day++) {
        (function (dayNum) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = dayNum;

            var isToday = (
                dayNum === currentDate.getDate() &&
                actCurrentMonth === currentDate.getMonth() &&
                actCurrentYear === currentDate.getFullYear()
            );
            if (isToday) btn.classList.add('today');

            var tasksOnDay = getTasksForDay(dayNum, actCurrentMonth, actCurrentYear);
            if (tasksOnDay.length > 0) {
                btn.classList.add('has-tasks');
                btn.title = tasksOnDay.length + ' tarea(s)';
            }

            var dateStr = actCurrentYear + '-' +
                String(actCurrentMonth + 1).padStart(2, '0') + '-' +
                String(dayNum).padStart(2, '0');

            if (selectedFilterDate === dateStr) {
                btn.classList.add('date-active');
            }

            btn.addEventListener('click', function () {
                if (selectedFilterDate === dateStr) {
                    selectedFilterDate = null;
                } else {
                    selectedFilterDate = dateStr;
                }
                renderActividadesCalendar();
                updateFilterTitle();
                renderAllTaskCards();
            });

            actCalendarDays.appendChild(btn);
        })(day);
    }

    var totalCells = firstDay + daysInMonth;
    var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (var i = 1; i <= remaining; i++) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = i;
        btn.className = 'other-month';
        actCalendarDays.appendChild(btn);
    }
}

actCalPrev.addEventListener('click', function () {
    actCurrentMonth--;
    if (actCurrentMonth < 0) { actCurrentMonth = 11; actCurrentYear--; }
    renderActividadesCalendar();
});

actCalNext.addEventListener('click', function () {
    actCurrentMonth++;
    if (actCurrentMonth > 11) { actCurrentMonth = 0; actCurrentYear++; }
    renderActividadesCalendar();
});

btnClearDate.addEventListener('click', function () {
    selectedFilterDate = null;
    renderActividadesCalendar();
    updateFilterTitle();
    renderAllTaskCards();
});

function updateFilterTitle() {
    if (selectedFilterDate) {
        var d = new Date(selectedFilterDate + 'T00:00:00');
        filterTitle.textContent = d.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } else {
        filterTitle.textContent = 'Todas las tareas';
    }
}

// ===== ESCAPADO HTML =====
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== TARJETAS DE TAREAS =====
function renderTaskCard(task) {
    var taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.id = task.id;

    if (task.completed) {
        taskCard.classList.add('completed');
    }

    var priorityLabel = { alta: 'Alta', media: 'Media', baja: 'Baja' };
    var prio = task.priority || 'media';
    var checkedAttr = task.completed ? ' checked' : '';
    var clienteName = task.cliente_id ? getClienteName(task.cliente_id) : (task.nombre || 'Sin cliente');

    taskCard.innerHTML =
        '<button class="btn-delete" title="Eliminar tarea">🗑️</button>' +
        '<div class="card-header">' +
            '<input type="checkbox" class="checkbox-complete" title="Marcar como completada"' + checkedAttr + '>' +
            '<h3>' + escapeHtml(clienteName) + '</h3>' +
            '<span class="priority-badge priority-' + prio + '">' + (priorityLabel[prio] || 'Media') + '</span>' +
        '</div>' +
        '<p class="materia"><span role="img" aria-label="libro">📚</span> ' + escapeHtml(task.materia) + '</p>' +
        '<p class="descripcion">' + escapeHtml(task.descripcion) + '</p>' +
        '<p class="fecha"><span role="img" aria-label="calendario">📅</span> Entrega: ' + escapeHtml(task.fecha) + '</p>';

    taskCard.querySelector('.checkbox-complete').addEventListener('change', function () {
        var newCompleted = this.checked;
        supabaseClient
            .from('tareas')
            .update({ completed: newCompleted })
            .eq('id', task.id)
            .then(function () {
                task.completed = newCompleted;
                if (newCompleted) {
                    taskCard.classList.add('completed');
                } else {
                    taskCard.classList.remove('completed');
                }
                renderActividadesCalendar();
            });
    });

    taskCard.querySelector('.btn-delete').addEventListener('click', function () {
        if (!confirm('¿Eliminar esta tarea?')) return;
        supabaseClient
            .from('tareas')
            .delete()
            .eq('id', task.id)
            .then(function () {
                taskCard.remove();
                allTasks = allTasks.filter(function (t) { return t.id !== task.id; });
                renderActividadesCalendar();
            });
    });

    return taskCard;
}

// ===== FILTROS =====
var searchInput = document.getElementById('search-input');
var filterStatus = document.getElementById('filter-status');
var filterPriority = document.getElementById('filter-priority');

function taskMatchesFilters(task) {
    var query = (searchInput.value || '').toLowerCase().trim();
    var status = filterStatus.value;
    var priority = filterPriority.value;

    if (selectedFilterDate) {
        if (task.fecha_iso !== selectedFilterDate) return false;
    }

    if (query) {
        var clienteName = task.cliente_id ? getClienteName(task.cliente_id) : (task.nombre || '');
        var text = (clienteName + ' ' + task.materia + ' ' + task.descripcion).toLowerCase();
        if (text.indexOf(query) === -1) return false;
    }

    if (status === 'pendientes' && task.completed) return false;
    if (status === 'completadas' && !task.completed) return false;
    if (priority !== 'todas' && task.priority !== priority) return false;

    return true;
}

function renderAllTaskCards() {
    var container = document.getElementById('tasks-container');
    container.innerHTML = '';
    allTasks.forEach(function (task) {
        if (taskMatchesFilters(task)) {
            container.appendChild(renderTaskCard(task));
        }
    });
}

searchInput.addEventListener('input', renderAllTaskCards);
filterStatus.addEventListener('change', renderAllTaskCards);
filterPriority.addEventListener('change', renderAllTaskCards);

// ===== HISTORIAL (TABLA) =====
function renderHistorial() {
    var tbody = document.getElementById('historial-tbody');
    var clienteFilter = document.getElementById('historial-cliente-filter').value;
    var statusFilter = document.getElementById('historial-status-filter').value;
    var priorityFilter = document.getElementById('historial-priority-filter').value;
    var priorityLabel = { alta: 'Alta', media: 'Media', baja: 'Baja' };

    tbody.innerHTML = '';

    var tasks = allTasks.filter(function (t) {
        if (clienteFilter !== 'todas' && t.cliente_id !== parseInt(clienteFilter)) return false;
        if (statusFilter === 'pendientes' && t.completed) return false;
        if (statusFilter === 'completadas' && !t.completed) return false;
        if (priorityFilter !== 'todas' && t.priority !== priorityFilter) return false;
        return true;
    });

    if (tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:30px;">Sin resultados</td></tr>';
        return;
    }

    tasks.forEach(function (t) {
        var tr = document.createElement('tr');
        var clienteName = t.cliente_id ? getClienteName(t.cliente_id) : (t.nombre || '-');
        var estadoHtml = t.completed
            ? '<span class="estado-completada">Completada</span>'
            : '<span class="estado-pendiente">Pendiente</span>';

        tr.innerHTML =
            '<td class="td-cliente">' + escapeHtml(clienteName) + '</td>' +
            '<td>' + escapeHtml(t.materia) + '</td>' +
            '<td>' + escapeHtml(t.descripcion) + '</td>' +
            '<td class="td-fecha">' + escapeHtml(t.fecha) + '</td>' +
            '<td><span class="priority-badge priority-' + (t.priority || 'media') + '">' + (priorityLabel[t.priority] || 'Media') + '</span></td>' +
            '<td>' + estadoHtml + '</td>' +
            '<td><button class="btn-table-delete" title="Eliminar">🗑️</button></td>';

        tr.querySelector('.btn-table-delete').addEventListener('click', function () {
            if (!confirm('¿Eliminar esta actividad?')) return;
            supabaseClient.from('tareas').delete().eq('id', t.id).then(function () {
                allTasks = allTasks.filter(function (x) { return x.id !== t.id; });
                renderHistorial();
                renderAllTaskCards();
                renderActividadesCalendar();
            });
        });

        tbody.appendChild(tr);
    });
}

document.getElementById('historial-cliente-filter').addEventListener('change', renderHistorial);
document.getElementById('historial-status-filter').addEventListener('change', renderHistorial);
document.getElementById('historial-priority-filter').addEventListener('change', renderHistorial);

// ===== CARGA Y GUARDADO =====
async function loadTasks() {
    var result = await supabaseClient
        .from('tareas')
        .select('*')
        .order('created_at', { ascending: false });

    if (result.error) {
        console.error('Error al cargar tareas:', result.error);
        return;
    }

    allTasks = result.data;
    renderAllTaskCards();
    renderActividadesCalendar();
}

var form = document.getElementById('task-form');

form.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    var clienteId = parseInt(document.getElementById('cliente-select').value);
    var materia = document.getElementById('materia').value;
    var tarea = document.getElementById('tarea').value;
    var fecha = dateInput.value;
    var fechaIso = dateInput.dataset.iso || '';
    var prioridad = document.getElementById('prioridad').value;

    if (!clienteId) { showToast('Selecciona un cliente'); return; }

    var result = await supabaseClient
        .from('tareas')
        .insert([{
            cliente_id: clienteId,
            materia: materia,
            descripcion: tarea,
            fecha: fecha,
            fecha_iso: fechaIso,
            priority: prioridad,
            completed: false
        }])
        .select()
        .single();

    if (result.error) {
        console.error('Error al guardar tarea:', result.error);
        showToast('Error al guardar la tarea');
        return;
    }

    allTasks.unshift(result.data);
    renderAllTaskCards();
    renderActividadesCalendar();

    form.reset();
    document.getElementById('cliente-select').value = '';
    document.getElementById('prioridad').value = 'media';
    selectedDate = null;
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderFormCalendar();

    showToast('✅ Tarea guardada correctamente');
});

// ===== INICIO =====
async function init() {
    await loadClients();
    await loadTasks();
    updateFilterTitle();
}

init();

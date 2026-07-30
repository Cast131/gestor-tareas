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

// ===== MODAL CUSTOM =====
var modalOverlay = document.getElementById('modal-overlay');
var modalMessage = document.getElementById('modal-message');
var modalActions = document.getElementById('modal-actions');

function showConfirm(msg, onConfirm) {
    modalMessage.textContent = msg;
    modalActions.innerHTML =
        '<button class="modal-btn-cancel" id="modal-btn-no">Cancelar</button>' +
        '<button class="modal-btn-confirm" id="modal-btn-si">Eliminar</button>';
    modalOverlay.classList.add('active');

    document.getElementById('modal-btn-no').addEventListener('click', closeModal);
    document.getElementById('modal-btn-si').addEventListener('click', function () {
        closeModal();
        onConfirm();
    });
}

function showAlert(msg, onOk) {
    modalMessage.textContent = msg;
    modalActions.innerHTML =
        '<button class="modal-btn-ok" id="modal-btn-ok">Aceptar</button>';
    modalOverlay.classList.add('active');

    document.getElementById('modal-btn-ok').addEventListener('click', function () {
        closeModal();
        if (onOk) onOk();
    });
}

function closeModal() {
    modalOverlay.classList.remove('active');
}

modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
});

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

// ===== AUTOCOMPLETE CLIENTES =====
var clienteInput = document.getElementById('cliente-input');
var clienteIndicator = document.getElementById('cliente-indicator');
var clienteSuggestions = document.getElementById('cliente-suggestions');
var selectedClienteId = null;

clienteInput.addEventListener('input', function () {
    var query = this.value.trim();
    selectedClienteId = null;
    clienteIndicator.className = 'cliente-indicator';
    clienteIndicator.textContent = '';
    clienteSuggestions.innerHTML = '';
    clienteSuggestions.classList.remove('active');

    if (!query) return;

    var exact = allClients.filter(function (c) {
        return c.nombre.toLowerCase() === query.toLowerCase();
    });

    if (exact.length > 0) {
        selectedClienteId = exact[0].id;
        clienteIndicator.className = 'cliente-indicator existe';
        clienteIndicator.textContent = '✓ Cliente existente';
        return;
    }

    var matches = allClients.filter(function (c) {
        return c.nombre.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });

    if (matches.length > 0) {
        matches.forEach(function (c) {
            var item = document.createElement('div');
            item.className = 'cliente-suggestion-item';
            item.textContent = c.nombre;
            item.addEventListener('mousedown', function (e) {
                e.preventDefault();
                clienteInput.value = c.nombre;
                selectedClienteId = c.id;
                clienteIndicator.className = 'cliente-indicator existe';
                clienteIndicator.textContent = '✓ Cliente existente';
                clienteSuggestions.classList.remove('active');
            });
            clienteSuggestions.appendChild(item);
        });
        clienteSuggestions.classList.add('active');
    } else {
        clienteIndicator.className = 'cliente-indicator nuevo';
        clienteIndicator.textContent = '+ Se crear\u00e1 un nuevo cliente';
    }
});

clienteInput.addEventListener('blur', function () {
    setTimeout(function () {
        clienteSuggestions.classList.remove('active');
    }, 200);
});

clienteInput.addEventListener('focus', function () {
    if (clienteSuggestions.children.length > 0) {
        clienteSuggestions.classList.add('active');
    }
});

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
            if (selectedDate && dayNum === selectedDate.getDate() &&
                currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear()) {
                btn.classList.add('selected');
            }
            btn.addEventListener('click', function () {
                selectedDate = new Date(currentYear, currentMonth, dayNum);
                dateInput.value = selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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

// ===== CARGA DE CLIENTES =====
async function loadClients() {
    var result = await supabaseClient
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });
    if (result.error) return;
    allClients = result.data;
    populateHistorialClienteFilter();
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
        return parseInt(parts[0]) === year && parseInt(parts[1]) === month + 1 && parseInt(parts[2]) === day;
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
            var isToday = dayNum === currentDate.getDate() && actCurrentMonth === currentDate.getMonth() && actCurrentYear === currentDate.getFullYear();
            if (isToday) btn.classList.add('today');

            var tasksOnDay = getTasksForDay(dayNum, actCurrentMonth, actCurrentYear);
            if (tasksOnDay.length > 0) {
                btn.classList.add('has-tasks');
                btn.title = tasksOnDay.length + ' tarea(s)';
            }

            var dateStr = actCurrentYear + '-' + String(actCurrentMonth + 1).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
            if (selectedFilterDate === dateStr) btn.classList.add('date-active');

            btn.addEventListener('click', function () {
                selectedFilterDate = selectedFilterDate === dateStr ? null : dateStr;
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
        filterTitle.textContent = d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else {
        filterTitle.textContent = 'Todas las tareas';
    }
}

// ===== ESCAPADO =====
function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== TARJETAS =====
function renderTaskCard(task) {
    var taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.id = task.id;
    if (task.completed) taskCard.classList.add('completed');

    var priorityLabel = { alta: 'Alta', media: 'Media', baja: 'Baja' };
    var prio = task.priority || 'media';
    var checkedAttr = task.completed ? ' checked' : '';
    var clienteName = task.cliente_id ? getClienteName(task.cliente_id) : (task.nombre || 'Sin cliente');

    taskCard.innerHTML =
        '<div class="card-actions">' +
            '<button class="btn-card-action btn-edit" title="Editar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
            '</button>' +
            '<button class="btn-card-action btn-delete-card" title="Eliminar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>' +
            '</button>' +
        '</div>' +
        '<div class="card-header">' +
            '<input type="checkbox" class="checkbox-complete" title="Marcar como completada"' + checkedAttr + '>' +
            '<h3>' + escapeHtml(clienteName) + '</h3>' +
            '<span class="priority-badge priority-' + prio + '">' + (priorityLabel[prio] || 'Media') + '</span>' +
        '</div>' +
        '<p class="materia">' + escapeHtml(task.materia) + '</p>' +
        '<p class="descripcion">' + escapeHtml(task.descripcion) + '</p>' +
        '<p class="fecha">Entrega: ' + escapeHtml(task.fecha) + '</p>';

    taskCard.querySelector('.checkbox-complete').addEventListener('change', function () {
        var newCompleted = this.checked;
        supabaseClient.from('tareas').update({ completed: newCompleted }).eq('id', task.id).then(function () {
            task.completed = newCompleted;
            if (newCompleted) taskCard.classList.add('completed');
            else taskCard.classList.remove('completed');
            renderActividadesCalendar();
        });
    });

    taskCard.querySelector('.btn-delete-card').addEventListener('click', function () {
        showConfirm('¿Eliminar esta actividad?', function () {
            supabaseClient.from('tareas').delete().eq('id', task.id).then(function () {
                taskCard.remove();
                allTasks = allTasks.filter(function (t) { return t.id !== task.id; });
                renderActividadesCalendar();
                showToast('Actividad eliminada');
            });
        });
    });

    taskCard.querySelector('.btn-edit').addEventListener('click', function () {
        openEditModal(task);
    });

    return taskCard;
}

// ===== EDITAR TAREA =====
var editModalOverlay = document.getElementById('edit-modal-overlay');
var editingTaskId = null;

function openEditModal(task) {
    editingTaskId = task.id;
    document.getElementById('edit-materia').value = task.materia;
    document.getElementById('edit-descripcion').value = task.descripcion;
    document.getElementById('edit-prioridad').value = task.priority || 'media';
    editModalOverlay.classList.add('active');
}

document.getElementById('edit-modal-cancel').addEventListener('click', function () {
    editModalOverlay.classList.remove('active');
    editingTaskId = null;
});

editModalOverlay.addEventListener('click', function (e) {
    if (e.target === editModalOverlay) {
        editModalOverlay.classList.remove('active');
        editingTaskId = null;
    }
});

document.getElementById('edit-modal-save').addEventListener('click', async function () {
    var materia = document.getElementById('edit-materia').value.trim();
    var descripcion = document.getElementById('edit-descripcion').value.trim();
    var prioridad = document.getElementById('edit-prioridad').value;

    if (!materia || !descripcion) {
        showToast('Completa todos los campos');
        return;
    }

    var result = await supabaseClient
        .from('tareas')
        .update({ materia: materia, descripcion: descripcion, priority: prioridad })
        .eq('id', editingTaskId);

    if (result.error) {
        showToast('Error al actualizar');
        return;
    }

    for (var i = 0; i < allTasks.length; i++) {
        if (allTasks[i].id === editingTaskId) {
            allTasks[i].materia = materia;
            allTasks[i].descripcion = descripcion;
            allTasks[i].priority = prioridad;
            break;
        }
    }

    editModalOverlay.classList.remove('active');
    editingTaskId = null;
    renderAllTaskCards();
    renderActividadesCalendar();
    showToast('Actividad actualizada');
});

// ===== FILTROS =====
var searchInput = document.getElementById('search-input');
var filterStatus = document.getElementById('filter-status');
var filterPriority = document.getElementById('filter-priority');

function taskMatchesFilters(task) {
    var query = (searchInput.value || '').toLowerCase().trim();
    var status = filterStatus.value;
    var priority = filterPriority.value;

    if (selectedFilterDate && task.fecha_iso !== selectedFilterDate) return false;

    if (query) {
        var cn = task.cliente_id ? getClienteName(task.cliente_id) : (task.nombre || '');
        var text = (cn + ' ' + task.materia + ' ' + task.descripcion).toLowerCase();
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
        if (taskMatchesFilters(task)) container.appendChild(renderTaskCard(task));
    });
}

searchInput.addEventListener('input', renderAllTaskCards);
filterStatus.addEventListener('change', renderAllTaskCards);
filterPriority.addEventListener('change', renderAllTaskCards);

// ===== HISTORIAL =====
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
        var cn = t.cliente_id ? getClienteName(t.cliente_id) : (t.nombre || '-');
        var estadoHtml = t.completed ? '<span class="estado-completada">Completada</span>' : '<span class="estado-pendiente">Pendiente</span>';
        tr.innerHTML =
            '<td class="td-cliente">' + escapeHtml(cn) + '</td>' +
            '<td>' + escapeHtml(t.materia) + '</td>' +
            '<td>' + escapeHtml(t.descripcion) + '</td>' +
            '<td class="td-fecha">' + escapeHtml(t.fecha) + '</td>' +
            '<td><span class="priority-badge priority-' + (t.priority || 'media') + '">' + (priorityLabel[t.priority] || 'Media') + '</span></td>' +
            '<td>' + estadoHtml + '</td>' +
            '<td><button class="btn-table-delete" title="Eliminar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button></td>';

        tr.querySelector('.btn-table-delete').addEventListener('click', function () {
            showConfirm('¿Eliminar esta actividad?', function () {
                supabaseClient.from('tareas').delete().eq('id', t.id).then(function () {
                    allTasks = allTasks.filter(function (x) { return x.id !== t.id; });
                    renderHistorial();
                    renderAllTaskCards();
                    renderActividadesCalendar();
                    showToast('Actividad eliminada');
                });
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
    if (result.error) return;
    allTasks = result.data;
    renderAllTaskCards();
    renderActividadesCalendar();
}

var form = document.getElementById('task-form');

form.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    var clienteNombre = clienteInput.value.trim();
    var materia = document.getElementById('materia').value;
    var tarea = document.getElementById('tarea').value;
    var fecha = dateInput.value;
    var fechaIso = dateInput.dataset.iso || '';
    var prioridad = document.getElementById('prioridad').value;

    if (!clienteNombre) { showToast('Ingresa el nombre del cliente'); return; }

    var clienteId = selectedClienteId;

    if (!clienteId) {
        var exactMatch = allClients.filter(function (c) {
            return c.nombre.toLowerCase() === clienteNombre.toLowerCase();
        });
        if (exactMatch.length > 0) {
            clienteId = exactMatch[0].id;
        } else {
            var clientResult = await supabaseClient
                .from('clientes')
                .insert([{ nombre: clienteNombre }])
                .select()
                .single();
            if (clientResult.error) { showToast('Error al crear cliente'); return; }
            allClients.push(clientResult.data);
            populateHistorialClienteFilter();
            clienteId = clientResult.data.id;
            showToast('Cliente "' + clienteNombre + '" creado');
        }
    }

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

    if (result.error) { showToast('Error al guardar la tarea'); return; }

    allTasks.unshift(result.data);
    renderAllTaskCards();
    renderActividadesCalendar();

    form.reset();
    document.getElementById('prioridad').value = 'media';
    clienteInput.value = '';
    selectedClienteId = null;
    clienteIndicator.className = 'cliente-indicator';
    clienteIndicator.textContent = '';
    selectedDate = null;
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderFormCalendar();

    showToast('Tarea guardada correctamente');
});

// ===== AJUSTES: RESET =====
document.getElementById('btn-reset-data').addEventListener('click', function () {
    showConfirm('¿Estás seguro? Se eliminarán TODAS las tareas y clientes. Esta acción no se puede deshacer.', async function () {
        var err1 = await supabaseClient.from('tareas').delete().gte('id', 0);
        if (err1.error) console.error('Error al borrar tareas:', err1.error);
        var err2 = await supabaseClient.from('clientes').delete().gte('id', 0);
        if (err2.error) console.error('Error al borrar clientes:', err2.error);
        allTasks = [];
        allClients = [];
        renderAllTaskCards();
        renderActividadesCalendar();
        populateHistorialClienteFilter();
        showToast('Todos los datos han sido eliminados');
    });
});

// ===== INICIO =====
async function init() {
    await loadClients();
    await loadTasks();
    updateFilterTitle();
}

init();

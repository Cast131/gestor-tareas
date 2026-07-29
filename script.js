var SUPABASE_URL = 'https://fysjierhimzjpotfwbkf.supabase.co';
var SUPABASE_KEY = 'sb_publishable_msOvy_8roFVAn_eDmVRGHQ__MfBNzV3';
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

var dateInput = document.getElementById('fecha');
var calendarDropdown = document.getElementById('calendar-dropdown');
var calMonthYear = document.getElementById('cal-month-year');
var calendarDays = document.getElementById('calendar-days');
var calPrev = document.getElementById('cal-prev');
var calNext = document.getElementById('cal-next');
var form = document.getElementById('task-form');
var tasksContainer = document.getElementById('tasks-container');
var searchInput = document.getElementById('search-input');
var filterStatus = document.getElementById('filter-status');
var filterPriority = document.getElementById('filter-priority');

var currentDate = new Date();
var selectedDate = null;
var currentMonth = currentDate.getMonth();
var currentYear = currentDate.getFullYear();
var allTasks = [];

function renderCalendar() {
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
                var formatted = selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                dateInput.value = formatted;
                dateInput.dataset.iso = selectedDate.toISOString().split('T')[0];
                renderCalendar();
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
    renderCalendar();
});

calPrev.addEventListener('click', function (e) {
    e.stopPropagation();
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
});

calNext.addEventListener('click', function (e) {
    e.stopPropagation();
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
});

document.addEventListener('click', function (e) {
    if (!calendarDropdown.contains(e.target) && e.target !== dateInput) {
        calendarDropdown.classList.remove('active');
    }
});

function escapeHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

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

    taskCard.innerHTML =
        '<button class="btn-delete">Borrar</button>' +
        '<div class="card-header">' +
            '<input type="checkbox" class="checkbox-complete" title="Marcar como completada"' + checkedAttr + '>' +
            '<h3>' + escapeHtml(task.nombre) + '</h3>' +
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
                applyFilters();
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
            });
    });

    return taskCard;
}

function applyFilters() {
    var query = (searchInput.value || '').toLowerCase().trim();
    var status = filterStatus.value;
    var priority = filterPriority.value;

    var cards = tasksContainer.querySelectorAll('.task-card');
    cards.forEach(function (card) {
        var id = parseInt(card.dataset.id);
        var task = null;
        for (var i = 0; i < allTasks.length; i++) {
            if (allTasks[i].id === id) { task = allTasks[i]; break; }
        }
        if (!task) { card.style.display = ''; return; }

        var show = true;

        if (query) {
            var text = (task.nombre + ' ' + task.materia + ' ' + task.descripcion).toLowerCase();
            if (text.indexOf(query) === -1) show = false;
        }

        if (status === 'pendientes' && task.completed) show = false;
        if (status === 'completadas' && !task.completed) show = false;

        if (priority !== 'todas' && task.priority !== priority) show = false;

        card.style.display = show ? '' : 'none';
    });
}

searchInput.addEventListener('input', applyFilters);
filterStatus.addEventListener('change', applyFilters);
filterPriority.addEventListener('change', applyFilters);

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
    tasksContainer.innerHTML = '';
    allTasks.forEach(function (task) {
        tasksContainer.appendChild(renderTaskCard(task));
    });
}

form.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    var nombre = document.getElementById('nombre').value;
    var materia = document.getElementById('materia').value;
    var tarea = document.getElementById('tarea').value;
    var fecha = dateInput.value;
    var fechaIso = dateInput.dataset.iso || '';
    var prioridad = document.getElementById('prioridad').value;

    var result = await supabaseClient
        .from('tareas')
        .insert([{
            nombre: nombre,
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
        return;
    }

    allTasks.unshift(result.data);
    tasksContainer.prepend(renderTaskCard(result.data));

    form.reset();
    document.getElementById('prioridad').value = 'media';
    selectedDate = null;
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar();
    applyFilters();
});

loadTasks();

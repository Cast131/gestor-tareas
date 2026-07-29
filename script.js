const SUPABASE_URL = 'https://fysjierhimzjpotfwbkf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_msOvy_8roFVAn_eDmVRGHQ__MfBNzV3';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const dateInput = document.getElementById('fecha');
const calendarDropdown = document.getElementById('calendar-dropdown');
const calMonthYear = document.getElementById('cal-month-year');
const calendarDays = document.getElementById('calendar-days');
const calPrev = document.getElementById('cal-prev');
const calNext = document.getElementById('cal-next');
const form = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');

let currentDate = new Date();
let selectedDate = null;
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();

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
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = day;

        var isToday = (
            day === currentDate.getDate() &&
            currentMonth === currentDate.getMonth() &&
            currentYear === currentDate.getFullYear()
        );
        if (isToday) btn.classList.add('today');

        if (
            selectedDate &&
            day === selectedDate.getDate() &&
            currentMonth === selectedDate.getMonth() &&
            currentYear === selectedDate.getFullYear()
        ) {
            btn.classList.add('selected');
        }

        btn.addEventListener('click', function (dayNum) {
            return function () {
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
            };
        }(day));

        calendarDays.appendChild(btn);
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

function renderTaskCard(task) {
    var taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.dataset.id = task.id;

    taskCard.innerHTML =
        '<button class="btn-delete">Borrar</button>' +
        '<h3>' + escapeHtml(task.nombre) + '</h3>' +
        '<p class="materia"><span role="img" aria-label="libro">📚</span> ' + escapeHtml(task.materia) + '</p>' +
        '<p class="descripcion">' + escapeHtml(task.descripcion) + '</p>' +
        '<p class="fecha"><span role="img" aria-label="calendario">📅</span> Entrega: ' + escapeHtml(task.fecha) + '</p>';

    taskCard.querySelector('.btn-delete').addEventListener('click', function () {
        supabase
            .from('tareas')
            .delete()
            .eq('id', task.id)
            .then(function () {
                taskCard.remove();
            });
    });

    return taskCard;
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

async function loadTasks() {
    var { data, error } = await supabase
        .from('tareas')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error al cargar tareas:', error);
        return;
    }

    tasksContainer.innerHTML = '';
    data.forEach(function (task) {
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

    var { data, error } = await supabase
        .from('tareas')
        .insert([{
            nombre: nombre,
            materia: materia,
            descripcion: tarea,
            fecha: fecha,
            fecha_iso: fechaIso
        }])
        .select()
        .single();

    if (error) {
        console.error('Error al guardar tarea:', error);
        return;
    }

    tasksContainer.prepend(renderTaskCard(data));

    form.reset();
    selectedDate = null;
    currentMonth = currentDate.getMonth();
    currentYear = currentDate.getFullYear();
    renderCalendar();
});

loadTasks();

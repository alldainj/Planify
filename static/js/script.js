
const weekGrid = document.getElementById("weekGrid");
const monthLabel = document.getElementById("monthLabel");
const todayLabel = document.getElementById("todayLabel");
const eventList = document.getElementById("eventList");

const modal = document.getElementById("eventModal");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");

const eventTitle = document.getElementById("eventTitle");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventCategory = document.getElementById("eventCategory");
const eventReminder = document.getElementById("eventReminder");
const saveEvent = document.getElementById("saveEvent");

const quickInput = document.getElementById("quickInput");
const quickAdd = document.getElementById("quickAdd");

const searchEvents = document.getElementById("searchEvents");
const filterDate = document.getElementById("filterDate");
const filterCategory = document.getElementById("filterCategory");
const resetFilters = document.getElementById("resetFilters");

const overviewPage = document.getElementById("overviewPage");
const completedPage = document.getElementById("completedPage");
const statisticsPage = document.getElementById("statisticsPage");
const remindersPage = document.getElementById("remindersPage");
const settingsPage = document.getElementById("settingsPage");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const completedList = document.getElementById("completedList");
const remindersList = document.getElementById("remindersList");

const completedCount = document.getElementById("completedCount");
const activeCount = document.getElementById("activeCount");

let currentDate = new Date();
let selectedDate = dateKey(new Date());
let editingIndex = null;
let currentPage = "overview";

let events = JSON.parse(
    localStorage.getItem("planifyEvents") || "[]"
);

// ==========================================
// ПРИОРИТЕТЫ
// ==========================================

const priorityOptions = [
    { value: "high", label: "🔴 Высокий" },
    { value: "medium", label: "🟡 Средний" },
    { value: "low", label: "🟢 Низкий" }
];

const priorityField = document.createElement("div");
priorityField.className = "priority-field";

const priorityLabel = document.createElement("label");
priorityLabel.textContent = "Приоритет";

const eventPriority = document.createElement("select");
eventPriority.id = "eventPriority";

priorityOptions.forEach(option => {
    const element = document.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    eventPriority.append(element);
});

eventPriority.value = "medium";

priorityField.append(priorityLabel, eventPriority);

if (eventCategory && eventCategory.parentElement) {
    eventCategory.parentElement.insertAdjacentElement(
        "afterend",
        priorityField
    );
}

const priorityStyles = document.createElement("style");

priorityStyles.textContent = `
.priority-field {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-top: 12px;
}

.priority-field label {
    color: var(--text);
    font-size: 13px;
    font-weight: 600;
}

.priority-field select {
    width: 100%;
    padding: 12px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 9px;
    color: var(--text);
    outline: none;
    font-size: 13px;
}

.priority-field select:focus {
    border-color: var(--accent);
}

.priority-field select option {
    background: var(--panel);
    color: var(--text);
}

.event-priority {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    margin-top: 7px;
    padding: 5px 9px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 700;
}

.priority-high {
    background: #48252B;
    color: #FF9A9A;
}

.priority-medium {
    background: #493C20;
    color: #F5D17A;
}

.priority-low {
    background: #1E4033;
    color: #91E0B5;
}
`;

document.head.append(priorityStyles);

// ==========================================
// МИГРАЦИЯ И СОХРАНЕНИЕ СОБЫТИЙ
// ==========================================

events.forEach(event => {
    if (!event.id) event.id = createId();
    if (event.reminder === undefined) event.reminder = 15;
    if (event.reminded === undefined) event.reminded = false;
    if (event.completed === undefined) event.completed = false;
    if (!event.category) event.category = "Другое";
    if (!event.priority) event.priority = "medium";
});

function saveEvents() {
    localStorage.setItem(
        "planifyEvents",
        JSON.stringify(events)
    );
}

saveEvents();

function createId() {
    return Date.now().toString(36) +
        Math.random().toString(36).slice(2);
}

function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const weekdays = [
    "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"
];

const months = [
    "Январь", "Февраль", "Март", "Апрель",
    "Май", "Июнь", "Июль", "Август",
    "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
];

// ==========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==========================================

function detectCategory(title) {
    const text = title.toLowerCase();

    if (/математ|русск|английск|урок|школ|домашн|экзамен|учёб|учеб|физик|хими|биолог|истори|географ|литератур/.test(text)) {
        return "Учёба";
    }

    if (/работ|проект|совещан|собеседован|задач|офис/.test(text)) {
        return "Работа";
    }

    if (/спорт|трениров|футбол|баскетбол|бег|зал|плаван|волейбол|теннис/.test(text)) {
        return "Спорт";
    }

    if (/встреч|друз|кино|магазин|покуп|отдых|прогул|день рожд/.test(text)) {
        return "Личное";
    }

    return "Другое";
}

function formatReminder(minutes) {
    minutes = Number(minutes);

    if (minutes === 1440) return "1 день";
    if (minutes === 60) return "1 час";

    return `${minutes} мин.`;
}

function formatDate(dateString) {
    const date = new Date(dateString + "T12:00:00");

    return date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function getCompletionDate(event) {
    return event.completedAt || event.date;
}

function getCategoryClass(category) {
    const classes = {
        "Учёба": "category-study",
        "Работа": "category-work",
        "Спорт": "category-sport",
        "Личное": "category-personal",
        "Другое": "category-other"
    };

    return classes[category] || "category-other";
}

function createCategoryBadge(category) {
    const badge = document.createElement("span");

    badge.className =
        `event-category ${getCategoryClass(category)}`;

    badge.textContent = category || "Другое";

    return badge;
}

function getPriorityLabel(priority) {
    const labels = {
        high: "🔴 Высокий приоритет",
        medium: "🟡 Средний приоритет",
        low: "🟢 Низкий приоритет"
    };

    return labels[priority] || labels.medium;
}

function getPriorityClass(priority) {
    const classes = {
        high: "priority-high",
        medium: "priority-medium",
        low: "priority-low"
    };

    return classes[priority] || "priority-medium";
}

function createPriorityBadge(priority) {
    const badge = document.createElement("span");

    badge.className =
        `event-priority ${getPriorityClass(priority)}`;

    badge.textContent = getPriorityLabel(priority);

    return badge;
}

function sortByPriority(a, b) {
    const priorityOrder = {
        high: 1,
        medium: 2,
        low: 3
    };

    const priorityA = priorityOrder[a.priority] || 2;
    const priorityB = priorityOrder[b.priority] || 2;

    if (priorityA !== priorityB) {
        return priorityA - priorityB;
    }

    const dateCompare = a.date.localeCompare(b.date);

    return dateCompare || a.time.localeCompare(b.time);
}

// ==========================================
// УВЕДОМЛЕНИЯ
// ==========================================

async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("Браузер не поддерживает уведомления.");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission === "denied") {
        alert("Разреши уведомления для Planify в настройках браузера.");
        return false;
    }

    const permission = await Notification.requestPermission();

    return permission === "granted";
}

// ==========================================
// НАВИГАЦИЯ
// ==========================================

function showPage(page) {
    currentPage = page;

    [
        overviewPage,
        completedPage,
        statisticsPage,
        remindersPage,
        settingsPage
    ].forEach(element => {
        if (element) {
            element.classList.add("hidden-page");
        }
    });

    document.querySelectorAll(".side-nav a").forEach(link => {
        link.classList.remove("active");
    });

    const activeLink = document.querySelector(
        `.side-nav a[data-page="${page}"]`
    );

    if (activeLink) {
        activeLink.classList.add("active");
    }

    if (page === "overview" || page === "calendar") {
        if (overviewPage) {
            overviewPage.classList.remove("hidden-page");
        }

        pageTitle.textContent = "Мой календарь";
        pageSubtitle.textContent = "Планируй своё время с умом";

        if (page === "calendar") {
            setTimeout(() => {
                const calendarSection =
                    document.getElementById("calendarSection");

                if (calendarSection) {
                    calendarSection.scrollIntoView({
                        behavior: "smooth"
                    });
                }
            }, 50);
        }
    }

    if (page === "completed") {
        completedPage.classList.remove("hidden-page");

        pageTitle.textContent = "Выполненные";
        pageSubtitle.textContent = "Твои завершённые мероприятия";

        renderCompleted();
    }

    if (page === "statistics") {
        statisticsPage.classList.remove("hidden-page");

        pageTitle.textContent = "Статистика";
        pageSubtitle.textContent = "Твои результаты и достижения";

        renderStatistics();
    }

    if (page === "reminders") {
        remindersPage.classList.remove("hidden-page");

        pageTitle.textContent = "Напоминания";
        pageSubtitle.textContent = "Не забывай о важных событиях";

        renderReminders();
    }

    if (page === "settings") {
        if (settingsPage) {
            settingsPage.classList.remove("hidden-page");
        }

        pageTitle.textContent = "Внешний вид";
        pageSubtitle.textContent = "Настрой Planify под себя";

        updateThemeButtons();
    }

    const mainContent = document.querySelector(".main-content");

    if (mainContent) {
        mainContent.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

document.querySelectorAll(".side-nav a[data-page]").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

// ==========================================
// КАЛЕНДАРЬ
// ==========================================

function getMonday(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);

    const day = (result.getDay() + 6) % 7;

    result.setDate(result.getDate() - day);

    return result;
}

function renderCalendar() {
    weekGrid.innerHTML = "";

    const monday = getMonday(currentDate);

    monthLabel.textContent =
        `${months[monday.getMonth()]} ${monday.getFullYear()}`;

    const today = dateKey(new Date());

    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);

        const key = dateKey(date);

        const dayEvents = events.filter(
            event => event.date === key && !event.completed
        );

        const card = document.createElement("div");
        card.className = "day-card";

        if (key === today) {
            card.classList.add("today");
        }

        if (key === selectedDate) {
            card.classList.add("selected");
        }

        card.addEventListener("click", () => {
            selectedDate = key;
            renderCalendar();
        });

        const name = document.createElement("div");
        name.className = "day-name";
        name.textContent = weekdays[i];

        const number = document.createElement("div");
        number.className = "day-number";
        number.textContent = date.getDate();

        card.append(name, number);

        if (dayEvents.length > 0) {
            const dot = document.createElement("span");
            dot.className = "day-dot";
            card.append(dot);
        }

        weekGrid.append(card);
    }

    renderEvents();
}

// ==========================================
// СОБЫТИЯ И ФИЛЬТРЫ
// ==========================================

function createActionButton(className, html, callback) {
    const button = document.createElement("button");

    button.className = `event-action ${className}`;
    button.innerHTML = html;

    button.addEventListener("click", callback);

    return button;
}

function hasActiveFilters() {
    return Boolean(
        searchEvents.value.trim() ||
        filterDate.value ||
        filterCategory.value
    );
}

function getFilteredEvents() {
    const search = searchEvents.value.trim().toLowerCase();
    const date = filterDate.value;
    const category = filterCategory.value;

    return events
        .map((event, index) => ({
            ...event,
            originalIndex: index
        }))
        .filter(event => !event.completed)
        .filter(event => {
            if (hasActiveFilters()) {
                return true;
            }

            return event.date === selectedDate;
        })
        .filter(event => {
            if (search && !event.title.toLowerCase().includes(search)) {
                return false;
            }

            if (date && event.date !== date) {
                return false;
            }

            if (category && event.category !== category) {
                return false;
            }

            return true;
        })
        .sort(sortByPriority);
}

function fillEditForm(event) {
    editingIndex = event.originalIndex;

    eventTitle.value = event.title;
    eventDate.value = event.date;
    eventTime.value = event.time;
    eventCategory.value = event.category || "Другое";
    eventReminder.value = String(event.reminder ?? 15);
    eventPriority.value = event.priority || "medium";

    modal.classList.remove("hidden");
}

function renderEvents() {
    eventList.innerHTML = "";

    const selectedEvents = getFilteredEvents();

    if (selectedEvents.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty";

        empty.textContent = hasActiveFilters()
            ? "По заданным фильтрам мероприятий не найдено."
            : "На этот день активных событий пока нет.";

        eventList.append(empty);
        return;
    }

    selectedEvents.forEach(event => {
        const item = document.createElement("div");
        item.className = "event-item";

        const title = document.createElement("strong");
        title.textContent = event.title;

        const category = createCategoryBadge(event.category);
        const priority = createPriorityBadge(event.priority);

        const details = document.createElement("small");

        const reminderText = Number(event.reminder) > 0
            ? ` • Напоминание за ${formatReminder(event.reminder)}`
            : " • Без напоминания";

        details.textContent =
            `${formatDate(event.date)} • ${event.time}${reminderText}`;

        const actions = document.createElement("div");
        actions.className = "event-actions";

        const complete = createActionButton(
            "complete-action",
            "<span>✓</span> Выполнено",
            () => {
                events[event.originalIndex].completed = true;
                events[event.originalIndex].completedAt = dateKey(new Date());

                saveEvents();
                renderAll();
            }
        );

        const edit = createActionButton(
            "edit-action",
            "<span>✎</span> Изменить",
            () => fillEditForm(event)
        );

        const remove = createActionButton(
            "delete-action",
            "<span>⌫</span> Удалить",
            () => {
                if (!confirm("Удалить это мероприятие?")) return;

                events.splice(event.originalIndex, 1);

                saveEvents();
                renderAll();
            }
        );

        actions.append(complete, edit, remove);
        item.append(title, category, priority, actions, details);
        eventList.append(item);
    });
}

searchEvents.addEventListener("input", renderEvents);
filterDate.addEventListener("change", renderEvents);
filterCategory.addEventListener("change", renderEvents);

resetFilters.addEventListener("click", () => {
    searchEvents.value = "";
    filterDate.value = "";
    filterCategory.value = "";

    renderEvents();
});

// ==========================================
// ВЫПОЛНЕННЫЕ СОБЫТИЯ
// ==========================================

function renderCompleted() {
    completedList.innerHTML = "";

    const completedEvents = events
        .map((event, index) => ({
            ...event,
            originalIndex: index
        }))
        .filter(event => event.completed)
        .sort(sortByPriority);

    const activeEvents = events.filter(event => !event.completed);

    completedCount.textContent = completedEvents.length;
    activeCount.textContent = activeEvents.length;

    if (completedEvents.length === 0) {
        completedList.innerHTML =
            '<p class="empty">Пока нет выполненных мероприятий. Заверши первое дело в календаре!</p>';
        return;
    }

    completedEvents.forEach(event => {
        const item = document.createElement("div");
        item.className = "event-item completed-event";

        const title = document.createElement("strong");
        title.className = "completed-title";
        title.textContent = event.title;

        const category = createCategoryBadge(event.category);
        const priority = createPriorityBadge(event.priority);

        const details = document.createElement("small");
        details.textContent =
            `${formatDate(event.date)} • ${event.time} • Выполнено: ${formatDate(getCompletionDate(event))}`;

        const actions = document.createElement("div");
        actions.className = "event-actions";

        const restore = createActionButton(
            "undo-action",
            "<span>↩</span> Вернуть",
            () => {
                events[event.originalIndex].completed = false;
                delete events[event.originalIndex].completedAt;

                saveEvents();
                renderAll();
            }
        );

        const remove = createActionButton(
            "delete-action",
            "<span>⌫</span> Удалить",
            () => {
                if (!confirm("Удалить это мероприятие навсегда?")) return;

                events.splice(event.originalIndex, 1);

                saveEvents();
                renderAll();
            }
        );

        actions.append(restore, remove);
        item.append(title, category, priority, actions, details);
        completedList.append(item);
    });
}

// ==========================================
// СТАТИСТИКА
// ==========================================

function renderStatistics() {
    const total = events.length;

    const completedEvents = events.filter(
        event => event.completed
    );

    const activeEvents = events.filter(
        event => !event.completed
    );

    const done = completedEvents.length;
    const pending = activeEvents.length;

    const percentage = total > 0
        ? Math.round((done / total) * 100)
        : 0;

    document.getElementById("totalStats").textContent = total;
    document.getElementById("doneStats").textContent = done;
    document.getElementById("pendingStats").textContent = pending;
    document.getElementById("completionRate").textContent = `${percentage}%`;

    document.getElementById("progressLabel").textContent =
        `${percentage}%`;

    document.getElementById("progressBar").style.width =
        `${percentage}%`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monday = getMonday(today);
    const mondayKey = dateKey(monday);
    const todayKey = dateKey(today);

    const monthStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    const monthStartKey = dateKey(monthStart);

    const completedDates = completedEvents.map(event =>
        getCompletionDate(event)
    );

    const weekDone = completedDates.filter(date =>
        date >= mondayKey && date <= todayKey
    ).length;

    const monthDone = completedDates.filter(date =>
        date >= monthStartKey && date <= todayKey
    ).length;

    document.getElementById("weekStats").textContent = weekDone;
    document.getElementById("monthStats").textContent = monthDone;

    renderActivityChart(completedDates);
}

function renderActivityChart(completedDates) {
    const chart = document.getElementById("activityChart");
    chart.innerHTML = "";

    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setHours(0, 0, 0, 0);
        date.setDate(today.getDate() - i);

        const key = dateKey(date);

        const count = completedDates.filter(
            completionDate => completionDate === key
        ).length;

        const label = date.toLocaleDateString("ru-RU", {
            weekday: "short"
        });

        days.push({
            key,
            label,
            count
        });
    }

    const maxCount = Math.max(
        1,
        ...days.map(day => day.count)
    );

    days.forEach(day => {
        const column = document.createElement("div");
        column.className = "chart-day";

        const value = document.createElement("span");
        value.className = "chart-value";
        value.textContent = day.count;

        const barArea = document.createElement("div");
        barArea.className = "chart-bar-area";

        const bar = document.createElement("div");
        bar.className = "chart-bar";

        const height = day.count > 0
            ? Math.max(8, (day.count / maxCount) * 100)
            : 0;

        bar.style.height = `${height}%`;

        const label = document.createElement("span");
        label.className = "chart-label";
        label.textContent = day.label;

        barArea.append(bar);
        column.append(value, barArea, label);
        chart.append(column);
    });
}

// ==========================================
// НАПОМИНАНИЯ
// ==========================================

function renderReminders() {
    remindersList.innerHTML = "";

    const activeReminders = events
        .map((event, index) => ({
            ...event,
            originalIndex: index
        }))
        .filter(event =>
            !event.completed && Number(event.reminder) > 0
        )
        .sort(sortByPriority);

    if (activeReminders.length === 0) {
        remindersList.innerHTML =
            '<p class="empty">Пока нет активных напоминаний.</p>';
        return;
    }

    activeReminders.forEach(event => {
        const item = document.createElement("div");
        item.className = "event-item";

        const title = document.createElement("strong");
        title.textContent = event.title;

        const category = createCategoryBadge(event.category);
        const priority = createPriorityBadge(event.priority);

        const details = document.createElement("small");
        details.textContent =
            `${formatDate(event.date)} • ${event.time} • За ${formatReminder(event.reminder)}`;

        const actions = document.createElement("div");
        actions.className = "event-actions";

        const edit = createActionButton(
            "edit-action",
            "<span>✎</span> Изменить",
            () => fillEditForm(event)
        );

        actions.append(edit);
        item.append(title, category, priority, actions, details);
        remindersList.append(item);
    });
}

// ==========================================
// ОБНОВЛЕНИЕ РАЗДЕЛОВ
// ==========================================

function renderAll() {
    renderCalendar();
    renderCompleted();
    renderReminders();

    if (currentPage === "statistics") {
        renderStatistics();
    }
}

// ==========================================
// ДОБАВЛЕНИЕ СОБЫТИЙ
// ==========================================

function addEvent(
    title,
    date,
    time,
    reminder = 15,
    category = "Другое",
    priority = "medium"
) {
    if (!title || !date || !time) {
        alert("Заполни все поля.");
        return;
    }

    events.push({
        id: createId(),
        title,
        date,
        time,
        category,
        priority,
        reminder: Number(reminder),
        reminded: false,
        completed: false
    });

    saveEvents();
    renderAll();
}

// ==========================================
// БЫСТРОЕ ДОБАВЛЕНИЕ
// ==========================================

function parseSmartDate(text) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    const phrase = text.match(
        /(сегодня|завтра|послезавтра|в\s+(понедельник|вторник|среду|четверг|пятницу|субботу|воскресенье))/i
    );

    if (!phrase) return null;

    const word = phrase[1].toLowerCase();

    if (word === "завтра") {
        date.setDate(date.getDate() + 1);
    } else if (word === "послезавтра") {
        date.setDate(date.getDate() + 2);
    } else if (word.startsWith("в ")) {
        const days = {
            "понедельник": 1,
            "вторник": 2,
            "среду": 3,
            "четверг": 4,
            "пятницу": 5,
            "субботу": 6,
            "воскресенье": 0
        };

        const target = days[word.split(" ")[1]];
        const difference = (target - date.getDay() + 7) % 7;

        date.setDate(date.getDate() + difference);
    }

    return dateKey(date);
}

function parseSmartEvent(text) {
    const date = parseSmartDate(text);
    const timeMatch = text.match(/(\d{1,2}):(\d{2})/);

    if (!date || !timeMatch) return null;

    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);

    if (hours > 23 || minutes > 59) return null;

    const title = text
        .replace(
            /сегодня|завтра|послезавтра|в\s+(понедельник|вторник|в среду|четверг|пятницу|субботу|воскресенье)/i,
            ""
        )
        .replace(/\d{1,2}:\d{2}/, "")
        .replace(/^[\s,.:—-]+|[\s,.:—-]+$/g, "")
        .replace(/^в\s+/i, "")
        .trim();

    if (!title) return null;

    return {
        id: createId(),
        title,
        date,
        time: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
        category: detectCategory(title),
        priority: "medium",
        reminder: 15,
        reminded: false,
        completed: false
    };
}

quickAdd.addEventListener("click", async () => {
    const text = quickInput.value.trim();

    if (!text) {
        alert("Напиши свой план.");
        return;
    }

    const parts = text.split(/[,;\n]+/);
    const parsedEvents = parts.map(parseSmartEvent);

    if (parsedEvents.some(event => event === null)) {
        alert("Не удалось распознать часть расписания.");
        return;
    }

    await requestNotificationPermission();

    events.push(...parsedEvents);

    saveEvents();
    renderAll();

    quickInput.value = "";
});

// ==========================================
// МОДАЛЬНОЕ ОКНО
// ==========================================

function openEventModal() {
    editingIndex = null;

    modal.classList.remove("hidden");

    eventDate.value = selectedDate || dateKey(new Date());
    eventTime.value = "12:00";
    eventTitle.value = "";
    eventCategory.value = "Другое";
    eventReminder.value = "15";
    eventPriority.value = "medium";

    eventTitle.focus();
}

function closeEventModal() {
    modal.classList.add("hidden");
    editingIndex = null;
}

openModal.addEventListener("click", openEventModal);
closeModal.addEventListener("click", closeEventModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeEventModal();
    }
});

saveEvent.addEventListener("click", async () => {
    const title = eventTitle.value.trim();
    const date = eventDate.value;
    const time = eventTime.value;
    const category = eventCategory.value;
    const reminder = Number(eventReminder.value);
    const priority = eventPriority.value;

    if (!title || !date || !time) {
        alert("Заполни все поля.");
        return;
    }

    await requestNotificationPermission();

    if (editingIndex !== null) {
        events[editingIndex] = {
            ...events[editingIndex],
            title,
            date,
            time,
            category,
            reminder,
            priority,
            reminded: false
        };

        editingIndex = null;
    } else {
        addEvent(
            title,
            date,
            time,
            reminder,
            category,
            priority
        );
    }

    selectedDate = date;
    currentDate = new Date(date + "T12:00:00");

    saveEvents();
    renderAll();

    eventTitle.value = "";
    closeEventModal();
});

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ НЕДЕЛЬ
// ==========================================

document.getElementById("prevWeek").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 7);
    renderCalendar();
});

document.getElementById("nextWeek").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 7);
    renderCalendar();
});

// ==========================================
// ПРОВЕРКА НАПОМИНАНИЙ
// ==========================================

function checkReminders() {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const now = new Date();
    let changed = false;

    events.forEach(event => {
        if (event.reminded || event.completed) return;

        const reminderMinutes = Number(event.reminder ?? 0);

        if (reminderMinutes <= 0) return;

        const eventDateTime = new Date(
            `${event.date}T${event.time}:00`
        );

        const reminderTime = new Date(
            eventDateTime.getTime() - reminderMinutes * 60000
        );

        if (now >= reminderTime && now < eventDateTime) {
            new Notification("Planify — напоминание", {
                body: `${event.title} начнётся в ${event.time}`,
                tag: `planify-${event.id}`
            });

            event.reminded = true;
            changed = true;
        }
    });

    if (changed) saveEvents();
}

setInterval(checkReminders, 15000);

// ==========================================
// ПЕРЕКЛЮЧЕНИЕ ТЕМЫ
// ==========================================

function getCurrentTheme() {
    if (window.planifyTheme &&
        typeof window.planifyTheme.get === "function") {
        return window.planifyTheme.get();
    }

    return localStorage.getItem("planifyTheme") || "dark";
}

function updateThemeButtons() {
    const currentTheme = getCurrentTheme();

    document.querySelectorAll("[data-theme-choice]").forEach(button => {
        const selected = button.dataset.themeChoice === currentTheme;

        button.setAttribute("aria-pressed", String(selected));
        button.classList.toggle("active", selected);
    });
}

async function selectTheme(theme) {
    if (theme !== "light" && theme !== "dark") {
        return;
    }

    const status = document.getElementById("themeSaveStatus");

    // Сначала сразу применяем тему
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("planifyTheme", theme);

    updateThemeButtons();

    if (status) {
        status.textContent = "Сохраняем настройки...";
    }

    try {
        if (window.planifyTheme &&
            typeof window.planifyTheme.save === "function") {
            await window.planifyTheme.save(theme);
        } else {
            const response = await fetch("/api/preferences", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ theme })
            });

            if (!response.ok) {
                throw new Error("Ошибка сохранения темы");
            }
        }

        if (status) {
            status.textContent = "Настройки сохранены";
        }
    } catch (error) {
        console.error("Ошибка сохранения темы:", error);

        if (status) {
            status.textContent =
                "Тема применена, но не удалось сохранить её в аккаунте";
        }
    }

    updateThemeButtons();
}

document.querySelectorAll("[data-theme-choice]").forEach(button => {
    button.addEventListener("click", () => {
        selectTheme(button.dataset.themeChoice);
    });
});

document.addEventListener("planify:theme-loaded", updateThemeButtons);
document.addEventListener("planify:theme-changed", updateThemeButtons);

document.addEventListener("DOMContentLoaded", updateThemeButtons);

// ==========================================
// ЗАПУСК
// ==========================================

todayLabel.textContent = new Date().toLocaleDateString(
    "ru-RU",
    {
        day: "numeric",
        month: "long",
        year: "numeric"
    }
);

renderAll();
checkReminders();
updateThemeButtons();

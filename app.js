// App state
let tasks = [];
let currentDate = getTodayDateString();

// SVG Progress Ring configuration
const strokeDashOffsetVal = 169.64; // 2 * pi * r (r = 27)

// DOM Elements
const elements = {
    currentDateDisplay: document.getElementById('current-date-display'),
    datePicker: document.getElementById('date-picker'),
    btnToday: document.getElementById('btn-today'),
    btnYesterday: document.getElementById('btn-yesterday'),
    btnTomorrow: document.getElementById('btn-tomorrow'),
    
    singleAddForm: document.getElementById('single-add-form'),
    taskInput: document.getElementById('task-input'),
    
    bulkImportForm: document.getElementById('bulk-import-form'),
    bulkInput: document.getElementById('bulk-input'),
    
    activeList: document.getElementById('active-list'),
    completedList: document.getElementById('completed-list'),
    activeCount: document.getElementById('active-count'),
    completedCount: document.getElementById('completed-count'),
    postponedList: document.getElementById('postponed-list'),
    postponedCount: document.getElementById('postponed-count'),
    
    progressCircle: document.querySelector('.progress-ring__circle'),
    progressText: document.querySelector('.progress-text'),
    statCompleted: document.getElementById('stat-completed'),
    
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    btnExport: document.getElementById('btn-export'),
    btnImport: document.getElementById('btn-import'),
    fileImport: document.getElementById('file-import'),
    btnReset: document.getElementById('btn-reset'),
    
    completedHeader: document.getElementById('completed-header'),
    postponedHeader: document.getElementById('postponed-header')
};

// Initialize the Application
function init() {
    setupEventListeners();
    loadTasks();
    runRolloverLogic();
    updateDateDisplay();
    render();
}

// Event Listeners Setup
function setupEventListeners() {
    // Date navigation
    elements.datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            setCurrentDate(e.target.value);
        }
    });
    
    elements.btnToday.addEventListener('click', () => setCurrentDate(getTodayDateString()));
    elements.btnYesterday.addEventListener('click', () => setCurrentDate(getRelativeDateString(-1)));
    elements.btnTomorrow.addEventListener('click', () => setCurrentDate(getRelativeDateString(1)));
    
    // Tab switching (Single vs Bulk)
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            console.log('Switching to tab:', tabId);
            // Remove active class from all tab buttons and contents
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            // Activate clicked button
            btn.classList.add('active');
            // Activate corresponding content pane
            const target = document.getElementById(tabId);
            if (target) {
                target.classList.add('active');
            } else {
                console.warn('Tab content element not found for ID:', tabId);
            }
        });
    });
    
    // Forms submission
    elements.singleAddForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = elements.taskInput.value.trim();
        if (text) {
            addTask(text);
            elements.taskInput.value = '';
            showNotification('Task added successfully');
        }
    });
    
    elements.bulkImportForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const bulkText = elements.bulkInput.value.trim();
        if (bulkText) {
            const lines = bulkText.split('\n');
            let count = 0;
            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed) {
                    addTask(trimmed);
                    count++;
                }
            });
            elements.bulkInput.value = '';
            showNotification(`Imported ${count} tasks`);
            // Switch back to single input tab
            elements.tabBtns[0].click();
        }
    });
    
    // Data management
    elements.btnExport.addEventListener('click', exportData);
    elements.btnImport.addEventListener('click', () => elements.fileImport.click());
    elements.fileImport.addEventListener('change', importData);
    elements.btnReset.addEventListener('click', resetDatabase);
    
    // Close menus on clicking outside (use click to avoid hover flicker)
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-postpone') && !e.target.closest('.postpone-menu')) {
            closeAllPostponeMenus();
        }
    });
}

// Core Operations

// Smart parsing of task strings
// Updated parseTask to handle multiple JIRA keys and assignee tags
function parseTask(rawText, dateStr) {
    let title = rawText;
    // Detect assignee tag @Name (red badge)
    let assignee = null;
    const assigneeMatch = title.match(/@([A-Za-z][A-Za-z0-9_-]*)/);
    if (assigneeMatch) {
        assignee = assigneeMatch[1];
        // remove the tag from title
        title = title.replace(assigneeMatch[0], '').trim();
    }
    // Regex for JIRA issue codes (multiple)
    const jiraRegex = /\b([A-Za-z]+)-([0-9]+)\b/g;
    const jiraMatches = [...title.matchAll(jiraRegex)];
    const jiraKeys = [];
    let jiraProject = null;
    let jiraNum = null;
    if (jiraMatches.length) {
        jiraMatches.forEach(m => {
            const key = `${m[1].toUpperCase()}-${parseInt(m[2], 10)}`;
            jiraKeys.push(key);
        });
        // Use first match for project/num sorting convenience
        jiraProject = jiraMatches[0][1].toUpperCase();
        jiraNum = parseInt(jiraMatches[0][2], 10);
        // Remove all JIRA keys from title for clean display
        title = title.replace(jiraRegex, '').trim();
    }
    // Regex for DISCOVERY/RESEARCH badge
    const discoveryTags = /#discovery|#research|\[discovery\]|\[research\]/i;
    const discoveryWords = /\b(discovery|research)\b/i;
    const isDiscovery = discoveryTags.test(title) || discoveryWords.test(title);
    // Regex for SPRINT badge
    const sprintTags = /#sprint|\[sprint\]/i;
    const sprintWords = /\b(sprint)\b/i;
    const isSprint = sprintTags.test(title) || sprintWords.test(title);
    // Clean up hashtag representations if present to keep titles clean
    title = title
        .replace(/#discovery|#research/ig, '')
        .replace(/#sprint/ig, '')
        .replace(/\s+/g, ' ')
        .trim();
    return {
        id: generateUUID(),
        title: title,
        completed: false,
        completedAt: null,
        date: dateStr,
        createdDate: getTodayDateString(),
        postponedFromDate: null,
        isRollover: false,
        isDiscovery: isDiscovery,
        isSprint: isSprint,
        jiraKeys: jiraKeys,
        jiraKey: jiraKeys[0] || null, // legacy single key support
        jiraProject: jiraProject,
        jiraNum: jiraNum,
        assignee: assignee
    };
}

function addTask(text) {
    const task = parseTask(text, currentDate);
    tasks.push(task);
    saveTasks();
    render();
}

function toggleTaskComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        
        // Trigger a tiny micro-animation on task completion
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element && task.completed) {
            element.style.transform = 'scale(0.98)';
            setTimeout(() => {
                element.style.transform = '';
                render();
            }, 200);
        } else {
            render();
        }
    }
}

function deleteTask(id) {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
        element.classList.add('slide-out');
        setTimeout(() => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            render();
        }, 300);
    } else {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
    }
}

function editTaskTitle(id, newTitle) {
    const task = tasks.find(t => t.id === id);
    if (task && newTitle.trim()) {
        // Re-parse in case they added/changed tags
        const parsed = parseTask(newTitle, task.date);
        
        task.title = parsed.title;
        task.isDiscovery = parsed.isDiscovery;
        task.isSprint = parsed.isSprint;
        task.jiraKey = parsed.jiraKey;
        task.jiraProject = parsed.jiraProject;
        task.jiraNum = parsed.jiraNum;
        
        saveTasks();
        render();
    }
}

function postponeTask(id, targetDate) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const originalDate = task.date;
        task.date = targetDate;
        task.postponedFromDate = originalDate;
        saveTasks();
        
        const element = document.querySelector(`[data-id="${id}"]`);
        if (element) {
            element.classList.add('slide-out');
            setTimeout(() => {
                render();
                showNotification(`Task postponed to ${formatFriendlyDate(targetDate)}`);
            }, 300);
        } else {
            render();
        }
    }
}

// Engine: Rollover unfinished tasks to the current day
function runRolloverLogic() {
    const todayStr = getTodayDateString();
    let rolloverCount = 0;
    
    tasks.forEach(task => {
        // If task is unfinished AND its scheduled date is in the past
        if (!task.completed && task.date < todayStr) {
            task.postponedFromDate = task.date; // Note the origin
            task.date = todayStr;              // Move to today
            task.isRollover = true;            // Mark it
            rolloverCount++;
        }
    });
    
    if (rolloverCount > 0) {
        saveTasks();
        showNotification(`Rolled over ${rolloverCount} unfinished tasks to today!`, 'warning');
    }
}

// Sorting Engine
function sortTasks(taskList) {
    return taskList.sort((a, b) => {
        // JIRA tasks first
        const aHasJira = !!a.jiraKey;
        const bHasJira = !!b.jiraKey;
        
        if (aHasJira && !bHasJira) return -1;
        if (!aHasJira && bHasJira) return 1;
        
        if (aHasJira && bHasJira) {
            // Compare JIRA project keys alphabetically
            const projectCompare = a.jiraProject.localeCompare(b.jiraProject);
            if (projectCompare !== 0) return projectCompare;
            
            // Compare issue numbers numerically
            return a.jiraNum - b.jiraNum;
        }
        
        // Non-JIRA tasks: sort alphabetically by title
        return a.title.localeCompare(b.title);
    });
}

// UI Rendering Engine
function render() {
    // Filter tasks for the selected currentDate
    const dayTasks = tasks.filter(t => t.date === currentDate);
    const activeTasks = dayTasks.filter(t => !t.completed);
    const completedTasks = dayTasks.filter(t => t.completed);
    const postponedTasks = tasks.filter(t => !t.completed && t.date && t.date !== currentDate);

    // Sort tasks
    const sortedActive = sortTasks(activeTasks);
    const sortedCompleted = completedTasks.sort((a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt) : 0;
        const dateB = b.completedAt ? new Date(b.completedAt) : 0;
        return dateB - dateA;
    });
    const sortedPostponed = sortTasks(postponedTasks);

    // Render Counts
    elements.activeCount.textContent = sortedActive.length;
    elements.completedCount.textContent = sortedCompleted.length;
    elements.postponedCount.textContent = sortedPostponed.length;

    // Header visibility
    elements.completedHeader.style.display = sortedCompleted.length === 0 ? 'none' : 'flex';
    if (elements.postponedHeader) {
        elements.postponedHeader.style.display = sortedPostponed.length === 0 ? 'none' : 'flex';
    }

    // Render Lists
    elements.activeList.innerHTML = sortedActive.map(renderTaskItem).join('');
    elements.completedList.innerHTML = sortedCompleted.map(renderTaskItem).join('');
    elements.postponedList.innerHTML = sortedPostponed.map(renderTaskItem).join('');

    // Update progress stats
    updateProgress(dayTasks.length, completedTasks.length);
}


function renderTaskItem(task) {
    const isCompleted = task.completed;
    
    // Generate badges
    let badgesHtml = '';
if (task.jiraKeys && task.jiraKeys.length) {
    task.jiraKeys.forEach(key => {
        badgesHtml += `<span class="badge badge-jira">${key}</span>`;
    });
}
if (task.isSprint) {
    badgesHtml += `<span class="badge badge-sprint">Sprint</span>`;
}
if (task.isDiscovery) {
    badgesHtml += `<span class="badge badge-discovery">Discovery</span>`;
}
if (task.isRollover) {
    badgesHtml += `<span class="badge badge-rollover">Rolled Over</span>`;
}
if (task.assignee) {
    badgesHtml += `<span class="badge badge-assignee">${task.assignee}</span>`;
}
if (task.postponedFromDate) {
    const friendlyOrig = formatFriendlyDate(task.postponedFromDate);
    badgesHtml += `<span class="badge badge-postponed-from" title="Originally scheduled for ${task.postponedFromDate}">Postponed from ${friendlyOrig}</span>`;
}
if (task.date && task.date !== currentDate) {
    const friendlyTarget = formatFriendlyDate(task.date);
    badgesHtml += `<span class="badge badge-postponed-to" title="Postponed to ${task.date}">Postponed to ${friendlyTarget}</span>`;
}
    
    return `
        <div class="task-item ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
            <label class="checkbox-container">
                <input type="checkbox" ${isCompleted ? 'checked' : ''} onclick="toggleTaskComplete('${task.id}')">
                <span class="checkmark"></span>
            </label>
            
            <div class="task-content-area">
                <div class="task-title-row">
                    ${badgesHtml}
                    <span class="task-title" id="title-${task.id}" onclick="startEditingTitle('${task.id}')" title="Click to edit">${escapeHTML(task.title)}</span>
                </div>
            </div>
            
            <div class="task-actions">
                ${!isCompleted ? `
                    <button class="btn-action-icon btn-postpone" onclick="togglePostponeMenu(event, '${task.id}')" title="Postpone Task">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M12 14v4M10 16h4"></path></svg>
                    </button>
                ` : ''}
                <button class="btn-action-icon btn-delete" onclick="deleteTask('${task.id}')" title="Delete Task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    `;
}

// Inline edit of task title
window.startEditingTitle = function(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    // Construct the input contents back to raw format so tags can be edited too
    let rawFormat = '';
    if (task.jiraKey) rawFormat += `${task.jiraKey}: `;
    rawFormat += task.title;
    if (task.isSprint) rawFormat += ' #sprint';
    if (task.isDiscovery) rawFormat += ' #discovery';
    
    const titleElement = document.getElementById(`title-${id}`);
    const parentRow = titleElement.parentElement;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text-input';
    input.value = rawFormat;
    input.style.padding = '0.2rem 0.5rem';
    input.style.fontSize = '0.9rem';
    
    // Replace text element temporarily
    titleElement.style.display = 'none';
    parentRow.insertBefore(input, titleElement);
    input.focus();
    
    let isFinished = false;
    
    const finishEdit = () => {
        if (isFinished) return;
        isFinished = true;
        
        const newValue = input.value.trim();
        if (newValue) {
            editTaskTitle(id, newValue);
        } else {
            titleElement.style.display = '';
        }
        input.remove();
    };
    
    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            finishEdit();
        } else if (e.key === 'Escape') {
            isFinished = true;
            titleElement.style.display = '';
            input.remove();
        }
    });
};

// Modal Postpone UI
window.showPostponeModal = function(id) {
    // Find task element (optional, not needed for modal positioning)
    const taskItem = document.querySelector(`[data-id="${id}"]`);
    if (!taskItem) return;

    const modal = document.getElementById('postpone-modal');
    const content = modal.querySelector('.modal-content');
    // Build options HTML
    const tomorrowStr = getRelativeDateString(1);
    const inTwoDaysStr = getRelativeDateString(2);
    // Next Monday calculation
    const today = new Date();
    const resultDate = new Date(today);
    resultDate.setDate(today.getDate() + (1 + 7 - today.getDay()) % 7 || 7);
    const nextMondayStr = formatDateString(resultDate);
    content.innerHTML = `
        <button class="postpone-option" onclick="postponeTask('${id}', '${tomorrowStr}')">Tomorrow (${formatFriendlyDate(tomorrowStr)})</button>
        <button class="postpone-option" onclick="postponeTask('${id}', '${inTwoDaysStr}')">In 2 Days (${formatFriendlyDate(inTwoDaysStr)})</button>
        <button class="postpone-option" onclick="postponeTask('${id}', '${nextMondayStr}')">Next Monday (${formatFriendlyDate(nextMondayStr)})</button>
        <div style="border-top:1px solid var(--border-color); margin:0.25rem 0; padding-top:0.25rem;">
            <span style="font-size:0.7rem; color:var(--text-muted); padding-left:0.75rem;">Custom Date:</span>
            <input type="date" class="postpone-date-input" onchange="postponeTask('${id}', this.value)" />
        </div>
        <button class="postpone-option" style="margin-top:0.5rem; background:var(--accent-danger);" onclick="closePostponeModal()">Cancel</button>
    `;
    modal.classList.remove('hidden');
    // Close on outside click
    const outsideClick = (e) => {
        if (!e.target.closest('.modal-content')) {
            closePostponeModal();
        }
    };
    modal.addEventListener('click', outsideClick);
    // Close on Escape
    const escListener = (e) => {
        if (e.key === 'Escape') closePostponeModal();
    };
    document.addEventListener('keydown', escListener);
    // Store listeners for cleanup
    modal._outsideClick = outsideClick;
    modal._escListener = escListener;
};

function closePostponeModal() {
    const modal = document.getElementById('postpone-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    // Cleanup listeners
    if (modal._outsideClick) modal.removeEventListener('click', modal._outsideClick);
    if (modal._escListener) document.removeEventListener('keydown', modal._escListener);
    modal._outsideClick = null;
    modal._escListener = null;
}

// Keep backward compatibility (old name)
window.togglePostponeMenu = function(event, id) {
    event.stopPropagation();
    closeAllPostponeMenus(); // ensure any old menus are cleared
    showPostponeModal(id);
};

function closeAllPostponeMenus() {
    // Old dropdown menus (if any) cleanup
    const menus = document.querySelectorAll('.postpone-menu');
    menus.forEach(m => m.remove());
    // Also close modal if open
    closePostponeModal();
}


// Progress Ring Updater
function updateProgress(total, completed) {
    elements.statCompleted.textContent = `${completed}/${total}`;
    
    if (total === 0) {
        elements.progressCircle.style.strokeDashoffset = strokeDashOffsetVal;
        elements.progressText.textContent = '0%';
        return;
    }
    
    const percent = Math.round((completed / total) * 100);
    elements.progressText.textContent = `${percent}%`;
    
    const offset = strokeDashOffsetVal - (percent / 100) * strokeDashOffsetVal;
    elements.progressCircle.style.strokeDashoffset = offset;
}

// Date Navigation Helpers
function setCurrentDate(dateStr) {
    currentDate = dateStr;
    updateDateDisplay();
    closeAllPostponeMenus();
    render();
}

function updateDateDisplay() {
    elements.datePicker.value = currentDate;
    
    const today = getTodayDateString();
    const yesterday = getRelativeDateString(-1);
    const tomorrow = getRelativeDateString(1);
    
    // Toggle active classes on quick date tabs
    elements.btnToday.classList.toggle('btn-active', currentDate === today);
    elements.btnYesterday.classList.toggle('btn-active', currentDate === yesterday);
    elements.btnTomorrow.classList.toggle('btn-active', currentDate === tomorrow);
    
    elements.currentDateDisplay.textContent = formatFriendlyDate(currentDate);
}

// Data Import / Export / Storage
function saveTasks() {
    localStorage.setItem('daily-planner-tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const stored = localStorage.getItem('daily-planner-tasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse tasks', e);
            tasks = [];
        }
    } else {
        // Load some demo tasks for first time use
        tasks = getDemoTasks();
        saveTasks();
    }
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `daily-tasks-export-${currentDate}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('Database exported successfully');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                tasks = imported;
                saveTasks();
                runRolloverLogic();
                render();
                showNotification(`Imported ${imported.length} tasks successfully!`);
            } else {
                showNotification('Invalid file format. Must be a JSON array.', 'error');
            }
        } catch (err) {
            showNotification('Error parsing JSON file.', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
}

function resetDatabase() {
    if (confirm('Are you sure you want to delete ALL tasks and reset the database? This cannot be undone.')) {
        tasks = getDemoTasks();
        saveTasks();
        currentDate = getTodayDateString();
        updateDateDisplay();
        render();
        showNotification('Database reset to defaults');
    }
}

// Toast Notifications Helper
function showNotification(message, type = 'success') {
    const container = document.getElementById('notification-container') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `notification-toast toast-${type}`;
    
    // Style notification dynamically
    notification.style.background = 'hsla(224, 20%, 15%, 0.95)';
    notification.style.backdropFilter = 'blur(8px)';
    notification.style.border = `1px solid ${type === 'warning' ? 'var(--accent-warning)' : type === 'error' ? 'var(--accent-danger)' : 'var(--accent-cyan)'}`;
    notification.style.color = 'var(--text-primary)';
    notification.style.padding = '0.75rem 1.25rem';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = 'var(--shadow-main)';
    notification.style.fontSize = '0.85rem';
    notification.style.fontWeight = '500';
    notification.style.animation = 'scaleIn 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
    notification.style.pointerEvents = 'auto';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : '✨'}
            <span>${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px) scale(0.9)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3500);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.bottom = '2rem';
    container.style.right = '2rem';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '0.5rem';
    container.style.zIndex = '1000';
    container.style.pointerEvents = 'none';
    document.body.appendChild(container);
    return container;
}

// Date Utilities
function getTodayDateString() {
    return formatDateString(new Date());
}

function getRelativeDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return formatDateString(d);
}

function formatDateString(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatFriendlyDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (formatDateString(date) === formatDateString(today)) {
        return 'Today';
    } else if (formatDateString(date) === formatDateString(yesterday)) {
        return 'Yesterday';
    } else if (formatDateString(date) === formatDateString(tomorrow)) {
        return 'Tomorrow';
    }
    
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function generateUUID() {
    return 'uuid-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Initial Demo Data
function getDemoTasks() {
    const today = getTodayDateString();
    const yesterday = getRelativeDateString(-1);
    const tomorrow = getRelativeDateString(1);
    
    return [
        {
            id: 'demo-1',
            title: 'Refactor login controller logic',
            completed: false,
            completedAt: null,
            date: today,
            createdDate: today,
            postponedFromDate: null,
            isRollover: false,
            isDiscovery: false,
            isSprint: true,
            jiraKey: 'AUTH-120',
            jiraProject: 'AUTH',
            jiraNum: 120
        },
        {
            id: 'demo-2',
            title: 'Verify OAuth libraries and identity provider credentials',
            completed: false,
            completedAt: null,
            date: today,
            createdDate: today,
            postponedFromDate: null,
            isRollover: false,
            isDiscovery: true,
            isSprint: false,
            jiraKey: 'AUTH-45',
            jiraProject: 'AUTH',
            jiraNum: 45
        },
        {
            id: 'demo-3',
            title: 'Setup test database container script',
            completed: true,
            completedAt: new Date().toISOString(),
            date: today,
            createdDate: today,
            postponedFromDate: null,
            isRollover: false,
            isDiscovery: false,
            isSprint: false,
            jiraKey: null,
            jiraProject: null,
            jiraNum: null
        },
        {
            id: 'demo-4',
            title: 'Research vector search index engines (Milvus vs Pinecone)',
            completed: false,
            completedAt: null,
            date: today,
            createdDate: yesterday,
            postponedFromDate: yesterday,
            isRollover: true,
            isDiscovery: true,
            isSprint: true,
            jiraKey: 'CORE-2',
            jiraProject: 'CORE',
            jiraNum: 2
        },
        {
            id: 'demo-5',
            title: 'Update developer environment README docs',
            completed: false,
            completedAt: null,
            date: tomorrow,
            createdDate: today,
            postponedFromDate: null,
            isRollover: false,
            isDiscovery: false,
            isSprint: false,
            jiraKey: null,
            jiraProject: null,
            jiraNum: null
        }
    ];
}

// Global functions attached to window for inline onclick triggers
window.toggleTaskComplete = toggleTaskComplete;
window.deleteTask = deleteTask;
window.postponeTask = postponeTask;

// Run
document.addEventListener('DOMContentLoaded', init);

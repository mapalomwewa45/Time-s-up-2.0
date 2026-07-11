import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

// Data Storage
let appData = {
    tasks: [],
    deadlines: [],
    notes: []
};

const DATA_FILE = 'timesup_data.json';
const DATA_DIRECTORY = Directory.Documents;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    renderAllItems();
});

// Setup event listeners
function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Modal close on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Tab switching
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active to clicked button
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
}

// ============ TASK FUNCTIONS ============

function openAddTaskModal() {
    document.getElementById('addTaskModal').classList.add('active');
}

function closeAddTaskModal() {
    document.getElementById('addTaskModal').classList.remove('active');
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDescription').value = '';
}

function saveTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;

    if (!title) {
        alert('Please enter a task title');
        return;
    }

    const task = {
        id: Date.now(),
        title,
        description,
        priority,
        completed: false,
        createdAt: new Date().toLocaleDateString()
    };

    appData.tasks.push(task);
    saveData();
    renderTasks();
    closeAddTaskModal();
}

function deleteTask(id) {
    appData.tasks = appData.tasks.filter(task => task.id !== id);
    saveData();
    renderTasks();
}

function toggleTaskComplete(id) {
    const task = appData.tasks.find(task => task.id === id);
    if (task) {
        task.completed = !task.completed;
        saveData();
        renderTasks();
    }
}

function renderTasks() {
    const tasksList = document.getElementById('tasksList');
    
    if (appData.tasks.length === 0) {
        tasksList.innerHTML = '<p class="empty-state">No tasks yet. Add one to get started!</p>';
        return;
    }

    tasksList.innerHTML = appData.tasks.map(task => `
        <div class="item task-item ${task.completed ? 'completed' : ''}">
            <div style="display: flex; align-items: start; gap: 10px;">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleTaskComplete(${task.id})">
                <div style="flex: 1;">
                    <div class="item-title">${escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="item-description">${escapeHtml(task.description)}</div>` : ''}
                    <div class="item-meta">
                        <span class="priority-badge priority-${task.priority}">${task.priority.toUpperCase()}</span>
                        <span>${task.createdAt}</span>
                    </div>
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-delete" onclick="deleteTask(${task.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// ============ DEADLINE FUNCTIONS ============

function openAddDeadlineModal() {
    document.getElementById('addDeadlineModal').classList.add('active');
}

function closeAddDeadlineModal() {
    document.getElementById('addDeadlineModal').classList.remove('active');
    document.getElementById('deadlineTitle').value = '';
    document.getElementById('deadlineDate').value = '';
    document.getElementById('deadlineTime').value = '';
    document.getElementById('deadlineDescription').value = '';
}

function saveDeadline() {
    const title = document.getElementById('deadlineTitle').value.trim();
    const date = document.getElementById('deadlineDate').value;
    const time = document.getElementById('deadlineTime').value;
    const description = document.getElementById('deadlineDescription').value.trim();

    if (!title || !date) {
        alert('Please enter a title and date');
        return;
    }

    const deadline = {
        id: Date.now(),
        title,
        date,
        time,
        description,
        createdAt: new Date().toLocaleDateString()
    };

    appData.deadlines.push(deadline);
    appData.deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveData();
    renderDeadlines();
    closeAddDeadlineModal();
}

function deleteDeadline(id) {
    appData.deadlines = appData.deadlines.filter(d => d.id !== id);
    saveData();
    renderDeadlines();
}

function renderDeadlines() {
    const deadlinesList = document.getElementById('deadlinesList');
    
    if (appData.deadlines.length === 0) {
        deadlinesList.innerHTML = '<p class="empty-state">No deadlines yet. Add one to stay on track!</p>';
        return;
    }

    deadlinesList.innerHTML = appData.deadlines.map(deadline => {
        const isOverdue = new Date(deadline.date) < new Date() && !deadline.completed;
        return `
            <div class="item ${isOverdue ? 'overdue' : ''}">
                <div class="item-title">${escapeHtml(deadline.title)}</div>
                ${deadline.description ? `<div class="item-description">${escapeHtml(deadline.description)}</div>` : ''}
                <div class="item-meta">
                    <span class="deadline-time">📅 ${formatDate(deadline.date)} ${deadline.time ? `⏰ ${deadline.time}` : ''}</span>
                    ${isOverdue ? '<span style="color: #d32f2f; font-weight: 600;">⚠️ Overdue</span>' : ''}
                </div>
                <div class="item-actions">
                    <button class="btn-delete" onclick="deleteDeadline(${deadline.id})">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// ============ NOTE FUNCTIONS ============

function openAddNoteModal() {
    document.getElementById('addNoteModal').classList.add('active');
}

function closeAddNoteModal() {
    document.getElementById('addNoteModal').classList.remove('active');
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
}

function saveNote() {
    const title = document.getElementById('noteTitle').value.trim();
    const content = document.getElementById('noteContent').value.trim();

    if (!title || !content) {
        alert('Please enter a title and content');
        return;
    }

    const note = {
        id: Date.now(),
        title,
        content,
        createdAt: new Date().toLocaleDateString()
    };

    appData.notes.push(note);
    appData.notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    saveData();
    renderNotes();
    closeAddNoteModal();
}

function deleteNote(id) {
    appData.notes = appData.notes.filter(note => note.id !== id);
    saveData();
    renderNotes();
}

function renderNotes() {
    const notesList = document.getElementById('notesList');
    
    if (appData.notes.length === 0) {
        notesList.innerHTML = '<p class="empty-state">No notes yet. Create one to remember important info!</p>';
        return;
    }

    notesList.innerHTML = appData.notes.map(note => `
        <div class="item">
            <div class="item-title">${escapeHtml(note.title)}</div>
            <div class="item-description" style="white-space: pre-wrap; word-break: break-word;">${escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}</div>
            <div class="item-meta">
                <span>${note.createdAt}</span>
            </div>
            <div class="item-actions">
                <button class="btn-delete" onclick="deleteNote(${note.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// ============ UTILITY FUNCTIONS ============

function renderAllItems() {
    renderTasks();
    renderDeadlines();
    renderNotes();
}

// Save data to phone storage using Capacitor Filesystem API
async function saveData() {
    try {
        const jsonString = JSON.stringify(appData);
        await Filesystem.writeFile({
            path: DATA_FILE,
            data: jsonString,
            directory: DATA_DIRECTORY,
            encoding: Encoding.UTF8
        });
        console.log('Data saved to phone storage successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        // Fallback to localStorage if Capacitor fails
        localStorage.setItem('timesUpData', JSON.stringify(appData));
    }
}

// Load data from phone storage using Capacitor Filesystem API
async function loadData() {
    try {
        const result = await Filesystem.readFile({
            path: DATA_FILE,
            directory: DATA_DIRECTORY,
            encoding: Encoding.UTF8
        });
        appData = JSON.parse(result.data);
        console.log('Data loaded from phone storage successfully');
    } catch (error) {
        console.log('No saved data found, trying localStorage fallback');
        // Fallback to localStorage
        const saved = localStorage.getItem('timesUpData');
        if (saved) {
            try {
                appData = JSON.parse(saved);
                console.log('Data loaded from localStorage');
            } catch (e) {
                console.error('Error parsing localStorage:', e);
            }
        }
    }
}

function formatDate(dateStr) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

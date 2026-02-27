/**
 * Smart Study Planner JavaScript
 * Handles all interactions, API calls, and UI updates
 */

(function() {
    'use strict';

    // State
    let currentConfig = null;
    let currentSubjects = [];
    let currentSchedule = null;

    // DOM Elements
    const weeklyViewBtn = document.getElementById('weeklyViewBtn');
    const setupViewBtn = document.getElementById('setupViewBtn');
    const weeklyView = document.getElementById('weeklyView');
    const setupView = document.getElementById('setupView');
    const configForm = document.getElementById('configForm');
    const addSubjectForm = document.getElementById('addSubjectForm');
    const subjectsList = document.getElementById('subjectsList');
    const calendarGrid = document.getElementById('calendarGrid');
    const generateBtn = document.getElementById('generateBtn');
    const setupPromptBtn = document.getElementById('setupPromptBtn');
    const suggestionsBanner = document.getElementById('suggestionsBanner');
    const suggestionsContent = document.getElementById('suggestionsContent');
    const currentStreak = document.getElementById('currentStreak');
    const bestStreak = document.getElementById('bestStreak');
    const readinessScore = document.getElementById('readinessScore');
    const readinessLevel = document.getElementById('readinessLevel');
    const readinessEmoji = document.getElementById('readinessEmoji');
    const performanceGrid = document.getElementById('performanceGrid');

    // View Toggle
    weeklyViewBtn.addEventListener('click', () => switchView('weekly'));
    setupViewBtn.addEventListener('click', () => switchView('setup'));
    setupPromptBtn?.addEventListener('click', () => switchView('setup'));

    function switchView(view) {
        if (view === 'weekly') {
            weeklyViewBtn.classList.add('active');
            setupViewBtn.classList.remove('active');
            weeklyView.classList.add('active');
            setupView.classList.remove('active');
            loadWeeklySchedule();
        } else {
            setupViewBtn.classList.add('active');
            weeklyViewBtn.classList.remove('active');
            setupView.classList.add('active');
            weeklyView.classList.remove('active');
        }
    }

    // Configuration Form
    configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(configForm);
        const config = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/study-planner/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                showNotification('Configuration saved successfully!', 'success');
                currentConfig = config;
            } else {
                showNotification('Failed to save configuration', 'error');
            }
        } catch (error) {
            console.error('Error saving config:', error);
            showNotification('Error saving configuration', 'error');
        }
    });

    // Subject Management
    addSubjectForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addSubjectForm);
        const subject = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/api/study-planner/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subject)
            });

            if (response.ok) {
                showNotification('Subject added successfully!', 'success');
                addSubjectForm.reset();
                loadSubjects();
            } else {
                showNotification('Failed to add subject', 'error');
            }
        } catch (error) {
            console.error('Error adding subject:', error);
            showNotification('Error adding subject', 'error');
        }
    });

    async function loadSubjects() {
        try {
            const response = await fetch('/api/study-planner/config');
            if (response.ok) {
                const data = await response.json();
                currentSubjects = data.subjects || [];
                renderSubjects();
            }
        } catch (error) {
            console.error('Error loading subjects:', error);
        }
    }

    function renderSubjects() {
        if (!currentSubjects.length) {
            subjectsList.innerHTML = '<p class="text-dim">No subjects added yet</p>';
            return;
        }

        subjectsList.innerHTML = currentSubjects.map(subject => `
            <div class="subject-item">
                <div class="subject-info">
                    <span class="subject-name">${escapeHtml(subject.subject_name)}</span>
                    <span class="priority-badge priority-${subject.priority}">
                        ${subject.priority} - Weight ${subject.weight}
                    </span>
                </div>
                <button class="btn-delete" onclick="deleteSubject('${escapeHtml(subject.subject_name)}')">
                    Delete
                </button>
            </div>
        `).join('');
    }

    window.deleteSubject = async function(subjectName) {
        if (!confirm(`Delete ${subjectName}?`)) return;

        try {
            const response = await fetch(`/api/study-planner/subjects/${encodeURIComponent(subjectName)}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Subject deleted', 'success');
                loadSubjects();
            } else {
                showNotification('Failed to delete subject', 'error');
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
            showNotification('Error deleting subject', 'error');
        }
    };

    // Generate Schedule
    generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg> Generating...';

        try {
            const response = await fetch('/api/study-planner/generate-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                showNotification(`Schedule generated! ${data.tasks_count} tasks created`, 'success');
                await loadWeeklySchedule();
            } else {
                const error = await response.json();
                showNotification(error.error || 'Failed to generate schedule', 'error');
            }
        } catch (error) {
            console.error('Error generating schedule:', error);
            showNotification('Error generating schedule', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg> Generate Schedule';
        }
    });

    // Load Weekly Schedule
    async function loadWeeklySchedule() {
        try {
            const response = await fetch('/api/study-planner/weekly-schedule');
            if (response.ok) {
                const data = await response.json();
                if (data.schedule && data.tasks) {
                    currentSchedule = data;
                    renderCalendar(data.tasks);
                } else {
                    renderEmptyCalendar();
                }
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
        }
    }

    function renderCalendar(tasks) {
        // Group tasks by date
        const tasksByDate = {};
        tasks.forEach(task => {
            if (!tasksByDate[task.task_date]) {
                tasksByDate[task.task_date] = [];
            }
            tasksByDate[task.task_date].push(task);
        });

        // Get week start and end from schedule
        const weekStart = new Date(currentSchedule.week_start_date);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        let html = '';
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setDate(weekStart.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayTasks = tasksByDate[dateStr] || [];

            html += `
                <div class="calendar-day">
                    <div class="day-header">
                        <div class="day-name">${days[currentDate.getDay()]}</div>
                        <div class="day-date">${currentDate.getDate()}</div>
                    </div>
                    <div class="day-tasks">
                        ${dayTasks.map(task => renderTask(task)).join('')}
                    </div>
                </div>
            `;
        }

        calendarGrid.innerHTML = html;
    }

    function renderTask(task) {
        const typeClass = `task-type-${task.task_type}`;
        return `
            <div class="task-item ${task.completed ? 'completed' : ''}" 
                 data-task-id="${task.id}"
                 onclick="toggleTask(${task.id}, ${task.completed ? 1 : 0})">
                <span class="task-time">${formatTime(task.task_time)}</span>
                <span class="task-subject">${escapeHtml(task.subject)}</span>
                <span class="task-topic">${escapeHtml(task.topic)}</span>
                <span class="task-type-badge ${typeClass}">${task.task_type.replace('_', ' ')}</span>
            </div>
        `;
    }

    function renderEmptyCalendar() {
        calendarGrid.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>No schedule generated yet</p>
                <button class="btn-setup" onclick="document.getElementById('setupViewBtn').click()">
                    Configure Planner →
                </button>
            </div>
        `;
    }

    // Toggle Task Completion
    window.toggleTask = async function(taskId, isCompleted) {
        const endpoint = isCompleted 
            ? `/api/study-planner/task/${taskId}/incomplete`
            : `/api/study-planner/task/${taskId}/complete`;

        try {
            const response = await fetch(endpoint, { method: 'POST' });
            if (response.ok) {
                loadWeeklySchedule();
                loadStreak();
            }
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    // Load Streak
    async function loadStreak() {
        try {
            const response = await fetch('/api/study-planner/streak');
            if (response.ok) {
                const streak = await response.json();
                currentStreak.textContent = streak.current_streak || 0;
                bestStreak.textContent = streak.best_streak || 0;
            }
        } catch (error) {
            console.error('Error loading streak:', error);
        }
    }

    // Load Performance
    async function loadPerformance() {
        try {
            const response = await fetch('/api/study-planner/performance');
            if (response.ok) {
                const data = await response.json();
                updateReadiness(data.readiness);
                renderPerformance(data.performance);
            }
        } catch (error) {
            console.error('Error loading performance:', error);
        }
    }

    function updateReadiness(readiness) {
        if (!readiness) return;
        
        readinessScore.textContent = `${readiness.score}%`;
        readinessLevel.textContent = readiness.level;
        readinessEmoji.textContent = readiness.emoji;
    }

    function renderPerformance(performance) {
        if (!performance.subject_performance || !performance.subject_performance.length) {
            performanceGrid.innerHTML = '<p class="text-dim">Complete tasks to see insights</p>';
            return;
        }

        performanceGrid.innerHTML = performance.subject_performance.map(subj => `
            <div class="performance-card">
                <div class="perf-label">Completion Rate</div>
                <div class="perf-value">${calculateCompletion(subj)}%</div>
                <div class="perf-subject">${escapeHtml(subj.subject)}</div>
            </div>
        `).join('');
    }

    function calculateCompletion(subject) {
        if (!subject.total_tasks) return 0;
        return Math.round((subject.total_completed / subject.total_tasks) * 100);
    }

    // Load Suggestions
    async function loadSuggestions() {
        try {
            const response = await fetch('/api/study-planner/suggestions');
            if (response.ok) {
                const data = await response.json();
                if (data.suggestions && data.suggestions.length) {
                    suggestionsBanner.style.display = 'flex';
                    suggestionsContent.innerHTML = data.suggestions.map(s => 
                        `<p>${escapeHtml(s)}</p>`
                    ).join('');
                } else {
                    suggestionsBanner.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error loading suggestions:', error);
        }
    }

    // Load Configuration
    async function loadConfig() {
        try {
            const response = await fetch('/api/study-planner/config');
            if (response.ok) {
                const data = await response.json();
                currentConfig = data.config;
                currentSubjects = data.subjects || [];
                
                if (currentConfig) {
                    populateConfigForm(currentConfig);
                }
                renderSubjects();
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }

    function populateConfigForm(config) {
        if (!config) return;
        
        Object.keys(config).forEach(key => {
            const input = configForm.elements[key];
            if (input && config[key]) {
                input.value = config[key];
            }
        });
    }

    // Utility Functions
    function formatTime(timeStr) {
        // Convert 24h to 12h format
        const [hours, minutes] = timeStr.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showNotification(message, type = 'info') {
        // Simple notification (you can enhance this)
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 77, 77, 0.2)'};
            border: 1px solid ${type === 'success' ? 'rgba(74, 222, 128, 0.4)' : 'rgba(255, 77, 77, 0.4)'};
            color: #fff;
            border-radius: 12px;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .spin {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    // Initialize
    async function init() {
        await loadConfig();
        await loadStreak();
        await loadPerformance();
        await loadSuggestions();
        await loadWeeklySchedule();
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

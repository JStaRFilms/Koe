export class TasksPanel {
    constructor() {
        this.container = document.getElementById('panel-tasks');
        this.content = document.getElementById('tasks-content');
    }

    show() {
        this.loadTasks();
    }

    hide() {}

    async loadTasks() {
        if (!window.api || !window.api.getTasks) return;

        try {
            const tasks = await window.api.getTasks();
            this.renderTasks(tasks);
        } catch (error) {
            console.error('Failed to load tasks:', error);
        }
    }

    renderTasks(tasks) {
        if (!this.content) return;

        this.content.innerHTML = '';

        if (!tasks || tasks.length === 0) {
            this.content.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    <p>No action items extracted yet.</p>
                </div>
            `;
            return;
        }

        tasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = 'history-entry';
            taskEl.style.display = 'flex';
            taskEl.style.alignItems = 'center';
            taskEl.style.gap = '12px';
            taskEl.style.padding = '12px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', async () => {
                const updatedTasks = await window.api.toggleTask(task.id);
                this.renderTasks(updatedTasks);
            });

            const text = document.createElement('span');
            text.textContent = task.task;
            text.style.flex = '1';
            if (task.completed) {
                text.style.textDecoration = 'line-through';
                text.style.opacity = '0.6';
            }

            taskEl.appendChild(checkbox);
            taskEl.appendChild(text);
            this.content.appendChild(taskEl);
        });
    }
}

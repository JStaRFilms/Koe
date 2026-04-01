/**
 * Settings Window Entry Point
 * Manages the tabbed interface for Settings, History, and Usage panels
 */

import { SettingsPanel } from './components/settings-panel.js';
import { HistoryPanel } from './components/history-panel.js';
import { UsageMeter } from './components/usage-meter.js';
import { TasksPanel } from './components/tasks-panel.js';
import { getThemeManager } from './components/theme-manager.js';

class SettingsWindow {
    constructor() {
        this.currentTab = 'settings';
        this.panels = {};
        this.init();
    }

    init() {
        // Initialize theme manager first
        this.themeManager = getThemeManager();

        this.setupTabSwitching();
        this.setupWindowControls();
        this.setupKeyboardShortcuts();
        this.initializePanels();
        this.listenForTabCommands();
    }

    /**
     * Set up tab button click handlers
     */
    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchToTab(tabName);
            });
        });
    }

    /**
     * Switch to a specific tab
     */
    switchToTab(tabName) {
        if (this.currentTab === tabName) return;

        // Hide current panel
        this.hidePanel(this.currentTab);

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${tabName}`);
        });

        this.currentTab = tabName;

        // Show and load data for the new panel
        this.showPanel(tabName);
    }

    /**
     * Show a panel and load its data
     */
    showPanel(tabName) {
        switch (tabName) {
            case 'settings':
                if (this.panels.settings) {
                    this.panels.settings.show();
                }
                break;
            case 'history':
                if (this.panels.history) {
                    this.panels.history.show();
                }
                break;
            case 'usage':
                if (this.panels.usage) {
                    this.panels.usage.show();
                }
                break;
            case 'tasks':
                if (this.panels.tasks) {
                    this.panels.tasks.show();
                }
                break;
        }
    }

    /**
     * Hide a panel
     */
    hidePanel(tabName) {
        switch (tabName) {
            case 'settings':
                if (this.panels.settings) {
                    this.panels.settings.hide();
                }
                break;
            case 'history':
                if (this.panels.history) {
                    this.panels.history.hide();
                }
                break;
            case 'usage':
                if (this.panels.usage) {
                    this.panels.usage.hide();
                }
                break;
            case 'tasks':
                if (this.panels.tasks) {
                    this.panels.tasks.hide();
                }
                break;
        }
    }

    /**
     * Load data for the active panel
     */
    loadPanelData(tabName) {
        switch (tabName) {
            case 'settings':
                if (this.panels.settings) {
                    this.panels.settings.loadSettings();
                }
                break;
            case 'history':
                if (this.panels.history) {
                    this.panels.history.loadHistory();
                }
                break;
            case 'usage':
                if (this.panels.usage) {
                    this.panels.usage.fetchUsage();
                }
                break;
        }
    }

    /**
     * Set up window control buttons
     */
    setupWindowControls() {
        const closeBtn = document.getElementById('btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (window.api && window.api.closeSettingsWindow) {
                    window.api.closeSettingsWindow();
                }
            });
        }
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Close on Escape
            if (e.key === 'Escape') {
                if (window.api && window.api.closeSettingsWindow) {
                    window.api.closeSettingsWindow();
                }
            }

            // Tab switching with Ctrl/Cmd + number
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const tabMap = { '1': 'settings', '2': 'history', '3': 'usage', '4': 'tasks' };
                this.switchToTab(tabMap[e.key]);
            }
        });
    }

    /**
     * Initialize panel components
     */
    initializePanels() {
        try {
            // Initialize Settings Panel
            this.panels.settings = new SettingsPanel();

            // To provide a good UX, we should show a completion toast when saving settings
            // instead of closing the window automatically.
            const originalSave = this.panels.settings.saveSettings.bind(this.panels.settings);
            this.panels.settings.saveSettings = async () => {
                await originalSave();
                // We'll show a toast notification here
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.querySelector('.toast-text').innerText = 'Settings saved successfully';
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 2000);
                }
            };
        } catch (error) {
            console.error('Failed to initialize SettingsPanel:', error);
        }

        try {
            // Initialize History Panel
            this.panels.history = new HistoryPanel();
        } catch (error) {
            console.error('Failed to initialize HistoryPanel:', error);
        }

        try {
            // Initialize Usage Meter
            this.panels.usage = new UsageMeter();
        } catch (error) {
            console.error('Failed to initialize UsageMeter:', error);
        }

        try {
            // Initialize Tasks Panel
            this.panels.tasks = new TasksPanel();
        } catch (error) {
            console.error('Failed to initialize TasksPanel:', error);
        }

        // Show initial panel
        this.showPanel('settings');
    }

    /**
     * Listen for tab commands from main process
     */
    listenForTabCommands() {
        if (!window.api) return;

        // Listen for tab switch commands
        if (window.api.onOpenSettingsTab) {
            window.api.onOpenSettingsTab(() => this.switchToTab('settings'));
        }
        if (window.api.onOpenHistoryTab) {
            window.api.onOpenHistoryTab(() => this.switchToTab('history'));
        }
        if (window.api.onOpenUsageTab) {
            window.api.onOpenUsageTab(() => this.switchToTab('usage'));
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.settingsWindow = new SettingsWindow();
    });
} else {
    window.settingsWindow = new SettingsWindow();
}
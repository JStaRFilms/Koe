/**
 * Settings Window Entry Point
 * Manages the tabbed interface for Settings, History, and Usage panels
 */

import { SettingsPanel } from './components/settings-panel.js';
import { HistoryPanel } from './components/history-panel.js';
import { UsageMeter } from './components/usage-meter.js';
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
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '3') {
                e.preventDefault();
                const tabMap = { '1': 'settings', '2': 'history', '3': 'usage' };
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

            // Override the hide method since we don't hide in this context
            this.panels.settings.hide = () => {
                // In the settings window, we don't hide - we close the window
                if (window.api && window.api.closeSettingsWindow) {
                    window.api.closeSettingsWindow();
                }
            };

            // Override save to close window after saving
            const originalSave = this.panels.settings.saveSettings.bind(this.panels.settings);
            this.panels.settings.saveSettings = async () => {
                await originalSave();
                if (window.api && window.api.closeSettingsWindow) {
                    window.api.closeSettingsWindow();
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
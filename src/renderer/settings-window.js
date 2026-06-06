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
        this.setupSettingsSectionNav();
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
     * Set up settings-section navigation inside the Settings tab
     */
    setupSettingsSectionNav() {
        const scrollRegion = document.getElementById('settings-scroll-region');
        const navButtons = document.querySelectorAll('.section-nav-btn[data-section]');
        const sections = document.querySelectorAll('.settings-section-card');

        if (navButtons.length === 0) {
            return;
        }

        const switchToSection = (sectionId) => {
            // Update nav button states
            navButtons.forEach((button) => {
                button.classList.toggle('active', button.dataset.section === sectionId);
            });

            // Show target section card, hide others
            sections.forEach((section) => {
                section.classList.toggle('active', section.id === sectionId);
            });

            // Reset scroll of the container to top
            if (scrollRegion) {
                scrollRegion.scrollTop = 0;
            }
        };

        navButtons.forEach((button) => {
            button.addEventListener('click', () => {
                switchToSection(button.dataset.section);
            });
        });

        // Initialize with default active section
        const activeBtn = document.querySelector('.section-nav-btn.active[data-section]');
        if (activeBtn) {
            switchToSection(activeBtn.dataset.section);
        } else if (navButtons[0]) {
            switchToSection(navButtons[0].dataset.section);
        }
    }

    /**
     * Switch to a specific tab
     */
    switchToTab(tabName) {
        if (this.currentTab === tabName) {
            // Re-opening an already active tab should still restore and refresh it.
            this.showPanel(tabName);
            return;
        }

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
        const closeWindow = () => {
            if (window.api && window.api.closeSettingsWindow) {
                window.api.closeSettingsWindow();
            }
        };

        const requestCloseWindow = async ({ discardChanges = false } = {}) => {
            const settingsPanel = this.panels.settings;

            if (!discardChanges && settingsPanel?.hasUnsavedChanges?.()) {
                const shouldSave = window.confirm('You have unsaved settings changes. Save before closing?\n\nOK = save and close\nCancel = keep editing');
                if (!shouldSave) {
                    return;
                }

                const saved = await settingsPanel.saveSettings();
                if (!saved) {
                    return;
                }
            }

            closeWindow();
        };

        const closeBtn = document.getElementById('btn-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => requestCloseWindow());
        }

        const cancelSettingsBtn = document.getElementById('btn-cancel-settings');
        if (cancelSettingsBtn) {
            cancelSettingsBtn.addEventListener('click', () => requestCloseWindow({ discardChanges: true }));
        }

        this.requestCloseWindow = requestCloseWindow;
    }

    /**
     * Set up keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Close on Escape
            if (e.key === 'Escape') {
                this.requestCloseWindow?.();
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

            // To provide a good UX, we should show a completion toast when saving settings
            // instead of closing the window automatically.
            const originalSave = this.panels.settings.saveSettings.bind(this.panels.settings);
            this.panels.settings.saveSettings = async () => {
                const saved = await originalSave();
                // Show success only when the save actually completed.
                if (saved !== false) {
                    const toast = document.getElementById('toast');
                    if (toast) {
                        toast.querySelector('.toast-text').innerText = 'Settings saved successfully';
                        toast.classList.add('show');
                        setTimeout(() => toast.classList.remove('show'), 2000);
                    }
                }
                return saved;
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
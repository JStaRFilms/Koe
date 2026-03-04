/**
 * Theme Manager
 * Handles dark/light theme switching and system preference detection
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = 'dark';
        this.systemPreference = null;
        this.init();
    }

    /**
     * Initialize theme manager
     */
    init() {
        this.detectSystemPreference();
        this.loadSavedTheme();
        this.setupSystemListeners();
    }

    /**
     * Detect system color scheme preference
     */
    detectSystemPreference() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            this.systemPreference = darkModeQuery.matches ? 'dark' : 'light';

            // Listen for system theme changes
            darkModeQuery.addEventListener('change', (e) => {
                this.systemPreference = e.matches ? 'dark' : 'light';
                // Only auto-switch if user hasn't set a preference
                if (!this.getSavedThemePreference()) {
                    this.applyTheme(this.systemPreference);
                }
            });
        }
    }

    /**
     * Load saved theme from settings
     */
    async loadSavedTheme() {
        try {
            if (window.api && window.api.getSettings) {
                const settings = await window.api.getSettings();
                if (settings && settings.theme) {
                    this.applyTheme(settings.theme);
                } else {
                    // Default to dark or system preference
                    this.applyTheme(this.systemPreference || 'dark');
                }
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
            this.applyTheme('dark');
        }
    }

    /**
     * Apply a theme to the document
     */
    applyTheme(theme) {
        this.currentTheme = theme;

        if (theme === 'system') {
            const systemTheme = this.systemPreference || 'dark';
            document.documentElement.setAttribute('data-theme', systemTheme);
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }

        // Dispatch custom event for components to react
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme: this.getEffectiveTheme() }
        }));
    }

    /**
     * Get the currently applied theme (resolves 'system' to actual theme)
     */
    getEffectiveTheme() {
        if (this.currentTheme === 'system') {
            return this.systemPreference || 'dark';
        }
        return this.currentTheme;
    }

    /**
     * Get the saved theme preference (including 'system')
     */
    getSavedThemePreference() {
        return this.currentTheme;
    }

    /**
     * Toggle between light and dark
     */
    toggleTheme() {
        const newTheme = this.getEffectiveTheme() === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.saveThemePreference(newTheme);
    }

    /**
     * Save theme preference to settings
     */
    async saveThemePreference(theme) {
        try {
            if (window.api && window.api.getSettings && window.api.saveSettings) {
                const settings = await window.api.getSettings();
                settings.theme = theme;
                await window.api.saveSettings(settings);
            }
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    }

    /**
     * Set up system theme change listeners
     */
    setupSystemListeners() {
        // Listen for visibility change to detect system theme updates
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.currentTheme === 'system') {
                this.detectSystemPreference();
                this.applyTheme('system');
            }
        });
    }

    /**
     * Check if dark mode is active
     */
    isDarkMode() {
        return this.getEffectiveTheme() === 'dark';
    }

    /**
     * Get CSS variables for the current theme
     */
    getThemeVariables() {
        const isDark = this.isDarkMode();

        return {
            // Background
            '--koe-bg-primary': isDark ? '#0a0a0f' : '#ffffff',
            '--koe-bg-secondary': isDark ? '#12121a' : '#f8f9fa',
            '--koe-glass-bg': isDark ? 'rgba(15, 15, 25, 0.85)' : 'rgba(255, 255, 255, 0.85)',

            // Text
            '--koe-text': isDark ? '#e8e8f0' : '#1a1a2e',
            '--koe-text-muted': isDark ? '#64647a' : '#6c757d',
            '--koe-text-dim': isDark ? '#3a3a50' : '#adb5bd',

            // Border
            '--koe-border': isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            '--koe-border-highlight': isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',

            // Accent (keep consistent)
            '--koe-accent': '#00e5bf',
            '--koe-accent-dim': 'rgba(0, 229, 191, 0.15)',
            '--koe-accent-glow': 'rgba(0, 229, 191, 0.35)',
        };
    }

    /**
     * Apply CSS variables to an element
     */
    applyThemeVariables(element = document.documentElement) {
        const variables = this.getThemeVariables();
        Object.entries(variables).forEach(([key, value]) => {
            element.style.setProperty(key, value);
        });
    }
}

// Create singleton instance
let themeManagerInstance = null;

export function getThemeManager() {
    if (!themeManagerInstance) {
        themeManagerInstance = new ThemeManager();
    }
    return themeManagerInstance;
}

// Initialize on module load if in browser environment
if (typeof window !== 'undefined') {
    getThemeManager();
}
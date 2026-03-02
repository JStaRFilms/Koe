export class SettingsPanel {
    constructor() {
        this.panel = document.getElementById('settings-panel');
        this.btnClose = document.getElementById('btn-close-settings');
        this.btnSave = document.getElementById('btn-save-settings');
        this.btnToggleKey = document.getElementById('btn-toggle-key');
        this.btnTestKey = document.getElementById('btn-test-key');
        this.inputApiKey = document.getElementById('api-key');
        this.selLanguage = document.getElementById('language');
        this.chkEnhance = document.getElementById('enhance-text');
        this.selPromptStyle = document.getElementById('prompt-style');
        this.chkAutoPaste = document.getElementById('auto-paste');
        this.testResult = document.getElementById('test-key-result');
        this.promptStyleGroup = document.getElementById('prompt-style-group');

        // New UI elements
        this.selModel = document.getElementById('transcription-model');
        this.selTheme = document.getElementById('theme');
        this.inputHotkey = document.getElementById('hotkey');
        this.hotkeyError = document.getElementById('hotkey-error');

        this.isRecordingHotkey = false;
        this.pendingHotkey = null;

        this.initListeners();
    }

    async show() {
        await this.loadSettings();
        this.panel.classList.remove('hide');
    }

    hide() {
        this.panel.classList.add('hide');
        this.testResult.style.display = 'none';
        this.testResult.className = 'test-result';
    }

    initListeners() {
        this.btnClose.addEventListener('click', () => this.hide());
        this.btnSave.addEventListener('click', () => this.saveSettings());

        this.btnToggleKey.addEventListener('click', () => {
            if (this.inputApiKey.type === 'password') {
                this.inputApiKey.type = 'text';
                this.btnToggleKey.textContent = '🙈';
            } else {
                this.inputApiKey.type = 'password';
                this.btnToggleKey.textContent = '👁️';
            }
        });

        this.btnTestKey.addEventListener('click', () => this.testApiKey());

        this.chkEnhance.addEventListener('change', () => {
            this.promptStyleGroup.style.opacity = this.chkEnhance.checked ? '1' : '0.5';
            this.selPromptStyle.disabled = !this.chkEnhance.checked;
        });

        // Theme change listener - apply immediately for preview
        if (this.selTheme) {
            this.selTheme.addEventListener('change', () => {
                this.applyThemePreview(this.selTheme.value);
            });
        }

        // Hotkey recording
        if (this.inputHotkey) {
            this.inputHotkey.addEventListener('focus', () => this.startHotkeyRecording());
            this.inputHotkey.addEventListener('blur', () => this.stopHotkeyRecording());
            this.inputHotkey.addEventListener('keydown', (e) => this.handleHotkeyInput(e));
        }
    }

    startHotkeyRecording() {
        this.isRecordingHotkey = true;
        this.pendingHotkey = null;
        if (this.inputHotkey) {
            this.inputHotkey.classList.add('recording');
            this.inputHotkey.placeholder = 'Press key combination...';
            this.inputHotkey.value = '';
        }
        if (this.hotkeyError) {
            this.hotkeyError.classList.remove('show');
        }
    }

    stopHotkeyRecording() {
        this.isRecordingHotkey = false;
        if (this.inputHotkey) {
            this.inputHotkey.classList.remove('recording');
            this.inputHotkey.placeholder = 'e.g., CommandOrControl+Shift+Space';
            // Restore current hotkey if no new one was recorded
            if (!this.pendingHotkey) {
                this.loadSettings();
            }
        }
    }

    handleHotkeyInput(e) {
        if (!this.isRecordingHotkey) return;

        e.preventDefault();

        // Build the accelerator string
        const modifiers = [];
        if (e.ctrlKey) modifiers.push('CommandOrControl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.metaKey) modifiers.push('Super');

        let key = e.key;
        // Handle special keys
        if (key === ' ') key = 'Space';
        if (key === 'Escape') key = 'Esc';
        if (key.length === 1) key = key.toUpperCase();

        // Don't accept modifier-only combinations
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            return;
        }

        const accelerator = [...modifiers, key].join('+');
        this.pendingHotkey = accelerator;

        if (this.inputHotkey) {
            this.inputHotkey.value = this.formatHotkeyForDisplay(accelerator);
        }

        // Stop recording
        this.inputHotkey.blur();
    }

    formatHotkeyForDisplay(accelerator) {
        return accelerator
            .replace('CommandOrControl', 'Ctrl')
            .replace('Super', 'Win')
            .replace(/\+/g, ' + ');
    }

    applyThemePreview(theme) {
        // Apply theme to document for immediate preview
        document.documentElement.setAttribute('data-theme', theme === 'system' ? 'dark' : theme);
    }

    async loadSettings() {
        if (!window.api) return;
        try {
            const settings = await window.api.getSettings();
            if (settings) {
                this.inputApiKey.value = settings.groqApiKey || '';
                this.selLanguage.value = settings.language || 'auto';
                this.chkEnhance.checked = settings.enhanceText !== false; // default true
                this.selPromptStyle.value = settings.promptStyle || 'Clean';
                this.chkAutoPaste.checked = settings.autoPaste || false;

                // Load new settings
                if (this.selModel) {
                    this.selModel.value = settings.model || 'whisper-large-v3-turbo';
                }
                if (this.selTheme) {
                    this.selTheme.value = settings.theme || 'dark';
                }
                if (this.inputHotkey) {
                    this.inputHotkey.value = this.formatHotkeyForDisplay(settings.hotkey || 'CommandOrControl+Shift+Space');
                }

                // Trigger change to update style group opacity
                this.chkEnhance.dispatchEvent(new Event('change'));
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    async saveSettings() {
        if (!window.api) return;

        const newSettings = {
            groqApiKey: this.inputApiKey.value.trim(),
            language: this.selLanguage.value,
            enhanceText: this.chkEnhance.checked,
            promptStyle: this.selPromptStyle.value,
            autoPaste: this.chkAutoPaste.checked,
            model: this.selModel ? this.selModel.value : 'whisper-large-v3-turbo',
            theme: this.selTheme ? this.selTheme.value : 'dark',
            hotkey: this.pendingHotkey || (this.inputHotkey ? this.parseHotkeyFromDisplay(this.inputHotkey.value) : 'CommandOrControl+Shift+Space')
        };

        try {
            await window.api.saveSettings(newSettings);
            this.hide();
        } catch (e) {
            console.error('Failed to save settings', e);
            // Show error in the hotkey error area if it's a hotkey error
            if (e.message && e.message.includes('hotkey')) {
                if (this.hotkeyError) {
                    this.hotkeyError.textContent = e.message;
                    this.hotkeyError.classList.add('show');
                }
            } else {
                alert('Failed to save settings: ' + e.message);
            }
        }
    }

    parseHotkeyFromDisplay(displayValue) {
        if (!displayValue) return 'CommandOrControl+Shift+Space';
        return displayValue
            .replace(/Ctrl/g, 'CommandOrControl')
            .replace(/Win/g, 'Super')
            .replace(/\s*\+\s*/g, '+');
    }

    async testApiKey() {
        if (!window.api) return;
        const key = this.inputApiKey.value.trim();
        if (!key) {
            this.showTestResult('Enter an API key first', false);
            return;
        }

        this.btnTestKey.textContent = 'Testing...';
        this.btnTestKey.disabled = true;
        this.testResult.style.display = 'none';

        try {
            const isValid = await window.api.testGroqKey(key);
            if (isValid) {
                this.showTestResult('Connection successful ✓', true);
            } else {
                this.showTestResult('Invalid API Key ✗', false);
            }
        } catch (e) {
            this.showTestResult('Connection failed ✗', false);
        } finally {
            this.btnTestKey.textContent = 'Test Connection';
            this.btnTestKey.disabled = false;
        }
    }

    showTestResult(message, isSuccess) {
        this.testResult.textContent = message;
        this.testResult.className = `test-result ${isSuccess ? 'success' : 'error'}`;
        this.testResult.style.display = 'block';
    }
}

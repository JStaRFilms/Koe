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
            autoPaste: this.chkAutoPaste.checked
        };

        try {
            await window.api.saveSettings(newSettings);
            this.hide();
        } catch (e) {
            console.error('Failed to save settings', e);
            alert('Failed to save settings');
        }
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

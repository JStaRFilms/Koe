export class SettingsPanel {
    constructor() {
        this.panel = document.getElementById('settings-panel');
        this.btnClose = document.getElementById('btn-close-settings');
        this.btnSave = document.getElementById('btn-save-settings');
        this.btnToggleKey = document.getElementById('btn-toggle-key');
        this.btnTestKey = document.getElementById('btn-test-key');
        this.btnOpenLogs = document.getElementById('btn-open-logs');
        this.inputApiKey = document.getElementById('api-key');
        this.chkCloudProcessing = document.getElementById('cloud-processing-enabled');
        this.inputCloudProcessingUrl = document.getElementById('cloud-processing-url');
        this.selLanguage = document.getElementById('language');
        this.chkEnhance = document.getElementById('enhance-text');
        this.selPromptStyle = document.getElementById('prompt-style');
        this.inputCustomPrompt = document.getElementById('custom-prompt');
        this.chkAutoPaste = document.getElementById('auto-paste');
        this.chkLaunchOnStartup = document.getElementById('launch-on-startup');
        this.chkAutoUpdate = document.getElementById('auto-update');
        this.chkAlwaysOn = document.getElementById('always-on');
        this.chkPrivacyMode = document.getElementById('privacy-mode');
        this.inputSmartContext = document.getElementById('smart-context');
        this.testResult = document.getElementById('test-key-result');
        this.cloudProcessingUrlGroup = document.getElementById('cloud-processing-url-group');
        this.promptStyleGroup = document.getElementById('prompt-style-group');
        this.customPromptGroup = document.getElementById('custom-prompt-group');

        // New UI elements
        this.selModel = document.getElementById('transcription-model');
        this.selTheme = document.getElementById('theme');
        this.inputHotkey = document.getElementById('hotkey');
        this.hotkeyError = document.getElementById('hotkey-error');
        this.shortcutRecordToggle = document.getElementById('shortcut-record-toggle');
        this.shortcutRetryLast = document.getElementById('shortcut-retry-last');
        this.shortcutSettingsTabs = document.getElementById('shortcut-settings-tabs');
        this.shortcutSettingsClose = document.getElementById('shortcut-settings-close');

        this.isRecordingHotkey = false;
        this.pendingHotkey = null;

        this.initListeners();
        if (this.chkEnhance) {
            this.chkEnhance.checked = true;
            this.chkEnhance.disabled = true;
        }
    }

    isMacPlatform() {
        return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
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
                this.btnToggleKey.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
            } else {
                this.inputApiKey.type = 'password';
                this.btnToggleKey.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });

        this.btnTestKey.addEventListener('click', () => this.testApiKey());

        if (this.chkCloudProcessing) {
            this.chkCloudProcessing.addEventListener('change', () => {
                this.updateCloudProcessingControls();
            });
        }

        this.chkEnhance.addEventListener('change', () => {
            this.updateEnhancementControls();
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

        // Open Logs button
        if (this.btnOpenLogs) {
            this.btnOpenLogs.addEventListener('click', () => this.openLogsFolder());
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
        this.renderShortcutReference();
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
        const isMac = this.isMacPlatform();
        if (e.ctrlKey) modifiers.push(isMac ? 'Control' : 'CommandOrControl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.metaKey) modifiers.push(isMac ? 'Command' : 'Super');

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

        this.renderShortcutReference(accelerator);

        // Stop recording
        this.inputHotkey.blur();
    }

    formatHotkeyForDisplay(accelerator) {
        if (this.isMacPlatform()) {
            return accelerator
                .replace('CommandOrControl', 'Cmd')
                .replace('Command', 'Cmd')
                .replace('Control', 'Ctrl')
                .replace('Alt', 'Option')
                .replace('Super', 'Cmd')
                .replace(/\+/g, ' + ');
        }

        return accelerator
            .replace('CommandOrControl', 'Ctrl')
            .replace('Super', 'Win')
            .replace(/\+/g, ' + ');
    }

    formatHotkeyToken(token) {
        if (this.isMacPlatform()) {
            return token
                .replace('CommandOrControl', 'Cmd')
                .replace('Command', 'Cmd')
                .replace('Control', 'Ctrl')
                .replace('Alt', 'Option')
                .replace('Super', 'Cmd');
        }

        return token
            .replace('CommandOrControl', 'Ctrl')
            .replace('Super', 'Win');
    }

    renderShortcutSequence(container, sequences) {
        if (!container) {
            return;
        }

        const normalizedSequences = Array.isArray(sequences?.[0]) ? sequences : [sequences];
        container.replaceChildren();

        normalizedSequences.forEach((sequence, sequenceIndex) => {
            if (sequenceIndex > 0) {
                const separator = document.createElement('span');
                separator.className = 'shortcut-separator';
                separator.textContent = '/';
                container.appendChild(separator);
            }

            sequence.forEach((token, tokenIndex) => {
                if (tokenIndex > 0) {
                    const plus = document.createElement('span');
                    plus.className = 'shortcut-plus';
                    plus.textContent = '+';
                    container.appendChild(plus);
                }

                const keyEl = document.createElement('kbd');
                keyEl.textContent = this.formatHotkeyToken(token);
                container.appendChild(keyEl);
            });
        });
    }

    renderShortcutReference(currentHotkey = null) {
        const activeHotkey = currentHotkey
            || this.pendingHotkey
            || this.parseHotkeyFromDisplay(this.inputHotkey?.value)
            || 'CommandOrControl+Shift+Space';
        const modifier = this.isMacPlatform() ? 'Command' : 'CommandOrControl';

        this.renderShortcutSequence(this.shortcutRecordToggle, activeHotkey.split('+'));
        this.renderShortcutSequence(this.shortcutRetryLast, ['CommandOrControl', 'Shift', ',']);
        this.renderShortcutSequence(this.shortcutSettingsTabs, [
            [modifier, '1'],
            [modifier, '2'],
            [modifier, '3']
        ]);
        this.renderShortcutSequence(this.shortcutSettingsClose, ['Esc']);
    }

    applyThemePreview(theme) {
        // Apply theme to document for immediate preview
        document.documentElement.setAttribute('data-theme', theme === 'system' ? 'dark' : theme);
    }

    updateEnhancementControls() {
        const isEnabled = this.chkEnhance.checked;

        if (this.promptStyleGroup) {
            this.promptStyleGroup.style.opacity = isEnabled ? '1' : '0.5';
        }
        if (this.customPromptGroup) {
            this.customPromptGroup.style.opacity = isEnabled ? '1' : '0.5';
        }
        if (this.selPromptStyle) {
            this.selPromptStyle.disabled = !isEnabled;
        }
        if (this.inputCustomPrompt) {
            this.inputCustomPrompt.disabled = !isEnabled;
        }
    }

    updateCloudProcessingControls() {
        const isEnabled = this.chkCloudProcessing ? this.chkCloudProcessing.checked : false;

        if (this.cloudProcessingUrlGroup) {
            this.cloudProcessingUrlGroup.style.opacity = isEnabled ? '1' : '0.5';
        }

        if (this.inputCloudProcessingUrl) {
            this.inputCloudProcessingUrl.disabled = !isEnabled;
        }
    }

    async loadSettings() {
        if (!window.api) return;
        try {
            const settings = await window.api.getSettings();
            if (settings) {
                this.inputApiKey.value = settings.groqApiKey || '';
                if (this.chkCloudProcessing) {
                    this.chkCloudProcessing.checked = settings.cloudProcessingEnabled === true;
                }
                if (this.inputCloudProcessingUrl) {
                    this.inputCloudProcessingUrl.value = settings.cloudProcessingUrl || '';
                }
                this.selLanguage.value = settings.language || 'auto';
                this.chkEnhance.checked = true;
                this.chkEnhance.disabled = true;
                this.selPromptStyle.value = settings.promptStyle || 'Clean';
                if (this.inputCustomPrompt) {
                    this.inputCustomPrompt.value = settings.customPrompt || '';
                }
                this.chkAutoPaste.checked = settings.autoPaste || false;
                if (this.chkLaunchOnStartup) {
                    this.chkLaunchOnStartup.checked = settings.launchOnStartup !== false;
                }
                if (this.chkAutoUpdate) {
                    this.chkAutoUpdate.checked = settings.autoUpdate !== false;
                }
                if (this.chkAlwaysOn) {
                    this.chkAlwaysOn.checked = settings.alwaysOn === true;
                }
                if (this.chkPrivacyMode) {
                    this.chkPrivacyMode.checked = settings.privacyMode === true;
                }
                if (this.inputSmartContext) {
                    this.inputSmartContext.value = settings.smartContext || '';
                }

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
                this.renderShortcutReference(settings.hotkey || 'CommandOrControl+Shift+Space');

                // Trigger change to update style group opacity
                this.updateCloudProcessingControls();
                this.updateEnhancementControls();
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    async saveSettings() {
        if (!window.api) return;

        const newSettings = {
            groqApiKey: this.inputApiKey.value.trim(),
            cloudProcessingEnabled: this.chkCloudProcessing ? this.chkCloudProcessing.checked : false,
            cloudProcessingUrl: this.inputCloudProcessingUrl ? this.inputCloudProcessingUrl.value.trim() : '',
            language: this.selLanguage.value,
            enhanceText: true,
            promptStyle: this.selPromptStyle.value,
            customPrompt: this.inputCustomPrompt ? this.inputCustomPrompt.value.trim() : '',
            autoPaste: this.chkAutoPaste.checked,
            launchOnStartup: this.chkLaunchOnStartup ? this.chkLaunchOnStartup.checked : true,
            autoUpdate: this.chkAutoUpdate ? this.chkAutoUpdate.checked : true,
            alwaysOn: this.chkAlwaysOn ? this.chkAlwaysOn.checked : false,
            privacyMode: this.chkPrivacyMode ? this.chkPrivacyMode.checked : false,
            smartContext: this.inputSmartContext ? this.inputSmartContext.value.trim() : '',
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
        if (this.isMacPlatform()) {
            return displayValue
                .replace(/Cmd/g, 'Command')
                .replace(/Option/g, 'Alt')
                .replace(/Ctrl/g, 'Control')
                .replace(/\s*\+\s*/g, '+');
        }

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

        const testIconSvg = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
        this.btnTestKey.innerHTML = testIconSvg + ' Testing...';
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
            this.btnTestKey.innerHTML = testIconSvg + ' Test Connection';
            this.btnTestKey.disabled = false;
        }
    }

    showTestResult(message, isSuccess) {
        this.testResult.textContent = message;
        this.testResult.className = `test-result ${isSuccess ? 'success' : 'error'}`;
        this.testResult.style.display = 'block';
    }

    /**
     * Open the logs folder in the system file explorer
     */
    async openLogsFolder() {
        if (!window.api || !window.api.openLogsFolder) {
            console.error('openLogsFolder API not available');
            return;
        }

        try {
            this.btnOpenLogs.disabled = true;
            this.btnOpenLogs.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                Opening...
            `;

            const result = await window.api.openLogsFolder();

            if (!result.success) {
                console.error('Failed to open logs folder:', result.error);
                // Show error toast
                const toast = document.getElementById('toast');
                if (toast) {
                    toast.querySelector('.toast-text').innerText = 'Failed to open logs folder';
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 2000);
                }
            }
        } catch (error) {
            console.error('Error opening logs folder:', error);
        } finally {
            // Restore button state
            this.btnOpenLogs.disabled = false;
            this.btnOpenLogs.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                </svg>
                Open Logs Folder
            `;
        }
    }
}

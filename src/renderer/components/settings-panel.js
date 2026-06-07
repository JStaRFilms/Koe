export class SettingsPanel {
    constructor() {
        this.panel = document.getElementById('settings-panel');
        this.btnClose = document.getElementById('btn-close-settings');
        this.btnSave = document.getElementById('btn-save-settings');
        this.btnToggleKey = document.getElementById('btn-toggle-key');
        this.btnTestKey = document.getElementById('btn-test-key');
        this.btnOpenLogs = document.getElementById('btn-open-logs');
        this.inputApiKey = document.getElementById('api-key');
        this.localFallbackSection = document.getElementById('local-fallback-section');
        this.localFallbackSummary = document.getElementById('local-fallback-summary');
        this.localFallbackContent = document.getElementById('local-fallback-content');
        this.localFallbackDescription = document.getElementById('local-fallback-description');
        this.localFallbackHelp = document.getElementById('local-fallback-help');
        this.localFallbackToggle = document.getElementById('btn-toggle-local-fallback');
        this.localFallbackNavButton = document.getElementById('local-fallback-nav-btn');
        this.selLanguage = document.getElementById('language');
        this.chkEnhance = document.getElementById('enhance-text');
        this.selPromptStyle = document.getElementById('prompt-style');
        this.inputCustomPrompt = document.getElementById('custom-prompt');
        this.chkAutoPaste = document.getElementById('auto-paste');
        this.chkLaunchOnStartup = document.getElementById('launch-on-startup');
        this.chkAutoUpdate = document.getElementById('auto-update');
        this.testResult = document.getElementById('test-key-result');
        this.promptStyleGroup = document.getElementById('prompt-style-group');
        this.customPromptGroup = document.getElementById('custom-prompt-group');

        this.selModel = document.getElementById('transcription-model');
        this.selTheme = document.getElementById('theme');
        this.inputHotkey = document.getElementById('hotkey');
        this.hotkeyError = document.getElementById('hotkey-error');
        this.shortcutRecordToggle = document.getElementById('shortcut-record-toggle');
        this.shortcutRetryLast = document.getElementById('shortcut-retry-last');
        this.shortcutSettingsTabs = document.getElementById('shortcut-settings-tabs');
        this.shortcutSettingsClose = document.getElementById('shortcut-settings-close');

        this.accountStatusCard = document.getElementById('account-status-card');
        this.accountStatusChip = document.getElementById('account-status-chip');
        this.accountStatusSubtitle = document.getElementById('account-status-subtitle');
        this.accountStatusMeta = document.getElementById('account-status-meta');
        this.accountSnapshot = document.getElementById('account-snapshot');
        this.accountActionResult = document.getElementById('account-action-result');
        this.inputAccountEmail = document.getElementById('account-email');
        this.inputAccountPassword = document.getElementById('account-password');
        this.inputAccountDisplayName = document.getElementById('account-display-name');
        this.accountModeSelect = document.getElementById('account-mode-select');
        this.inputAccountByok = document.getElementById('account-byok-key');
        this.accountByokHelp = document.getElementById('account-byok-help');
        this.accountByokSavedLabel = document.getElementById('account-byok-saved-label');
        this.btnAccountSignUp = document.getElementById('btn-account-sign-up');
        this.btnAccountSignIn = document.getElementById('btn-account-sign-in');
        this.btnAccountPasswordReset = document.getElementById('btn-account-password-reset');
        this.btnAccountSignOut = document.getElementById('btn-account-sign-out');
        this.btnAccountEmailVerify = document.getElementById('btn-account-email-verify');
        this.btnAccountRefresh = document.getElementById('btn-account-refresh');
        this.btnAccountWebBilling = document.getElementById('btn-account-web-billing');
        this.btnAccountModeSave = document.getElementById('btn-account-mode-save');
        this.btnAccountByokSave = document.getElementById('btn-account-byok-save');
        this.btnAccountByokDelete = document.getElementById('btn-account-byok-delete');

        this.accountState = null;
        this.accountActionBusy = false;
        this.showLocalFallbackControls = false;
        this.isRecordingHotkey = false;
        this.pendingHotkey = null;
        this.savedSettingsSnapshot = null;
        this.hasDirtySettings = false;
        this.isSavingSettings = false;

        this.initListeners();
        this.initDirtyTracking();
        if (this.chkEnhance) {
            this.chkEnhance.checked = true;
            this.chkEnhance.disabled = true;
        }
    }

    isMacPlatform() {
        return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');
    }

    async show() {
        this.panel.classList.remove('hide');
        await this.loadSettings();
    }

    hide() {
        this.panel.classList.add('hide');
        this.hideResult(this.testResult);
    }

    initListeners() {
        this.btnClose?.addEventListener('click', () => this.hide());
        this.btnSave?.addEventListener('click', () => this.saveSettings());

        this.btnToggleKey?.addEventListener('click', () => {
            if (this.inputApiKey.type === 'password') {
                this.inputApiKey.type = 'text';
                this.btnToggleKey.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
            } else {
                this.inputApiKey.type = 'password';
                this.btnToggleKey.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });

        this.btnTestKey?.addEventListener('click', () => this.testApiKey());
        this.btnAccountSignUp?.addEventListener('click', () => this.handleAccountSignUp());
        this.btnAccountSignIn?.addEventListener('click', () => this.handleAccountSignIn());
        this.btnAccountPasswordReset?.addEventListener('click', () => this.handleAccountPasswordReset());
        this.btnAccountSignOut?.addEventListener('click', () => this.handleAccountSignOut());
        this.btnAccountEmailVerify?.addEventListener('click', () => this.handleAccountEmailVerification());
        this.btnAccountRefresh?.addEventListener('click', () => this.handleAccountRefresh());
        this.btnAccountWebBilling?.addEventListener('click', () => this.handleOpenWebBilling());
        this.btnAccountModeSave?.addEventListener('click', () => this.handleAccountModeSave());
        this.btnAccountByokSave?.addEventListener('click', () => this.handleAccountByokSave());
        this.btnAccountByokDelete?.addEventListener('click', () => this.handleAccountByokDelete());
        this.localFallbackToggle?.addEventListener('click', () => {
            this.showLocalFallbackControls = !this.showLocalFallbackControls;
            this.updateLocalFallbackVisibility();
        });

        this.chkEnhance?.addEventListener('change', () => this.updateEnhancementControls());

        this.selTheme?.addEventListener('change', () => {
            this.applyThemePreview(this.selTheme.value);
        });

        if (this.inputHotkey) {
            this.inputHotkey.addEventListener('focus', () => this.startHotkeyRecording());
            this.inputHotkey.addEventListener('blur', () => this.stopHotkeyRecording());
            this.inputHotkey.addEventListener('keydown', (e) => this.handleHotkeyInput(e));
        }

        this.btnOpenLogs?.addEventListener('click', () => this.openLogsFolder());
    }

    initDirtyTracking() {
        const trackedControls = [
            this.inputApiKey,
            this.selLanguage,
            this.selPromptStyle,
            this.inputCustomPrompt,
            this.chkAutoPaste,
            this.chkLaunchOnStartup,
            this.chkAutoUpdate,
            this.selModel,
            this.selTheme,
            this.inputHotkey
        ].filter(Boolean);

        trackedControls.forEach((control) => {
            control.addEventListener('input', () => this.updateDirtyState());
            control.addEventListener('change', () => this.updateDirtyState());
        });

        this.updateSaveButtonState();
    }

    getCurrentSettingsSnapshot() {
        return {
            groqApiKey: this.inputApiKey?.value.trim() || '',
            language: this.selLanguage?.value || 'auto',
            enhanceText: true,
            promptStyle: this.selPromptStyle?.value || 'Clean',
            customPrompt: this.inputCustomPrompt ? this.inputCustomPrompt.value.trim() : '',
            autoPaste: this.chkAutoPaste?.checked === true,
            launchOnStartup: this.chkLaunchOnStartup ? this.chkLaunchOnStartup.checked : true,
            autoUpdate: this.chkAutoUpdate ? this.chkAutoUpdate.checked : true,
            model: this.selModel ? this.selModel.value : 'whisper-large-v3-turbo',
            theme: this.selTheme ? this.selTheme.value : 'dark',
            hotkey: this.pendingHotkey || (this.inputHotkey ? this.parseHotkeyFromDisplay(this.inputHotkey.value) : 'CommandOrControl+Shift+Space')
        };
    }

    settingsSnapshotsEqual(left, right) {
        return JSON.stringify(left || null) === JSON.stringify(right || null);
    }

    updateSaveButtonState() {
        if (this.btnSave) {
            this.btnSave.disabled = !this.hasDirtySettings || this.isSavingSettings;
            this.btnSave.textContent = this.isSavingSettings ? 'Saving...' : (this.hasDirtySettings ? 'Save changes' : 'No changes');
        }
    }

    updateDirtyState(forceDirty = null) {
        if (forceDirty !== null) {
            this.hasDirtySettings = forceDirty === true;
        } else if (!this.savedSettingsSnapshot) {
            this.hasDirtySettings = false;
        } else {
            this.hasDirtySettings = !this.settingsSnapshotsEqual(this.getCurrentSettingsSnapshot(), this.savedSettingsSnapshot);
        }

        this.updateSaveButtonState();
        return this.hasDirtySettings;
    }

    hasUnsavedChanges() {
        return this.hasDirtySettings === true;
    }

    markSavedSnapshot() {
        this.savedSettingsSnapshot = this.getCurrentSettingsSnapshot();
        this.updateDirtyState(false);
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
        this.hotkeyError?.classList.remove('show');
    }

    stopHotkeyRecording() {
        this.isRecordingHotkey = false;
        if (this.inputHotkey) {
            this.inputHotkey.classList.remove('recording');
            this.inputHotkey.placeholder = 'e.g., CommandOrControl+Shift+Space';
            if (!this.pendingHotkey && window.api?.getSettings) {
                window.api.getSettings().then((settings) => {
                    const hotkey = settings?.hotkey || 'CommandOrControl+Shift+Space';
                    this.inputHotkey.value = this.formatHotkeyForDisplay(hotkey);
                    this.renderShortcutReference(hotkey);
                }).catch(() => {});
            }
        }
    }

    handleHotkeyInput(e) {
        if (!this.isRecordingHotkey) return;

        e.preventDefault();

        const modifiers = [];
        const isMac = this.isMacPlatform();
        if (e.ctrlKey) modifiers.push(isMac ? 'Control' : 'CommandOrControl');
        if (e.altKey) modifiers.push('Alt');
        if (e.shiftKey) modifiers.push('Shift');
        if (e.metaKey) modifiers.push(isMac ? 'Command' : 'Super');

        let key = e.key;
        if (key === ' ') key = 'Space';
        if (key === 'Escape') key = 'Esc';
        if (key.length === 1) key = key.toUpperCase();

        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
            return;
        }

        const accelerator = [...modifiers, key].join('+');
        this.pendingHotkey = accelerator;

        if (this.inputHotkey) {
            this.inputHotkey.value = this.formatHotkeyForDisplay(accelerator);
        }

        this.renderShortcutReference(accelerator);
        this.updateDirtyState();
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

    hideResult(target) {
        if (!target) {
            return;
        }

        target.style.display = 'none';
        target.className = 'test-result';
        target.textContent = '';
    }

    showResult(target, message, isSuccess) {
        if (!target) {
            return;
        }

        target.textContent = message;
        target.className = `test-result ${isSuccess ? 'success' : 'error'}`;
        target.style.display = 'block';
    }

    showTestResult(message, isSuccess) {
        this.showResult(this.testResult, message, isSuccess);
    }

    cleanActionErrorMessage(error, fallback = 'Action failed.') {
        const raw = String(error?.message || error || fallback).trim();
        return raw
            .replace(/^Error invoking remote method '[^']+':\s*/i, '')
            .replace(/^Error:\s*/i, '')
            .trim() || fallback;
    }

    showAccountResult(message, isSuccess) {
        this.showResult(this.accountActionResult, message, isSuccess);
    }

    getAccountCredentials() {
        const email = this.inputAccountEmail?.value.trim() || '';
        const password = this.inputAccountPassword?.value || '';
        const displayName = this.inputAccountDisplayName?.value.trim() || '';
        return { email, password, displayName };
    }

    getSyncedSettingsPayload() {
        return {
            language: this.selLanguage.value,
            enhanceText: true,
            promptStyle: this.selPromptStyle.value,
            customPrompt: this.inputCustomPrompt ? this.inputCustomPrompt.value.trim() : '',
            model: this.selModel ? this.selModel.value : 'whisper-large-v3-turbo'
        };
    }

    getSelectedAccountMode(state) {
        return state?.user?.defaultMode || state?.resolvedMode?.mode || 'managed';
    }

    describeAccountByok(state) {
        const byok = state?.capabilities?.byok;
        if (byok?.available) {
            return byok.last4 ? `Saved ending in ${byok.last4}` : 'Saved in account vault';
        }
        return 'No account key saved';
    }

    isEmailVerified(state) {
        return Boolean(state?.user?.emailVerifiedAt);
    }

    describeEmailVerification(state) {
        if (!state?.authenticated) {
            return 'Sign in to check email status';
        }

        return this.isEmailVerified(state)
            ? `Verified${state.user.emailVerifiedAt ? ` on ${new Date(state.user.emailVerifiedAt).toLocaleDateString()}` : ''}`
            : 'Unverified';
    }

    formatDuration(seconds) {
        const value = Math.max(0, Math.round(Number(seconds || 0)));
        if (value < 60) return `${value}s`;
        if (value < 3600) return `${Math.round(value / 60)}m`;
        return `${Math.round((value / 3600) * 10) / 10}h`;
    }

    managedUsageSummary(usage) {
        if (!usage) return 'N/A';
        if (usage.source !== 'dynamic_free') {
            return `${this.formatDuration(usage.audioSecondsUsed)}/${this.formatDuration(usage.audioSecondsLimit)} used • ${usage.requestCountUsed}/${usage.requestCountLimit} reqs`;
        }

        const remaining = Math.max(0, Number(usage.audioSecondsLimit || 0) - Number(usage.audioSecondsUsed || 0));
        const floor = this.formatDuration(usage.guaranteedFloorSeconds || 300);
        return `${this.formatDuration(remaining)} left today • ${floor} guaranteed • ${this.formatDuration(usage.audioSecondsLimit)} quiet-pool limit`;
    }

    updateLocalFallbackVisibility() {
        const authenticated = this.accountState?.authenticated === true;
        const shouldCollapse = authenticated && !this.showLocalFallbackControls;

        this.localFallbackSummary?.classList.toggle('hidden', !authenticated);
        this.localFallbackContent?.classList.toggle('hidden', shouldCollapse);

        if (this.localFallbackToggle) {
            this.localFallbackToggle.textContent = shouldCollapse
                ? 'Show fallback key options'
                : 'Hide fallback key options';
        }

        if (this.localFallbackDescription) {
            this.localFallbackDescription.textContent = authenticated
                ? 'Signed-in recordings use the account mode above. Keep a local Groq key only as an optional desktop fallback.'
                : 'Save a local Groq key if you want to record without signing in.';
        }

        if (this.localFallbackHelp) {
            this.localFallbackHelp.textContent = authenticated
                ? 'Only used when signed out or when you intentionally use desktop-only fallback.'
                : 'Stored only on this desktop for local BYOK processing.';
        }

        if (this.localFallbackNavButton) {
            this.localFallbackNavButton.textContent = authenticated ? 'Fallback key' : 'Local BYOK';
        }
    }

    accountModeSummary(state) {
        if (!state?.resolvedMode) {
            return 'Signed out. Local desktop fallback is available when you save a Groq key below.';
        }

        const selectedMode = this.getSelectedAccountMode(state);
        const resolvedMode = `${state.resolvedMode.mode}${state.resolvedMode.available ? '' : ' (unavailable)'}`;
        const byok = state.capabilities?.byok?.available
            ? `BYOK ready${state.capabilities.byok.last4 ? ` ••••${state.capabilities.byok.last4}` : ''}`
            : (selectedMode === 'byok'
                ? 'BYOK mode selected, but no Groq key is saved yet'
                : 'No account BYOK key saved');
        const managed = state.capabilities?.managed?.available
            ? 'Managed available'
            : `Managed ${state.capabilities?.managed?.status || 'unavailable'}`;
        return `Resolved mode: ${resolvedMode}. ${byok}. ${managed}.`;
    }

    renderAccountState(state) {
        const wasAuthenticated = this.accountState?.authenticated === true;
        this.accountState = state || null;
        const authenticated = state?.authenticated === true;
        if (!authenticated || authenticated !== wasAuthenticated) {
            this.showLocalFallbackControls = false;
        }
        this.updateLocalFallbackVisibility();

        if (this.accountStatusChip) {
            this.accountStatusChip.textContent = authenticated ? 'Signed in' : 'Signed out';
            this.accountStatusChip.classList.toggle('signed-in', authenticated);
            this.accountStatusChip.classList.toggle('signed-out', !authenticated);
        }

        const title = this.accountStatusCard?.querySelector('.account-status-title');
        if (title) {
            title.textContent = authenticated
                ? `Signed in as ${state.user?.email || 'account user'}`
                : 'Signed out';
        }

        const selectedMode = this.getSelectedAccountMode(state);
        const hasAccountByok = state?.capabilities?.byok?.available === true;

        if (this.accountStatusSubtitle) {
            this.accountStatusSubtitle.textContent = authenticated
                ? (selectedMode === 'byok' && !hasAccountByok
                    ? 'Bring Your Own Key is selected. Save a Groq key in the account BYOK vault below to make this mode available.'
                    : `Default mode: ${selectedMode} • Session active until ${state.session?.expiresAt ? new Date(state.session.expiresAt).toLocaleString() : 'unknown'}`)
                : 'Use your Koe account to sync BYOK and mode across devices.';
        }

        if (this.accountStatusMeta) {
            this.accountStatusMeta.textContent = this.accountModeSummary(state);
        }

        const busy = this.accountActionBusy === true;
        const emailVerified = this.isEmailVerified(state);

        if (this.accountModeSelect) {
            this.accountModeSelect.disabled = busy || !authenticated;
            this.accountModeSelect.value = state?.user?.defaultMode || 'managed';
        }

        if (this.btnAccountSignUp) {
            this.btnAccountSignUp.disabled = busy || authenticated;
        }
        if (this.btnAccountSignIn) {
            this.btnAccountSignIn.disabled = busy || authenticated;
        }
        if (this.btnAccountPasswordReset) {
            this.btnAccountPasswordReset.disabled = busy || authenticated;
        }
        if (this.btnAccountModeSave) {
            this.btnAccountModeSave.disabled = busy || !authenticated;
        }
        if (this.btnAccountSignOut) {
            this.btnAccountSignOut.disabled = busy || !authenticated;
        }
        if (this.btnAccountEmailVerify) {
            this.btnAccountEmailVerify.disabled = busy || !authenticated || emailVerified;
            this.btnAccountEmailVerify.textContent = emailVerified ? 'Email Verified' : 'Verify Email';
        }
        if (this.btnAccountRefresh) {
            this.btnAccountRefresh.disabled = busy;
        }
        if (this.btnAccountWebBilling) {
            this.btnAccountWebBilling.disabled = busy;
        }
        if (this.btnAccountByokSave) {
            this.btnAccountByokSave.disabled = busy || !authenticated;
        }
        if (this.btnAccountByokDelete) {
            this.btnAccountByokDelete.disabled = busy || !authenticated;
        }

        if (this.accountByokSavedLabel) {
            this.accountByokSavedLabel.textContent = this.describeAccountByok(state);
            this.accountByokSavedLabel.classList.toggle('ready', authenticated && hasAccountByok);
            this.accountByokSavedLabel.classList.toggle('warning', authenticated && selectedMode === 'byok' && !hasAccountByok);
        }

        if (this.accountByokHelp) {
            const byok = state?.capabilities?.byok;
            this.accountByokHelp.textContent = authenticated
                ? (byok?.available
                    ? `Bring Your Own Key is ready${byok.last4 ? ` with account key ending in ${byok.last4}` : ''}. Metadata only is returned to the app.`
                    : (selectedMode === 'byok'
                        ? 'BYOK mode is selected, but no account Groq key is saved yet. Paste your key here and click Save.'
                        : 'No account BYOK key saved yet. Switch to BYOK any time, then save a Groq key here.'))
                : 'Sign in to save a Bring Your Own Key credential to your account vault.';
        }

        if (this.accountSnapshot) {
            if (!authenticated) {
                this.accountSnapshot.innerHTML = `
                    <div class="snapshot-grid">
                        <div class="snapshot-row">
                            <span class="snapshot-label">User Status</span>
                            <span class="snapshot-value">Signed out</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Email Status</span>
                            <span class="snapshot-value">${this.describeEmailVerification(state)}</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Local Fallback</span>
                            <span class="snapshot-value">${state?.localFallback?.hasLocalGroqKey ? 'Configured' : 'Not configured'}</span>
                        </div>
                    </div>
                `;
            } else {
                const managedUsage = state?.capabilities?.managed?.usage;
                const byokText = state.capabilities?.byok?.available 
                    ? `Available (•••• ${state.capabilities.byok.last4 || 'bMRY'})` 
                    : (selectedMode === 'byok' ? 'Not saved — Add key above' : 'Not saved');
                const managedStatus = `${state.capabilities?.managed?.status || 'unallocated'}${state.capabilities?.managed?.available ? ' (Available)' : ' (Unavailable)'}`;
                
                this.accountSnapshot.innerHTML = `
                    <div class="snapshot-grid">
                        <div class="snapshot-row">
                            <span class="snapshot-label">User</span>
                            <span class="snapshot-value">${state.user?.email || 'Unknown'}</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Email Status</span>
                            <span class="snapshot-value">${this.describeEmailVerification(state)}</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Resolved Mode</span>
                            <span class="snapshot-value" style="font-weight: 600; color: var(--koe-accent);">${state.resolvedMode?.mode || 'unknown'}</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Account BYOK</span>
                            <span class="snapshot-value">${byokText}</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Managed Tier</span>
                            <span class="snapshot-value">${managedStatus}</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Managed Usage</span>
                            <span class="snapshot-value">${this.managedUsageSummary(managedUsage)}</span>
                        </div>
                        <div class="snapshot-row">
                            <span class="snapshot-label">Local Fallback Key</span>
                            <span class="snapshot-value">${state.localFallback?.hasLocalGroqKey ? 'Configured' : 'Not configured'}</span>
                        </div>
                    </div>
                `;
            }
        }
    }

    async loadAccountState(showSuccessMessage = false) {
        if (!window.api?.getAccountState) {
            return;
        }

        try {
            const state = await window.api.getAccountState();
            this.renderAccountState(state);
            if (showSuccessMessage) {
                this.showAccountResult(state?.authenticated ? 'Account snapshot refreshed ✓' : 'Account state refreshed ✓', true);
            }
            return state;
        } catch (error) {
            console.error('Failed to load account state', error);
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Failed to load account state'), false);
        }
    }

    async handleAccountRefresh() {
        await this.withAccountAction(this.btnAccountRefresh, 'Refreshing...', async () => {
            await this.loadAccountState(true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Failed to refresh account.'), false);
        });
    }

    async handleAccountPasswordReset() {
        const { email } = this.getAccountCredentials();
        if (!email) {
            this.showAccountResult('Enter your email address first.', false);
            return;
        }

        await this.withAccountAction(this.btnAccountPasswordReset, 'Sending...', async () => {
            await window.api.requestAccountPasswordReset({ email });
            this.showAccountResult('If that email has a Koe account, a reset link is on the way.', true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Could not request a password reset email.'), false);
        });
    }

    async handleAccountEmailVerification() {
        if (!this.accountState?.authenticated) {
            this.showAccountResult('Sign in before requesting a verification email.', false);
            return;
        }

        await this.withAccountAction(this.btnAccountEmailVerify, 'Sending...', async () => {
            await window.api.requestAccountEmailVerification();
            this.showAccountResult('Verification email sent. Open the link in your inbox to confirm this address.', true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Could not send a verification email.'), false);
        });
    }

    async handleOpenWebBilling() {
        await this.withAccountAction(this.btnAccountWebBilling, 'Opening...', async () => {
            const result = await window.api.openWebBilling();
            this.showAccountResult(`Opened Koe web account in your browser${result?.url ? `: ${result.url}` : '.'}`, true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Could not open Koe web account.'), false);
        });
    }

    async loadSettings() {
        if (!window.api) return;
        try {
            await this.loadAccountState(false);
            const settings = await window.api.getSettings();

            if (settings) {
                this.inputApiKey.value = settings.groqApiKey || '';
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
                if (this.selModel) {
                    this.selModel.value = settings.model || 'whisper-large-v3-turbo';
                }
                if (this.selTheme) {
                    this.selTheme.value = settings.theme || 'dark';
                }
                if (this.inputHotkey) {
                    this.inputHotkey.value = this.formatHotkeyForDisplay(settings.hotkey || 'CommandOrControl+Shift+Space');
                }
                this.pendingHotkey = null;
                this.renderShortcutReference(settings.hotkey || 'CommandOrControl+Shift+Space');
                this.updateEnhancementControls();
                this.markSavedSnapshot();
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    }

    async saveSettings() {
        if (!window.api) return false;

        const newSettings = this.getCurrentSettingsSnapshot();

        try {
            this.isSavingSettings = true;
            this.updateSaveButtonState();
            await window.api.saveSettings(newSettings);
            this.pendingHotkey = null;

            if (this.accountState?.authenticated && window.api.saveAccountSettings) {
                try {
                    await window.api.saveAccountSettings(this.getSyncedSettingsPayload());
                    this.showAccountResult('Local settings saved and synced to your account ✓', true);
                } catch (accountError) {
                    console.error('Failed to sync account settings', accountError);
                    this.showAccountResult(`Local settings saved, but account sync failed: ${accountError.message}`, false);
                }
            }

            this.markSavedSnapshot();
            return true;
        } catch (e) {
            console.error('Failed to save settings', e);
            if (e.message && e.message.includes('hotkey')) {
                if (this.hotkeyError) {
                    this.hotkeyError.textContent = e.message;
                    this.hotkeyError.classList.add('show');
                }
            } else {
                alert('Failed to save settings: ' + e.message);
            }
            return false;
        } finally {
            this.isSavingSettings = false;
            this.updateSaveButtonState();
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

    setAccountActionBusy(isBusy) {
        this.accountActionBusy = isBusy === true;
        this.renderAccountState(this.accountState);
    }

    async withAccountAction(button, busyText, action) {
        if (this.accountActionBusy) {
            return null;
        }

        this.setAccountActionBusy(true);
        try {
            return await this.withBusyButton(button, busyText, action);
        } finally {
            this.setAccountActionBusy(false);
        }
    }

    async withBusyButton(button, busyText, action, options = {}) {
        if (!button) {
            return action();
        }

        const original = button.innerHTML;
        button.disabled = true;
        button.textContent = busyText;

        let succeeded = false;

        try {
            const result = await action();
            succeeded = true;
            return result;
        } finally {
            if (options.restoreDisabled !== false || !succeeded) {
                button.disabled = false;
            }
            button.innerHTML = original;
        }
    }

    async handleAccountSignUp() {
        const { email, password, displayName } = this.getAccountCredentials();
        if (!email || !password) {
            this.showAccountResult('Email and password are required.', false);
            return;
        }

        await this.withAccountAction(this.btnAccountSignUp, 'Signing Up...', async () => {
            const state = await window.api.signUp({ email, password, displayName });
            this.renderAccountState(state);
            await this.loadSettings();
            this.inputAccountPassword.value = '';
            this.showAccountResult('Account created and signed in ✓', true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Sign up failed.'), false);
        });
    }

    async handleAccountSignIn() {
        const { email, password } = this.getAccountCredentials();
        if (!email || !password) {
            this.showAccountResult('Email and password are required.', false);
            return;
        }

        await this.withAccountAction(this.btnAccountSignIn, 'Signing In...', async () => {
            const state = await window.api.signIn({ email, password });
            this.renderAccountState(state);
            await this.loadSettings();
            this.inputAccountPassword.value = '';
            this.showAccountResult('Signed in successfully ✓', true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Sign in failed.'), false);
        });
    }

    async handleAccountSignOut() {
        await this.withAccountAction(this.btnAccountSignOut, 'Signing Out...', async () => {
            const state = await window.api.signOut();
            this.renderAccountState(state);
            this.inputAccountPassword.value = '';
            this.inputAccountByok.value = '';
            this.showAccountResult('Signed out ✓', true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Sign out failed.'), false);
        });
    }

    async handleAccountModeSave() {
        if (!this.accountModeSelect?.value) {
            return;
        }

        const selectedMode = this.accountModeSelect.value;

        await this.withAccountAction(this.btnAccountModeSave, 'Saving...', async () => {
            const state = await window.api.setAccountMode({ defaultMode: selectedMode });
            this.renderAccountState(state);
            this.showAccountResult(`Default mode set to ${selectedMode === 'byok' ? 'BYOK (Bring Your Own Key)' : 'managed'} ✓`, true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Failed to update account mode.'), false);
        });
    }

    async handleAccountByokSave() {
        const apiKey = this.inputAccountByok?.value.trim() || '';
        if (!apiKey) {
            this.showAccountResult('Enter a Groq API key to save to your account.', false);
            return;
        }

        await this.withAccountAction(this.btnAccountByokSave, 'Saving...', async () => {
            const state = await window.api.saveAccountByok({ apiKey, validate: true });
            this.renderAccountState(state);
            this.inputAccountByok.value = '';
            this.showAccountResult('Synced Groq BYOK saved to your account ✓', true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Failed to save account Groq key.'), false);
        });
    }

    async handleAccountByokDelete() {
        await this.withAccountAction(this.btnAccountByokDelete, 'Deleting...', async () => {
            const state = await window.api.deleteAccountByok();
            this.renderAccountState(state);
            this.inputAccountByok.value = '';
            this.showAccountResult('Synced Groq BYOK deleted from your account ✓', true);
        }).catch((error) => {
            this.showAccountResult(this.cleanActionErrorMessage(error, 'Failed to delete account Groq key.'), false);
        });
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
        this.hideResult(this.testResult);

        try {
            const isValid = await window.api.testGroqKey(key);
            if (isValid) {
                this.showTestResult('Connection successful ✓', true);
            } else {
                this.showTestResult('Invalid API Key ✗', false);
            }
        } catch (_error) {
            this.showTestResult('Connection failed ✗', false);
        } finally {
            this.btnTestKey.innerHTML = testIconSvg + ' Test Connection';
            this.btnTestKey.disabled = false;
        }
    }

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

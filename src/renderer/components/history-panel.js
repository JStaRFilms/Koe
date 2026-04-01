export class HistoryPanel {
    constructor() {
        this.container = document.getElementById('history-panel');
        this.content = document.getElementById('history-content');
        this.btnClose = document.getElementById('btn-close-history');
        this.btnClear = document.getElementById('btn-clear-history');
        this.btnCopyAll = document.getElementById('btn-copy-history');
        this.btnExport = document.getElementById('btn-export-history');
        this.searchField = document.getElementById('history-search');

        if (this.btnClose) {
            this.btnClose.addEventListener('click', () => this.hide());
        }

        if (this.btnClear) {
            this.btnClear.addEventListener('click', () => this.clearHistory());
        }

        if (this.btnCopyAll) {
            this.btnCopyAll.addEventListener('click', () => this.copyAllToClipboard());
        }

        if (this.btnExport) {
            this.btnExport.addEventListener('click', () => this.exportHistory());
        }

        if (this.searchField) {
            this.searchField.addEventListener('input', (e) => this.searchHistory(e.target.value));
        }
    }

    show() {
        if (!this.container) return;
        this.container.classList.remove('hide');
        this.loadHistory();
    }

    hide() {
        if (!this.container) return;
        this.container.classList.add('hide');
    }

    async loadHistory() {
        if (!window.api || !window.api.getHistory) return;

        try {
            const query = this.searchField ? this.searchField.value : '';
            const history = query
                ? await window.api.searchHistory(query)
                : await window.api.getHistory();
            this.renderHistory(history);
        } catch (error) {
            window.api.log(`Failed to load history: ${error.message}`);
        }
    }

    async searchHistory(query) {
        if (!window.api || !window.api.searchHistory) return;

        try {
            const history = await window.api.searchHistory(query);
            this.renderHistory(history);
        } catch (error) {
            window.api.log(`Failed to search history: ${error.message}`);
        }
    }

    createTextSection(label, text, modifierClass = '') {
        const section = document.createElement('div');
        section.className = `history-text-section ${modifierClass}`.trim();

        const labelEl = document.createElement('div');
        labelEl.className = 'history-text-label';
        labelEl.textContent = label;

        const bodyEl = document.createElement('div');
        bodyEl.className = 'history-text-body';
        bodyEl.textContent = text;

        section.appendChild(labelEl);
        section.appendChild(bodyEl);
        return section;
    }

    async copyText(text, successMessage, fallbackMessage = 'Copy failed') {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(successMessage);
        } catch (error) {
            window.api?.log(`Failed to copy text: ${error.message}`);
            this.showToast(fallbackMessage);
        }
    }

    renderHistory(historyEntries) {
        if (!this.content) return;

        this.content.innerHTML = '';

        if (!historyEntries || historyEntries.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'history-empty';
            emptyDiv.textContent = 'No transcription history yet.';
            this.content.appendChild(emptyDiv);
            return;
        }

        historyEntries.forEach((entry) => {
            const refinedText = entry.refinedText || entry.text || '';
            const rawText = entry.rawText || entry.text || '';
            const previewText = refinedText.length > 100 ? `${refinedText.substring(0, 100)}...` : refinedText;
            const hasDistinctRawText = rawText && rawText !== refinedText;

            const entryEl = document.createElement('div');
            entryEl.className = 'history-entry';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'history-header';

            const timeSpan = document.createElement('span');
            timeSpan.className = 'history-time';
            timeSpan.textContent = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            const badgesDiv = document.createElement('div');
            badgesDiv.className = 'history-badges';

            const langBadge = document.createElement('span');
            langBadge.className = 'badge lang-badge';
            langBadge.textContent = (entry.language || 'auto').toUpperCase();
            badgesDiv.appendChild(langBadge);

            if (entry.isLlamaEnhanced) {
                const enhanceBadge = document.createElement('span');
                enhanceBadge.className = 'badge enhance-badge';
                enhanceBadge.textContent = 'Refined';
                badgesDiv.appendChild(enhanceBadge);
            }

            if (entry.source === 'retry') {
                const retryBadge = document.createElement('span');
                retryBadge.className = 'badge retry-badge';
                retryBadge.textContent = 'Retry';
                badgesDiv.appendChild(retryBadge);
            }

            headerDiv.appendChild(timeSpan);
            headerDiv.appendChild(badgesDiv);

            const previewDiv = document.createElement('div');
            previewDiv.className = 'history-text-preview';
            previewDiv.textContent = previewText;

            const fullTextDiv = document.createElement('div');
            fullTextDiv.className = 'history-text-full';
            if (entry.isLlamaEnhanced || hasDistinctRawText) {
                fullTextDiv.appendChild(this.createTextSection('Refined', refinedText));
            }
            fullTextDiv.appendChild(this.createTextSection('Raw', rawText, 'history-text-section-raw'));

            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-actions';

            const btnExpand = document.createElement('button');
            btnExpand.className = 'secondary-btn btn-history-expand';
            btnExpand.title = 'Expand';
            btnExpand.textContent = 'Expand';

            const btnRetry = document.createElement('button');
            btnRetry.className = 'secondary-btn btn-history-retry';
            btnRetry.title = 'Retry raw transcript';
            btnRetry.textContent = 'Retry';

            const btnCopyRaw = document.createElement('button');
            btnCopyRaw.className = 'secondary-btn btn-history-copy-raw';
            btnCopyRaw.title = 'Copy raw transcript';
            btnCopyRaw.textContent = 'Copy Raw';

            actionsDiv.appendChild(btnExpand);
            actionsDiv.appendChild(btnRetry);
            actionsDiv.appendChild(btnCopyRaw);

            entryEl.appendChild(headerDiv);
            entryEl.appendChild(previewDiv);
            entryEl.appendChild(fullTextDiv);
            entryEl.appendChild(actionsDiv);

            btnExpand.addEventListener('click', () => {
                const isExpanded = entryEl.classList.toggle('is-expanded');
                btnExpand.textContent = isExpanded ? 'Compact' : 'Expand';
                btnExpand.title = isExpanded ? 'Compact' : 'Expand';
            });

            btnRetry.addEventListener('click', async () => {
                if (!window.api?.retryHistoryEntry) {
                    this.showToast('Retry is not available');
                    return;
                }

                btnRetry.disabled = true;
                btnRetry.textContent = 'Retrying...';

                try {
                    await window.api.retryHistoryEntry(entry.id);
                    this.showToast('Retried raw transcript');
                    await this.loadHistory();
                } catch (error) {
                    window.api.log(`Failed to retry history entry: ${error.message}`);
                    this.showToast('Retry failed');
                } finally {
                    btnRetry.disabled = false;
                    btnRetry.textContent = 'Retry';
                }
            });

            btnCopyRaw.addEventListener('click', () => {
                this.copyText(rawText, 'Copied raw text');
            });

            this.content.appendChild(entryEl);
        });
    }

    async clearHistory() {
        if (!confirm('Are you sure you want to clear your transcription history? This cannot be undone.')) {
            return;
        }

        try {
            if (window.api?.clearHistory) {
                await window.api.clearHistory();
                this.renderHistory([]);
            }
        } catch (error) {
            window.api.log(`Failed to clear history: ${error.message}`);
        }
    }

    async copyAllToClipboard() {
        if (!window.api?.getHistory) return;

        try {
            const history = await window.api.getHistory();
            if (history && history.length > 0) {
                const allText = history.map((entry) => entry.refinedText || entry.text || '').join('\n\n');
                await navigator.clipboard.writeText(allText);
                this.showToast('Copied all to clipboard');
            }
        } catch (error) {
            window.api.log(`Failed to copy history: ${error.message}`);
        }
    }

    async exportHistory() {
        if (!window.api?.exportHistory) {
            this.showToast('Export not available');
            return;
        }

        try {
            const result = await window.api.exportHistory('txt');
            if (result.success) {
                this.showToast(`Exported to ${result.filePath.split('/').pop().split('\\').pop()}`);
            } else if (result.error) {
                this.showToast(`Export failed: ${result.error}`);
            }
        } catch (error) {
            window.api.log(`Failed to export history: ${error.message}`);
            this.showToast('Export failed');
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        if (toast) {
            toast.querySelector('.toast-text').innerText = message;
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 2000);
        }
    }
}

export class HistoryPanel {
    constructor() {
        this.container = document.getElementById('history-panel');
        this.content = document.getElementById('history-content');
        this.btnClose = document.getElementById('btn-close-history');
        this.btnClear = document.getElementById('btn-clear-history');
        this.btnCopyAll = document.getElementById('btn-copy-history');
        this.btnExport = document.getElementById('btn-export-history');

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
            const history = await window.api.getHistory();
            this.renderHistory(history);
        } catch (error) {
            window.api.log(`Failed to load history: ${error.message}`);
        }
    }

    renderHistory(historyEntries) {
        if (!this.content) return;

        this.content.innerHTML = ''; // Clear current content

        if (!historyEntries || historyEntries.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'history-empty';
            emptyDiv.textContent = 'No transcription history yet.';
            this.content.appendChild(emptyDiv);
            return;
        }

        historyEntries.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = 'history-entry';

            const date = new Date(entry.timestamp);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Truncate text for preview
            const previewText = entry.text.length > 80 ? entry.text.substring(0, 80) + '...' : entry.text;

            // Create header
            const headerDiv = document.createElement('div');
            headerDiv.className = 'history-header';

            const timeSpan = document.createElement('span');
            timeSpan.className = 'history-time';
            timeSpan.textContent = timeString;

            const badgesDiv = document.createElement('div');
            badgesDiv.className = 'history-badges';

            const langBadge = document.createElement('span');
            langBadge.className = 'badge lang-badge';
            langBadge.textContent = entry.language.toUpperCase();
            badgesDiv.appendChild(langBadge);

            if (entry.isLlamaEnhanced) {
                const enhanceBadge = document.createElement('span');
                enhanceBadge.className = 'badge enhance-badge';
                enhanceBadge.textContent = 'Enhanced';
                badgesDiv.appendChild(enhanceBadge);
            }

            headerDiv.appendChild(timeSpan);
            headerDiv.appendChild(badgesDiv);

            // Create preview and full text elements (using textContent to prevent XSS)
            const previewDiv = document.createElement('div');
            previewDiv.className = 'history-text-preview';
            previewDiv.textContent = previewText;

            const fullTextDiv = document.createElement('div');
            fullTextDiv.className = 'history-text-full hide';
            fullTextDiv.textContent = entry.text;

            // Create actions
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'history-actions';

            const btnExpand = document.createElement('button');
            btnExpand.className = 'icon-btn btn-history-expand';
            btnExpand.title = 'Expand';
            btnExpand.textContent = 'v';

            const btnCopy = document.createElement('button');
            btnCopy.className = 'icon-btn btn-history-copy';
            btnCopy.title = 'Copy';
            btnCopy.textContent = '📋';

            actionsDiv.appendChild(btnExpand);
            actionsDiv.appendChild(btnCopy);

            // Assemble entry
            entryEl.appendChild(headerDiv);
            entryEl.appendChild(previewDiv);
            entryEl.appendChild(fullTextDiv);
            entryEl.appendChild(actionsDiv);

            // Expand/Collapse logic
            btnExpand.addEventListener('click', () => {
                if (fullTextDiv.classList.contains('hide')) {
                    fullTextDiv.classList.remove('hide');
                    previewDiv.classList.add('hide');
                    btnExpand.textContent = '^';
                } else {
                    fullTextDiv.classList.add('hide');
                    previewDiv.classList.remove('hide');
                    btnExpand.textContent = 'v';
                }
            });

            // Copy logic
            btnCopy.addEventListener('click', () => {
                navigator.clipboard.writeText(entry.text).then(() => {
                    this.showToast('Copied to clipboard');
                }).catch(err => {
                    window.api.log('Failed to copy text: ' + err);
                });
            });

            this.content.appendChild(entryEl);
        });
    }

    async clearHistory() {
        if (confirm("Are you sure you want to clear your transcription history? This cannot be undone.")) {
            try {
                if (window.api && window.api.clearHistory) {
                    await window.api.clearHistory();
                    this.renderHistory([]);
                }
            } catch (err) {
                window.api.log(`Failed to clear history: ${err.message}`);
            }
        }
    }

    async copyAllToClipboard() {
        if (!window.api || !window.api.getHistory) return;
        try {
            const history = await window.api.getHistory();
            if (history && history.length > 0) {
                const allText = history.map(h => h.text).join('\n\n');
                navigator.clipboard.writeText(allText).then(() => {
                    this.showToast('Copied all to clipboard');
                });
            }
        } catch (e) { }
    }

    async exportHistory() {
        if (!window.api || !window.api.exportHistory) {
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
            // Cancelled - don't show anything
        } catch (e) {
            window.api.log(`Failed to export history: ${e.message}`);
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

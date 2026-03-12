const { clipboard } = require('electron');
const { exec } = require('child_process');
const logger = require('./logger');

function writeToClipboard(text) {
    clipboard.writeText(String(text || ''));
    logger.debug(`[AutoPaste] Wrote ${String(text || '').length} characters to clipboard.`);
}

function runPasteCommand(command, options, successMessage, errorPrefix) {
    return new Promise((resolve, reject) => {
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                logger.error(errorPrefix, error.message);
                if (stderr) {
                    logger.error(`${errorPrefix} stderr:`, stderr);
                }
                reject(error);
                return;
            }

            if (stdout) {
                logger.debug('[AutoPaste] stdout:', stdout.trim());
            }

            logger.debug(successMessage);
            resolve();
        });
    });
}

function performPaste(text) {
    writeToClipboard(text);
    logger.debug(`[AutoPaste] Starting auto-paste on ${process.platform}.`);

    if (process.platform === 'win32') {
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')`;
        return runPasteCommand(
            `powershell -NoProfile -NonInteractive -Command "${psCommand}"`,
            { timeout: 5000 },
            '[AutoPaste] Ctrl+V simulated successfully.',
            '[AutoPaste] PowerShell SendKeys failed:'
        );
    }

    if (process.platform === 'darwin') {
        return runPasteCommand(
            'osascript -e \'tell application "System Events" to keystroke "v" using command down\'',
            {},
            '[AutoPaste] Cmd+V simulated successfully.',
            '[AutoPaste] macOS paste failed:'
        );
    }

    return runPasteCommand(
        'xdotool key ctrl+v',
        {},
        '[AutoPaste] Ctrl+V simulated successfully.',
        '[AutoPaste] xdotool paste failed:'
    );
}

let pasteQueue = Promise.resolve();

function autoPaste(text) {
    pasteQueue = pasteQueue
        .then(() => performPaste(text))
        .catch((error) => {
            logger.error('[AutoPaste] Queued paste failed:', error.message);
        });

    return pasteQueue;
}

module.exports = {
    writeToClipboard,
    autoPaste
};

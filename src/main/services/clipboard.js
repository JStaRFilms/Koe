const { clipboard } = require('electron');
const { exec } = require('child_process');
const logger = require('./logger');

function writeToClipboard(text) {
    clipboard.writeText(text);
    logger.info(`[AutoPaste] Wrote ${String(text || '').length} characters to clipboard.`);
}

/**
 * Write text to clipboard, then simulate Ctrl+V to paste
 * into the currently focused application.
 */
function autoPaste(text) {
    writeToClipboard(text);
    logger.info(`[AutoPaste] Starting auto-paste on ${process.platform}.`);

    if (process.platform === 'win32') {
        // Use .NET SendKeys via PowerShell — more reliable than WScript.Shell COM
        // -NoProfile speeds up startup, Add-Type loads WinForms for SendKeys
        // Use single quotes for '^v' inside PowerShell to avoid JS/shell quote stripping
        const psCommand = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')`;

        exec(
            `powershell -NoProfile -NonInteractive -Command "${psCommand}"`,
            { timeout: 5000 },
            (error, stdout, stderr) => {
                if (error) {
                    logger.error('[AutoPaste] PowerShell SendKeys failed:', error.message);
                    if (stderr) {
                        logger.error('[AutoPaste] PowerShell stderr:', stderr);
                    }
                } else {
                    logger.info('[AutoPaste] Ctrl+V simulated successfully.');
                }
            }
        );
    } else if (process.platform === 'darwin') {
        exec(
            'osascript -e \'tell application "System Events" to keystroke "v" using command down\'',
            (error, stdout, stderr) => {
                if (error) {
                    logger.error('[AutoPaste] macOS paste failed:', error.message);
                    if (stderr) {
                        logger.error('[AutoPaste] macOS paste stderr:', stderr);
                    }

                    logger.warn(
                        '[AutoPaste] On macOS, simulated paste requires Accessibility permission for Koe and Apple Events access to System Events.'
                    );
                } else {
                    if (stdout) {
                        logger.info('[AutoPaste] macOS paste stdout:', stdout.trim());
                    }
                    logger.info('[AutoPaste] Cmd+V simulated successfully.');
                }
            }
        );
    } else {
        exec('xdotool key ctrl+v', (error, stdout, stderr) => {
            if (error) {
                logger.error('[AutoPaste] xdotool paste failed:', error.message);
                if (stderr) {
                    logger.error('[AutoPaste] xdotool stderr:', stderr);
                }
            } else {
                if (stdout) {
                    logger.info('[AutoPaste] xdotool stdout:', stdout.trim());
                }
                logger.info('[AutoPaste] Ctrl+V simulated successfully.');
            }
        });
    }
}

module.exports = {
    writeToClipboard,
    autoPaste
};

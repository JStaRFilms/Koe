const { clipboard } = require('electron');
const { exec } = require('child_process');

function writeToClipboard(text) {
    clipboard.writeText(text);
}

/**
 * Write text to clipboard, then simulate Ctrl+V to paste
 * into the currently focused application.
 */
function autoPaste(text) {
    writeToClipboard(text);
    console.log('[AutoPaste] Text written to clipboard. Simulating Ctrl+V...');

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
                    console.error('[AutoPaste] PowerShell SendKeys failed:', error.message);
                    console.error('[AutoPaste] stderr:', stderr);
                } else {
                    console.log('[AutoPaste] Ctrl+V simulated successfully.');
                }
            }
        );
    } else if (process.platform === 'darwin') {
        exec(
            'osascript -e \'tell application "System Events" to keystroke "v" using command down\'',
            (error) => {
                if (error) console.error('[AutoPaste] macOS paste failed:', error);
                else console.log('[AutoPaste] Cmd+V simulated successfully.');
            }
        );
    } else {
        exec('xdotool key ctrl+v', (error) => {
            if (error) console.error('[AutoPaste] xdotool paste failed:', error);
            else console.log('[AutoPaste] Ctrl+V simulated successfully.');
        });
    }
}

module.exports = {
    writeToClipboard,
    autoPaste
};

const { clipboard } = require('electron');
const { exec } = require('child_process');

function writeToClipboard(text) {
    clipboard.writeText(text);
}

function autoPaste(text) {
    writeToClipboard(text);

    // Give focus a moment to restore to the previous window before pasting
    setTimeout(() => {
        if (process.platform === 'win32') {
            const script = `
            $wshell = New-Object -ComObject wscript.shell;
            $wshell.SendKeys('^v');
            `;
            exec(`powershell -command "${script}"`, (error) => {
                if (error) console.error('Auto-paste (win32) failed:', error);
            });
        } else if (process.platform === 'darwin') {
            exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'', (error) => {
                if (error) console.error('Auto-paste (darwin) failed:', error);
            });
        } else {
            // Assumes xdotool is installed on Linux
            exec('xdotool key ctrl+v', (error) => {
                if (error) console.error('Auto-paste (linux) failed:', error);
            });
        }
    }, 100);
}

module.exports = {
    writeToClipboard,
    autoPaste
};

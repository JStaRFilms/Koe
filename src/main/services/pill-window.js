const { screen } = require('electron');

const PILL_SIZE = Object.freeze({
    width: 480,
    height: 160,
    bottomMargin: 16
});

const PILL_ALWAYS_ON_TOP_LEVEL = process.platform === 'win32'
    ? 'screen-saver'
    : 'floating';

function getPillBounds() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    return {
        width: PILL_SIZE.width,
        height: PILL_SIZE.height,
        x: Math.round((screenWidth - PILL_SIZE.width) / 2),
        y: screenHeight - PILL_SIZE.height - PILL_SIZE.bottomMargin
    };
}

function pinPillWindow(mainWindow) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    mainWindow.setAlwaysOnTop(true, PILL_ALWAYS_ON_TOP_LEVEL);
}

function showPillWindow(mainWindow) {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    pinPillWindow(mainWindow);

    if (!mainWindow.isVisible()) {
        mainWindow.showInactive();
    }

    if (typeof mainWindow.moveTop === 'function') {
        mainWindow.moveTop();
    }
}

module.exports = {
    getPillBounds,
    pinPillWindow,
    showPillWindow
};

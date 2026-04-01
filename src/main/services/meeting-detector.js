const { exec } = require('child_process');
const { Notification } = require('electron');
const logger = require('./logger');

const MEETING_PROCESSES = [
    'Zoom.exe',
    'Teams.exe',
    'ms-teams.exe',
    'Slack.exe',
    'Webex.exe'
];

class MeetingDetector {
    constructor() {
        this.interval = null;
        this.isMeetingActive = false;
        this.mainWindow = null;
    }

    init(mainWindow) {
        this.mainWindow = mainWindow;
        this.startMonitoring();
    }

    startMonitoring() {
        if (this.interval) return;

        this.interval = setInterval(() => {
            this.checkMeetingStatus();
        }, 30000); // Check every 30 seconds

        this.checkMeetingStatus();
    }

    stopMonitoring() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    checkMeetingStatus() {
        const command = process.platform === 'win32' ? 'tasklist' : 'ps -e';

        exec(command, (error, stdout) => {
            if (error) {
                logger.error('[MeetingDetector] Failed to list processes:', error);
                return;
            }

            const active = MEETING_PROCESSES.some(proc => stdout.includes(proc));

            if (active && !this.isMeetingActive) {
                this.onMeetingDetected();
            }

            this.isMeetingActive = active;
        });
    }

    onMeetingDetected() {
        logger.info('[MeetingDetector] Meeting detected!');

        const notification = new Notification({
            title: 'Koe - Meeting Detected',
            body: 'Would you like to join the meeting to take notes and summarize?',
            silent: false
        });

        notification.show();

        notification.on('click', () => {
            if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                const { CHANNELS } = require('../../shared/constants');
                this.mainWindow.webContents.send(CHANNELS.MEETING_DETECTED);
                this.mainWindow.show();
            }
        });
    }
}

module.exports = new MeetingDetector();

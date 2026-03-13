const fs = require('fs');
const path = require('path');
const os = require('os');
const { app } = require('electron');

class Logger {
    constructor() {
        this._initialized = false;
        this.maxLogSize = 5 * 1024 * 1024;
        this.maxLogFiles = 3;
        this.stream = null;
    }

    _init() {
        if (this._initialized) {
            return;
        }

        try {
            this.logDir = path.join(app.getPath('userData'), 'logs');
            this.logFile = path.join(this.logDir, 'koe.log');
            this.ensureLogDirectory();
            this.rotateLogsIfNeeded();
            this.stream = fs.createWriteStream(this.logFile, { flags: 'a' });
            this._initialized = true;
        } catch (error) {
            console.error('[Logger] Initialization failed:', error);
            this.logDir = os.tmpdir();
            this.logFile = path.join(this.logDir, 'koe.log');
            this.stream = fs.createWriteStream(this.logFile, { flags: 'a' });
            this._initialized = true;
        }
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    rotateLogsIfNeeded() {
        if (!fs.existsSync(this.logFile)) {
            return;
        }

        const stats = fs.statSync(this.logFile);
        if (stats.size <= this.maxLogSize) {
            return;
        }

        const oldestLog = `${this.logFile}.${this.maxLogFiles}`;
        if (fs.existsSync(oldestLog)) {
            fs.unlinkSync(oldestLog);
        }

        for (let index = this.maxLogFiles - 1; index >= 1; index -= 1) {
            const oldPath = `${this.logFile}.${index}`;
            const newPath = `${this.logFile}.${index + 1}`;
            if (fs.existsSync(oldPath)) {
                fs.renameSync(oldPath, newPath);
            }
        }

        fs.renameSync(this.logFile, `${this.logFile}.1`);
    }

    sanitize(obj, seen = new WeakSet()) {
        if (!obj || typeof obj !== 'object' || seen.has(obj)) {
            return obj;
        }

        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map((item) => this.sanitize(item, seen));
        }

        const sanitized = {};
        const sensitiveKeys = ['groqApiKey', 'apiKey', 'token', 'secret', 'password', 'authorization'];

        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                sanitized[key] = this.sanitize(value, seen);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    formatArgs(args) {
        return args.map((arg) => {
            if (arg instanceof Error) {
                return `${arg.name}: ${arg.message}\n${arg.stack}`;
            }

            if (typeof arg === 'object') {
                try {
                    const sanitized = this.sanitize(arg);
                    return JSON.stringify(sanitized);
                } catch (error) {
                    return '[Object]';
                }
            }

            return String(arg);
        }).join(' ');
    }

    _write(level, ...args) {
        this._init();

        const timestamp = new Date().toISOString();
        const message = this.formatArgs(args);
        const logLine = `[${timestamp}] [${level}] ${message}\n`;
        const consoleMethod = level === 'ERROR'
            ? console.error
            : level === 'WARN'
                ? console.warn
                : level === 'DEBUG'
                ? console.debug
                : console.log;

        consoleMethod(logLine.trimEnd());
        this.stream.write(logLine);
    }

    info(...args) {
        this._write('INFO', ...args);
    }

    warn(...args) {
        this._write('WARN', ...args);
    }

    error(...args) {
        this._write('ERROR', ...args);
    }

    debug(...args) {
        if (!app.isPackaged) {
            this._write('DEBUG', ...args);
        }
    }

    getLogPath() {
        this._init();
        return this.logFile;
    }

    getLogDirectory() {
        this._init();
        return this.logDir;
    }

    getRecentLogs(lines = 100) {
        this._init();
        if (!fs.existsSync(this.logFile)) {
            return [];
        }

        const content = fs.readFileSync(this.logFile, 'utf8');
        const allLines = content.split('\n').filter((line) => line.trim());
        return allLines.slice(-lines);
    }
}

module.exports = new Logger();

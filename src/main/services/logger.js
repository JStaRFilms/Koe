/**
 * Logger Service - Persistent file logging for production debugging
 * Logs are written to userData/logs/koe.log for persistence across sessions
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Logger {
    constructor() {
        this._initialized = false;
        this.maxLogSize = 5 * 1024 * 1024; // 5MB max log size
        this.maxLogFiles = 3; // Keep 3 rotated log files
    }

    /**
     * Lazy initialization - called on first log operation
     * This ensures app is ready before we try to use app.getPath()
     */
    _init() {
        if (this._initialized) return;

        try {
            this.logDir = path.join(app.getPath('userData'), 'logs');
            this.logFile = path.join(this.logDir, 'koe.log');

            // Ensure log directory exists
            this.ensureLogDirectory();

            // Rotate logs if current log is too large
            this.rotateLogsIfNeeded();

            this._initialized = true;
        } catch (error) {
            console.error('[Logger] Initialization failed:', error);
            // Fallback to temp directory
            this.logDir = require('os').tmpdir();
            this.logFile = path.join(this.logDir, 'koe.log');
            this._initialized = true;
        }
    }

    /**
     * Ensure the log directory exists
     */
    ensureLogDirectory() {
        try {
            if (!fs.existsSync(this.logDir)) {
                fs.mkdirSync(this.logDir, { recursive: true });
                this.info('[Logger] Created log directory:', this.logDir);
            }
        } catch (error) {
            console.error('[Logger] Failed to create log directory:', error);
        }
    }

    /**
     * Rotate logs if the current log file is too large
     */
    rotateLogsIfNeeded() {
        try {
            if (fs.existsSync(this.logFile)) {
                const stats = fs.statSync(this.logFile);
                if (stats.size > this.maxLogSize) {
                    this.rotateLogs();
                }
            }
        } catch (error) {
            console.error('[Logger] Failed to check log file size:', error);
        }
    }

    /**
     * Rotate log files (koe.log -> koe.log.1 -> koe.log.2 -> koe.log.3)
     */
    rotateLogs() {
        try {
            // Delete oldest log file if it exists
            const oldestLog = `${this.logFile}.${this.maxLogFiles}`;
            if (fs.existsSync(oldestLog)) {
                fs.unlinkSync(oldestLog);
            }

            // Shift log files (2 -> 3, 1 -> 2, current -> 1)
            for (let i = this.maxLogFiles - 1; i >= 1; i--) {
                const oldPath = `${this.logFile}.${i}`;
                const newPath = `${this.logFile}.${i + 1}`;
                if (fs.existsSync(oldPath)) {
                    fs.renameSync(oldPath, newPath);
                }
            }

            // Move current log to .1
            if (fs.existsSync(this.logFile)) {
                fs.renameSync(this.logFile, `${this.logFile}.1`);
            }

            this.info('[Logger] Log files rotated');
        } catch (error) {
            console.error('[Logger] Failed to rotate logs:', error);
        }
    }

    /**
     * Format arguments for logging (handle objects, errors, etc.)
     */
    formatArgs(args) {
        return args.map(arg => {
            if (arg instanceof Error) {
                return `${arg.name}: ${arg.message}\n${arg.stack}`;
            }
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch {
                    return '[Object]';
                }
            }
            return String(arg);
        }).join(' ');
    }

    /**
     * Get current timestamp in ISO format
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Core logging method
     */
    _write(level, ...args) {
        // Initialize on first log call
        this._init();

        const timestamp = this.getTimestamp();
        const message = this.formatArgs(args);
        const logLine = `[${timestamp}] [${level}] ${message}\n`;

        // Write to console for development convenience
        const consoleMethod = level === 'ERROR' ? console.error :
            level === 'WARN' ? console.warn :
                level === 'DEBUG' ? console.debug : console.log;
        consoleMethod(`[${level}]`, ...args);

        // Write to file (synchronously to ensure logs are written)
        try {
            fs.appendFileSync(this.logFile, logLine);
        } catch (error) {
            console.error('[Logger] Failed to write to log file:', error);
        }
    }

    /**
     * Log an info message
     */
    info(...args) {
        this._write('INFO', ...args);
    }

    /**
     * Log a warning message
     */
    warn(...args) {
        this._write('WARN', ...args);
    }

    /**
     * Log an error message
     */
    error(...args) {
        this._write('ERROR', ...args);
    }

    /**
     * Log a debug message (only in development)
     */
    debug(...args) {
        if (!app.isPackaged) {
            this._write('DEBUG', ...args);
        }
    }

    /**
     * Get the path to the log file
     */
    getLogPath() {
        this._init();
        return this.logFile;
    }

    /**
     * Get the log directory path
     */
    getLogDirectory() {
        this._init();
        return this.logDir;
    }

    /**
     * Get recent log entries (for displaying in UI)
     */
    getRecentLogs(lines = 100) {
        this._init();
        try {
            if (!fs.existsSync(this.logFile)) {
                return [];
            }
            const content = fs.readFileSync(this.logFile, 'utf8');
            const allLines = content.split('\n').filter(line => line.trim());
            return allLines.slice(-lines);
        } catch (error) {
            console.error('[Logger] Failed to read logs:', error);
            return [];
        }
    }
}

// Export singleton instance
module.exports = new Logger();

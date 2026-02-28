const Store = require('electron-store');

const usageStore = new Store({
    name: 'usage-stats'
});

const LIMITS = {
    RPM: 20,
    RPD: 2000,
    SECONDS_PER_DAY: 28800
};

// Internal state for Sliding Window 
let requestTimestamps = [];
let queue = [];
const MAX_QUEUE_SIZE = 50;
let isProcessingQueue = false;

function getTodayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function getDailyStats() {
    const todayKey = getTodayKey();
    const stats = usageStore.get(todayKey, { requests: 0, audioSeconds: 0 });
    return stats;
}

function saveDailyStats(stats) {
    const todayKey = getTodayKey();
    usageStore.set(todayKey, stats);
}

// Clean up old requests beyond the 1-minute window
function cleanOldTimestamps() {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    requestTimestamps = requestTimestamps.filter(ts => ts > oneMinuteAgo);
}

function canRequest(audioSeconds = 0) {
    cleanOldTimestamps();

    // Check RPM 
    if (requestTimestamps.length >= LIMITS.RPM) {
        return { allowed: false, reason: 'RPM_LIMIT', waitTimeMs: requestTimestamps[0] + 60000 - Date.now() };
    }

    // Check Daily limits
    const dailyStats = getDailyStats();
    if (dailyStats.requests >= LIMITS.RPD) {
        return { allowed: false, reason: 'RPD_LIMIT' };
    }
    if (dailyStats.audioSeconds + audioSeconds > LIMITS.SECONDS_PER_DAY) {
        return { allowed: false, reason: 'DAILY_SECONDS_LIMIT' };
    }

    return { allowed: true };
}

function recordRequest(audioSeconds = 0) {
    requestTimestamps.push(Date.now());
    const dailyStats = getDailyStats();
    dailyStats.requests += 1;
    dailyStats.audioSeconds += audioSeconds;
    saveDailyStats(dailyStats);
}

function getUsageStats() {
    const dailyStats = getDailyStats();
    cleanOldTimestamps();
    return {
        dailyRequests: dailyStats.requests,
        dailyRequestsLimit: LIMITS.RPD,
        dailyAudioSeconds: dailyStats.audioSeconds,
        dailyAudioSecondsLimit: LIMITS.SECONDS_PER_DAY,
        requestsThisMinute: requestTimestamps.length,
        rpmLimit: LIMITS.RPM,
        queueSize: queue.length
    };
}

// Push to FIFO Queue and kick off processing
function enqueue(item, processFunction) {
    if (queue.length >= MAX_QUEUE_SIZE) {
        return Promise.reject(new Error('Rate limit queue is full. Please try again later.'));
    }

    return new Promise((resolve, reject) => {
        queue.push({
            item,
            processFunction,
            resolve,
            reject,
            audioSeconds: item.audioSeconds || 0
        });

        processQueue(); // Try dequeueing
    });
}

async function processQueue() {
    if (isProcessingQueue || queue.length === 0) return;

    isProcessingQueue = true;

    try {
        while (queue.length > 0) {
            const nextItem = queue[0];
            const check = canRequest(nextItem.audioSeconds);

            if (check.allowed) {
                const task = queue.shift();
                recordRequest(task.audioSeconds);

                try {
                    const result = await task.processFunction({ ...task.item, queueSize: queue.length });
                    task.resolve(result);
                } catch (error) {
                    task.reject(error);
                }
            } else if (check.reason === 'RPM_LIMIT') {
                // Must wait for sliding window
                const waitTime = Math.max(check.waitTimeMs || 1000, 1000);
                await new Promise(r => setTimeout(r, waitTime));
            } else {
                // Daily limit reached, flush queue
                while (queue.length > 0) {
                    const task = queue.shift();
                    task.reject(new Error(`Daily limit reached: ${check.reason}`));
                }
                break;
            }
        }
    } finally {
        isProcessingQueue = false;
    }
}

module.exports = {
    canRequest,
    recordRequest,
    getUsageStats,
    enqueue,
    LIMITS
};

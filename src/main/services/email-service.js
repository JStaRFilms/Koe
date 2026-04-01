const logger = require('./logger');

class EmailService {
    async sendMeetingSummary(to, summary) {
        if (!to) {
            logger.warn('[EmailService] No email address provided for summary.');
            return;
        }

        // Simulating email sending
        logger.info(`[EmailService] Sending meeting summary to ${to}...`);
        logger.debug('[EmailService] Summary content:', summary);

        // In a real app, you'd use a service like SendGrid, Mailgun, or Nodemailer
        return Promise.resolve({ success: true });
    }
}

module.exports = new EmailService();

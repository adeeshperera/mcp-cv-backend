const nodemailer = require("nodemailer");

class EmailService {
	constructor() {
		this.transporter = null;
		this.isConfigured = false;
		this.initializeTransporter();
	}

	initializeTransporter() {
		try {
			const gmailUser = process.env.GMAIL_USER;
			const gmailPass = process.env.GMAIL_PASS;

			if (!gmailUser || !gmailPass) {
				console.warn(
					"Gmail credentials not configured. Email functionality will be disabled."
				);
				return;
			}

			this.transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: gmailUser,
					pass: gmailPass,
				},
			});

			this.isConfigured = true;
		} catch (error) {
			console.error("Error configuring email service:", error.message);
		}
	}

	validateEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	async sendEmail(recipient, subject, body) {
		try {
			// Validate inputs
			if (!recipient || !subject || !body) {
				throw new Error(
					"Missing required fields: recipient, subject, and body are required"
				);
			}

			if (!this.validateEmail(recipient)) {
				throw new Error("Invalid email address format");
			}

			if (!this.isConfigured) {
				throw new Error(
					"Email service is not configured. Please check your Gmail credentials."
				);
			}

			// Prepare email options
			const mailOptions = {
				from: process.env.GMAIL_USER,
				to: recipient,
				subject: subject,
				text: body,
				html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h3>Message from MCP CV Server</h3>
          <p>${body.replace(/\n/g, "<br>")}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This email was sent via the MCP CV Server application.
          </p>
        </div>`,
			};

			// Send email
			const info = await this.transporter.sendMail(mailOptions);

			return {
				success: true,
				messageId: info.messageId,
				recipient: recipient,
				subject: subject,
				timestamp: new Date().toISOString(),
			};
		} catch (error) {
			console.error("Error sending email:", error.message);

			return {
				success: false,
				error: error.message,
				recipient: recipient,
				subject: subject,
				timestamp: new Date().toISOString(),
			};
		}
	}

	async testConnection() {
		if (!this.isConfigured) {
			return {
				success: false,
				error: "Email service is not configured",
			};
		}

		try {
			await this.transporter.verify();
			return {
				success: true,
				message: "Email service is working correctly",
			};
		} catch (error) {
			console.error("Email connection test failed:", error.message);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	getStatus() {
		return {
			configured: this.isConfigured,
			user: process.env.GMAIL_USER || "Not configured",
		};
	}
}

module.exports = EmailService;

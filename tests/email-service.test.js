const EmailService = require("../src/email-service");

// Mock nodemailer
jest.mock("nodemailer", () => ({
	createTransport: jest.fn(() => ({
		sendMail: jest.fn(),
		verify: jest.fn(),
	})),
}));

describe("EmailService", () => {
	let emailService;

	beforeEach(() => {
		// Set up test environment variables
		process.env.GMAIL_USER = "test@example.com";
		process.env.GMAIL_PASS = "testpassword";
		emailService = new EmailService();
	});

	afterEach(() => {
		delete process.env.GMAIL_USER;
		delete process.env.GMAIL_PASS;
	});

	test("should validate email addresses correctly", () => {
		expect(emailService.validateEmail("valid@example.com")).toBe(true);
		expect(emailService.validateEmail("invalid-email")).toBe(false);
		expect(emailService.validateEmail("test@")).toBe(false);
		expect(emailService.validateEmail("")).toBe(false);
	});

	test("should return error for missing required fields", async () => {
		const result = await emailService.sendEmail("", "Subject", "Body");

		expect(result.success).toBe(false);
		expect(result.error).toContain("Missing required fields");
	});

	test("should return error for invalid email format", async () => {
		const result = await emailService.sendEmail(
			"invalid-email",
			"Subject",
			"Body"
		);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Invalid email address format");
	});

	test("should return service status correctly", () => {
		const status = emailService.getStatus();

		expect(status.configured).toBe(true);
		expect(status.user).toBe("test@example.com");
	});
});

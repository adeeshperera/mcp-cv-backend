const MCPTools = require("../src/mcp-tools");

describe("MCPTools", () => {
	let mcpTools;
	let mockCvData;
	let mockEmailService;

	beforeEach(() => {
		mockCvData = {
			personal: {
				name: "John Doe",
				email: "john@example.com",
				location: "New York",
			},
			experience: [
				{
					title: "Software Developer",
					period: "Current",
					company: "Tech Corp",
				},
			],
			education: [
				{
					qualification: "BSc Computer Science",
					institution: "MIT",
					duration: "2020-2024",
				},
			],
			skills: ["JavaScript", "React", "Node.js"],
		};

		mockEmailService = {
			isConfigured: true,
			sendEmail: jest.fn(),
		};

		mcpTools = new MCPTools(mockCvData, mockEmailService);
	});

	test("should get personal information successfully", async () => {
		const result = await mcpTools.executeTool("get_personal_info");

		expect(result.success).toBe(true);
		expect(result.data).toEqual(mockCvData.personal);
		expect(result.summary).toContain("John Doe");
	});

	test("should search CV content correctly", async () => {
		const result = await mcpTools.executeTool("search_cv", {
			query: "javascript",
		});

		expect(result.success).toBe(true);
		expect(result.results.matches).toHaveLength(1);
		expect(result.results.categories).toContain("skills");
	});

	test("should handle email sending", async () => {
		mockEmailService.sendEmail.mockResolvedValue({
			success: true,
			messageId: "test-123",
		});

		const result = await mcpTools.executeTool("send_email", {
			recipient: "test@example.com",
			subject: "Test",
			body: "Test message",
		});

		expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
			"test@example.com",
			"Test",
			"Test message"
		);
		expect(result.success).toBe(true);
	});

	test("should handle unknown tool gracefully", async () => {
		const result = await mcpTools.executeTool("unknown_tool");

		expect(result.error).toContain("Unknown tool");
		expect(result.toolName).toBe("unknown_tool");
	});
});

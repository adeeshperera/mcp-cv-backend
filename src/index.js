#!/usr/bin/env node

require("dotenv").config({
	path: require("path").join(__dirname, "..", ".env"),
});
const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const {
	StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const {
	CallToolRequestSchema,
	ListToolsRequestSchema,
} = require("@modelcontextprotocol/sdk/types.js");
const path = require("path");

const CVParser = require("./cv-parser.js");
const EmailService = require("./email-service.js");
const MCPTools = require("./mcp-tools.js");

class MCPCVServer {
	constructor() {
		this.server = new Server(
			{
				name: "mcp-cv-server",
				version: "1.0.0",
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.cvParser = null;
		this.emailService = null;
		this.mcpTools = null;
		this.isInitialized = false;

		this.setupHandlers();
	}

	async initialize() {
		try {
			// Initialize email service
			this.emailService = new EmailService();

			// Initialize CV parser
			const cvPath = path.join(__dirname, "..", "cv.pdf");
			this.cvParser = new CVParser(cvPath);

			const cvData = await this.cvParser.parseCV();

			// Initialize MCP tools
			this.mcpTools = new MCPTools(cvData, this.emailService);

			// Test email service connection
			const emailStatus = await this.emailService.testConnection();
			if (emailStatus.success) {
			} else {
				console.warn("Email service connection failed:", emailStatus.error);
			}

			this.isInitialized = true;

			return true;
		} catch (error) {
			console.error("Failed to initialize MCP CV Server:", error.message);
			console.error("Stack trace:", error.stack);

			// Create fallback data structure
			this.mcpTools = new MCPTools(
				{
					personal: {},
					experience: [],
					education: [],
					skills: [],
					rawText: "",
				},
				this.emailService
			);

			this.isInitialized = true;
			return false;
		}
	}

	setupHandlers() {
		// Handle tool listing
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			if (!this.isInitialized || !this.mcpTools) {
				return {
					tools: [],
				};
			}

			const tools = this.mcpTools.getToolDefinitions();

			return {
				tools: tools,
			};
		});

		// Handle tool execution
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			if (!this.isInitialized || !this.mcpTools) {
				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: "Server not properly initialized",
								timestamp: new Date().toISOString(),
							}),
						},
					],
				};
			}

			try {
				const result = await this.mcpTools.executeTool(name, args);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify(result, null, 2),
						},
					],
				};
			} catch (error) {
				console.error("Tool execution failed:", error.message);

				return {
					content: [
						{
							type: "text",
							text: JSON.stringify({
								error: error.message,
								tool: name,
								timestamp: new Date().toISOString(),
							}),
						},
					],
				};
			}
		});

		// Error handling
		this.server.onerror = (error) => {
			console.error("MCP Server error:", error);
		};

		process.on("SIGINT", async () => {
			console.log("\nShutting down MCP CV Server...");
			await this.server.close();
			process.exit(0);
		});
	}

	async start() {
		try {
			// Initialize the server
			const initSuccess = await this.initialize();
			if (!initSuccess) {
				console.warn("Server started with limited functionality");
			}

			// Create transport
			const transport = new StdioServerTransport();

			// Connect server to transport
			await this.server.connect(transport);

			console.log("MCP CV Server is running");
			console.log("Listening for MCP requests");

			if (this.mcpTools) {
				const tools = this.mcpTools.getToolDefinitions();
				tools.forEach((tool) => {
					console.log(`   - ${tool.name}: ${tool.description}`);
				});
			}

			console.log("\nServer Status:");
			console.log(`   - CV Data: ${this.cvParser ? "Loaded" : "Failed"}`);
			console.log(
				`   - Email Service: ${
					this.emailService && this.emailService.isConfigured
						? "Configured"
						: "Not configured"
				}`
			);
			console.log(`   - Tools: ${this.mcpTools ? "Ready" : "Not available"}`);
		} catch (error) {
			console.error("Failed to start server:", error.message);
			console.error("Stack trace:", error.stack);
			process.exit(1);
		}
	}

	// Method to get server status (useful for debugging)
	getStatus() {
		return {
			initialized: this.isInitialized,
			cvData: !!this.cvParser?.getCVData(),
			emailConfigured: !!this.emailService?.isConfigured,
			toolsReady: !!this.mcpTools,
		};
	}
}

// Start the server if this file is run directly
if (require.main === module) {
	const server = new MCPCVServer();
	server.start().catch((error) => {
		console.error("Fatal error starting server:", error);
		process.exit(1);
	});
}

module.exports = MCPCVServer;

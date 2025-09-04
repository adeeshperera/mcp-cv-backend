const express = require('express');
const cors = require('cors');
require('dotenv').config({
  path: require('path').join(__dirname, '..', '.env'),
});

const CVParser = require('./cv-parser.js');
const EmailService = require('./email-service.js');
const MCPTools = require('./mcp-tools.js');
const path = require('path');

class WebServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || process.env.MCP_SERVER_PORT || 3001;
    this.mcpTools = null;
    this.isInitialized = false;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // CORS configuration for frontend
    this.app.use(cors({
      origin: [
        'https://mcp-cv-frontend.vercel.app',
        'http://localhost:3000',
        'http://localhost:3001'
      ],
      credentials: true
    }));
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'MCP CV Backend API',
        status: 'running',
        timestamp: new Date().toISOString(),
        initialized: this.isInitialized
      });
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      });
    });

    // Get all available tools
    this.app.get('/api/tools', (req, res) => {
      if (!this.isInitialized || !this.mcpTools) {
        return res.status(503).json({
          error: 'Server not properly initialized',
          timestamp: new Date().toISOString()
        });
      }

      const tools = this.mcpTools.getToolDefinitions();
      res.json({
        success: true,
        tools: tools,
        count: tools.length
      });
    });

    // Execute tool endpoint
    this.app.post('/api/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const args = req.body || {};

      if (!this.isInitialized || !this.mcpTools) {
        return res.status(503).json({
          error: 'Server not properly initialized',
          timestamp: new Date().toISOString()
        });
      }

      try {
        const result = await this.mcpTools.executeTool(toolName, args);
        res.json(result);
      } catch (error) {
        console.error('Tool execution failed:', error.message);
        res.status(500).json({
          error: error.message,
          tool: toolName,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Convenience endpoints for common operations
    this.app.get('/api/personal', async (req, res) => {
      try {
        const result = await this.mcpTools.executeTool('get_personal_info');
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/experience', async (req, res) => {
      try {
        const result = await this.mcpTools.executeTool('get_work_experience');
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/education', async (req, res) => {
      try {
        const result = await this.mcpTools.executeTool('get_education');
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.get('/api/skills', async (req, res) => {
      try {
        const result = await this.mcpTools.executeTool('get_skills');
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/search', async (req, res) => {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      try {
        const result = await this.mcpTools.executeTool('search_cv', { query });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    this.app.post('/api/email', async (req, res) => {
      const { recipient, subject, body } = req.body;
      
      if (!recipient || !subject || !body) {
        return res.status(400).json({ 
          error: 'Missing required fields: recipient, subject, and body are required' 
        });
      }

      try {
        const result = await this.mcpTools.executeTool('send_email', { 
          recipient, 
          subject, 
          body 
        });
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Catch all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    });
  }

  async initialize() {
    try {
      console.log('Initializing MCP CV Web Server...');
      
      // Initialize email service
      const emailService = new EmailService();

      // Initialize CV parser
      const cvPath = path.join(__dirname, '..', 'cv.pdf');
      const cvParser = new CVParser(cvPath);

      const cvData = await cvParser.parseCV();

      // Initialize MCP tools
      this.mcpTools = new MCPTools(cvData, emailService);

      // Test email service connection
      const emailStatus = await emailService.testConnection();
      if (emailStatus.success) {
        console.log('✓ Email service connected successfully');
      } else {
        console.warn('⚠ Email service connection failed:', emailStatus.error);
      }

      this.isInitialized = true;
      console.log('✓ Server initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize server:', error.message);
      
      // Create fallback data structure
      this.mcpTools = new MCPTools(
        {
          personal: {},
          experience: [],
          education: [],
          skills: [],
          rawText: '',
        },
        new EmailService()
      );

      this.isInitialized = true;
      console.log('⚠ Server started with limited functionality');
      return false;
    }
  }

  async start() {
    // Initialize the server first
    await this.initialize();

    // Start the web server
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log(`\n🚀 MCP CV Web Server is running!`);
      console.log(`📍 URL: http://localhost:${this.port}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Status: ${this.isInitialized ? 'Fully operational' : 'Limited functionality'}`);
      
      if (this.mcpTools) {
        const tools = this.mcpTools.getToolDefinitions();
        console.log(`🛠 Available tools: ${tools.length}`);
        tools.forEach(tool => {
          console.log(`   - ${tool.name}: ${tool.description}`);
        });
      }
      
      console.log('\n📋 Available endpoints:');
      console.log('   GET  / - Server info');
      console.log('   GET  /health - Health check');
      console.log('   GET  /api/tools - List all tools');
      console.log('   POST /api/tools/:toolName - Execute tool');
      console.log('   GET  /api/personal - Get personal info');
      console.log('   GET  /api/experience - Get work experience');
      console.log('   GET  /api/education - Get education');
      console.log('   GET  /api/skills - Get skills');
      console.log('   POST /api/search - Search CV content');
      console.log('   POST /api/email - Send email');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      process.exit(0);
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new WebServer();
  server.start().catch(error => {
    console.error('Fatal error starting web server:', error);
    process.exit(1);
  });
}

module.exports = WebServer;

# Simple Unit Tests

This directory contains unit tests for the main functionalities:

## Test Files

- `cv-parser.test.js` - Tests CV parsing and data extraction
- `email-service.test.js` - Tests email validation and service functionality
- `mcp-tools.test.js` - Tests MCP tool execution and responses

## Running Tests

```bash
# Install test dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Test Coverage

These tests cover:

- ✅ CV data extraction (personal info, experience, education, skills)
- ✅ Email validation and error handling
- ✅ MCP tool execution and search functionality
- ✅ Error handling for invalid inputs

The tests use Jest with mocked dependencies to ensure fast, reliable unit testing.

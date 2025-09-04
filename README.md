# MCP CV Backend

A Model Context Protocol (MCP) server for CV data and email functionality, now available as both an MCP server and a REST API.

## Features

- 📄 CV data parsing from PDF
- 🔍 Search functionality across CV content
- 📧 Email notifications via Gmail SMTP
- 🌐 REST API endpoints for web integration
- 🛠 MCP tools for AI assistant integration

## Quick Start

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```env
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASS=your-app-password
   MCP_SERVER_PORT=3001
   DEBUG=true
   ```

3. Start the web server:
   ```bash
   npm start
   ```

4. Or start the MCP server:
   ```bash
   npm run start:mcp
   ```

## Deployment Options

### Option 1: Railway (Recommended - Free & Simple)

Railway is perfect for Node.js applications and offers free hosting:

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add web server and deployment config"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to [railway.app](https://railway.app)
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `mcp-cv-backend` repository
   - Railway will automatically detect the Dockerfile and deploy

3. **Set Environment Variables** in Railway dashboard:
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_PASS`: Your Gmail app password
   - `PORT`: 3001 (Railway will set this automatically)

4. **Your API will be available at**: `https://your-app-name.railway.app`

### Option 2: Render (Alternative Free Option)

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Choose "Web Service"
4. Use these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Add your environment variables

### Option 3: Vercel (For serverless deployment)

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Set environment variables in Vercel dashboard

## API Endpoints

Once deployed, your backend will have these endpoints:

- `GET /` - Server info and status
- `GET /health` - Health check
- `GET /api/personal` - Get personal information
- `GET /api/experience` - Get work experience
- `GET /api/education` - Get education details
- `GET /api/skills` - Get skills list
- `POST /api/search` - Search CV content
- `POST /api/email` - Send email notification

## Frontend Integration

Update your frontend to use the deployed backend URL:

```javascript
const API_BASE_URL = 'https://your-app-name.railway.app';

// Example API call
const response = await fetch(`${API_BASE_URL}/api/personal`);
const data = await response.json();
```

## Environment Variables

Required environment variables:

- `GMAIL_USER` - Your Gmail address
- `GMAIL_PASS` - Gmail app password (not your regular password)
- `PORT` - Port number (set automatically by most platforms)
- `DEBUG` - Set to `true` for development

## Security Notes

- Never commit your `.env` file
- Use Gmail App Passwords, not regular passwords
- The backend is configured for CORS with your frontend domain

## Testing

Run tests with:
```bash
npm test
```

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables are set correctly
3. Ensure your Gmail app password is working
4. Test the health endpoint: `GET /health`

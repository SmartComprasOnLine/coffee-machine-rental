# Coffee Machine Rental Service

A WhatsApp-based service for managing coffee machine rentals, integrated with spreadsheet updates and automated customer service.

## Features

- Real-time spreadsheet integration for machine inventory updates
- WhatsApp integration for customer service
- Automated responses using GPT-4
- MongoDB database for data persistence
- Docker containerization for easy deployment

## Webhooks

- `/api/webhook/spreadsheet` - Receives machine updates from spreadsheet
- `/api/webhook/coffee` - Handles WhatsApp interactions

## Environment Variables

Required environment variables:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4

# Evolution API Configuration
EVOLUTION_API_URL=your_evolution_api_url
EVOLUTION_API_KEY=your_evolution_api_key
EVOLUTION_INSTANCE=your_instance_name
```

## Deployment

This project is configured for deployment on EasyPanel using Docker Compose.

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Docker Compose

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.easypanel.yml up -d

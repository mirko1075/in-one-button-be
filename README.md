# OneButton Backend

Enterprise-grade backend for OneButton meeting transcription and management platform.

## Features

- **Authentication**: Auth0 integration + local email/password authentication
- **Real-time Transcription**: WebSocket-based audio streaming with Deepgram
- **Meeting Management**: Full CRUD operations for meetings with transcripts
- **Billing**: Stripe integration for subscriptions and payments
- **Email & Slack Delivery**: Automated meeting minutes distribution
- **Security**: OWASP best practices, rate limiting, input sanitization
- **Testing**: Comprehensive test coverage (unit + integration)
- **Docker**: Production-ready containerization

## Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io for WebSocket connections
- **Authentication**: Auth0 + JWT
- **Billing**: Stripe
- **Transcription**: Deepgram
- **Email**: SendGrid
- **Messaging**: Slack Web API
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose

## Architecture

```
src/
├── config/          # Configuration and environment
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── middleware/      # Express middleware
├── routes/          # API routes
├── validators/      # Request validation (Zod)
├── sockets/         # WebSocket handlers
├── jobs/            # Cron jobs
├── utils/           # Utility functions
├── types/           # TypeScript types
└── tests/           # Test suite
    ├── unit/        # Unit tests
    ├── integration/ # Integration tests
    └── helpers/     # Test utilities
```

## Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14
- npm >= 10.0.0
- Docker (optional, for containerized deployment)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd in-one-button-be
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Auth0
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_AUDIENCE="https://api.onebutton.com"
AUTH0_ISSUER="https://your-tenant.auth0.com/"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Deepgram
DEEPGRAM_API_KEY="your-deepgram-api-key"

# SendGrid
SENDGRID_API_KEY="SG...."
SENDGRID_FROM_EMAIL="noreply@onebutton.com"

# Other required variables (see .env.example)
```

### 4. Set up database

Generate Prisma Client:

```bash
npm run prisma:generate
```

Run migrations:

```bash
npm run prisma:migrate:dev
```

### 5. Start development server

```bash
npm run dev
```

The server will start on `http://localhost:8080`

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in watch mode

```bash
npm run test:watch
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Test Requirements

Before running tests, ensure you have a test database configured:

```env
TEST_DATABASE_URL="postgresql://username:password@host:5432/database_test"
```

Tests will automatically:
- Create test database schema
- Clean data before/after tests
- Mock external services (Stripe, Deepgram, SendGrid)

## Docker Deployment

### Development with Docker Compose

```bash
# Start all services (app + postgres)
docker-compose up

# Stop services
docker-compose down
```

### Production Docker Build

```bash
# Build production image
docker build -t onebutton-backend .

# Run container
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e STRIPE_SECRET_KEY="sk_..." \
  onebutton-backend
```

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build && npm run prisma:generate`
   - **Start Command**: `npm run prisma:migrate && npm start`
   - **Dockerfile**: Use the Dockerfile in the repository
4. Add environment variables from `.env.example`
5. Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## Running in Docker (Testing)

To run tests inside Docker:

```bash
# Build test image
docker build -f Dockerfile.dev -t onebutton-test .

# Run tests
docker run -e NODE_ENV=test onebutton-test npm test
```

## API Documentation

### Base URL

```
http://localhost:8080/api
```

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPass123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Meeting Endpoints

#### Create Meeting
```http
POST /api/meetings
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Team Standup",
  "description": "Daily standup meeting",
  "startTime": "2024-01-15T10:00:00Z",
  "participants": [
    { "name": "John Doe", "email": "john@example.com" }
  ]
}
```

#### Get Meetings
```http
GET /api/meetings?page=1&limit=10&status=COMPLETED
Authorization: Bearer <token>
```

#### Start Meeting
```http
POST /api/meetings/:id/start
Authorization: Bearer <token>
```

#### End Meeting
```http
POST /api/meetings/:id/end
Authorization: Bearer <token>
```

### Billing Endpoints

#### Create Checkout Session
```http
POST /api/billing/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "priceId": "price_...",
  "successUrl": "https://app.com/success",
  "cancelUrl": "https://app.com/cancel"
}
```

#### Create Customer Portal Session
```http
POST /api/billing/portal
Authorization: Bearer <token>
Content-Type: application/json

{
  "returnUrl": "https://app.com/settings"
}
```

### WebSocket Events

Connect to WebSocket server:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Start audio stream
socket.emit('stream:start', {
  meetingId: 'meeting-id',
  userId: 'user-id'
});

// Send audio data
socket.emit('stream:audio', {
  meetingId: 'meeting-id',
  audio: audioBuffer
});

// Listen for transcription updates
socket.on('transcription:update', (data) => {
  console.log('Transcript:', data.transcript);
});

// Stop stream
socket.emit('stream:stop', {
  meetingId: 'meeting-id'
});
```

## Database Migrations

### Create a new migration

```bash
npm run prisma:migrate:dev
```

### Apply migrations to production

```bash
npm run prisma:migrate
```

### Open Prisma Studio (GUI for database)

```bash
npm run prisma:studio
```

## Cron Jobs

The application includes automated cron jobs:

1. **Cleanup Meetings**: Deletes meetings older than retention period (daily at 2 AM)
2. **Cleanup Audit Logs**: Removes old audit logs (weekly on Sunday at 3 AM)

To disable cron jobs:

```env
ENABLE_CRON_JOBS=false
```

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents brute force attacks
- **Input Sanitization**: Prevents XSS attacks
- **HPP**: HTTP parameter pollution protection
- **Auth0 JWT Verification**: Secure authentication
- **Audit Logging**: Track all user actions
- **Stripe Webhook Signature Verification**: Secure webhook handling

## Project Structure Details

### Layered Architecture

1. **Routes**: Define API endpoints and apply middleware
2. **Controllers**: Handle HTTP requests/responses
3. **Services**: Contain business logic
4. **Repositories**: Handle database operations
5. **Middleware**: Cross-cutting concerns (auth, validation, security)

### Design Patterns

- **Dependency Injection**: Services are instantiated in controllers
- **Repository Pattern**: Abstract database access
- **Factory Pattern**: Create instances with configuration
- **Singleton Pattern**: Database connection
- **Strategy Pattern**: Multiple auth strategies (Auth0 + local)

### SOLID Principles

- **Single Responsibility**: Each class has one responsibility
- **Open/Closed**: Extensible without modification
- **Liskov Substitution**: Interfaces are substitutable
- **Interface Segregation**: Specific interfaces
- **Dependency Inversion**: Depend on abstractions

## Monitoring & Logging

Logs are stored in `./logs/`:
- `combined.log`: All logs
- `error.log`: Error logs only

Log levels: `error`, `warn`, `info`, `debug`

Configure log level:

```env
LOG_LEVEL=info
```

## Troubleshooting

### Database connection failed

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check firewall rules

### Prisma migrations failed

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Apply migrations
npm run prisma:migrate:dev
```

### Tests failing

- Ensure `TEST_DATABASE_URL` is configured
- Run migrations on test database
- Check that no services are mocking incorrectly

### Docker build fails

- Ensure `.dockerignore` is present
- Check that all environment variables are set
- Verify Node version in Dockerfile matches package.json

## Contributing

1. Create a feature branch
2. Write tests for new features
3. Ensure all tests pass: `npm test`
4. Run linter: `npm run lint`
5. Submit pull request

## License

MIT

## Support

For issues and questions, please open a GitHub issue.

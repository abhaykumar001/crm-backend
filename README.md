# Modern CRM Backend

A modern, scalable CRM backend built with Node.js, TypeScript, Express, and Prisma.

## Features

- 🚀 **Modern Stack**: Node.js + TypeScript + Express + Prisma
- 🔐 **Authentication**: JWT-based authentication with role-based access control
- 📱 **Mobile Ready**: API designed for both web and mobile applications
- ⚡ **Real-time**: WebSocket support for live updates
- 🛡️ **Secure**: Input validation, rate limiting, and security headers
- 📊 **Database**: MySQL with Prisma ORM
- 🔄 **Migration**: Easy migration from existing Laravel CRM

## Quick Start

### Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Set up database**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   npm run db:seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

### Health Check

Visit `http://localhost:5000/health` to verify the server is running.

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user profile

### User Management

- `GET /api/v1/users` - Get all users (paginated)
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Lead Management

- `GET /api/v1/leads` - Get all leads (paginated)
- `POST /api/v1/leads` - Create new lead
- `GET /api/v1/leads/:id` - Get lead by ID
- `PUT /api/v1/leads/:id` - Update lead
- `DELETE /api/v1/leads/:id` - Delete lead
- `POST /api/v1/leads/:id/assign` - Assign lead to agents

### Campaign Management

- `GET /api/v1/campaigns` - Get all campaigns
- `POST /api/v1/campaigns` - Create new campaign
- `GET /api/v1/campaigns/:id` - Get campaign by ID
- `PUT /api/v1/campaigns/:id` - Update campaign

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

### Database Operations

- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data

## Project Structure

```
src/
├── controllers/     # Route handlers
├── middleware/      # Custom middleware
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript types
├── utils/          # Utility functions
├── config/         # Configuration files
└── index.ts        # Application entry point

prisma/
├── schema.prisma   # Database schema
├── migrations/     # Database migrations
└── seed.ts         # Database seeding

tests/              # Test files
uploads/            # File uploads
logs/               # Application logs
```

## Environment Variables

See `.env.example` for all available environment variables.

## Migration from Laravel

This backend is designed to replace the existing Laravel CRM system. Key migration features:

- Compatible database schema
- API endpoints matching Laravel functionality
- User roles and permissions preserved
- All existing features supported

## Mobile App Support

The API is optimized for mobile applications with:

- Efficient data serialization
- Offline-first considerations
- Push notification support
- File upload handling
- Location-based features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

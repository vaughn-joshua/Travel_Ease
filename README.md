# TravelEase - PERN Stack Blog Application

A full-stack blog application built with PostgreSQL, Express, React, and Node.js.

## Features

- **Frontend**: React with TypeScript, Tailwind CSS, React Router
- **Backend**: Express with TypeScript, Prisma ORM
- **Database**: PostgreSQL with Docker
- **Blog Management**: CRUD operations with API key protection
- **Responsive Design**: Mobile-first approach with modern UI

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop
- Git

### Setup

1. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd Travel_Ease
   npm run install:all
   ```

2. **Start the database**:

   ```bash
   docker compose up -d
   ```

3. **Set up the database**:

   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start development servers**:
   ```bash
   npm run dev
   ```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## Project Structure

```
Travel_Ease/
├── Travel_Ease_Backend/     # Express API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── schemas/        # Zod validation schemas
│   │   └── lib/           # Utilities (Prisma client)
│   ├── prisma/            # Database schema and migrations
│   └── package.json
├── Travel_Ease_Frontend/   # React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript type definitions
│   └── package.json
└── docker-compose.yml     # PostgreSQL database
```

## API Endpoints

### Public Endpoints

- `GET /api/blogs` - List blogs with pagination and filtering
- `GET /api/blogs/featured` - Get featured blogs
- `GET /api/blogs/:slug` - Get single blog by slug
- `GET /api/health` - Health check

### Protected Endpoints (require x-api-key header)

- `POST /api/blogs` - Create new blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

## Adding a New Blog

### Via API (with API key)

```bash
curl -X POST http://localhost:3000/api/blogs \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key-here" \
  -d '{
    "title": "My New Blog Post",
    "slug": "my-new-blog-post",
    "excerpt": "A brief description...",
    "content": "<p>Full blog content...</p>",
    "coverImageUrl": "https://example.com/image.jpg",
    "category": "Destinations",
    "isFeatured": false,
    "readingMinutes": 5,
    "author": "Your Name"
  }'
```

### Via Database Seed

Add your blog data to `Travel_Ease_Backend/src/seed.ts` and run:

```bash
npm run db:seed
```

## Development

### Backend Development

```bash
cd Travel_Ease_Backend
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
npm run db:studio    # Open Prisma Studio
```

### Frontend Development

```bash
cd Travel_Ease_Frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Management

```bash
npm run db:push      # Push schema changes
npm run db:migrate   # Create and run migrations
npm run db:seed      # Seed with sample data
```

## Testing

```bash
npm run test         # Run all tests
npm run test:backend # Backend tests only
npm run test:frontend # Frontend tests only
```

## Environment Variables

Create `.env` files in both backend and frontend directories:

### Backend (.env)

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/travelease_db"
PORT=3000
API_KEY="your-secret-api-key-here"
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
```

## Deployment

1. Build both applications:

   ```bash
   npm run build
   ```

2. Set up production database and environment variables

3. Deploy backend and frontend to your hosting platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

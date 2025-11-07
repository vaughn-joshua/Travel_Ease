# TravelEase - PERN Stack Blog Application

A full-stack blog application built with PostgreSQL, Express, React, and Node.js.

## Features

- **Frontend**: React with TypeScript, Tailwind CSS, React Router
- **Backend**: Express with TypeScript
- **Database**: Temporary DB layer (Docker & Prisma removed - Phase 1)
- **Blog Management**: CRUD operations with API key protection
- **Responsive Design**: Mobile-first approach with modern UI

> **Note**: Docker and Prisma have been removed. A temporary database compatibility layer is in place. Database operations will return errors or empty results until Phase 3 implementation.

## Quick Start

### Prerequisites

- Node.js 18+
- Git

### Setup

1. **Clone and install dependencies**:

   ```bash
   git clone <repository-url>
   cd Travel_Ease
   cd Travel_Ease_Backend
   npm install
   cd ../Travel_Ease_Frontend
   npm install
   ```

2. **Start development servers**:

   **Terminal 1 - Backend:**
   ```bash
   cd Travel_Ease_Backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd Travel_Ease_Frontend
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
│   │   └── lib/           # Utilities
│   │       └── db/        # Temporary DB compatibility layer
│   └── package.json
├── Travel_Ease_Frontend/   # React application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── pages/        # Page components
│   │   ├── services/     # API client
│   │   └── types/        # TypeScript type definitions
│   └── package.json
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
```

### Frontend Development

```bash
cd Travel_Ease_Frontend
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Database Management

> **Note**: Database management commands have been removed along with Prisma. The temporary DB layer in `src/lib/db/index.ts` provides stub implementations that keep the app bootable but do not persist data.

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
PORT=3000
API_KEY="your-secret-api-key-here"
```

> **Note**: `DATABASE_URL` is no longer required as Docker and Prisma have been removed. The temporary DB layer does not require database configuration.

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


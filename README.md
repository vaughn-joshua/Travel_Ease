# TravelEase - Full Stack Travel Planning Application

A comprehensive travel planning and discovery platform built with the PERN stack (PostgreSQL, Express, React, Node.js) and Prisma ORM.

## Features

### Core Functionality
- **Travel Planning**: Create, manage, and collaborate on travel plans with activities and itineraries
- **Business Directory**: Browse and register travel-related businesses (restaurants, hotels, attractions)
- **Interactive Maps**: Search locations, plan routes, and visualize travel spots using Leaflet and OpenStreetMap
- **Blog System**: Share travel stories and experiences with rich content management
- **Reviews**: Rate and review businesses and travel plans
- **User Management**: Registration, login, and favorites system

### Technical Stack
- **Frontend**: React 19 with TypeScript, Tailwind CSS 4, React Router
- **Backend**: Express.js with unified API architecture
- **Database**: PostgreSQL with Prisma ORM
- **Maps**: Leaflet, React Leaflet, Leaflet Routing Machine
- **Image Upload**: Cloudinary integration
- **Geocoding**: OpenStreetMap Nominatim API

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+ (running locally or remote)
- Cloudinary account (for image uploads)
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

2. **Configure Backend Environment**:

   Create `.env` file in `Travel_Ease_Backend/`:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/travelease_db"

   # Server
   PORT=3001

   # Cloudinary
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   # Environment
   NODE_ENV=development
   ```

3. **Initialize Database**:

   ```bash
   cd Travel_Ease_Backend
   npx prisma generate
   npx prisma db push
   ```

4. **Start Development Servers**:

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
- Backend API: http://localhost:3001

## Project Structure

```
Travel_Ease/
├── Travel_Ease_Backend/        # Express API server (Port 3001)
│   ├── server.js              # Unified server entry point
│   ├── prisma/                # Prisma schema and migrations
│   │   └── schema.prisma      # Database schema definition
│   ├── routes/                # API route handlers
│   │   ├── business_routes.js
│   │   ├── travel_plan_routes.js
│   │   ├── user_routes.js
│   │   ├── map_routes.js
│   │   └── utils_routes.js
│   ├── business/              # Business controller logic
│   ├── travel_plan/           # Travel plan controller logic
│   ├── user/                  # User controller logic
│   ├── utils/                 # Utilities (image upload)
│   ├── src/
│   │   ├── routes/            # Blog routes
│   │   ├── middleware/        # Auth and error handling
│   │   ├── schemas/           # Zod validation schemas
│   │   └── lib/
│   │       └── prisma.js      # Prisma client singleton
│   └── package.json
├── Travel_Ease_Frontend/      # React application (Port 5173)
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js         # Centralized API configuration
│   │   ├── component/         # Feature components
│   │   │   ├── main_page/    # Travel plan components
│   │   │   ├── business/     # Business registration/edit
│   │   │   ├── blog/         # Blog components
│   │   │   └── map_components/ # Map and routing
│   │   ├── pages/            # Page components
│   │   ├── utils/            # API utility functions
│   │   │   ├── travel_plan/
│   │   │   └── business/
│   │   ├── services/         # API client
│   │   └── types/            # TypeScript type definitions
│   └── package.json
```

## API Endpoints

### Travel Plan Endpoints
- `GET /api/travel_plan/ongoing_plan` - Get active travel plans
- `GET /api/travel_plan/plans` - Get draft plans
- `GET /api/travel_plan/previous_plans` - Get completed plans
- `GET /api/travel_plan/public_plans` - Get public plans
- `GET /api/travel_plan/plans/:id` - Get specific plan
- `GET /api/travel_plan/activities/:id` - Get activities for a plan
- `POST /api/travel_plan/create_plan` - Create new travel plan
- `POST /api/travel_plan/create_activity` - Add activity to plan
- `POST /api/travel_plan/quick_join` - Find matching public plans
- `PUT /api/travel_plan/edit_plan/:id` - Update travel plan
- `PUT /api/travel_plan/activity_edit/:id` - Update activity
- `PUT /api/travel_plan/update_activity/:id` - Update activity dates
- `DELETE /api/travel_plan/delete_activity/:id` - Delete activity

### Business Endpoints
- `GET /api/business/businesses` - List all businesses
- `GET /api/business/fetch_business/:id` - Get business details
- `GET /api/business/fetch_categories/:id` - Get business categories
- `GET /api/business/travel_spots` - Get travel spots (businesses)
- `GET /api/business/travel_spots/reviews/:id` - Get business reviews
- `POST /api/business/create_business` - Register new business
- `POST /api/business/price_range` - Add price ranges
- `PUT /api/business/edit_business/:id` - Update business

### User Endpoints
- `POST /api/user/register` - User registration
- `POST /api/user/login` - User login
- `POST /api/user/favorite` - Add to favorites
- `GET /api/user/favorite/:id` - Get user favorites
- `GET /api/user/user/:id` - Get user details

### Map Endpoints
- `GET /api/suggestions?query=<location>` - Location autocomplete
- `GET /api/search?query=<location>` - Search locations (bounded)
- `GET /api/geocode?query=<address>` - Geocode address
- `POST /api/search` - Address search with POST

### Blog Endpoints
- `GET /api/blogs` - List blogs with pagination and filtering
- `GET /api/blogs/featured` - Get featured blogs
- `GET /api/blogs/:slug` - Get single blog by slug
- `POST /api/blogs` - Create new blog
- `PUT /api/blogs/:id` - Update blog
- `DELETE /api/blogs/:id` - Delete blog

### Utility Endpoints
- `POST /api/utils/upload` - Upload single image to Cloudinary
- `POST /api/utils/upload_images` - Upload multiple images
- `GET /api/health` - Health check

## Database Schema

The application uses Prisma ORM with the following models:

- **User**: User accounts and authentication
- **Blog**: Travel blog posts with rich content
- **Business**: Travel-related businesses and venues
- **BusinessCategory**: Business categorization (many-to-many)
- **BusinessHours**: Operating hours for businesses
- **PriceRange**: Price ranges for business categories
- **TravelPlan**: User-created travel plans
- **Activity**: Activities within travel plans
- **Participant**: Collaborators on travel plans
- **BusinessReview**: Reviews and ratings for businesses
- **TravelPlanReview**: Reviews for travel plans
- **BusinessFavorite**: User's favorite businesses
- **TravelPlanFavorite**: User's favorite travel plans

## Development

### Backend Development

```bash
cd Travel_Ease_Backend
npm run dev              # Start with nodemon (watches for changes)
npm start                # Start production server
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and run migrations
npm run db:studio        # Open Prisma Studio (database GUI)
```

### Frontend Development

```bash
cd Travel_Ease_Frontend
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run test             # Run tests
npm run test:ui          # Run tests with UI
```

### Database Management

The database schema is managed with Prisma. Key commands:

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Push schema changes to database (development)
npx prisma db push

# Create a migration (production)
npx prisma migrate dev --name migration_name

# Open Prisma Studio to browse/edit data
npx prisma studio
```

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/travelease_db"

# Server
PORT=3001

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Environment
NODE_ENV=development
```

### Frontend (.env.local)

```env
VITE_API_BASE_URL=/api
```

## Key Features Explained

### Travel Planning
Create comprehensive travel plans with:
- Start and end dates
- Activities and itineraries
- Collaborators with different roles (Admin, Editor, Viewer)
- Budget ranges
- Public/private visibility
- Quick join for finding compatible plans

### Business Directory
- Register and manage travel-related businesses
- Categorize by type (food, accommodation, activities, etc.)
- Operating hours management
- Image uploads via Cloudinary
- Price range information
- User reviews and ratings

### Interactive Maps
- Search and autocomplete using OpenStreetMap Nominatim
- Visualize travel spots on interactive maps
- Route planning between locations
- Geocoding for addresses

### Blog System
- Rich text content with HTML support
- Featured posts
- Categories and tags
- Reading time estimation
- Pagination and search

## Architecture Decisions

### Unified Backend Server
All API routes are consolidated into a single Express server running on port 3001, providing:
- Consistent API base URL
- Shared middleware (CORS, error handling)
- Centralized Prisma client
- Better resource management

### Prisma ORM
Migrated from raw SQL queries to Prisma for:
- Type-safe database queries
- Automatic migrations
- Better relation handling
- Improved developer experience

### Centralized API Configuration
Frontend uses a single API configuration file (`src/config/api.js`) that:
- Eliminates hardcoded URLs
- Works with Vite proxy in development
- Easy to update for production
- Type-safe endpoint builders

## Deployment

1. **Build both applications**:

   ```bash
   # Backend
   cd Travel_Ease_Backend
   npm install --production

   # Frontend
   cd ../Travel_Ease_Frontend
   npm run build
   ```

2. **Set up production database**:
   - Create PostgreSQL database
   - Run migrations: `npx prisma migrate deploy`
   - Set DATABASE_URL environment variable

3. **Configure environment variables** for production

4. **Deploy**:
   - Backend: Deploy to Node.js hosting (Heroku, Railway, etc.)
   - Frontend: Deploy dist/ folder to static hosting (Vercel, Netlify, etc.)

## Troubleshooting

### Common Issues and Solutions

#### Backend won't start

**Issue**: `Cannot find module` errors
- **Solution**: Run `npm install` in the backend directory to ensure all dependencies are installed
- **Solution**: Run `npx prisma generate` to generate the Prisma client

**Issue**: Database connection errors
- **Solution**: Verify your `DATABASE_URL` in `.env` is correct
- **Solution**: Ensure PostgreSQL is running
- **Solution**: Check database credentials and that the database exists

#### Frontend won't start

**Issue**: Dependency conflicts or peer dependency warnings
- **Solution**: We use React 19 which requires compatible versions:
  - `@testing-library/react@^16.0.1` (not 14.x)
  - `@typescript-eslint/eslint-plugin@^8.0.0` and `@typescript-eslint/parser@^8.0.0` (not 7.x)
- **Solution**: Delete `node_modules` and `package-lock.json`, then run `npm install`

**Issue**: API calls fail from frontend
- **Solution**: Ensure backend is running on port 3001
- **Solution**: Check Vite proxy configuration in `vite.config.js` points to `http://localhost:3001`
- **Solution**: Verify API calls use `/api` prefix to utilize the proxy

#### Node Version Warnings

**Issue**: `EBADENGINE` warnings about Node.js version
- **Note**: The project specifies Node.js 18-24, but works fine with Node.js 25
- **Solution**: You can safely ignore this warning, or adjust `engines` in `package.json` if needed

#### Image Upload Issues

**Issue**: Image uploads fail
- **Solution**: Verify Cloudinary credentials in `.env` are correct
- **Solution**: Check that the backend has `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` set

#### Port Conflicts

**Issue**: "Port already in use" errors
- **Backend**: Kill processes using port 3001: `lsof -ti:3001 | xargs kill -9`
- **Frontend**: Kill processes using port 5173: `lsof -ti:5173 | xargs kill -9`

### Resetting the Environment

If you encounter persistent issues, try a complete reset:

```bash
# Backend
cd Travel_Ease_Backend
pkill -f nodemon  # Stop any running servers
rm -rf node_modules package-lock.json
npm install
npx prisma generate
npm run dev

# Frontend (in a new terminal)
cd Travel_Ease_Frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Verification Checklist

After setup, verify everything works:

- [ ] Backend starts without errors on port 3001
- [ ] Frontend starts without errors on port 5173
- [ ] Health check returns OK: `curl http://localhost:3001/api/health`
- [ ] Frontend can access backend via proxy: `curl http://localhost:5173/api/health`
- [ ] No CORS errors in browser console
- [ ] Database connection works (no Prisma errors in backend logs)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

ISC

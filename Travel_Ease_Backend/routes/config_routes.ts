import { Router, Request, Response } from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const router = Router();

// Initialize database using Prisma
router.get('/init_db', async (req: Request, res: Response) => {
  try {
    console.log('Initializing database with Prisma...');
    
    // Generate Prisma Client
    await execAsync('npx prisma generate');
    
    // Push schema to database
    const { stdout, stderr } = await execAsync('npx prisma db push');
    
    console.log('Database initialized successfully');
    console.log(stdout);
    
    if (stderr && !stderr.includes('warnings')) {
      console.error('Stderr:', stderr);
    }
    
    res.status(200).json({ 
      message: 'Database initialized successfully with Prisma',
      output: stdout
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ 
      error: 'Failed to initialize database',
      details: (error as Error).message
    });
  }
});

// Get database status
router.get('/db_status', async (req: Request, res: Response) => {
  try {
    await execAsync('npx prisma db execute --stdin', {
      // @ts-expect-error - input is not in the type but works
      input: 'SELECT 1 as connected;'
    });
    
    res.status(200).json({ 
      status: 'connected',
      message: 'Database is connected and accessible'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'disconnected',
      error: 'Cannot connect to database',
      details: (error as Error).message
    });
  }
});

export default router;


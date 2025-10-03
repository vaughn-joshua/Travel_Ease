import express from 'express';
import {con} from './config/travelease_db.js';
import { initDB } from './config/travelease_db.js';
const app = express();

app.use(express.json()); // parse application/json

app.get('/', async (req, res) => {
    try {
        const result = await con.query('SELECT * FROM "User"');
        res.json({
            message: 'Hello World!',
            users: result.rows
        });
    } catch (error) {
        console.error('Error executing query', error.stack);
        res.status(500).send('Internal Server Error');
    }
});


initDB().then(()=> {
    app.listen(3000, () =>{
        console.log('Server is running on port 3000');
    })
});

import {Client} from 'pg';

export const con = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'travelease_db',
    password: 'password',
    port: 5433,
});

con.connect().then(()=> {
    console.log('Connected to the database 1');
}).catch((err) => {
    console.error('Connection error', err.stack);
});


export async function initDB(){

    try {
        con.query(`
            CREATE TABLE IF NOT EXISTS "user" (
            user_id SERIAL PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            contact_no VARCHAR(20),
            password VARCHAR NOT NULL
            );

            CREATE TABLE IF NOT EXISTS blog (
            blog_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            content TEXT,
            category INT,
            blog_date DATE DEFAULT CURRENT_DATE
            );

            CREATE TABLE IF NOT EXISTS business (
            business_id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
            name VARCHAR(200) NOT NULL,
            address VARCHAR(300),
            description TEXT,
            rating ,
            business_hours VARCHAR(100),
            category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
            google_authenticator VARCHAR(100),
            status BOOLEAN DEFAULT TRUE,
            picture TEXT
            );

            CREATE TYPE status_enum AS ENUM ('Draft', 'Active', 'Completed', 'Cancelled');

            CREATE TABLE IF NOT EXISTS travel_plan(
            travel_plan_id SERIAL PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            start_date DATE,
            end_date DATE,
            description TEXT,
            visibility BOOLEAN DEFAULT TRUE,
            visibility_end_date DATE,
            status status_enum NOT NULL 
            );

            CREATE TABLE IF NOT EXISTS business_favorite(
            favorite_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
            );

            CREATE TABLE IF NOT EXISTS business_review(
            review_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
            rating ,
            content TEXT,
            review_date DATE DEFAULT CURRENT_DATE
            );

            CREATE TABLE IF NOT EXISTS travel_plan_favorite(
            favorite_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE
            )

            CREATE TABLE IF NOT EXISTS travel_plan_review(
            review_id SERIAL PRIMARY KEY,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
            rating ,
            content TEXT,
            review_date DATE DEFAULT CURRENT_DATE
            );

            CREATE TABLE IF NOT EXISTS product_service(
            product_service_id SERIAL PRIMARY KEY,
            business_id INT REFERENCES business(business_id) ON DELETE CASCADE,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            price_range VARCHAR(100),
            );

            CREATE TABLE IF NOT EXISTS category(
            category_id SERIAL PRIMARY KEY,
            category_name VARCHAR(100) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activity(
            activity_id SERIAL PRIMARY KEY, 
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
            business_id INT REFERENCES business(business_id) ON DELETE SET NULL,
            notes TEXT,
            target_date DATE,
            budget_range VARCHAR(100),
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE
            is_priority BOOLEAN DEFAULT FALSE
            );

            CREATE TYPE participant_role AS ENUM ('Admin', 'Editor', 'Viewer');

            CREATE TABLE IF NOT EXISTS participant (
            participant_id SERIAL PRIMARY KEY,
            travel_plan_id INT REFERENCES travel_plan(travel_plan_id) ON DELETE CASCADE,
            user_id INT REFERENCES "user"(user_id) ON DELETE CASCADE,
            role participant_role NOT NULL DEFAULT 'Viewer',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status BOOLEAN DEFAULT TRUE
            );

            `);
        console.log('Tables are created or already exist.');    
    } catch (error) {
        console.error('Error creating tables', error);
    }

}
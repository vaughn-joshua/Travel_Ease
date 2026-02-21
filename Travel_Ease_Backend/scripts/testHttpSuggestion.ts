
import axios from 'axios';
import jwt from 'jsonwebtoken';

async function testEndpoint() {
    try {
        // Generate a fake SUPER_ADMIN token
        const payload = {
            id: 1, // Assume user 1 is our super admin
            auth_id: 'fake-auth-id',
            role: 'SUPER_ADMIN'
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

        // Hit the endpoint. We need two activities. 
        // Let's just use 1 and 2, hope they exist.
        // Even if they don't, we should get a proper 404 or reason response, proving the endpoint runs.
        const res = await axios.get('http://localhost:3001/api/traffic/alternative-suggestion', {
            params: {
                origin_activity_id: 1,
                destination_activity_id: 2
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("Endpoint response:", res.data);

    } catch (e: any) {
        if (e.response) {
            console.error("Endpoint failed with status", e.response.status);
            console.error(e.response.data);
        } else {
            console.error("Error calling endpoint", e.message);
        }
    }
}

testEndpoint();

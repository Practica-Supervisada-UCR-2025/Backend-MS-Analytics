import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a function to generate admin token
async function generateAdminToken() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        // Create payload with required fields
        const payload = {
            role: 'admin',
            email: 'admin@example.com',
            uuid: 'admin-uuid-123'
        };

        // Generate token
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        console.log('Generated Admin Token:');
        console.log('Bearer ' + token);
        console.log('\nToken Payload:');
        console.log(JSON.stringify(payload, null, 2));
    } catch (error) {
        console.error('Error generating token:', error);
    }
}

// Execute the function
generateAdminToken(); 
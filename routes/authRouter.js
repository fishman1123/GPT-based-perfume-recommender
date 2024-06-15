const express = require('express');
const request = require('request');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();
const apiKey = process.env.IMWEB_API_KEY;
const secret = process.env.IMWEB_SECRET_KEY;

router.post('/auth', (req, res) => {
    const url = 'https://api.imweb.me/v2/auth';
    const req_body = {
        key: apiKey,
        secret: secret
    };

    request.post({
        headers: { 'Content-Type': 'application/json' },
        url: url,
        body: JSON.stringify(req_body)
    }, (error, response, body) => {
        if (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        try {
            const authResponse = JSON.parse(body);
            res.json(authResponse);
        } catch (err) {
            console.error('Error parsing JSON:', err);
            res.status(500).json({ error: 'Error parsing JSON response' });
        }
    });
});

module.exports = router;

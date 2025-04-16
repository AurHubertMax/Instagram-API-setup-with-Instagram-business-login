const express = require('express');
const axios = require('axios');
const app = express();
const port = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})

app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
})

app.post('/api/instagram/token', async (req, res) => {
    try {
        const formData = new URLSearchParams();
        for (const [key, value] of Object.entries(req.body)) {
            formData.append(key, value);
        }

        const res = await axios.post(
            'https://api.instagram.com/oauth/access_token',
            formData.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        console.log('Instagram token response:', res.data);
        res.json(res.data);
    } catch (e) {
        console.error('Instagram token error:',e);
        res.status(500).json({ error: e.message });
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
const FormData = require('form-data');
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

        const client_id = req.body.client_id ;
        const client_secret = req.body.client_secret;
        const redirect_uri = req.body.redirect_uri;
        const code = req.body.code;

        console.log('Extracted parameters:', { client_id, client_secret, redirect_uri, code });

        console.log('Received request to generate Instagram access token:', req.body);

        if (!client_id) {
            return res.status(400).json({ error: 'Missing client_id/app_id parameter' });
        }
        if (!client_secret) {
            return res.status(400).json({ error: 'Missing client_secret/app_secret parameter' });
        }
        if (!redirect_uri) {
            return res.status(400).json({ error: 'Missing redirect_uri parameter' });
        }
        if (!code) {
            return res.status(400).json({ error: 'Missing code parameter' });
        }
        

        const formData = new FormData();
        formData.append('client_id', client_id);
        formData.append('client_secret', client_secret);
        formData.append('grant_type', 'authorization_code');
        formData.append('redirect_uri', redirect_uri);
        formData.append('code', code);

        console.log('Form data:', formData.getBuffer().toString());
        console.log('Form data headers:', formData.getHeaders());

        const response = await axios.post(
            'https://api.instagram.com/oauth/access_token',
            formData, 
            {
                headers: {
                    'content-type': 'multipart/form-data'
                }
            }
        );

        console.log('Instagram token response:', response.data);

        return res.json(response.data);

    } catch (e) {
        console.error('Error generating Instagram access token:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        res.status(500).json({ error: e.message });
    }

})

app.get('/api/instagram/refreshToken', async (req, res) => {
    const access_token = req.body.access_token;
    try {
        const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
            params: {
                grant_type: 'ig_refresh_token',
                access_token: access_token
            }
        });
        console.log('Instagram refresh token response:', response.data);
        return res.json(response.data);
        
    } catch (e) {
        console.error('Error refreshing Instagram access token:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        throw e;
    }
})

app.get('/api/instagram/token', async (req, res) => {
    const client_secret = req.body.client_secret;
    const shortLivedToken = req.body.shortLivedToken;
    try {
        const response = await axios.get('https://graph.instagram.com/access_token', {
            params: {
              grant_type: 'ig_exchange_token',
              client_secret: client_secret,
              access_token: shortLivedToken
            }
        });

        console.log('Instagram long-lived token response:', response.data);
        return res.json(response.data);

    } catch (e) {
        console.error('Error generating Instagram access token:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        res.status(500).json({ error: e.message });
    }
    

})

// get instagram id
app.get('/api/instagram/userId', async (req, res) => {
    const access_token = req.body.access_token;
    try {
        const response = await axios.get('https://graph.instagram.com/me', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });
        console.log('Instagram user info response:', response.data);
        return res.json(response.data);
        
    } catch (e) {
        console.error('Error getting Instagram user id:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        throw e;
    }
})

app.get('/api/instagram/userInfo', async (req, res) => {
    const access_token = req.body.access_token;
    try {
        const response = await axios.get('https://graph.instagram.com/me?fields=id,username,account_type,media_count', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });
        console.log('Instagram user info response:', response.data);
        return res.json(response.data);
        
    } catch (e) {
        console.error('Error getting Instagram user info:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        throw e;
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
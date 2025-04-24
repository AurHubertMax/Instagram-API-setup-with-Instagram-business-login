if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(search, replacement) {
      return this.split(search).join(replacement);
    };
  }

const FormData = require('form-data');
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const app = express();
const port = 5000;

require('dotenv').config();

const longLivedToken = process.env.REACT_APP_INSTAGRAM_LONG_LIVED_ACCESS_TOKEN;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Create the multer instance
const upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Set to true in production
        maxAge: 60 * 24 * 60 * 60 * 1000 // 60 days
    }
}));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    next();
})

app.use((req, res, next) => {
    if (!req.session) {
        console.error('Session middleware not initialized properly');
        return res.status(500).json({ error: 'Server configuration error' });
    }
    next();
});

// middleware to automatically refresh token if it is expired
app.use(async (req, res, next) => {
    if (req.session.instagramToken?.longLivedToken) {
        const token = req.session.instagramToken;

        if (token.longLivedTokenExpiresAt && new Date(token.longLivedTokenExpiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
            try {
                console.log('Auto refreshing Instagram token...');

                const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
                    params: {
                        grant_type: 'ig_refresh_token',
                        access_token: token.longLivedToken
                    }
                });

                req.session.instagramToken.longLivedToken = response.data.access_token;
                req.session.instagramToken.longLivedTokenRefreshedAt = new Date();
                req.session.instagramToken.longLivedTokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
                
                console.log('Token auto-refreshed successfully');
            } catch (error) { 
                console.error('Error auto-refreshing token:', error.message);
            }
        }
    }

    next();
});

app.get('/api', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
})

/*---------------------------------------------------------------------------------------
** INSTAGRAM ACCESS TOKEN GENERATION ENDPOINTS
** These endpoints are used to create / refresh Instagram access token using the authorization code flow.
---------------------------------------------------------------------------------------*/

// get short-lived access token
app.post('/api/instagram/token', async (req, res) => {
    try {
        const client_id = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
        const client_secret = process.env.REACT_APP_INSTAGRAM_APP_SECRET;
        const redirect_uri = process.env.REACT_APP_INSTAGRAM_REDIRECT_URI;
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
        
        if (response.status !== 200) {
            throw new Error('Failed to generate Instagram access token');
        }

        // store short lived token in session
        req.session.instagramToken = {
            shortLivedToken: response.data.access_token,
            userId: response.data.user_id,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 3600 * 1000) // 1 hour expiration
        }

        console.log('Instagram token response:', response.data);

        return res.json({
            ...response.data,
            message: 'Instagram access token generated successfully'
     });

    } catch (e) {
        console.error('Error generating Instagram access token:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        res.status(500).json({ error: e.message });
    }

})

// get long-lived access token
app.get('/api/instagram/longLivedToken', async (req, res) => {
    const client_secret = process.env.REACT_APP_INSTAGRAM_APP_SECRET;
    // const client_secret = req.body.client_secret;
    const shortLivedToken = req.session.instagramToken ? req.session.instagramToken.shortLivedToken : longLivedToken;
    
    if (!shortLivedToken) {
        return res.status(400).json({ error: 'Missing short-lived access token' });
    }

    try {
        const response = await axios.get('https://graph.instagram.com/access_token', {
            params: {
              grant_type: 'ig_exchange_token',
              client_secret: client_secret,
              access_token: shortLivedToken
            }
        });

        // store long lived token in session
        req.session.instagramToken = {
            ...req.session.instagramToken,
            longLivedToken: response.data.access_token,
            longLivedTokenCreatedAt: new Date(),
            longLivedTokenExpiresAt: new Date(Date.now() + 60 * 60 * 24 * 60 * 1000) // 60 days
        };

        console.log('Long-lived token stored in session')

        return res.json({
            ...response.data,
            message: 'Long-lived token stored in session'
        });

    } catch (e) {
        console.error('Error generating Instagram access token:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        res.status(500).json({ error: e.message });
    }
})

// get current token status
app.get('/api/instagram/token-status', (req, res) => {
    if (!req.session.instagramToken) {
        return res.status(400).json({ error: 'No Instagram token found in session' });
    }

    const { shortLivedToken, longLivedToken, userId, expiresAt, longLivedTokenExpiresAt } = req.session.instagramToken;

    return res.json({
        loggedIn: true,
        userId,
        hasShortLivedToken: !!shortLivedToken,
        hasLongLivedToken: !!longLivedToken,
        shortLivedTokenExpiresAt: expiresAt,
        longLivedTokenExpiresAt: longLivedTokenExpiresAt,
    });
});

// delete token from session (logout)
app.post('/api/instagram/logout', (req, res) => {
    if (req.session.instagramToken) {
        delete req.session.instagramToken;
        return res.json({success: true, message: 'Instagram token deleted from session'});
    }

    return res.status(400).json({ error: 'No Instagram token found in session' });
})

/*---------------------------------------------------------------------------------------
** INSTAGRAM REFRESH TOKEN ENDPOINTS
** These endpoints are used to refresh Instagram access token using the refresh token flow.
---------------------------------------------------------------------------------------*/

// refresh long-lived access token
app.get('/api/instagram/refreshToken', async (req, res) => {
    const access_token = req.session.instagramToken ? req.session.instagramToken.longLivedToken : longLivedToken;
    
    if (!access_token) {
        return res.status(400).json({ error: 'Missing long-lived access token' });
    }

    try {
        const response = await axios.get('https://graph.instagram.com/refresh_access_token', {
            params: {
                grant_type: 'ig_refresh_token',
                access_token: access_token
            }
        });

        if (req.session.instagramToken) {
            req.session.instagramToken.longLivedToken = response.data.access_token;
            req.session.instagramToken.longLivedTokenCreatedAt = new Date();
            req.session.instagramToken.longLivedTokenExpiresAt = new Date(Date.now() + 60 * 60 * 24 * 60 * 1000); // 60 days
        } else {
            req.session.instagramToken = {
                longLivedToken: response.data.access_token,
                longLivedTokenCreatedAt: new Date(),
                longLivedTokenExpiresAt: new Date(Date.now() + 60 * 60 * 24 * 60 * 1000) // 60 days
            };
        }
        console.log('Instagram token refreshed and stored in session');
        return res.json({
            ...response.data,
            message: 'Refreshed token stored in session'
        });
        
    } catch (e) {
        console.error('Error refreshing Instagram access token:', e.response?.data || e.message);
        console.error('Error details:', e.body);
        throw e;
    }
})


/*---------------------------------------------------------------------------------------
** INSTAGRAM USER ID AND USER INFO ENDPOINTS 
** These endpoints are used to get Instagram user id and user info.
** Can be used for token validation and to get user info.
---------------------------------------------------------------------------------------*/
app.get('/api/instagram/userId', async (req, res) => {
    try {
        // Use query parameters for GET requests
        const access_token = req.query.access_token || 
                          (req.session.instagramToken ? req.session.instagramToken.longLivedToken : longLivedToken);
        
        if (!access_token) {
            return res.status(400).json({ error: 'Missing access_token parameter' });
        }
        
        // Use params instead of headers for Instagram API
        const response = await axios.get('https://graph.instagram.com/me', {
            params: { access_token }
        });
        
        console.log('Instagram user info response:', response.data);
        return res.json(response.data);
        
    } catch (e) {
        console.error('Error getting Instagram user id:', e.response?.data || e.message);
        return res.status(500).json({ error: e.message, details: e.response?.data });
    }
});

app.get('/api/instagram/userInfo', async (req, res) => {
    try {
        // Use query parameters for GET requests
        const access_token = req.query.access_token || 
                          (req.session.instagramToken ? req.session.instagramToken.longLivedToken : longLivedToken);
        
        if (!access_token) {
            return res.status(400).json({ error: 'Missing access_token parameter' });
        }
        
        const response = await axios.get('https://graph.instagram.com/me', {
            params: { 
                fields: 'id,username,account_type,media_count',
                access_token 
            }
        });
        
        console.log('Instagram user info response:', response.data);
        return res.json(response.data);
        
    } catch (e) {
        console.error('Error getting Instagram user info:', e.response?.data || e.message);
        return res.status(500).json({ error: e.message, details: e.response?.data });
    }
});

app.get('/api/instagram/token-status', (req, res) => {
    if (!req.session.instagramToken) {
        return res.json({ 
            loggedIn: false, 
            message: 'No Instagram account connected'
        });
    }

    const { longLivedToken, userId, longLivedTokenExpiresAt } = req.session.instagramToken;

    return res.json({
        loggedIn: !!longLivedToken,
        userId,
        username: req.session.instagramToken.username || null,
        profilePicture: req.session.instagramToken.profilePicture || null,
        expiresAt: longLivedTokenExpiresAt,
        isExpired: longLivedTokenExpiresAt ? new Date(longLivedTokenExpiresAt) < new Date() : null
    });
});

/*---------------------------------------------------------------------------------------
** INSTAGRAM POSTING ENDPOINTS
** These endpoints are used to post media to Instagram.
---------------------------------------------------------------------------------------*/

// UPLOAD A MEDIA FILE
app.post('/api/instagram/uploadImage', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Missing image file' });
        }

        // generate url for uploaded image
        const serverURL = `${req.protocol}://${req.get('host')}`;
        const imageURL = `${serverURL}/uploads/${req.file.filename}`;

        console.log('Uploaded image URL:', imageURL);

        return res.json({ 
            image_url: imageURL,
            id: req.file.filename,
        });

    } catch (e) {
        console.error('Error uploading image:', e.message);
        return res.status(500).json({ error: e.message });
    }
})

// DELETE A MEDIA FILE
app.post('/api/instagram/removeImage', async (req, res) => {
    try {
        const { id } = req.body;

        if (!id) {
            return res.status(400).json({ error: 'Missing image id' });
        }

        const filePath = path.join(uploadDir, id);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);

            return res.json({ message: 'Image removed successfully' });

        } else {

            return res.status(404).json({ error: 'Image not found' });

        }
    } catch (e) {
        console.error('Error removing image:', e.message);
        return res.status(500).json({ error: e.message });
    }
});

// CREATE A CONTAINER FOR THE MEDIA
app.post('/api/instagram/createContainer', async (req, res) => {
    try {
        console.log('Received request to create Instagram container');
        console.log('image url:', req.imageURL); 
        console.log('Body:', req.body); 

        const access_token = req.session.instagramToken ? req.session.instagramToken.longLivedToken : longLivedToken;

        if (!access_token) {
            return res.status(400).json({ error: 'Missing long-lived access token' });
        }

        // check validity of request body
        if (!req.imageURL) {
            return res.status(400).json({ error: 'Missing image file' });
        }
        
        if (!req.body.caption) {
            return res.status(400).json({ error: 'Missing caption parameter' });
        }

        let userId = req.body.user_id;
        if (!userId) {
            const userResponse = await axios.get('https://graph.instagram.com/me', {
                params: { access_token }
            });
            userId = userResponse.data.id;
        }

        const params = {
            caption, 
            access_token,
        };

        if (imageURL) {
            params.image_url = imageURL;
        } else if (video_url) {
            params.video_url = video_url;
        }

        const response = await axios.post(`https://graph.instagram.com/${userId}/media`, 
            null, 
            { params }
        );

        console.log('Instagram create container response:', response.data);
        return res.json(response.data);

    } catch (e) {
        console.error('Error creating Instagram container:', e.response?.data || e.message);
        return res.status(500).json({ error: e.message, details: e.response?.data });
    }
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
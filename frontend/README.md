# **Instagram Business API Integration with Imgur Image Hosting**
### This project demonstrates integration with Instagram's Business  API for posting content. It provides a simple interface to authenticate with Instagram, manage authentication token, using Imgur to host images to attain image urls, and post images to your instagram business profile

## Features
- Instagram OAuth login and authentication
- Token management (short-lived and long-lived tokens)
- Session persistence for authenticated users
- Image uploading and posting to Instagram
- Automatic token refresh to maintain connection

## Tech Stack
### Backend
- NodeJs with Express
- Session management with express-session
- File uploads with Multer
- HTTP requests with Axios
- Environment variable management with Dotenv

### Frontend
- React 19
- Axios for API interactions
- React Toastify for notifications
- Custom Instagram OAuth integration

# Getting Started
## Prerequisites
- NodeJs(v12.*)
- An Instagram Business account
- A Facebook Developer account with an app configured for Instagram Graph API and connected to the Instagram Business account
- An Imgur account and app

## Installation
1. Clone this repo
2. Install dependencies for both frontend and backend
3. Create `.env` files in both backend and frontend directories with your credentials
Backend (.env):
```
REACT_APP_INSTAGRAM_CLIENT_ID=your_instagram_app_client_id
REACT_APP_INSTAGRAM_APP_SECRET=your_instagram_app_secret
REACT_APP_INSTAGRAM_REDIRECT_URI=your_instagram_redirect_uri

REACT_APP_IMGUR_CLIENT_ID=your_imgur_app_client_id
REACT_APP_IMGUR_CLIENT_SECRET=your_imgur_app_secret
REACT_APP_IMGUR_REFRESH_TOKEN=your_imgur_refresh_token
REACT_APP_IMGUR_REDIRECT_URI=your_imgur_redirect_uri
```

Frontend (.env):
```
REACT_APP_INSTAGRAM_CLIENT_ID=your_instagram_app_client_id
REACT_APP_INSTAGRAM_APP_SECRET=your_instagram_app_secret
REACT_APP_INSTAGRAM_REDIRECT_URI=your_instagram_redirect_uri
```

## Running the Application
1. start backend server with `npm run dev`
2. start frontend server with `npm start`

## Usage
1. Connect your Instagram Business account using the "Connect Instagram Account" button
2. After authentication, copy the redirect uri with the code to the textarea that appears and click "Generate Access Token"
3. Upload images and add captions to post directly to your Instagram Business account
4. Disconnect your account when finished
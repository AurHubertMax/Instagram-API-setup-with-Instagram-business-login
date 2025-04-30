import { useState, useEffect, useRef } from 'react';
import './App.css';
import { toast } from 'react-toastify';
import CustomInstagramLogin from './components/customInstagramLogin';
import CustomImgurLogin from './components/customImgurLogin';
import { generateShortLivedAccessToken, generateLongLivedAccessToken } from './components/instagramAccessToken';
import { useParams } from "react-router-dom";
import axios from 'axios';
import { checkInstagramConnection as checkConnection, logoutFromInstagram, postToInstagram, uploadImageToServer, deleteImageFromServer } from './components/instagramUtilities';

const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
const clientSecret = process.env.REACT_APP_INSTAGRAM_APP_SECRET;
const redirectUri = process.env.REACT_APP_INSTAGRAM_REDIRECT_URI;
const scope = process.env.REACT_APP_INSTAGRAM_SCOPE;

const imgurClientId = process.env.REACT_APP_IMGUR_CLIENT_ID;
const imgurClientSecret = process.env.REACT_APP_IMGUR_CLIENT_SECRET;
const imgurRedirectUri = process.env.REACT_APP_IMGUR_REDIRECT_URI;


function App() {

  // INSTAGRAM STATES
  const [urlButtonVisibility, setUrlButtonVisibility] = useState(false);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [urlValue, setUrlValue] = useState('');
  const [instagramStatus, setInstagramStatus] = useState({
    loggedIn: false,
    userId: null,
    hasLongLivedToken: null,
    longLivedTokenExpiresAt: null,
    hasShortLivedToken: null,
    shortLivedTokenExpiresAt: null,
  });
  const [imageUrl, setImageUrl] = useState('');

  const fileInputRef = useRef(null);

  // separate scope into a comma separated array of strings
  const scopes = scope ? scope.split(',').map(s => s.trim()) : ['user_profile'];

  // IMGUR STATES
  const [imgurStatus, setImgurStatus] = useState({
    loggedIn: false,
    userId: null,
    hasLongLivedToken: null,
    longLivedTokenExpiresAt: null,
    hasShortLivedToken: null,
    shortLivedTokenExpiresAt: null,
  })


  const checkInstagramConnection = async () => {
    return await checkConnection(setInstagramStatus);
  };

  const checkImgurConnection = async () => {
    return await checkConnection(setImgurStatus);
  };

  useEffect(() => {
    checkInstagramConnection();
  }, []);

  useEffect(() => {
    if (!instagramStatus.loggedIn) return;
    
    const intervalId = setInterval(() => {
      checkConnection(setInstagramStatus);
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [instagramStatus.loggedIn]);

  useEffect(() => {
    if (!urlButtonVisibility) {
      setUrlValue('');
    }
  }, [urlButtonVisibility]);

  const handleUrlChange = (e) => {
    setUrlValue(e.target.value);
  }

  const handleGenerateAccessToken = async () => {
    try {
      const shortLivedToken = await generateShortLivedAccessToken(urlValue);
      console.log('Short-lived access token:', shortLivedToken);

      const longLivedToken = await generateLongLivedAccessToken();
      console.log('Long-lived access token:', longLivedToken);

      toast.success('Access token generated successfully');
      
      const isConnected = await checkInstagramConnection();
      
      if (isConnected) {
        setUrlButtonVisibility(false);
        toast.success('Successfully connected to Instagram!');
      }
    } catch (error) {
      console.error('Error generating access token:', error);
      toast.error('Error generating access token');
    }
  }

  const handleLogoutFromInstagram = async () => {
    try {
      await logoutFromInstagram(setInstagramStatus);
      toast.success('Successfully logged out from Instagram!');

    } catch (error) {
      console.error('Error logging out from Instagram:', error);
      toast.error('Error logging out from Instagram');
    }
  }

  const handlePostToInstagram = async (caption, imageURL) => {

    // const response = await uploadImageToServer(file);

    // if (response) {
    //   toast.success('Image uploaded successfully!');
    // } else {
    //   toast.error('Error uploading image');
    // }
    
    const response = await postToInstagram(caption, imageURL);
    if (response && response.success) {
      toast.success('Post created successfully!');
    } else {
      toast.error('Error creating post');
    }
    setCaption('');
    setFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset the file input
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        {/* Instagram Connection Status */}
        <div className="instagram-connection-status-container">
          <h2>Instagram Connection Status</h2>
          
          {instagramStatus.loggedIn ? (
            <div className="connected-account-container">
              <div className="connection-header">
                <span className="status-indicator connected"></span>
                <span>Connected to Instagram</span>
              </div>
              
              <div className="account-details">
                <div className="account-info">
                  <p className="username">
                    {instagramStatus.username || `User ID: ${instagramStatus.userId}`}
                  </p>
                  {instagramStatus.longLivedTokenExpiresAt && (
                    <p className="expiry-info">
                      Token expires: {new Date(instagramStatus.longLivedTokenExpiresAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Make a Post textarea and file upload */}
              <div className="post-container">
                <textarea 
                  placeholder='Write your caption here'
                  className='caption-textarea'
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
                {/* <input 
                  type="file" 
                  accept="image/*" 
                  className='file-input'
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0])}
                /> */}
                <textarea
                  placeholder='Provide image URL here'
                  className='image-url-textarea'
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <button 
                  className='post-button'
                  onClick={() => {
                    console.log('Caption:', caption);
                    console.log('File:', imageUrl);
                    handlePostToInstagram(caption, imageUrl);
                  }}
                >
                  Post
                </button>
              </div>
              
              <button 
                onClick={() => {handleLogoutFromInstagram()}}
                className="disconnect-button"
              >
                Disconnect Account
              </button>
            </div>
          ) : (
            <div className="disconnected-account">
              <div className="connection-header">
                <span className="status-indicator disconnected"></span>
                <span>Not connected to Instagram</span>
              </div>
              
              <p>Connect your Instagram account to enable features.</p>
            </div>
          )}
        </div>
        
        {/* Only show login UI if not already logged in */}
        {!instagramStatus.loggedIn && (
          <>
            <h1>Instagram Login</h1>
            <CustomInstagramLogin 
              appId={clientId}
              appSecret={clientSecret}
              redirectUri={redirectUri}
              scope={scopes}
              buttonText="Connect Instagram Account"
              className="instagram-button"
              setUrlButtonVisibility={setUrlButtonVisibility}
              onLoginSuccess={checkInstagramConnection}
            />
          </>
        )}
        {!imgurStatus.loggedIn && (
          <>
            <h1>Imgur Login</h1>
            <CustomImgurLogin 
              clientId={imgurClientId}
              clientSecret={imgurClientSecret}
              redirectUri={imgurRedirectUri}
              buttonText="Connect Imgur Account"
              className="imgur-button"
              setUrlButtonVisibility={setUrlButtonVisibility}
              onLoginSuccess={checkImgurConnection}
            />
          </>
        )}
  
        {/* Only show URL input when needed AND not logged in */}
        {urlButtonVisibility && !instagramStatus.loggedIn && ( 
          <div className="url-container">
            <label htmlFor="url" className='url-label'>URL:</label>
            <textarea 
              placeholder='Enter URL here'
              id="url" 
              value={urlValue} 
              onChange={handleUrlChange}
              className='url-textarea'
            />
            <button onClick={() => {
              handleGenerateAccessToken();
              checkInstagramConnection(); // Add this to update status after token generation
            }}>
              Generate Access Token
            </button>
          </div>
        )}
      </header>
      
      
    </div>
  );
}

export default App;

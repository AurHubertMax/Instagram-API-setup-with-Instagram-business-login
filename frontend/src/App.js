import { useState, useEffect } from 'react';
import './App.css';
import { toast } from 'react-toastify';
import CustomInstagramLogin from './components/customInstagramLogin';
import { generateInstagramAccessToken } from './components/generateInstagramAccessToken';
import { useParams } from "react-router-dom";
import axios from 'axios';

const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
const clientSecret = process.env.REACT_APP_INSTAGRAM_APP_SECRET;
const redirectUri = process.env.REACT_APP_INSTAGRAM_REDIRECT_URI;
const scope = process.env.REACT_APP_INSTAGRAM_SCOPE;

function App() {
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState({});
  const [urlButtonVisibility, setUrlButtonVisibility] = useState(false);
  const [urlValue, setUrlValue] = useState('');
  const [accessTokenSuccess, setAccessTokenSuccess] = useState(false);
  const [instagramStatus, setInstagramStatus] = useState({
    loggedIn: false,
    userId: null,
    username: null,
    profilePicture: null,
    expiresAt: null
  });

  // separate scope into a comma separated array of strings
  const scopes = scope ? scope.split(',').map(s => s.trim()) : ['user_profile'];

  useEffect(() => {
    fetch('/api')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setBackendData(data);
        setLoading(false);
        console.log(data);
        console.log('url is:', window.location.href);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        setLoading(false);
      })
  }, []);

  useEffect(() => {
    if (!instagramStatus.loggedIn) return;
    
    const intervalId = setInterval(() => {
      checkInstagramConnection();
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
      const accessToken = await generateInstagramAccessToken(urlValue, clientId, clientSecret, redirectUri);
      console.log('Generated access token:', accessToken);
      toast.success('Access token generated successfully');
      setAccessTokenSuccess(true);
      
      await checkInstagramConnection();
      
      if (instagramStatus.loggedIn) {
        setUrlButtonVisibility(false);
      }
    } catch (error) {
      console.error('Error generating access token:', error);
      toast.error('Error generating access token');
    }
  }

  const checkInstagramConnection = async () => {
    try {
      const response = await fetch('/api/instagram/token-status');
      if (!response.ok) throw new Error('Failed to fetch connection status');
      
      const data = await response.json();
      setInstagramStatus(data);
      
      // If logged in, automatically fetch additional profile data
      if (data.loggedIn && !data.username) {
        fetchInstagramProfile(data.userId);
      }
      
      return data.loggedIn;
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
      return false;
    }
  };

  const fetchInstagramProfile = async (userId) => {
    try {
      const response = await axios.get('http://localhost:5000/api/instagram/userInfo');
      if (!response.ok) throw new Error('Failed to fetch user info');
      
      const data = await response.json();
      setInstagramStatus(prev => ({
        ...prev,
        username: data.username || prev.username,
        profilePicture: data.profile_picture || prev.profilePicture
      }));
    } catch (error) {
      console.error('Error fetching Instagram profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/instagram/logout', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Logout failed');
      
      await checkInstagramConnection(); // Refresh status
      toast.info('Disconnected from Instagram');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to disconnect');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <p>Loading data from backend...</p>
        ) : (
          <p>Message from backend: {backendData.message}</p>
        )}
        
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
      
      {/* Instagram Connection Status */}
      <div className="instagram-connection-status">
        <h2>Instagram Connection Status</h2>
        
        {instagramStatus.loggedIn ? (
          <div className="connected-account">
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
            
            <button 
              onClick={handleLogout}
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
    </div>
  );
}

export default App;

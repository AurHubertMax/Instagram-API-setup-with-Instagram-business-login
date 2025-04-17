import { useState, useEffect } from 'react';
import './App.css';
import { toast } from 'react-toastify';
import CustomInstagramLogin from './components/customInstagramLogin';
import { generateInstagramAccessToken } from './components/generateInstagramAccessToken';
import { useParams } from "react-router-dom";

const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
const clientSecret = process.env.REACT_APP_INSTAGRAM_APP_SECRET;
const redirectUri = process.env.REACT_APP_INSTAGRAM_REDIRECT_URI;
const scope = process.env.REACT_APP_INSTAGRAM_SCOPE;

function App() {
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState({});
  const [urlButtonVisibility, setUrlButtonVisibility] = useState(false);
  const [urlValue, setUrlValue] = useState('');

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
    if (!urlButtonVisibility) {
      setUrlValue('');
    }
  }, [urlButtonVisibility]);

  const handleUrlChange = (e) => {
    setUrlValue(e.target.value);
  }

  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <p>Loading data from backend...</p>
        ) : (
          <p>Message from backend: {backendData.message}</p>
        )}
        <h1>Instagram Login</h1>

        <CustomInstagramLogin 
          appId={clientId}
          appSecret={clientSecret}
          redirectUri={redirectUri}
          scope={scopes}
          buttonText="Login with Instagram"
          className="instagram-button"
          setUrlButtonVisibility={setUrlButtonVisibility}
        />

        {urlButtonVisibility && ( 
          <div className="url-container">
            <label htmlFor="url" className='url-label'>URL:</label>
            <textarea 
              placeholder='Enter URL here'
              id="url" 
              value={urlValue} 
              onChange={handleUrlChange}
              className='url-textarea'
            />
            <button onClick={() => 
              generateInstagramAccessToken(urlValue, clientId, clientSecret, redirectUri)}
            >
              Generate Access Token
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

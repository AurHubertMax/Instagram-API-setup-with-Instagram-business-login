import { useState, useEffect } from 'react';
import './App.css';
import { toast } from 'react-toastify';
import { set } from 'mongoose';
import InstagramLogin from "react-instagram-oauth"

const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
const clientSecret = process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET;
const redirectUri = process.env.REACT_APP_INSTAGRAM_REDIRECT_URI;
const scope = process.env.REACT_APP_INSTAGRAM_SCOPE;

function App() {
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState({});

  // separate scope into a comma separated array of strings
  const scopes = scope ? scope.split(',').map(s => s.trim()) : ['user_profile'];
  console.log('scopes', scopes);
  // https://api.instagram.com/oauth/authorize?app_id=1867021637446444&redirect_uri=https://www.highestgood.com/dashboard&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights&response_type=code
  const fullUrl = `https://api.instagram.com/oauth/authorize?app_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes?.join(
      ","
    ) || "user_profile"}&response_type=code`;
  console.log('fullUrl', fullUrl);
  const authHandler = (err, data) => {
    if (err) {
      console.error(err);
      toast.error('Instagram login failed');
      return;
    }
    console.log('Instagram login data:', data);
    // Handle successful login here
  }

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
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        setLoading(false);
      })
  }, []);

  // const loginToInstagram = () => {
  //   console.log('Login to Instagram clicked');
  // https://api.instagram.com/oauth/authorize?app_id=1867021637446444&redirect_uri=https://www.highestgood.com/dashboard&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights
  // https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=1867021637446444&redirect_uri=https://www.highestgood.com/dashboard&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights
  //   const authURL = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;

  //   const width = 600;
  //   const height = 700;
  //   const left = window.screen.width / 2 - width / 2;
  //   const top = window.screen.height / 2 - height / 2;

  //   const popup = window.open(
  //     authURL,
  //     'instagram-auth-popup',
  //     `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0,scrollbars=1`,
  //   );

  //   console.log('popup response', popup);
  //   popup.onhashchange = function() {
  //     const hash = window.location.hash;
  //     const code = hash.split('=')[1];
  //     console.log('code', code);
  //     popup.close();
  //   };

  //   if (!popup) {
  //     toast.error('Failed to open Instagram login popup');
  //   }
  // };


  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <p>Loading data from backend...</p>
        ) : (
          <p>Message from backend: {backendData.message}</p>
        )}
        <h1>Instagram Login</h1>
        {/* <button onClick={() => {loginToInstagram()}}>Login to Instagram</button> */}
        <InstagramLogin 
          authCallback={authHandler}
          appId={clientId}
          appSecret={clientSecret}
          redirectUri={redirectUri}
          scope={scopes}
        />
      </header>
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import './App.css';
import { toast } from 'react-toastify';
import { set } from 'mongoose';
import InstagramLogin from "react-instagram-oauth"
import CustomInstagramLogin from './components/customInstagramLogin';
// import { InstagramLogin } from '@amraneze/react-instagram-login';

const clientId = process.env.REACT_APP_INSTAGRAM_CLIENT_ID;
const clientSecret = process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET;
const redirectUri = process.env.REACT_APP_INSTAGRAM_REDIRECT_URI;
const scope = process.env.REACT_APP_INSTAGRAM_SCOPE;

function App() {
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState({});
  const [instagramData, setInstagramData] = useState(null);

  // separate scope into a comma separated array of strings
  const scopes = scope ? scope.split(',').map(s => s.trim()) : ['user_profile'];


  // const authHandler = (err, data) => {
  //   if (err) {
  //     console.error(err);
  //     toast.error('Instagram login failed');
  //     return;
  //   }
  //   console.log('Instagram login data:', data);
  //   // Handle successful login here
  // }

  const authHandler = (err, data) => { //---------------------------------------- react-instagram-oauth
    console.log('Auth handler called!');
    
    if (err) {
      console.error('Instagram login error:', err);
      toast.error('Instagram login failed');
      return;
    }
    
    console.log('Instagram login data:', data);
    setInstagramData(data);
    toast.success('Instagram login successful!');
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

  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <p>Loading data from backend...</p>
        ) : (
          <p>Message from backend: {backendData.message}</p>
        )}
        <h1>Instagram Login</h1>
        {instagramData ? ( //---------------------------------------- react-instagram-oauth
          <div>
            <p>Logged in with Instagram!</p>
            <p>Access Token: {instagramData.access_token?.substr(0, 10)}...</p>
            <p>User ID: {instagramData.user_id}</p>
            <button onClick={() => setInstagramData(null)}>Logout</button>
          </div>
        ) : (
          <CustomInstagramLogin 
            authCallback={authHandler}
            appId={clientId}
            appSecret={clientSecret}
            redirectUri={redirectUri}
            scope={scopes}
            buttonText="Login with Instagram"
            className="instagram-button"
          />
        )}
        
        {/* <button onClick={() => {loginToInstagram()}}>Login to Instagram</button> */}
        {/* <InstagramLogin 
          authCallback={authHandler}
          appId={clientId}
          appSecret={clientSecret}
          redirectUri={redirectUri}
          scope={scopes}
        /> */}
      </header>
    </div>
  );
}

export default App;

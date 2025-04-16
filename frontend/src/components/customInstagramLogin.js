import React, { Component } from "react";
import { useNavigate } from 'react-router-dom';

class CustomInstagramLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isCompleted: false,
            popul: null
        };
    }

    componentDidMount() {
        this.initializeProcess();
    }

    initializeProcess = () => {
        window.addEventListener("message", this.handleMessage);
    };

    componentDidUpdate(prevProps) {
        if (prevProps !== this.props) {
            console.log("Props updated:", this.props);
        }
    }

    componentWillUnmount() {
        window.removeEventListener("message", this.handleMessage);
    }

    handleMessage = (event) => {
        console.log("Received message:", event.data);

        const { type, data } = event.data || {};
        console.log("Received type:", type);
        console.log("Received data:", data);

        if (type === "code") {
            console.log("Received code:", data);
            this.sendTokenRequest(data)
                .then(response => {
                    const { authCallback } = this.props;
                    const { popup } = this.state;

                    this.setState({ isCompleted: true });

                    if (authCallback) {
                        authCallback(undefined, response);
                    }

                    if (popup) {
                        popup.close();
                    }
                })
                .catch(e => {
                    console.error('Error during token request:', e);
                    const { authCallback } = this.props;

                    if (authCallback) {
                        authCallback(e);
                    }
                });
        }
    };

    buildCodeRequestURL = () => {
        const { appId, redirectUri, scope } = this.props;
        const uri = encodeURIComponent(redirectUri || window.location.href);
        const scopeStr = Array.isArray(scope) ? scope.join(",") : "user_profile";
        
        return `https://api.instagram.com/oauth/authorize?app_id=${appId}&redirect_uri=${uri}&scope=${scopeStr}&response_type=code`;
    };

    sendTokenRequest = async (code) => {
        const { appId, appSecret, redirectUri } = this.props;
        const uri = redirectUri || window.location.href;
        
        // Use our own backend proxy instead of cors-anywhere
        const response = await fetch('/api/instagram/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            app_id: appId,
            app_secret: appSecret,
            redirect_uri: uri,
            code: code,
            grant_type: 'authorization_code'
          })
        });
        
        if (!response.ok) {
          throw new Error('Token request failed');
        }
        
        return await response.json();
    };

    handleLoginClick = () => {
        console.log("Login button clicked");
        const url = this.buildCodeRequestURL();
        console.log("Auth URL:", url);
        
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
    
        const popup = window.open(
          url,
          'instagram-auth-popup',
          `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0,scrollbars=1`
        );
    
        if (popup) {
            console.log("Popup opened");
            console.log('popup location:', popup.location);
            // console.log('popup pathname:', popup.location.pathname);
            const params = new URLSearchParams(popup.location.search);
            
            console.log('popup params:', params.get('code'));
            
            // Store popup reference
            this.setState({ popup });
            
            // Monitor popup closing
            const checkPopupClosed = setInterval(() => {
                console.log('popup location:', popup.location);
                if (popup.closed) {
                clearInterval(checkPopupClosed);
                if (!this.state.isCompleted) {
                    const { authCallback } = this.props;
                    if (authCallback) {
                    authCallback("User closed OAuth popup");
                    }
                }
                }
            }, 500);
        } else {
          console.error("Failed to open popup");
        }
    };

    render() {
        return (
          <button 
            className={this.props.className || "instagram-login-button"}
            onClick={this.handleLoginClick}
          >
            {this.props.buttonText || "Login with Instagram"}
          </button>
        );
    }
}

export default CustomInstagramLogin;
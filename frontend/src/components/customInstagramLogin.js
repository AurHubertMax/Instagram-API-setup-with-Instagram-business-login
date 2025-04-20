import React, { Component } from "react";

class CustomInstagramLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isCompleted: false,
            popul: null
        };
    }

    buildCodeRequestURL = () => {
        const { appId, redirectUri, scope } = this.props;
        const uri = encodeURIComponent(redirectUri || window.location.href);
        const scopeStr = Array.isArray(scope) ? scope.join(",") : "user_profile";
        
        return `https://api.instagram.com/oauth/authorize?app_id=${appId}&redirect_uri=${uri}&scope=${scopeStr}&response_type=code`;
    };

    handleLoginClick = () => {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
    
        const popup = window.open(
          this.buildCodeRequestURL(),
          'instagram-auth-popup',
          `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0,scrollbars=1`
        );
        
        
        if (popup) {

            console.log("Popup opened, props:", this.props);
            if (this.props.setUrlButtonVisibility) {
                this.props.setUrlButtonVisibility(true);
            }


            const checkPopupClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkPopupClosed);

                    if (this.props.setUrlButtonVisibility) {
                        this.props.setUrlButtonVisibility(false);
                    }

                    if (this.props.onLoginSuccess && typeof this.props.onLoginSuccess === 'function') {
                        setTimeout(() => {
                            this.props.onLoginSuccess();
                        }, 1000);
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

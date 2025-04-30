import React, { Component } from "react";

class CustomImgurLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isCompleted: false,
            popup: null
        }
    }

    buildCodeRequestURL = () => {
        const { clientId } = this.props;
        
        return `https://api.imgur.com/oauth2/authorize?client_id=${clientId}&response_type=token`;
    }

    handleLoginClick = () => {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            this.buildCodeRequestURL(),
            'imgur-auth-popup',
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
            console.error("Popup could not be opened");
        }
    };

    render() {
        return (
            <button
                className={this.props.className || 'imgur-login-button'}
                onClick={this.handleLoginClick}
            >
                {this.props.buttonText || 'Login with Imgur'}
            </button>
        )
    }
}

export default CustomImgurLogin;
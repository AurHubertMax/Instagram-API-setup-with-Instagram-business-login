import axios from "axios";

export const generateInstagramAccessToken = async (url, clientId, clientSecret, redirectUri) => {
    console.log("URL to generate access token:", url);
    try {
        const cleanUrl = url.split('#')[0];
        
        const urlParts = cleanUrl.split('?');
        
        if (urlParts.length < 2) {
            throw new Error("Invalid URL format: No query parameters found");
        }
        
        const urlParams = new URLSearchParams(urlParts[1]);
        const code = urlParams.get('code');
        
        if (!code) {
            throw new Error("No code parameter found in URL");
        }
        
        console.log("Extracted code:", code);

        const response = await axios.post('/api/instagram/token', {
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code: code,
            grant_type: 'authorization_code'
        });
        
        return response.data;

    } catch (error) {

        console.error("Error generating Instagram access token:", error);
        throw error;

    }
}
import axios from "axios";


export const checkInstagramConnection = async (setInstagramStatus) => {
    try {
        const response = await axios.get('/api/instagram/token-status', {
            withCredentials: true
        });

        console.log('Instagram connection status:', response.data);

        if (setInstagramStatus && typeof setInstagramStatus === 'function') {
            setInstagramStatus(response.data);
        }

        return response.data.loggedIn;
    } catch (error) {
        console.error('Error checking Instagram connection:', error);
        return false;
    }
};

export const logoutFromInstagram = async (setInstagramStatus) => {
    try {
        const response = await axios.post('/api/instagram/logout', {
            withCredentials: true
        });
        console.log('Logout response:', response.data);
        
        if (setInstagramStatus && typeof setInstagramStatus === 'function') {
            setInstagramStatus(response.data);
        }

        return response.data;
    } catch (error) {
        console.error('Error logging out from Instagram:', error);
        return null;
    }
};

export const fetchInstagramProfile = async () => {
    try {
        const response = await axios.get('/api/instagram/userInfo');
        console.log('Instagram profile data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching Instagram profile:', error);
        return null;
    }
}
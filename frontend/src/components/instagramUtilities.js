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

// const convertImageToURL = (file) => {
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();

//         reader.onload = (event) => {
//             resolve(event.target.result);
//         };

//         reader.onerror = (error) => {
//             console.error('Error converting image to URL:', error);
//             reject(error);
//         };

//         reader.readAsDataURL(file);
//     })
// }

export const postToInstagram = async (caption, file) => {
    // Check if the file is a valid image type
    const validImageTypes = ['image/jpeg', 'image/jpg'];

    if (!file) {
        console.error('No file provided. Please select an image to upload.');
        return null;
    }

    if (!validImageTypes.includes(file.type)) {
        console.error('Invalid file type. Only JPEG images are allowed.');
        return null;
    }

    // Convert jpeg to image url
    // const imageUrl = URL.createObjectURL(file);
    // console.log('Image URL:', imageUrl);

    // const imageURL = await convertImageToURL(file); // For testing with base64 image uploads
    // console.log('Converted Image URL:', imageURL);

    const formData = new FormData();
    formData.append('image', file); 
    formData.append('caption', caption); 

    try {
        const response = await axios.post('/api/instagram/createContainer', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            withCredentials: true
        });

        console.log('Instagram create container response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error posting to Instagram:', error);
        return null;
    }
}
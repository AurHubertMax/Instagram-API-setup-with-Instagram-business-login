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

// export const uploadImageToServer = async (file) => {
//     try {
//         const validImageTypes = ['image/jpeg', 'image/jpg'];

//         if (!file) {
//             console.error('No file provided. Please select an image to upload.');
//             return null;
//         }

//         if (!validImageTypes.includes(file.type)) {
//             console.error('Invalid file type. Only JPEG images are allowed.');
//             return null;
//         }

//         const formData = new FormData();
//         formData.append('image', file);

//         const response = await axios.post('/api/instagram/uploadImage', formData, {
//             headers: {
//                 'Content-Type': 'multipart/form-data',
//             },
//             withCredentials: true
//         });

//         console.log('Image upload response:', response.data);
//         return response.data;
        
//     } catch (error) {
//         console.error('Error uploading image to server:', error);
//         return null;
//     }
// }

// export const deleteImageFromServer = async (imageId) => {
//     try {
//         const response = await axios.post('/api/instagram/removeImage', {
//             imageId: imageId
//         }, {
//             withCredentials: true
//         });

//         console.log('Image delete response:', response.data);
//         return response.data;

//     } catch (error) {
//         console.error('Error deleting image from server:', error);
//         return null;
//     }
// }

export const postToInstagram = async (caption, imageURL) => {
    // Check if the file is a valid image type
    
    if (!caption) {
        console.error('No caption provided. Please enter a caption for the post.');
        return null;
    }

    if (!imageURL) {
        console.error('No file provided. Please select an image to upload.');
        return null;
    }

    const validImageTypes = ['.jpeg', '.jpg'];
    const isValidExtension = validImageTypes.some(ext => imageURL.toLowerCase().endsWith(ext));

    if (!isValidExtension) {
        console.error('Invalid file type. Only JPEG images are allowed.');
        return null;
    }

    // const formData = new FormData();
    // formData.append('image_url', imageURL); 
    // formData.append('caption', caption); 

    try {
        const containerID = await axios.post('/api/instagram/createContainer', {
            image_url: imageURL,
            caption: caption
        }, {
            withCredentials: true
        });
        console.log('Instagram create container response:', containerID.data);

        const response = await axios.post('/api/instagram/publishContainer', {
            container_id: containerID.data.id
        }, {
            withCredentials: true
        });
        
        return response.data;
    } catch (error) {
        console.error('Error posting to Instagram:', error);
        return null;
    }
}
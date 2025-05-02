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

const convertToJPG = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        reject(new Error('Failed to convert image to JPG'));
                        return;
                    }

                    const fileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';

                    const convertedFile = new File(
                        [blob],
                        fileName,
                        { type: 'image/jpeg' }
                    );

                    resolve(convertedFile);
                }, 'image/jpeg');
            };

            img.onerror = (error) => {
                reject(error);
            }
        }

        reader.onerror = (error) => {
            reject(new Error('FileReader error: ' + error.message));
        };
    });
};

const uploadImageToImgur = async (file) => {

    if (!file) {
        console.error('No file provided. Please select an image to upload.');
        return null;
    }
    
    try {
        const jpgFile = await convertToJPG(file);
        console.log('Converted file:', jpgFile);

        const formData = new FormData();
        formData.append('image', jpgFile);

        const response = await axios.post('/api/imgur/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('Imgur upload response:', response);
        return response;

    } catch (error) {
        console.error('Error uploading image to Imgur:', error);
        return null;
    }

}

const deleteImageFromImgur = async (imageHash) => {
    if (!imageHash) {
        console.error('No image hash provided. Please provide a valid image hash to delete.');
        return null;
    }

    try {
        const response = await axios.delete(`/api/imgur/delete/${imageHash}`);

        console.log('Imgur delete response:', response.data);
        return response.data;
    } catch (e) {
        console.error('Error deleting image from Imgur:', e);
        return null;
    }
}

export const postToInstagram = async (caption, file) => {
    // Check if the file is a valid image type
    
    if (!caption) {
        console.error('No caption provided. Please enter a caption for the post.');
        return null;
    }

    if (!file) {
        console.error('No file provided. Please select an image to upload.');
        return null;
    }

    const imgurResponse = await uploadImageToImgur(file);

    console.log('imgurResponse:', imgurResponse);
    const imageURL = imgurResponse.data.image_url;
    const deleteHash = imgurResponse.data.delete_hash;


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

        const imgurDeleteResponse = await deleteImageFromImgur(deleteHash);
        console.log('Imgur delete response:', imgurDeleteResponse);

        if (imgurDeleteResponse.success && imgurDeleteResponse.success) {
            console.log('Image deleted successfully from Imgur.');
            
        }
        return response.data;
    } catch (error) {
        console.error('Error posting to Instagram:', error);
        return null;
    } 
}
const API_BASE_URL = 'http://192.168.1.136:8000';

// Upload file with progress tracking
export const uploadFile = async (file, onProgress) => {
  // First try with 'files' field name (as indicated by backend error)
  try {
    return await uploadFileWithFieldName(file, 'files', onProgress);
  } catch (error) {
    //console.log('Upload failed with field name "files":', error.message || error.toString());
    
    // If that fails, try with 'file' (common alternative)
    try {
      return await uploadFileWithFieldName(file, 'file', onProgress);
    } catch (error2) {
      //console.log('Upload failed with field name "file":', error2.message || error2.toString());
      
      // Try with 'upload_file' (also common)
      try {
        return await uploadFileWithFieldName(file, 'upload_file', onProgress);
      } catch (error3) {
        //console.log('Upload failed with field name "upload_file":', error3.message || error3.toString());
        throw error3; // Throw the last error
      }
    }
  }
};

// Helper function to try upload with specific field name
const uploadFileWithFieldName = async (file, fieldName, onProgress) => {
  const formData = new FormData();
  formData.append(fieldName, file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        onProgress(percentComplete);
      }
    });

    xhr.addEventListener('load', () => {
      //console.log('Response status:', xhr.status);
      //console.log('Response text:', xhr.responseText);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = xhr.responseText ? JSON.parse(xhr.responseText) : xhr.responseText;
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        let errorMessage = `Upload failed: ${xhr.status}`;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          //console.log('Parsed error response:', errorResponse);
          errorMessage = errorResponse.message || errorResponse.error || errorResponse.detail || errorResponse.msg || errorMessage;
        } catch (e) {
          //console.log('Could not parse error response as JSON');
          errorMessage = xhr.responseText || errorMessage;
        }
        reject(new Error(errorMessage));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error: Upload failed'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'));
    });

    // Don't set Content-Type header - let the browser set it with boundary for multipart/form-data
    xhr.open('POST', `${API_BASE_URL}/upload`);
    
    // Add some debugging info
    // console.log(`Uploading file with field name '${fieldName}':`, {
    //   name: file.name,
    //   size: file.size,
    //   type: file.type
    // });
    
    xhr.send(formData);
  });
};

// Alternative upload method using fetch (simpler approach)
export const uploadFileFetch = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('files', file); // Try 'files' first based on backend error

  //console.log('Trying fetch upload with file:', file.name, 'size:', file.size);

  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let the browser set it with boundary
    });

    //console.log('Fetch response status:', response.status);
    const responseText = await response.text();
    //console.log('Fetch response text:', responseText);

    if (!response.ok) {
      let errorMessage = `Upload failed: ${response.status}`;
      
      try {
        const errorJson = JSON.parse(responseText);
        //console.log('Parsed fetch error response:', errorJson);
        errorMessage = errorJson.message || errorJson.error || errorJson.detail || errorJson.msg || errorMessage;
      } catch (e) {
        //console.log('Could not parse fetch error response as JSON');
        errorMessage = responseText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      return responseText;
    }
  } catch (error) {
    console.error('Fetch upload error:', error);
    throw error;
  }
};

// Send chat message
export const sendChatMessage = async (message, collectionName = 'default') => {
  //console.log('Sending chat message:', message, 'to collection:', collectionName);
  
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: message,
        collection_name: collectionName 
      }),
    });

    //console.log('Chat response status:', response.status);
    const responseText = await response.text();
    //console.log('Chat response text:', responseText);

    if (!response.ok) {
      let errorMessage = `Chat request failed: ${response.status}`;
      
      try {
        const errorResponse = JSON.parse(responseText);
        //console.log('Parsed chat error response:', errorResponse);
        errorMessage = errorResponse.message || errorResponse.error || errorResponse.detail || errorResponse.msg || errorMessage;
      } catch (e) {
        //console.log('Could not parse chat error response as JSON');
        errorMessage = responseText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    try {
      return JSON.parse(responseText);
    } catch (e) {
      return responseText;
    }
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Alternative chat message sending with different request formats
export const sendChatMessageAlternative = async (message, collectionName = 'default') => {
  //console.log('Trying alternative chat formats for message:', message, 'to collection:', collectionName);
  
  // Try different request body formats with required fields
  const requestFormats = [
    { query: message, collection_name: collectionName }, // Correct format
    { query: message, collection_name: 'default' }, // With default collection
    { message, collection_name: collectionName }, // Alternative field name
    { text: message, collection_name: collectionName }, // Another alternative
    { prompt: message, collection_name: collectionName }, // Another alternative
    { input: message, collection_name: collectionName }, // Another alternative
  ];

  for (const body of requestFormats) {
    try {
      //console.log('Trying chat request with body:', body);
      
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      //console.log('Alternative chat response status:', response.status);
      const responseText = await response.text();
      //console.log('Alternative chat response text:', responseText);

      if (response.ok) {
        try {
          return JSON.parse(responseText);
        } catch (e) {
          return responseText;
        }
      } else {
        //console.log(`Chat request failed with body ${JSON.stringify(body)}:`, response.status);
      }
    } catch (error) {
      //console.log(`Chat request error with body ${JSON.stringify(body)}:`, error.message);
    }
  }
  
  throw new Error('All chat request formats failed');
};

// Get collections
export const getCollections = async () => {
  try {
    //console.log('Fetching collections from:', `${API_BASE_URL}/collections`);
    const response = await fetch(`${API_BASE_URL}/collections`);
    
    //console.log('Collections response status:', response.status);
    const responseText = await response.text();
    //console.log('Collections response text:', responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    try {
      const data = JSON.parse(responseText);
      //console.log('Parsed collections data:', data);
      return data;
    } catch (e) {
      //console.log('Could not parse collections response as JSON, returning raw text');
      return responseText;
    }
  } catch (error) {
    console.error('Error fetching collections:', error);
    throw error;
  }
};

// Delete collection
export const deleteCollection = async (collectionName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/collections/${collectionName}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting collection:', error);
    throw error;
  }
};

// Check health status
export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
};

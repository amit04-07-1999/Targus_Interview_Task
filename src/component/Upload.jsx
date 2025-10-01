import { useState, useRef } from 'react';
import { uploadFile, uploadFileFetch } from '../services/api';
import './Upload.css';

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setUploadStatus('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setUploadStatus('Uploading...');

    try {
      // First try with progress tracking (XMLHttpRequest)
      try {
        await uploadFile(selectedFile, (progress) => {
          setUploadProgress(progress);
        });
      } catch (progressError) {
        //console.log('Progress upload failed, trying fetch method:', progressError.message);
        
        // If progress upload fails, try with fetch method
        setUploadProgress(50); // Show some progress
        await uploadFileFetch(selectedFile);
        setUploadProgress(100);
      }
      
      setUploadStatus('Upload completed successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error details:', error);
      setError(`Upload failed: ${error.message}`);
      setUploadStatus('');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setError('');
      setUploadStatus('');
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload File</h2>
      
      <div 
        className="file-drop-zone"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <p>Drag and drop a file here, or click to select</p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="file-input"
            accept="*/*"
          />
        </div>
      </div>

      {selectedFile && (
        <div className="selected-file">
          <p><strong>Selected File:</strong> {selectedFile.name}</p>
          <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}

      {isUploading && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="progress-text">{Math.round(uploadProgress)}%</p>
        </div>
      )}

      {uploadStatus && (
        <div className="status-message success">
          {uploadStatus}
        </div>
      )}

      {error && (
        <div className="status-message error">
          {error}
        </div>
      )}

      <button 
        className="upload-button"
        onClick={handleUpload}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
};

export default Upload;

import { useState, useEffect } from 'react';
import { getCollections, deleteCollection } from '../services/api';
import './Collection.css';

const Collection = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [autoRefreshing, setAutoRefreshing] = useState(false);

  const fetchCollections = async (isAutoRefresh = false) => {
    if (isAutoRefresh) {
      setAutoRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    
    try {
      const data = await getCollections();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setCollections(data);
      } else if (data.collections && Array.isArray(data.collections)) {
        setCollections(data.collections);
      } else if (typeof data === 'object' && data !== null) {
        // Convert object to array format
        setCollections(Object.keys(data).map(key => ({
          name: key,
          ...data[key]
        })));
      } else {
        setCollections([]);
      }
    } catch (error) {
      setError(`Failed to fetch collections: ${error.message}`);
      setCollections([]);
    } finally {
      if (isAutoRefresh) {
        setAutoRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCollections();
    
    // Auto-refresh collections every 5 seconds to show newly uploaded files
    const interval = setInterval(() => fetchCollections(true), 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (collectionName) => {
    if (!window.confirm(`Are you sure you want to delete "${collectionName}"?`)) {
      return;
    }

    setDeletingId(collectionName);
    setError('');

    try {
      await deleteCollection(collectionName);
      
      // Remove the deleted collection from the list
      setCollections(prev => prev.filter(col => col.name !== collectionName));
    } catch (error) {
      setError(`Failed to delete collection: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRefresh = () => {
    fetchCollections();
  };

  const formatCollectionInfo = (collection) => {
    if (typeof collection === 'string') {
      return { name: collection };
    }
    
    if (collection.name) {
      return collection;
    }
    
    // Handle case where collection might be an object with collection info
    return {
      name: collection.collection_name || collection.id || 'Unknown Collection',
      ...collection
    };
  };

  return (
    <div className="collections-container">
      <div className="collections-header">
        <h2>Collections</h2>
        <div className="header-actions">
          {autoRefreshing && (
            <div className="auto-refresh-indicator">
              <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23,4 23,10 17,10"/>
                <polyline points="1,20 1,14 7,14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              Auto-refreshing...
            </div>
          )}
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            <svg className="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="23,4 23,10 17,10"/>
              <polyline points="1,20 1,14 7,14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="collections-content">
        {loading && collections.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading collections...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
            <h3>No Collections Found</h3>
            <p>There are no collections available at the moment.</p>
          </div>
        ) : (
          <div className="collections-list">
            {collections.map((collection, index) => {
              const formattedCollection = formatCollectionInfo(collection);
              const collectionName = formattedCollection.name;
              const isDeleting = deletingId === collectionName;
              
              return (
                <div key={collectionName || index} className="collection-item">
                  <div className="collection-info">
                    <div className="collection-name">
                      <svg className="collection-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                      </svg>
                      {collectionName}
                    </div>
                    {formattedCollection.count !== undefined && (
                      <div className="collection-count">
                        {formattedCollection.count} items
                      </div>
                    )}
                    {formattedCollection.description && (
                      <div className="collection-description">
                        {formattedCollection.description}
                      </div>
                    )}
                  </div>
                  <div className="collection-actions">
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(collectionName)}
                      disabled={isDeleting || loading}
                    >
                      {isDeleting ? (
                        <div className="spinner-small"></div>
                      ) : (
                        <svg className="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <polyline points="3,6 5,6 21,6"/>
                          <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      )}
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {collections.length > 0 && (
        <div className="collections-footer">
          <p className="collections-count">
            {collections.length} collection{collections.length !== 1 ? 's' : ''} found
          </p>
        </div>
      )}
    </div>
  );
};

export default Collection;

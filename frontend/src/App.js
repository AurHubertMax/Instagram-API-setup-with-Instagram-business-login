import { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import { set } from 'mongoose';

function App() {
  const [loading, setLoading] = useState(true);
  const [backendData, setBackendData] = useState({});

  useEffect(() => {
    fetch('/api')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setBackendData(data);
        setLoading(false);
        console.log(data);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        setLoading(false);
      })
  }, []);


  return (
    <div className="App">
      <header className="App-header">
        {loading ? (
          <p>Loading data from backend...</p>
        ) : (
          <p>Message from backend: {backendData.message}</p>
        )}
      </header>
    </div>
  );
}

export default App;

// Check what error is coming
useEffect(() => {
  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/tts/voices');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.error) {
        console.error('API Error:', data.error, data.message);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };
  fetchVoices();
}, []);

// api/proxy.js
module.exports = async (req, res) => {
  const { endpoint } = req.query;
  const apiKey = "546a5c7b6baf4f219ca8ae0e181730d5";
  
  try {
    const response = await fetch(`https://api.twelvedata.com/${endpoint}&apikey=${apiKey}`);
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

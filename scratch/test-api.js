const http = require('http');

http.get('http://localhost:8000/api/v1/b2b/search/?q=Ayodhya', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    const hotels = json.results?.hotels || json.results || json;
    console.log("Hotels:", hotels.length);
    if (hotels.length > 0) {
      console.log(JSON.stringify(hotels[0], null, 2));
    }
  });
});

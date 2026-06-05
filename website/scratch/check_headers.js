import http from 'https';

const options = {
  hostname: 'elevateqa.sdettech.com',
  port: 443,
  path: '/',
  method: 'GET',
  rejectUnauthorized: false // bypass SSL errors if any
};

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:');
  for (const [key, val] of Object.entries(res.headers)) {
    console.log(`  ${key}: ${val}`);
  }
});

req.on('error', (e) => {
  console.error('Error fetching headers:', e);
});

req.end();

const https = require('https');

const request = async ({hostname, path, method, headers, body}) => {
    return new Promise( (resolve, reject) => {
        if (!hostname || !path || !method) {
            return reject(new Error('Invalid parameters'));
        }
        const options = {
            hostname,
            path,
            method,
            headers: headers ? headers : {
                'Content-Type': 'application/json',
            }
        };
        const req = https.request(options, response => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
                let bodyResponse = Buffer.concat(chunks);
                const contentType = response.headers['content-type'].split(';');
                switch(contentType[0]) {
                    case 'application/json':
                        bodyResponse = JSON.parse(bodyResponse);
                        break;
                }
                resolve(bodyResponse);
            });
        });
        req.on('error', reject);
        if(body) {
            req.write(body);
        }
        req.end();
    });
};

module.exports = request;
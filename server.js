const http = require('node:http');
const fs = require('fs');

const dataFile = './data.txt';
const hostname = '127.0.0.1';
const port = 3000;

if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]', 'utf-8');

function readDataFromFile() {
    const data = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(data);
}
function writeDataToFile(data) {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf-8');
}

const server = http.createServer((req, res) => {
    const { method, url } = req;

    res.setHeader('Content-Type', 'application/json');

    if (method === 'GET' && url === '/items') {
        const items = readDataFromFile();
        res.writeHead(200);
        res.end(JSON.stringify(items));
    } else if (method === 'POST' && url === '/items') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const { name } = JSON.parse(body);
            if (!name) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'The name field is required' }));
                return;
            }

            const items = readDataFromFile();
            const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
            const newItem = { id: newId, name };
            items.push(newItem);
            writeDataToFile(items);

            res.writeHead(201);
            res.end(JSON.stringify(newItem));
        });
    } else if (method === 'PUT' && url.startsWith('/items/')) {
        const id = parseInt(url.split('/')[2], 10);
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const { name } = JSON.parse(body);
            if (!name) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'The name field is required' }));
                return;
            }

            const items = readDataFromFile();
            const item = items.find(i => i.id === id);

            if (item) {
                item.name = name;
                writeDataToFile(items);
                res.writeHead(200);
                res.end(JSON.stringify(item));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ message: 'Item not found' }));
            }
        });
    } else if (method === 'DELETE' && url.startsWith('/items/')) {
        const id = parseInt(url.split('/')[2], 10);
        const items = readDataFromFile();
        const index = items.findIndex(i => i.id === id);

        if (index !== -1) {
            items.splice(index, 1);
            writeDataToFile(items);
            res.writeHead(204);
            res.end();
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ message: 'Item not found' }));
        }
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ message: 'Not found' }));
    }
});

server.listen(3000, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
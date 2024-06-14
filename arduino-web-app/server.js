const express = require('express');
const path = require('path');
const cors = require('cors');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const portnav = 3000;

// Configurar CORS
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

let currentData = 0;
app.get('/seno', function (req, res) {
    res.send({
        seno: String(currentData),
    });
});

const port = new SerialPort({
    path: '/dev/cu.SLAB_USBtoUART3',
    baudRate: 115200
}, function (err) {
    if (err) {
        return console.log('Error: ', err.message);
    }
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r' }));
parser.on('data', data => currentData = data);

app.listen(portnav, () => {
    console.log('Server running at http://localhost:3000');
});

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use(express.static(__dirname));

app.get('/', (req, res)=>{
    //res.send('server working properly');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((req, res)=>{
    res.status(404).send('404: Page not found');
});

app.listen(port,()=>{
    console.log(`🌱 Server running at http://localhost:${port}`);
});
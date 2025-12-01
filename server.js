const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const promptsFilePath = path.join(__dirname, 'prompts.json');

// API to get prompts
app.get('/api/prompts', (req, res) => {
    fs.readFile(promptsFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error reading prompts file.');
        }
        res.send(data);
    });
});

// API to save prompts
app.post('/api/prompts', (req, res) => {
    const prompts = req.body;
    fs.writeFile(promptsFilePath, JSON.stringify(prompts, null, 2), 'utf8', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error writing prompts file.');
        }
        res.send('Prompts saved successfully.');
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

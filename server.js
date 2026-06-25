const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(express.json({ limit: '5mb' }));
app.use(express.static(__dirname));

// GET /api/tasks — read tasks from file
app.get('/api/tasks', (req, res) => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return res.json(null); // signals "no saved data yet" to the client
        }
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const tasks = JSON.parse(raw);
        res.json(tasks);
    } catch (err) {
        console.error('Error reading tasks:', err.message);
        res.status(500).json({ error: 'Failed to read tasks' });
    }
});

// POST /api/tasks — write tasks to file
app.post('/api/tasks', (req, res) => {
    try {
        const tasks = req.body;
        if (!Array.isArray(tasks)) {
            return res.status(400).json({ error: 'Body must be a JSON array' });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
        res.json({ ok: true, count: tasks.length });
    } catch (err) {
        console.error('Error writing tasks:', err.message);
        res.status(500).json({ error: 'Failed to write tasks' });
    }
});

app.listen(PORT, () => {
    console.log(`\n  📋 Daily Task Planner running at http://localhost:${PORT}\n`);
    console.log(`  Task data saved to: ${DATA_FILE}\n`);
});

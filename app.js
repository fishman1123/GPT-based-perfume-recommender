const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Import routes
const imageMasterRouter = require('./routes/imageMaster');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Use the imported router for the '/professorFish' path
app.use("/imageMaster", imageMasterRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
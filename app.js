const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Import routes
const imageMasterRouter = require('./routes/imageMaster');
const reportRouter = require('./routes/reportRouter');
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
app.use(reportRouter);


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

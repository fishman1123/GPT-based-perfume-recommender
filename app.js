const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Import routes
const imageMasterRouter = require('./routes/imageMaster');
const reportRouter = require('./routes/reportRouter');
const authRouter = require('./routes/authRouter');
const compressedReportsRouter = require('./routes/compressedReportRouter');

// Middleware to serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Report Preview Route
app.get('/preview', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/reportPreview.html'));
});

// Use the imported routers for the paths
app.use("/preview", compressedReportsRouter);
app.use("/imageMaster", imageMasterRouter);
app.use(reportRouter);
app.use(authRouter);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const express = require('express');
const router = express.Router();

router.get('/report', (req, res) => {
    res.render('report', { title: 'Dynamic EJS Page' });
});

module.exports = router;

const express = require('express');
const router = express.Router();

router.post('/report', (req, res) => {
    const { targetReportTitle, targetReportOne, targetReportTwo, targetReportThree } = req.body;

    console.log('targetReportTitle:', targetReportTitle);
    console.log('targetReportOne:', targetReportOne);
    console.log('targetReportTwo:', targetReportTwo);
    console.log('targetReportThree:', targetReportThree);

    // Respond back to the client
    res.json({ message: 'Data received and logged' });
});

module.exports = router;

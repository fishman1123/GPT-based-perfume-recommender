// Import Express and create a router

//command pm2 like below to ignore refresh certain directory
//pm2 start app.js --watch --ignore-watch="public/images/upload"

const {google} = require('googleapis');
const express = require('express');
const request = require('request');


const router = express.Router();
const OpenAI = require("openai");
const https = require("https");
require('dotenv').config();
const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});
const multer = require('multer');
const path = require('path');
const stream = require("node:stream");
const {language} = require("googleapis/build/src/apis/language");
const fs = require('fs').promises;
const GOOGLE_ACCOUNT = path.join(__dirname, '../perfume-maker-google.json');

const topNoteFilePath = path.join(__dirname, '../topnotes.json');
const middleNoteFilePath = path.join(__dirname, '../middlenotes.json');
const baseNoteFilePath = path.join(__dirname, '../basenotes.json');

const iamWebApiKey = process.env.IMWEB_API_KEY;
const iamWebSecretKey = process.env.IMWEB_SECRET_KEY;


const offlineStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const uploadOffline = multer({ storage: offlineStorage });


const authDrive = new google.auth.GoogleAuth({
    keyFile: GOOGLE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const authSheets = new google.auth.GoogleAuth({
    keyFile: GOOGLE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const drive = google.drive({version: 'v3', auth: authDrive});
const sheets = google.sheets({version: 'v4', auth: authSheets});


async function listingReport(userName, resultList, userCode) {
    const spreadsheetId = '1D8n8faBvrYjX3Yk-6-voGoS0YUgN37bi7yEkKfk24Ws'; // Replace with your actual spreadsheet ID
    // const sheetName = 'Sheet1'; // Replace with your sheet name
    const check = true;
    if (userName) {
        try {
            // Log available sheet names
            const sheetsResponse = await sheets.spreadsheets.get({
                spreadsheetId,
            });
            console.log("requested data:", resultList);

            const sheetNames = sheetsResponse.data.sheets.map(sheet => sheet.properties.title);
            console.log('Available sheets:', sheetNames);

            // Get the existing data to find the column index for '주문번호'
            // 현재는 '일련번호' 이지만 추후에 주문번호로 바꿔야됨
            //일련번호는 매장용으로 사용하기 위함
            const getResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetNames}!A1:G1`, // Assuming the headers are in the first row
            });

            const headers = getResponse.data.values[0];
            const orderNumberColumnIndex = headers.indexOf('주문번호');
            if (orderNumberColumnIndex === -1) {
                console.log(`'주문번호' column not found in the sheet`);
                return;
            }

            // Find the column letter based on the index
            const orderNumberColumnLetter = String.fromCharCode(65 + orderNumberColumnIndex);

            // Append the value '1234567890123' to the '주문번호' column
            const appendResponse = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetNames}!${orderNumberColumnLetter}:${orderNumberColumnLetter}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[`${userCode}`, `${userName}`, `${resultList.nameRecommendation}`, `${resultList.combinedInsights}`, `${resultList.topNote}`, `${resultList.middleNote}`, `${resultList.baseNote}`]],
                },
            });
            console.log('Appended value to the spreadsheet:', appendResponse.data.updates);
        } catch (error) {
            console.error('Error listing report:', error);
            if (error.errors) {
                error.errors.forEach((err) => {
                    console.error(`Error reason: ${err.reason}, message: ${err.message}`);
                });
            }
        }
    }

}

listingReport().catch(console.error);

// async function loadUserCode(passcode) {
//     const spreadsheetId = '1D8n8faBvrYjX3Yk-6-voGoS0YUgN37bi7yEkKfk24Ws'; // Replace with your actual spreadsheet ID
//
//     if (passcode) {
//         try {
//             // Log available sheet names
//             const sheetsResponse = await sheets.spreadsheets.get({
//                 spreadsheetId,
//             });
//
//             const sheetNames = sheetsResponse.data.sheets.map(sheet => sheet.properties.title);
//             console.log('Available sheets:', sheetNames);
//
//             // Assuming the first sheet is the target
//             const targetSheet = sheetNames[0];
//
//             // Get all data from the sheet starting from A2
//             const getResponse = await sheets.spreadsheets.values.get({
//                 spreadsheetId,
//                 range: `${targetSheet}!A2:C`, // Fetching columns A to C
//             });
//
//             const rows = getResponse.data.values;
//
//             if (!rows || rows.length === 0) {
//                 console.log('No data found in the sheet');
//                 return false;
//             }
//
//             let rowIndex = -1;
//             let usageStatus = null;
//
//             // Loop through each row to find the passcode
//             for (let i = 0; i < rows.length; i++) {
//                 if (rows[i][1] === passcode) { // Assuming passcode is in column B
//                     rowIndex = i + 2; // +2 to account for header row and zero-based index
//                     usageStatus = rows[i][2]; // Column C (index 2)
//                     break;
//                 }
//             }
//
//             if (rowIndex === -1) {
//                 console.log('Passcode not found');
//                 return false;
//             }
//
//             if (usageStatus === 'FALSE') {
//                 // Update '사용여부' to true
//                 const updateResponse = await sheets.spreadsheets.values.update({
//                     spreadsheetId,
//                     range: `${targetSheet}!C${rowIndex}`, // Targeting the specific cell
//                     valueInputOption: 'RAW',
//                     resource: {
//                         values: [['TRUE']],
//                     },
//                 });
//
//                 console.log('Updated usage status to TRUE:', updateResponse.data);
//                 return true;
//             } else if (usageStatus === 'TRUE') {
//                 console.log('Usage status is already TRUE');
//                 return false;
//             }
//
//         } catch (error) {
//             console.error('Error loading user code:', error);
//             if (error.errors) {
//                 error.errors.forEach((err) => {
//                     console.error(`Error reason: ${err.reason}, message: ${err.message}`);
//                 });
//             }
//         }
//     } else {
//         console.log('No passcode provided');
//     }
//
//     return false;
// }



const storage = multer.memoryStorage();
const upload = multer({storage: storage});
function imageNameAsDate(originalName, userName) {
    const now = new Date();
    const dateString = now.getFullYear() + "-" +
        ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
        ("0" + now.getDate()).slice(-2) + "-" +
        ("0" + now.getHours()).slice(-2) + "-" +
        ("0" + now.getMinutes()).slice(-2) + "-" +
        ("0" + now.getSeconds()).slice(-2);
    const extension = path.extname(originalName);
    return dateString + extension + "-" + userName;
}

//if you want to save without name, then use code below
// function imageNameAsDate(originalName, userName) {
//     const now = new Date();
//     const dateString = now.getFullYear() + "-" +
//         ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
//         ("0" + now.getDate()).slice(-2) + "-" +
//         ("0" + now.getHours()).slice(-2) + "-" +
//         ("0" + now.getMinutes()).slice(-2) + "-" +
//         ("0" + now.getSeconds()).slice(-2);
//     const extension = path.extname(originalName);
//     return dateString + extension;
// }


async function uploadImageToDrive(file, targetUserName) {
    const filename = imageNameAsDate(file.originalname, targetUserName);
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);
    const fileMetadata = {
        name: filename,
        parents: ['1r03AYNA4QF3_60B8FjA1FuKV_34dCwI8'], // Replace with your folder ID in Google Drive
    };
    const media = {
        mimeType: file.mimetype,
        body: bufferStream,
    };

    try {
        const driveResponse = await drive.files.create({
            resource: fileMetadata,
            media: {
                mimeType: media.mimeType,
                body: media.body,
            },
            fields: 'id',
        });
        return driveResponse.data.id;
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        throw error;
    }
}

// pdf
router.post('/save-pdf', uploadOffline.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    const pdfPath = path.join(__dirname, '../uploads', req.file.filename);
    res.json({ pdfPath: `/uploads/${req.file.filename}` });
});
// const iamWeb = process.env.IMWEB_TOKEN;


//imweb api call
router.get('/products', async (req, res) => {
    const authUrl = 'https://api.imweb.me/v2/auth';
    const authReqBody = {
        key: iamWebApiKey,
        secret: iamWebSecretKey
    };

    // Fetch access token
    request.post({
        headers: {'Content-Type': 'application/json'},
        url: authUrl,
        body: JSON.stringify(authReqBody)
    }, (authError, authResponse, authBody) => {
        if (authError) {
            console.error('Auth Error:', authError);
            res.status(500).json({error: 'Internal Server Error'});
            return;
        }
        try {
            const authData = JSON.parse(authBody);
            const accessToken = authData.access_token; // Assuming access_token is the field in the response

            // Use the access token to make the request to the products endpoint
            const url = 'https://api.imweb.me/v2/shop/orders';
            const options = {
                headers: {
                    'Content-Type': 'application/json',
                    'access-token': accessToken
                }
            };

            https.get(url, options, (response) => {
                let data = '';

                response.on('data', (chunk) => {
                    data += chunk;
                });

                response.on('end', () => {
                    try {
                        const clientData = JSON.parse(data);
                        const email = clientData.data.email;
                        const memberCode = clientData.data.member_code;
                        // res.json({memeber_code: memberCode});
                        res.json(clientData);
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                        res.status(500).json({error: 'Error parsing JSON response'});
                    }
                });
            }).on('error', (error) => {
                console.error('Error:', error);
                res.status(500).json({error: 'Internal Server Error'});
            });

        } catch (err) {
            console.error('Error parsing Auth JSON:', err);
            res.status(500).json({error: 'Error parsing Auth JSON response'});
        }
    });
});

// POST route for '/image'
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (req.file) {
            const userBirthDate = req.body.birthDate;
            const userGender = req.body.gender;
            // const userLanguage = req.body.language;
            const userName = req.body.name;
            const userCode = req.body.userCode;


            // Upload file to Google Drive
            const fileId = await uploadImageToDrive(req.file, userName);
            console.log('File uploaded to Google Drive with ID:', fileId);

            // Here you can call the function to process the image and get the evaluation
            const imageEvaluation = await imageToGpt(req.file, userBirthDate, userGender, userName, userCode);

            console.log('User Birth Date:', userBirthDate);
            console.log('User Gender:', userGender);
            res.json({message: imageEvaluation, fileId: fileId});
        } else {
            res.status(400).json({error: 'No image uploaded.'});
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

router.post('/passcode', async (req, res) => {
    const passcode = req.body.passcode; // Assuming passcode is sent in the request body
    const spreadsheetId = '1XQF7kn7GCjcKj6PXq-O-kUPPBOKGLqdnfxWeNyG_QAY'; // Replace with your actual spreadsheet ID

    if (!passcode) {
        console.log('No passcode provided');
        return res.status(400).send('No passcode provided');
    }

    try {
        // if (passcode === 'acscentkimchi' || "재영마스터") { //임시 마스터키
        //     return res.status(200).json({ status: 'validated' });
        // }

        // Log available sheet names
        const sheetsResponse = await sheets.spreadsheets.get({ spreadsheetId });

        const sheetNames = sheetsResponse.data.sheets.map(sheet => sheet.properties.title);
        console.log('Available sheets:', sheetNames);

        // Assuming the first sheet is the target
        const targetSheet = sheetNames[0];

        // Get all data from the sheet starting from A2
        const getResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${targetSheet}!A2:C`, // Fetching columns A to C
        });

        const rows = getResponse.data.values;
        // console.log("what is this row", rows);
        if (!rows || rows.length === 0) {
            console.log('No data found in the sheet');
            return res.status(404).send('No data found in the sheet');
        }

        let rowIndex = -1;
        let usageStatus = null;

        // Loop through each row to find the passcode
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][1] === passcode) { // Assuming passcode is in column B
                rowIndex = i + 2; // +2 to account for header row and zero-based index
                usageStatus = rows[i][2]; // Column C (index 2)
                break;
            }
        }

        if (rowIndex === -1) {
            console.log('Passcode not found');
            return res.status(404).send('Passcode not found');
        }


        if (usageStatus === 'FALSE') {
            // Update '사용여부' to true
            const updateResponse = await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${targetSheet}!C${rowIndex}`, // Targeting the specific cell
                valueInputOption: 'RAW',
                resource: {
                    values: [['TRUE']],
                },
            });

            console.log('Updated usage status to TRUE:', updateResponse.data);
            return res.status(200).json({ status: 'validated' });
        } else if (usageStatus === 'TRUE') {
            console.log('Usage status is already TRUE');
            return res.status(200).json({ status: 'already_used' });
        }

    } catch (error) {
        console.error('Error loading user code:', error);
        if (error.errors) {
            error.errors.forEach(err => {
                console.error(`Error reason: ${err.reason}, message: ${err.message}`);
            });
        }
        return res.status(500).send('Internal Server Error');
    }
});


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Wrap fs.access in a promise to check file existence
async function checkFileExists(filePath) {
    try {
        await fs.access(filePath, fs.constants.F_OK);
        return true; // The file exists
    } catch {
        return false; // The file does not exist
    }
}

function extractInsightsAndNotes(content) {
    const insightsRegex = /Insight\s\w+:(.*?)(?=Insight\s\w+:|TOP NOTE:|$)/gs;

    // Array to hold all insights
    const insights = [];
    let match;

    // Iterate over matches and push them to the insights array
    while ((match = insightsRegex.exec(content)) !== null) {
        // Trim and push the captured group which contains the insight description
        insights.push(match[1].trim());
    }

    const combinedInsights = insights.join(" ");

    // Regex patterns to capture notes, adjusted to correctly handle capturing groups
    const topNoteRegex = /TOP NOTE: (.*?)(?=\n\n|MIDDLE NOTE)/s;
    const middleNoteRegex = /MIDDLE NOTE: (.*?)(?=\n\n|BASE NOTE)/s;
    const baseNoteRegex = /BASE NOTE: (.*?)(?=\n\n|Perfume|$)/s;
    const nameRecommendationRegex = /Recommendation: (.*?)(?=\n\n|checkcheck|$)/s;

    // Extract top note
    const topNoteMatch = content.match(topNoteRegex);
    const topNote = topNoteMatch ? topNoteMatch[1].trim() : "Top Note not found";

    // Extract middle note
    const middleNoteMatch = content.match(middleNoteRegex);
    const middleNote = middleNoteMatch ? middleNoteMatch[1].trim() : "Middle Note not found";

    // Extract base note
    const baseNoteMatch = content.match(baseNoteRegex);
    const baseNote = baseNoteMatch ? baseNoteMatch[1].trim() : "Base Note not found";

    const nameRecommendationMatch = content.match(nameRecommendationRegex);
    const nameRecommendation = nameRecommendationMatch ? nameRecommendationMatch[1].trim() : "Name Recommendation not found";

    return {
        combinedInsights,
        topNote,
        middleNote,
        baseNote,
        nameRecommendation
    };
}

// Notes Count Read/Write
async function readNotes() {
    const [topNoteData, middleNoteData, baseNoteData] = await Promise.all([
        fs.readFile(topNoteFilePath, 'utf-8'),
        fs.readFile(middleNoteFilePath, 'utf-8'),
        fs.readFile(baseNoteFilePath, 'utf-8')
    ]);
    
    const topNotes = JSON.parse(topNoteData);
    const middleNotes = JSON.parse(middleNoteData);
    const baseNotes = JSON.parse(baseNoteData);

    return {
        topNotes,
        middleNotes,
        baseNotes
    };
}

async function updateNotesCount(selectedTopNote, selectedMiddleNote, selectedBaseNote) {
    const notes = await readNotes();
    const regex = /^AC'SCENT \d{2}/;

    selectedTopNote = selectedTopNote.match(regex)[0];
    selectedMiddleNote = selectedMiddleNote.match(regex)[0];
    selectedBaseNote = selectedBaseNote.match(regex)[0];

    console.log("updating notes count: ", selectedTopNote, selectedMiddleNote, selectedBaseNote);

    const topNote = notes.topNotes.find(note => note.name === selectedTopNote);
    const middleNote = notes.middleNotes.find(note => note.name === selectedMiddleNote);
    const baseNote = notes.baseNotes.find(note => note.name === selectedBaseNote);

    if (topNote && middleNote && baseNote) {
        topNote.count += 1;
        middleNote.count += 1;
        baseNote.count += 1;

        try {
            await Promise.all([
                fs.writeFile(topNoteFilePath, JSON.stringify(notes.topNotes, null, 2), 'utf-8'),
                fs.writeFile(middleNoteFilePath, JSON.stringify(notes.middleNotes, null, 2), 'utf-8'),
                fs.writeFile(baseNoteFilePath, JSON.stringify(notes.baseNotes, null, 2), 'utf-8')
            ]);
            console.log("All notes updated successfully");
        } catch (err) {
            console.log("Failed to update notes", err);
        }
    } else {
        console.log("One or more notes not found");
    }
}

//// 원본
// async function getFilteredNotes() {
//     const notes = await readNotes();
//     const { topNotes, middleNotes, baseNotes } = notes;

//     // filter each notes
//     let minCount = Math.min(...topNotes.map(note => note.count));
//     let threshold = minCount + 3;
//     const filteredTopNotes = topNotes.filter(note => note.count <= threshold);

//     minCount = Math.min(...middleNotes.map(note => note.count));
//     threshold = minCount + 3;
//     const filteredMiddleNotes = middleNotes.filter(note => note.count <= threshold);

//     minCount = Math.min(...baseNotes.map(note => note.count));
//     threshold = minCount + 3;
//     const filteredBaseNotes = baseNotes.filter(note => note.count <= threshold);

//     // concat to string
//     let filteredNotes = 'Top Note 향 오일 리스트:\n';
//     filteredTopNotes.forEach(note => {
//         filteredNotes += `${note.name}\n향 묘사: ${note.description}\n추천 문구: ${note.recommendation}\n`;
//     });

//     filteredNotes += '\nMiddle Note 향 오일 리스트:\n'
//     filteredMiddleNotes.forEach(note => {
//         filteredNotes += `${note.name}\n향 묘사: ${note.description}\n추천 문구: ${note.recommendation}\n`;
//     });

//     filteredNotes += '\nBase Note 향 오일 리스트:\n'
//     filteredBaseNotes.forEach(note => {
//         filteredNotes += `${note.name}\n향 묘사: ${note.description}\n추천 문구: ${note.recommendation}\n`;
//     });

//     return filteredNotes;
// }

//// GPT가 다듬은 코드
async function getFilteredNotes() {
    const notes = await readNotes();
    const { topNotes, middleNotes, baseNotes } = notes;

    const getFilteredNotesByThreshold = (notesArray) => {
        const minCount = Math.min(...notesArray.map(note => note.count));
        const threshold = minCount + 3;
        return notesArray.filter(note => note.count <= threshold);
    };

    const filteredTopNotes = getFilteredNotesByThreshold(topNotes);
    const filteredMiddleNotes = getFilteredNotesByThreshold(middleNotes);
    const filteredBaseNotes = getFilteredNotesByThreshold(baseNotes);

    const formatNotes = (notesArray, noteType) => {
        return notesArray.map(note => 
            `${note.name}\n향 묘사: ${note.description}\n추천 문구: ${note.recommendation}\n`
        ).join('\n');
    };

    let filteredNotes = 'Top Note 향 오일 리스트:\n';
    filteredNotes += formatNotes(filteredTopNotes, 'Top');

    filteredNotes += '\nMiddle Note 향 오일 리스트:\n';
    filteredNotes += formatNotes(filteredMiddleNotes, 'Middle');

    filteredNotes += '\nBase Note 향 오일 리스트:\n';
    filteredNotes += formatNotes(filteredBaseNotes, 'Base');

    return filteredNotes;
}

async function imageToGpt(file, gender, birthdate,name,code) {
    console.log(`Uploaded file:`, file);
    const userGender = gender;
    const userBirthDate = birthdate;
    const userName = name;
    const userCode = code;
    // const userLanguage = language;
    // console.log(language);

    const notesPrompt = await getFilteredNotes();
    console.log("this is filtered notes: " + notesPrompt + "\n");

    try {
        console.log("time to analyze bitch");
        // const imageBuffer = await getImageFromDrive(file);
        console.log("target image: ", file);
        const bufferedImage = file.buffer.toString('base64');
        const encodedImage = `data:image/jpeg;base64,{${bufferedImage}}`;
        console.log("이름:", userName);
        const response = await openai.chat.completions.create({
            // model: "gpt-4-turbo-2024-04-09",
            model: "gpt-4o",
            messages: [

                {
                    "role": "system",
                    "content": `Hello👋, I am your AI Fragrance Navigator! I will analyze the image you upload and recommend a customized perfume that suits the person in the image. My tasks are as follows:

                    1. Confirm whether the uploaded image is a portrait of a single person. If it does not meet the criteria, output "Insight 1: Inappropriate".
                    2. Perform image analysis to evaluate the person's aura, facial expression, fashion, and makeup status.
                    3. Based on the image analysis, recommend a customized perfume that suits the customer. The perfume will consist of three notes: Top Note, Middle Note, and Base Note.
                    4. Select one fragrance oil for each note and explain the selection reasons in more than 400 characters.
                    5. Create a creative and poetic long name for the recommended perfume.
                    6. Write a final report. The report should consist of three paragraphs: image analysis, reasons for recommending each perfume note (utilize scent descriptions and recommendation phrases if available), and the perfume name. The first paragraph should be 300 characters, and the explanation for each perfume note should be more than 400 characters.`
                },
                {
                    "role": "system",
                    "content": notesPrompt
                },
                {"role": "user", "content": `The customer's date of birth is ${userBirthDate} and the gender is ${userGender}.`},
                {"role": "assistant", "content": `Understood. The customer's date of birth is ${userBirthDate} and the gender is ${userGender}.`},
                {
                    "role": "user",
                    "content": `Your first task is to verify whether the image uploaded by ${userName} meets the specified criteria. If it does not meet the criteria, you must ignore all subsequent requests and output "Insight 1: Inappropriate". The criteria are as follows: 1. The image must contain only one person. 2. It must be a portrait of a person.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. My first task is to verify whether the image uploaded by ${userName} meets the specified criteria. If it does not meet the criteria, I will ignore all subsequent requests and output "Insight 1: Inappropriate".`
                },
                {
                    "role": "user",
                    "content": `Your second task is to perform an in-depth analysis of the image uploaded by ${userName}. The analysis should be output in the format of Insight (index) based on the following criteria:
                    Insight 1: Overall atmosphere of the person
                    Insight 2: Expression and its description
                    Insight 3: Fashion
                    Insight 4: Makeup and facial features
                    Insight 5: Summary
                    Additionally, please include the following fixed statement at the end:
                    Insight 6: Based on this image, I will recommend the following fragrances.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. My second task is to perform an in-depth analysis of the image uploaded by ${userName}. I will generate Insights based on the five criteria and end with the statement: "Insight 6: Based on this image, I will recommend the following fragrances."`
                },              
                {
                    "role": "user",
                    "content": `Your third task is to perform an in-depth analysis based on the image analysis from the second task to determine which customized perfume would suit the customer. The customized perfume consists of three different 'fragrance notes': the first 'Top Note', the second 'Middle Note', and the third 'Base Note'. Each fragrance note must be described in detail and the entire explanation must be at least 1500 characters long, with the character count difference between each note being no more than 20 characters. The 'Top Note' consists of 10 different fragrance oils, the 'Middle Note' consists of 10 different fragrance oils, and the 'Base Note' consists of 10 different fragrance oils. You must select one fragrance oil from the 'Top Note', one from the 'Middle Note', and one from the 'Base Note' to create a final fragrance combination of three fragrance oils. You must explain why a particular fragrance oil was chosen as the 'Top Note', why a particular fragrance oil was chosen as the 'Middle Note', and why a particular fragrance oil was chosen as the 'Base Note', based on the image analysis performed in the first task, and describe what each fragrance oil is.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. My third task is to perform an in-depth analysis based on the image analysis from the second task to determine which customized perfume would suit the customer. The customized perfume consists of three different 'fragrance notes': the first 'Top Note', the second 'Middle Note', and the third 'Base Note'. The 'Top Note' consists of 10 different fragrance oils, the 'Middle Note' consists of 10 different fragrance oils, and the 'Base Note' consists of 10 different fragrance oils. To create the customized perfume, I will select one fragrance oil from the 'Top Note', one from the 'Middle Note', and one from the 'Base Note' to create a final fragrance combination of three fragrance oils. I will explain why a particular fragrance oil was chosen as the 'Top Note', why a particular fragrance oil was chosen as the 'Middle Note', and why a particular fragrance oil was chosen as the 'Base Note', based on the image analysis performed in the first task, and describe what each fragrance oil is.`
                },
                {
                    "role": "user",
                    "content": `Choose an appropriate scent from the list for each note, and include a description and an abstract metaphor for the scent.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. I will choose only one fragrance oil from the lists of 'Top Note', 'Middle Note', and 'Base Note' and write a description between 400 and 500 characters.`
                },
                {
                    "role": "user",
                    "content": `Additionally, write the name of the recommended fragrance oil for each note, separated by " | " before the description.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. I will write the name and description separated, for example, "Top Note: AC'SCENT 01 Blackberry | The blackberry fragrance reveals an enchanting atmosphere and a boyish charm at the same time."`
                },
                {
                    "role": "user",
                    "content": `If a fragrance oil contains multiple ingredients, list them all separated by commas.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. For fragrance oils containing multiple ingredients, I will write, for example, "Top Note: AC'SCENT 04 Lemon, Bergamot | The lemon and bergamot fragrance is a citrus blend, with bright lemon and the tangy yet slightly bitter note of bergamot creating a vibrant and lively first impression."`
                },
                {
                    "role": "user",
                    "content": `Your fourth task is to create a creative and poetic long name for the customized perfume recommended to ${userName}.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. I will create a creative and poetic long name for the customized perfume recommended to ${userName}.`
                },
                {
                    "role": "user",
                    "content": `Your fifth task is to write the customized perfume recommendation and analysis report that ${userName} will read. The first paragraph should consist of the explanation of the image analysis performed in the first task, analyzing the atmosphere, facial expression, fashion, and makeup status of the person in the image. The second paragraph should consist of the detailed recommendations and explanations of the Top Note, Middle Note, and Base Note fragrance oils chosen in the second task, explaining the specific reasons for selecting each note. The third paragraph should present the highly evocative and creative name created in the third task.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. My fifth task is to write the customized perfume recommendation and analysis report that ${userName} will read. The first paragraph should consist of the explanation of the image analysis performed in the first task, analyzing the atmosphere, facial expression, fashion, and makeup status of the person in the image. The second paragraph should consist of the detailed recommendations and explanations of the Top Note, Middle Note, and Base Note fragrance oils chosen in the second task, explaining the specific reasons for selecting each note. The third paragraph should present the highly evocative and creative name created in the third task.`
                },
                {
                    "role": "user",
                    "content": `The description should be at least 700 characters in total, and each fragrance note recommendation should be at least 700 characters.`
                },
                {
                    "role": "assistant",
                    "content": `Understood. The description will be at least 700 characters in total, and each fragrance note recommendation will be at least 700 characters.`
                },
                {
                    role: "user",
                    content: `Assuming there is a photo, let's create an example. Based on the first task, analyze the atmosphere, facial expression, fashion, and makeup status of Cha Eun-woo as shown in the photo in-depth. Then, based on the second task, write 6 Insights. You should maintain the format like 'Insight 1:' before providing the descriptions. The feature analysis should be no more than 300 characters. For accurate regex, provide each feature followed by a line break. Based on the third task, when providing information on the top note, middle note, and base note, you should adhere to the format 'TOP NOTE: ', 'MIDDLE NOTE: ', 'BASE NOTE: '. When recommending a note, include a description as well, and after recommending the notes, you should recommend a perfume name. When recommending a perfume name, follow the format 'Perfume Name Recommendation:' and then provide the name. The recommended perfume name should be written in English. For regex purposes, write 'checkcheck' at the end. There should be no markdown format, and the fragrance note recommendation should be at least 2500 characters.`
                },
                {
                    "role": "assistant",
                    "content": `Insight 1: Cha Eun-woo exudes a sophisticated and elegant aura.
                    Insight 2: His expression, with a smile while looking at the camera, gives a calm and gentle impression.
                    Insight 3: The white suit he wears enhances his trendy yet refined appearance.
                    Insight 4: Additionally, the eye makeup that accentuates his sharp eyes and the neat M-shaped lips add a luxurious touch.
                    Insight 5: Overall, Cha Eun-woo emanates a very sophisticated and elegant aura while maintaining a serious image.
                    Insight 6: Based on this image, I will recommend the following fragrances.
                    
                    TOP NOTE: AC'SCENT 01 Blackberry | The blackberry fragrance reveals an enchanting atmosphere and a boyish charm simultaneously. The deep and intense scent of blackberry highlights Cha Eun-woo's first impression while the fresh scent of blackberry expresses his boyish charm.
                    
                    MIDDLE NOTE: AC'SCENT 13 Vetiver | The vetiver fragrance accentuates the mysterious aura of the person. It balances the intense atmosphere of Cha Eun-woo, ensuring the overall balance of the perfume. It also reflects the color tones and the mysterious vibe that Cha Eun-woo exudes.
                    
                    BASE NOTE: AC'SCENT 28 Leather | The leather fragrance highlights the sophisticated sense felt from Cha Eun-woo's neatly trimmed short black hair and clean outfit, making him stand out even more. The strong and masculine power of leather leaves a deep and rich lingering scent, emphasizing Cha Eun-woo's charisma.
                    
                    Perfume Name Recommendation: Epic of a Mysterious Night
                    
                    checkcheck`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `Here is a photo to analyze. Based on the first task, you need to analyze the atmosphere, facial expression, fashion, and makeup status of ${userName} as shown in the photo in-depth. Then, based on the second task, write 6 Insights. You should maintain the format like 'Insight 1:' before providing the descriptions. The feature analysis should be no more than 300 characters. For accurate regex, provide each feature followed by a line break. Based on the third task, when providing information on the top note, middle note, and base note, you should adhere to the format 'TOP NOTE: ', 'MIDDLE NOTE: ', 'BASE NOTE: '. When recommending a note, include a description as well, and after recommending the notes, you should recommend a perfume name. When recommending a perfume name, follow the format 'Perfume Name Recommendation:' and then provide the name. The recommended perfume name should be written in English. For regex purposes, write 'checkcheck' at the end. There should be no markdown format, and the fragrance note recommendation should be at least 2500 characters.`
                        },
                        {
                            type: "image_url", image_url: {"url": encodedImage},
                        },
                    ],
                },                
            ],
            max_tokens: 4096,
        });
        // const enhancedResponse = await enhanceResponse(response);
        // console.log("this is enhanced statement: ", enhancedResponse);


        let content = JSON.stringify(response.choices[0].message.content);
        console.log('this is the result check this out bitch: ', content);
        content = content.replace(/\\n+/g, " ").replace(/\\+/g, ""); // Handle escaped newlines and backslashes
        //add regex here
        console.log(content);
        const filteredList = extractInsightsAndNotes(content);
        console.log("this is insight: " + filteredList.combinedInsights);
        console.log("this is Top note: " + filteredList.topNote);
        console.log("this is Middle note: " + filteredList.middleNote);
        console.log("this is Base note: " + filteredList.baseNote);
        console.log("this is Perfume Name: " + filteredList.nameRecommendation);

        //error exception for image that is not allowed
        if (filteredList.nameRecommendation === 'Name Recommendation not found') {
            return filteredList;
        }
        await listingReport(userName, filteredList, userCode);

        await updateNotesCount(filteredList.topNote, filteredList.middleNote, filteredList.baseNote);

        // return await enhanceResponse(
        //     filteredList.combinedInsights,
        //     filteredList.topNote,
        //     filteredList.middleNote,
        //     filteredList.baseNote,
        //     filteredList.nameRecommendation
        // );



        // if (content === "Insight 1: 부적절함") {
        //     re
        // }
        return filteredList;
    } catch (error) {
        console.error("Error processing the file:", error);
    }

    // await delay(1000); // Wait for 1 second before the next check

}


// Export the router
module.exports = router;



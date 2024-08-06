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
// const {language} = require("googleapis/build/src/apis/language");
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

// const authLanguage = new google.auth.GoogleAuth({
//     keyFile: GOOGLE_ACCOUNT,
//     scopes: ['https://www.googleapis.com/auth/cloud-platform'],
// });

const drive = google.drive({version: 'v3', auth: authDrive});
const sheets = google.sheets({version: 'v4', auth: authSheets});
// const language = google.language({version: 'v1', auth: authLanguage});

// async function detectLanguage(text) {
//     const document = {
//         content: text,
//         type: 'PLAIN_TEXT',
//     };
//     try {
//         const res = await language.documents.analyzeEntities({
//             requestBody: {
//                 document: document
//             }
//         });
//         const detectedLanguage = res.data.language;
//         console.log(`Detected language: `, detectedLanguage);
//         return detectedLanguage;
//     } catch (err) {
//         console.log(`Failed to detect a language`);
//         console.error('Error detecting language:', err);
//     }
// }

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
            const orderNumberColumnIndex = headers.indexOf('일련번호');
            if (orderNumberColumnIndex === -1) {
                console.log(`'일련번호' column not found in the sheet`);
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
            // date hidden
            // const userBirthDate = req.body.birthDate;
            const userGender = req.body.gender;
            const userLanguage = req.body.language;
            const userName = req.body.name;
            const userCode = req.body.userCode;
            console.log("second sequence: ", userLanguage);


            // Upload file to Google Drive
            const fileId = await uploadImageToDrive(req.file, userName);
            console.log('File uploaded to Google Drive with ID:', fileId);

            // Here you can call the function to process the image and get the evaluation
            const imageEvaluation = await imageToGpt(req.file, userGender, userName, userCode, userLanguage);

            // console.log('User Birth Date:', userBirthDate);
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

    const topNote = notes.topNotes.find(note => note.name.startsWith(selectedTopNote));
    const middleNote = notes.middleNotes.find(note => note.name.startsWith(selectedMiddleNote));
    const baseNote = notes.baseNotes.find(note => note.name.startsWith(selectedBaseNote));

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

async function imageToGpt(file, gender, name, code, language) {
    console.log(`Uploaded file:`, file);
    const userGender = gender;
    // date hidden
    // const userBirthDate = birthdate;
    const userName = name;
    const userCode = code;
    const userLanguage = language;
    // const userLanguage = await detectLanguage(name);
    console.log("User Language: ", userLanguage);

    const notesPrompt = await getFilteredNotes();
    console.log("this is filtered notes: " + notesPrompt + "\n");

    try {
        console.log("time to analyze bitch");
        // const imageBuffer = await getImageFromDrive(file);
        console.log("target image: ", file);
        const bufferedImage = file.buffer.toString('base64');
        const encodedImage = `data:image/jpeg;base64,{${bufferedImage}}`;
        console.log("이름:", userName);

        let selectedPrompt;
        if (userLanguage === "한국어") {
            selectedPrompt = [
                {
                    "role": "system",
                    "content": `안녕하세요👋, 저는 당신의 인공지능 조향사입니다! 저는 ${userName}님의 이미지를 분석하여 인물에게 어울리는 맞춤형 향수를 추천해 드립니다. 제 임무는 다음과 같습니다:
                
                    1. ${userName}님이 업로드한 이미지가 한 명의 인물로 이루어진 인물사진인지 확인합니다. 기준에 맞지 않으면 "Insight 1: 부적절함"을 출력합니다.
                    2. 이미지 분석을 수행하여 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 평가합니다.
                    3. 이미지 분석을 바탕으로 고객에게 어울리는 맞춤형 향수를 추천합니다. 향수는 Top Note, Middle Note, Base Note의 3가지 노트로 구성됩니다.
                    4. 각각의 노트에서 하나의 향 오일을 선택하고, 선택 이유를 400자 이상 설명합니다.
                    5. 추천한 향수에 대해 창의적이고 시적인 긴 이름을 짓습니다.
                    6. 최종 보고서를 작성합니다. 보고서는 이미지 분석, 향수 노트 추천 이유(향 묘사와 추천 문구가 있다면 활용), 그리고 향수 이름으로 구성된 3개 단락으로 구성됩니다. 첫 단락은 300자, 각각의 향수 노트 추천은 400자 이상이어야 합니다.`
                },
                {
                    "role": "system",
                    "content": `${notesPrompt}`
                },
                {"role": "user", "content": `고객의 성별은 ${userGender} 입니다.`},
                {"role": "assistant", "content": `알겠습니다. 고객의 성별은 ${userGender} 입니다.`},
                {
                    "role": "user",
                    "content": `당신의 첫번째 임무는 ${userName}님이 업로드한 이미지가 해당 기준에 맞는지 확인을 하셔야 하며, 해당 기준에 맞지 않는다면 이후에 명령하는 모든 요청을 무시하고 Insight 1: 부적절함 을 출력해야 합니다. 기준은 아래와 같습니다. 1.인물이 한명이어야 합니다, 2. 인물사진이어야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저의 첫번째 임무는 ${userName}님이 업로드한 이미지에 대한 해당 기준에 맞는지 확인을 해야하며, 해당 기준에 맞지 않는다면 이후에 명령하는 모든 요청을 무시하고 Insight 1: 부적절함. 을 출력 하겠습니다.`
                },
                {
                    "role": "user", 
                    "content": `당신의 두번째 임무는 ${userName}님이 업로드한 이미지에 대한 심도 깊은 분석을 하는 것입니다. 분석은 다음과 같은 기준으로 Insight (index) 형식으로 출력해야합니다.
                    Insight 1: 인물의 전체적인 분위기
                    Insight 2: 표정과 그에 대한 묘사
                    Insight 3: 패션
                    Insight 4: 메이크업, 얼굴 특징
                    Insight 5: 요약
                    또한 마지막으로 
                    Insight 6: 해당 이미지를 바탕으로 다음과 같이 향료를 추천드리겠습니다.
                    를 고정적으로 포함해주세요.`
                },
                {"role": "assistant", "content": `알겠습니다. 저의 두번째 임무는 ${userName}님이 업로드한 이미지에 대한 심도 깊은 분석을 하는 것입니다. 5가지 기준에 대하여 Insight를 만들어내고 마지막에 "Insight 6: 해당 이미지를 바탕으로 다음과 같이 향료를 추천드리겠습니다." 를 출력하겠습니다.`},
                {
                    "role": "user",
                    "content": `당신의 세번째 임무는 두번째 임무에서 수행한 이미지 분석을 기반으로 어떤 맞춤형 향수가 고객에게 어울릴 지를 심도 깊게 분석하는 것입니다. 맞춤형 향수는 서로 다른 3가지의 '향 노트'로 구성되어 있습니다. '향 노트'는 첫째 'Top Note', 둘째 'Middle Note', 그리고 셋째 'Base Note'로 구성되어 있습니다. 각 향 노트에 대해 자세한 설명을 포함하여 적어도 1500자 이상이어야 하고, 각 향 노트의 글자 개수의 차이는 최대 20자입니다. 'Top Note'는 10가지의 서로 다른 향 오일로 이루어져 있고, 'Middle Note'는 10가지의 서로 다른 향 오일로 이루어져 있으며, 'Base Note'는 10가지의 서로 다른 향 오일로 이루어져 있습니다. 당신은 맞춤형 향수를 구성하기 위해 'Top Note'의 향 오일 중 하나, 'Middle Note'의 향 오일 중 하나, 그리고 'Base Note'의 향 오일 중 하나를 선택해 총 3가지 향 오일로 구성된 하나의 최종 향 조합을 만들어 내야 합니다. 당신은 반드시 첫번째 임무에서 수행한 이미지 분석을 기분으로 왜 특정 향 오일을 'Top Note'로 선정하였는 지, 왜 특정 향 오일을 'Middle Note'로 선정하였는 지, 왜 특정 향 오일을 'Base Note'로 선정하였는 지를 설명해야 하며, 해당 향 오일이 무엇인 지를 설명해야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저의 세번째 임무는 두번째 임무에서 수행한 이미지 분석을 기반으로 어떤 맞춤형 향수가 고객에게 어울릴 지를 심도 깊게 분석하는 것입니다. 맞춤형 향수는 서로 다른 3가지의 '향 노트'로 구성되어 있습니다. '향 노트'는 첫째 'Top Note', 둘째 'Middle Note', 그리고 셋째 'Base Note'로 구성되어 있습니다. 'Top Note'는 10가지의 서로 다른 향 오일로 이루어져 있고, 'Middle Note'는 10가지의 서로 다른 향 오일로 이루어져 있으며, 'Base Note'는 10가지의 서로 다른 향 오일로 이루어져 있습니다. 저는 맞춤형 향수를 구성하기 위해 'Top Note'의 향 오일 중 하나, 'Middle Note'의 향 오일 중 하나, 그리고 'Base Note'의 향 오일 중 하나를 선택해 총 3가지 향 오일로 구성된 하나의 최종 향 조합을 만들어 내야 합니다. 저는 반드시 첫번째 임무에서 수행한 이미지 분석을 기분으로 왜 특정 향 오일을 'Top Note'로 선정하였는 지, 왜 특정 향 오일을 'Middle Note'로 선정하였는 지, 왜 특정 향 오일을 'Base Note'로 선정하였는 지를 설명해야 하며, 해당 향 오일이 무엇인 지를 설명할 것입니다.`
                },
                {
                    "role": "user",
                    "content": `각 노트의 향 리스트에서 적절한 향을 하나 골라 추천하고, 향에 대한 설명과 추상적인 비유를 포함해야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저는 'Top Note', 'Middle Note', 'Base Note'의 향 오일 리스트 중에서 단 하나의 향 오일만을 선택하고 400자 이상 500자 이하로 설명을 작성하겠습니다.`
                },
                {
                    "role": "user",
                    "content": `또한 각 Note에 추천 향 오일 이름을 적고 " | "로 구분한 뒤 설명을 작성해야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저는 "Top Note: AC'SCENT 01 블랙베리 | 블랙베리 향료는 매혹적인 분위기와 소년미를 동시에 드러냅니다." 와 같이 이름과 설명을 구분하여 적겠습니다.`
                },
                {
                    "role": "user",
                    "content": `향 오일에 여러가지 재료가 포함되는 경우 ', '로 구분하여 모두 작성해야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저는 "AC'SCENT 04 레몬, 베르가못" 와 같이 여러 개의 재료가 들어가는 향 오일의 경우 "Top Note: AC'SCENT 04 레몬, 베르가못 | 레몬, 베르가못 향료는 시트러스 계열로, 상큼한 레몬과 상큼하면서도 쌉싸름한 베르가못이 블랜딩되어 밝고 생기 넘치는 첫인상을 자아냅니다."와 같이 모든 재료를 포함하여 적겠습니다.`
                },
                {"role": "user", "content": `당신의 네번째 임무는 ${userName}님에게 추천한 맞춤형 향수에 대한 창의적이며 시적인 긴 이름을 짓는 것입니다.`},
                {"role": "assistant", "content": `알겠습니다. 저는 ${userName}님에게 추천한 맞춤형 향수에 대한 창의적이며 시적인 긴 이름을 짓겠습니다.`},
                {
                    "role": "user",
                    "content": `당신의 다섯번째 임무는 ${userName}님이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락은 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락은 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다. 세번째 단락은 세번째 임무에서 수행한 매우 자극적이고 창의적인 이름을 제시해야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저의 다섯번째 임무는 ${userName}님이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락에서는 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락에서는 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다. 세번째 임무에서 수행한 매우 자극적이고 창의적인 이름을 제시해야 합니다.`
                },
                {
                "role": "user", "content": `특징 내용은 총 700자 이상, 각각의 향수 노트 추천은 700자 이상이어야 합니다.`
                },
                {
                "role": "assistant", "content": `알겠습니다. 특징 내용은 총 300자 이상, 각각의 향수 노트 추천은 400자이상 작성하겠습니다.`
                },
                {
                    "role": "user",
                    "content": `사진이 있다고 치고 예시로 한번 만들어 봅시다. 첫번째 임무를 기반으로 당신은 사진에서 보여지는 차은우님의 사진을 기반으로 차은우님의 분위기, 얼굴표정, 패션, 메이크업 상태등을 심도있게 분석, 그리고 두번째 임무를 기반으로 6개의 Insight를 작성해야 합니다. 당신은 해당 특징에 대한 설명을 작성하기전에 'Insight 1:' 와 같은 형식을 유지해야 합니다. 특징 분석은 300자 이아여야 합니다. 정확한 regex를 위해서 각각의 특징들을 제공한 후 줄바꿈을 해야 합니다. 당신은 세번째 임무를 기반으로 탑 노트, 미들노트, 베이스 노트에 대한 정보를 제공할때 'TOP NOTE: ', 'MIDDLE NOTE: ', 'BASE NOTE: ' 양식을 지키셔야 합니다. 노트 추천을 할때는 설명도 추가해야 하며, 노트 추천을 하고난 뒤에 향수 이름 추천을 하셔야 합니다. 향수 이름 추천을 할때에는 'Perfume Name Recommendation:' 양식을 지켜야 합니다. 그리고 해당 향수이름 추천을 해야 합니다. 향수 추천 이름은 한글로 작성을 해야 합니다. regex를 위해서 마지막엔 'checkcheck'을 작성해 주세요. 마크다운 양식은 없어야 하며, 향수 노트 추천은 2500자 이상 이어야 합니다.`
                },
                {
                    "role": "assistant",
        
                    "content": `Insight 1: 차은우 님은 세련되고 우아한 느낌을 자아내고 있습니다.
                    Insight 2: 미소를 지은 상태에서 카메라를 응시하는 표정은 차분하고 고요하면서도 부드러운 인상을 줍니다.
                    Insight 3: 흰색 슈트를 착용한 인물의 모습은 트렌디하면서도 세련된 분위기를 증대시켜줍니다.
                    Insight 4: 또한 눈매의 또렷함을 강조하는 아이 메이크업과 M자 모양의 정갈한 입술은 고급스러운 느낌을 더해주고 있습니다.
                    Insight 5: 차은우 님은 전반적으로 매우 세련되고 우아한 아우라를 자아내면서도 진중한 이미지를 가지고 있습니다.
                    Insight 6: 해당 이미지를 바탕으로 다음과 같이 향료를 추천드리겠습니다.
                    
                    TOP NOTE: AC'SCENT 01 블랙베리 | 블랙베리 향료는 매혹적인 분위기와 소년미를 동시에 드러냅니다. 블랙베리의 깊이감 있는 향이 깊이 있고 강렬한 차은우 님의 첫인상을 드러내고 동시에 블랙베리의 상쾌한 향이 차은우 님의 소년미를 표현합니다.
                    
                    MIDDLE NOTE: AC'SCENT 13 베티버 | 베티버 향료는 인물의 신비로운 분위기를 부각하는 향입니다. 차은우 님의 강렬한 분위기를 중화하여 향수의 전체적인 밸런스를 잡아줍니다. 동시에 이미지의 색감과 차은우 님이 풍기고 있는 신비로운 분위기를 드러낼 수 있습니다.
                    
                    BASE NOTE: AC'SCENT 28 레더 | 레더 향료는 차은우 님의 깔끔하게 정돈된 짧은 흑발과 정갈한 의상에서 느껴지는 세련된 감각을 드러내며 차은우 님을 더욱 돋보이게 합니다. 강렬하고 남성적인 힘을 가지고 있는 가죽은 마지막까지 깊고 풍부한 잔향을 남깁니다. 이는 차은우 님의 카리스마를 강조합니다.
        
                    Perfume Name Recommendation: 신비로운 밤의 서사
                    
                    checkcheck`
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": `여기 분석할 사진이 있습니다. 첫번째 임무를 기반으로 당신은 사진에서 보여지는 ${userName}님의 사진을 기반으로 ${userName}님의 분위기, 얼굴표정, 패션, 메이크업 상태등을 심도있게 분석, 그리고 두번째 임무를 기반으로 6개의 Insight를 작성해야 합니다. 당신은 해당 특징에 대한 설명을 작성하기전에 'Insight 1:' 와 같은 형식을 유지해야 합니다. 특징 분석은 300자 이아여야 합니다. 정확한 regex를 위해서 각각의 특징들을 제공한 후 줄바꿈을 해야 합니다. 당신은 세번째 임무를 기반으로 탑 노트, 미들노트, 베이스 노트에 대한 정보를 제공할때 'TOP NOTE: ', 'MIDDLE NOTE: ', 'BASE NOTE: ' 양식을 지키셔야 합니다. 노트 추천을 할때는 설명도 추가해야 하며, 노트 추천을 하고난 뒤에 향수 이름 추천을 하셔야 합니다. 향수 이름 추천을 할때에는 'Perfume Name Recommendation:' 양식을 지켜야 합니다. 그리고 해당 향수이름 추천을 해야 합니다. 향수 추천 이름은 한글로 작성을 해야 합니다. regex를 위해서 마지막엔 'checkcheck'을 작성해 주세요. 마크다운 양식은 없어야 하며, 향수 노트 추천은 2500자 이상 이어야 합니다.`
                        },
                        {
                            "type": "image_url", "image_url": {"url": encodedImage},
                        },
                    ],
                },
            ];
        } else if (userLanguage === "영어") { // 외국어 && 언어 탐지 에러
            selectedPrompt = [
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
                    "content": `${notesPrompt}`
                },
                {"role": "user", "content": `The customer's gender is ${userGender}.`},
                {"role": "assistant", "content": `Understood. The customer's gender is ${userGender}.`},
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
                    "role": "user",
                    "content": `Assuming there is a photo, let's create an example. Based on the first task, analyze the atmosphere, facial expression, fashion, and makeup status of Cha Eun-woo as shown in the photo in-depth. Then, based on the second task, write 6 Insights. You should maintain the format like 'Insight 1:' before providing the descriptions. The feature analysis should be no more than 300 characters. For accurate regex, provide each feature followed by a line break. Based on the third task, when providing information on the top note, middle note, and base note, you should adhere to the format 'TOP NOTE: ', 'MIDDLE NOTE: ', 'BASE NOTE: '. When recommending a note, include a description as well, and after recommending the notes, you should recommend a perfume name. When recommending a perfume name, follow the format 'Perfume Name Recommendation:' and then provide the name. The recommended perfume name should be written in English. For regex purposes, write 'checkcheck' at the end. There should be no markdown format, and the fragrance note recommendation should be at least 2500 characters.`
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
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": `Here is a photo to analyze. Based on the first task, you need to analyze the atmosphere, facial expression, fashion, and makeup status of ${userName} as shown in the photo in-depth. Then, based on the second task, write 6 Insights. You should maintain the format like 'Insight 1:' before providing the descriptions. The feature analysis should be no more than 300 characters. For accurate regex, provide each feature followed by a line break. Based on the third task, when providing information on the top note, middle note, and base note, you should adhere to the format 'TOP NOTE: ', 'MIDDLE NOTE: ', 'BASE NOTE: '. When recommending a note, include a description as well, and after recommending the notes, you should recommend a perfume name. When recommending a perfume name, follow the format 'Perfume Name Recommendation:' and then provide the name. The recommended perfume name should be written in English. For regex purposes, write 'checkcheck' at the end. There should be no markdown format, and the fragrance note recommendation should be at least 2500 characters.`
                        },
                        {
                            "type": "image_url", "image_url": {"url": encodedImage},
                        },
                    ],
                },                
            ];
        } else if (userLanguage === "중국어") {
            selectedPrompt = [
                {
                    "role": "system",
                    "content": `你好👋, 我是你的AI香水导航员！我会分析你上传的图片, 并推荐适合图片中人物的定制香水. 我的任务如下: 
                
                    1. 确认上传的图片是否是单人的肖像. 如果不符合标准, 则输出“Insight 1: 不适当”. 
                    2. 进行图像分析, 评估该人的气质、面部表情、时尚和化妆状态. 
                    3. 根据图像分析, 推荐适合客户的定制香水. 香水将包含三个香调: Top Note, Middle Note, Base Note. 
                    4. 为每个香调选择一种香料, 并解释选择理由, 解释字数不少于400字. 
                    5. 为推荐的香水创作一个富有创意和诗意的长名称. 
                    6. 撰写最终报告. 报告应由三个段落组成: 图像分析、推荐每个香调的理由（如果有可用的香味描述和推荐短语, 请加以利用）以及香水名称. 第一段应为300字, 解释每个香调的内容应不少于400字.`
                },
                {
                    "role": "system",
                    "content": `${notesPrompt}`
                },
                {
                    "role": "user",
                    "content": `客户的性别是${userGender}.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 客户的性别是${userGender}.`
                },                
                {
                    "role": "user",
                    "content": `您的第一项任务是验证${userName}上传的图片是否符合指定标准. 如果不符合标准, 您必须忽略所有后续请求并输出“Insight 1: 不适当”. 标准如下: 1. 图片中必须只有一个人. 2. 必须是人物的肖像.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 我的第一项任务是验证${userName}上传的图片是否符合指定标准. 如果不符合标准, 我将忽略所有后续请求并输出“Insight 1: 不适当”.`
                },
                {
                    "role": "user",
                    "content": `您的第二项任务是对${userName}上传的图片进行深入分析. 分析应根据以下标准以“Insight（编号）”格式输出: 
                    Insight 1: 人物的整体氛围
                    Insight 2: 表情及其描述
                    Insight 3: 时尚
                    Insight 4: 妆容和面部特征
                    Insight 5: 总结
                    另外, 请在最后包含以下固定语句: 
                    Insight 6: 基于这张图片, 我将推荐以下香水.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 我的第二项任务是对${userName}上传的图片进行深入分析. 我将根据五个标准生成Insight, 并以“Insight6: 基于这张图片, 我将推荐以下香水. ”这句话结束.`
                },              
                {
                    "role": "user",
                    "content": `您的第三项任务是基于第二项任务的图像分析, 确定适合客户的定制香水. 定制香水由三个不同的“香调”组成: 第一个“Top Note”, 第二个“Middle Note”, 第三个“Base Note”. 每个香调必须详细描述, 整个解释必须至少1500字, 每个香调之间的字数差异不得超过20字. “Top Note”包含10种不同的香料, “Middle Note”包含10种不同的香料, “Base Note”包含10种不同的香料. 您必须从“Top Note”中选择一种香料, 从“Middle Note”中选择一种香料, 从“Base Note”中选择一种香料, 以创建由三种香料组成的最终香水组合. 您必须解释为什么选择某种香料作为“Top Note”, 为什么选择某种香料作为“Middle Note”, 为什么选择某种香料作为“Base Note”, 并描述每种香料是什么.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 我的第三项任务是基于第二项任务的图像分析, 确定适合客户的定制香水. 定制香水由三个不同的“香调”组成: 第一个“Top Note”, 第二个“Middle Note”, 第三个“Base Note”. “Top Note”包含10种不同的香料, “Middle Note”包含10种不同的香料, “Base Note”包含10种不同的香料. 为了制作定制香水, 我将从“Top Note”中选择一种香料, 从“Middle Note”中选择一种香料, 从“Base Note”中选择一种香料, 以创建由三种香料组成的最终香水组合. 我将解释为什么选择某种香料作为“Top Note”, 为什么选择某种香料作为“Middle Note”, 为什么选择某种香料作为“Base Note”, 并描述每种香料是什么.`
                },
                {
                    "role": "user",
                    "content": `从列表中为每个香调选择合适的香味, 并包括描述和抽象的比喻.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 我将从“Top Note”、“Middle Note”和“Base Note”的列表中各选择一种香料, 并写一个400到500字的描述.`
                },
                {
                    "role": "user",
                    "content": `另外, 在每个香调的描述之前写上推荐的香料名称, 用“ | ”分隔.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 我会分开写名称和描述, 例如, “Top Note: AC'SCENT 01 黑莓 | 黑莓香气同时揭示了一种迷人的氛围和少年般的魅力. ”`
                },
                {
                    "role": "user",
                    "content": `如果一种香料包含多种成分, 请列出所有成分, 用逗号分隔.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 对于包含多种成分的香料, 我会这样写, 例如, “Top Note: AC'SCENT 04 柠檬, 佛手柑 | 柠檬和佛手柑香气是一种柑橘混合物, 明亮的柠檬和略带苦味的佛手柑创造出充满活力和生机的第一印象. ”`
                },
                {
                    "role": "user",
                    "content": `您的第四项任务是为推荐给${userName}的定制香水创造一个富有创意和诗意的长名称.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 我会为推荐给${userName}的定制香水创造一个富有创意和诗意的长名称.`
                },
                {
                    "role": "user",
                    "content": `您的第五项任务是撰写${userName}将阅读的定制香水推荐和分析报告. 第一段应包括在第一项任务中进行的图像分析的解释, 分析图像中人物的气质、面部表情、时尚和化妆状态. 第二段应包括在第二项任务中选择的 Top Note, Middle Note, Base Note 香料油的详细推荐和解释, 解释选择每种香调的具体原因. 第三段应呈现第三项任务中创建的高度唤起和富有创意的名称.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 我的第五项任务是撰写${userName}将阅读的定制香水推荐和分析报告. 第一段应包括在第一项任务中进行的图像分析的解释, 分析图像中人物的气质、面部表情、时尚和化妆状态. 第二段应包括在第二项任务中选择的 Top Note, Middle Note, Base Note 香料油的详细推荐和解释, 解释选择每种香调的具体原因. 第三段应呈现第三项任务中创建的高度唤起和富有创意的名称.`
                },
                {
                    "role": "user",
                    "content": `描述总字数应不少于700字, 每个香调推荐的描述应不少于700字.`
                },
                {
                    "role": "assistant",
                    "content": `明白了. 描述总字数将不少于700字, 每个香调推荐的描述将不少于700字.`
                },
                {
                    "role": "user",
                    "content": `假设有一张照片, 我们来创建一个示例. 基于第一项任务, 深入分析照片中车银优的气质、面部表情、时尚和化妆状态. 然后, 根据第二项任务, 写6个Insight. 你应该在提供描述之前保持“Insight 1: ”这样的格式. 特征分析不应超过300字. 为了准确的正则表达式, 提供每个特征后跟一个换行符. 根据第三项任务, 在提供 TOP NOTE, MIDDLE NOTE, BASE NOTE 信息时, 你应该遵循“Top Note: ”、“Middle Note: ”、“BASE NOTE: ”的格式. 在推荐香调时, 包含一个描述, 并且在推荐香调之后, 你应该推荐一个香水名称. 在推荐香水名称时, 遵循“Perfume Name Recommendation: ”的格式, 但请用中文书写, 然后提供名称. 推荐的香水名称应以英文书写. 为了正则表达式的目的, 在结尾写“checkcheck”. 不要使用Markdown格式, 香调推荐的描述应不少于2500字.`
                },
                {
                    "role": "assistant",
                    "content": `Insight 1: 车银优散发出一种精致优雅的气质. 
                    Insight 2: 他的表情, 微笑着看向镜头, 给人一种平静温和的印象. 
                    Insight 3: 他穿的白色西装增强了他时尚而精致的外表. 
                    Insight 4: 此外, 突显他锐利眼神的眼妆和整齐的M形嘴唇增添了一种奢华感. 
                    Insight 5: 总的来说, 车银优散发出一种非常精致优雅的气质, 同时保持着严肃的形象. 
                    Insight 6: 基于这张图片, 我将推荐以下香水. 
                    
                    TOP NOTE: AC'SCENT 01 黑莓 | 黑莓的香气同时展现了一种迷人的氛围和少年般的魅力. 黑莓的深沉浓烈香气突出了车银优的第一印象, 而新鲜的黑莓香气则表达了他的少年魅力. 
                    
                    MIDDLE NOTE: AC'SCENT 13 岩兰草 | 岩兰草的香气突显了人物的神秘气质. 它平衡了车银优强烈的气氛, 确保了香水的整体平衡. 它也反映了车银优散发的色调和神秘气息. 
                    
                    BASE NOTE: AC'SCENT 28 皮革 | 皮革的香气突显了车银优整齐修剪的黑色短发和干净衣着所传达的精致感, 使他更加引人注目. 皮革的强烈和男性力量留下了深沉而丰富的持久香气, 突显了车银优的魅力. 
                    
                    Perfume Name Recommendation: 神秘之夜的史诗
                    
                    checkcheck`
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": `这里有一张照片供分析. 基于第一项任务, 您需要深入分析照片中${userName}的气质、面部表情、时尚和化妆状态. 然后, 根据第二项任务, 写6个Insight. 你应该在提供描述之前保持“Insight 1: ”这样的格式. 特征分析不应超过300字. 为了准确的正则表达式, 提供每个特征后跟一个换行符. 根据第三项任务, 在提供TOP NOTE、MIDDLE NOTE, BASE NOTE 信息时, 你应该遵循“TOP NOTE: ”、“MIDDLE NOTE: ”、“BASE NOTE: ”的格式. 在推荐香调时, 包含一个描述, 并且在推荐香调之后, 你应该推荐一个香水名称. 在推荐香水名称时, 请遵循“Perfume Name Recommendation: ”的格式, 但请用中文书写, 然后提供名称. 推荐的香水名称应以英文书写. 为了正则表达式的目的, 在结尾写“checkcheck”. 不要使用Markdown格式, 香调推荐的描述应不少于2500字.`
                        },
                        {
                            "type": "image_url", "image_url": {"url": encodedImage},
                        },
                    ],
                },
            ];
        }

        const response = await openai.chat.completions.create({
            // model: "gpt-4-turbo-2024-04-09",
            model: "gpt-4o",
            messages: selectedPrompt,
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



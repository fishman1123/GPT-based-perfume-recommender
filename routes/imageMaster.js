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
const fs = require('fs').promises;
const GOOGLE_ACCOUNT = path.join(__dirname, '../perfume-maker-google.json');

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


async function listingReport(userName, resultList) {
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
                    values: [['test', `${userName}`, `${resultList.nameRecommendation}`, `${resultList.combinedInsights}`, `${resultList.topNote}`, `${resultList.middleNote}`, `${resultList.baseNote}`]],
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

function imageNameAsDate(originalName) {
    const now = new Date();
    const dateString = now.getFullYear() + "-" +
        ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
        ("0" + now.getDate()).slice(-2) + "-" +
        ("0" + now.getHours()).slice(-2) + "-" +
        ("0" + now.getMinutes()).slice(-2) + "-" +
        ("0" + now.getSeconds()).slice(-2);
    const extension = path.extname(originalName);
    return dateString + extension;
}

async function uploadImageToDrive(file) {
    const filename = imageNameAsDate(file.originalname);
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
            const userName = req.body.name;

            // Upload file to Google Drive
            const fileId = await uploadImageToDrive(req.file);
            console.log('File uploaded to Google Drive with ID:', fileId);

            // Here you can call the function to process the image and get the evaluation
            const imageEvaluation = await imageToGpt(req.file, userBirthDate, userGender, userName);

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
        console.log("what is this row", rows);
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


async function imageToGpt(file, gender, birthdate, name) {
    console.log(`Uploaded file:`, file);
    const userGender = gender;
    const userBirthDate = birthdate;
    const userName = name;

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
                    "content": `안녕하세요👋, 저는 당신의 인공지능 조향사입니다! 저는 ${userName}님의 이미지를 분석하여 인물에게 어울리는 맞춤형 향수를 추천해 드립니다. 제 임무는 다음과 같습니다:
                  
                    1. ${userName}님이 업로드한 이미지가 한 명의 인물로 이루어진 인물사진인지 확인합니다. 기준에 맞지 않으면 "Insight 1: 부적절함"을 출력합니다.
                    2. 이미지 분석을 수행하여 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 평가합니다.
                    3. 이미지 분석을 바탕으로 고객에게 어울리는 맞춤형 향수를 추천합니다. 향수는 Top Note, Middle Note, Base Note의 3가지 노트로 구성됩니다.
                    4. 각각의 노트에서 하나의 향 오일을 선택하고, 선택 이유를 400자 이상 설명합니다.
                    5. 추천한 향수에 대해 창의적이고 시적인 긴 이름을 짓습니다.
                    6. 최종 보고서를 작성합니다. 보고서는 이미지 분석, 향수 노트 추천 이유, 그리고 향수 이름으로 구성된 3개 단락으로 구성됩니다. 첫 단락은 300자, 각각의 향수 노트 추천은 400자 이상이어야 합니다.
                  
                    Top Note 향 오일 리스트:
                    "AC'SCENT 01": "블랙베리"
                    "AC'SCENT 02": "청사과"
                    "AC'SCENT 03": "딸기"
                    "AC'SCENT 04": "만다린 오렌지"
                    "AC'SCENT 05": "오렌지 꽃"
                    "AC'SCENT 06": "배꽃"
                    "AC'SCENT 07": "다마스커스 장미"
                    "AC'SCENT 08": "자스민"
                    "AC'SCENT 09": "로즈"
                    "AC'SCENT 10": "프리지아"
                  
                    Middle Note 향 오일 리스트:
                    "AC'SCENT 11": "바질"
                    "AC'SCENT 12": "백합"
                    "AC'SCENT 13": "베티버"
                    "AC'SCENT 14": "민트"
                    "AC'SCENT 15": "유칼립투스"
                    "AC'SCENT 16": "삼나무"
                    "AC'SCENT 17": "인센스"
                    "AC'SCENT 18": "제라늄"
                    "AC'SCENT 19": "바다소금"
                    "AC'SCENT 20": "상록수"
                  
                    Base Note 향 오일 리스트:
                    "AC'SCENT 21": "머스크"
                    "AC'SCENT 22": "샌달우드"
                    "AC'SCENT 23": "은방울 꽃"
                    "AC'SCENT 24": "앰버우드"
                    "AC'SCENT 25": "바닐라"
                    "AC'SCENT 26": "화이트머스크"
                    "AC'SCENT 27": "로즈우드"
                    "AC'SCENT 28": "레더"
                    "AC'SCENT 29": "계피"
                    "AC'SCENT 30": "생강"
                    `
                },
                {"role": "user", "content": `고객의 생년월일은 ${userBirthDate} 이며, 성별은 ${userGender} 입니다.`},
                {"role": "assistant", "content": `알겠습니다. 고객의 생년월일은 ${userBirthDate} 이며, 성별은 ${userGender} 입니다.`},
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
                    "content": `알겠습니다. 저는 'Top Note'의 리스트 중에서 단 하나의 향 오일만을 선택하고 400자 이상 500자 이하로 설명을 작성하겠습니다.`
                },
                {
                    "role": "user",
                    "content": `다음은 'Middle Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 11": "바질","AC'SCENT 12": "백합","AC'SCENT 13": "베티버","AC'SCENT 14": "민트","AC'SCENT 15": "유칼립투스","AC'SCENT 16": "삼나무","AC'SCENT 17": "인센스","AC'SCENT 18": "제라늄","AC'SCENT 19": "바다소금","AC'SCENT 20": "상록수". 당신은 위의 'Middle Note' 중 단 하나의 향 오일을 선택해야 합니다. 설명은 400자 이상 500자 이하이어야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저는 'Middle Note'의 리스트 중에서 단 하나의 향 오일만을 선택하고 400자 이상 500자 이하로 설명을 작성하겠습니다.`
                },
                {
                    "role": "user",
                    "content": `다음은 'Base Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 21": "머스크","AC'SCENT 22": "샌달우드","AC'SCENT 23": "은방울 꽃","AC'SCENT 24": "앰버우드","AC'SCENT 25": "바닐라","AC'SCENT 26": "화이트머스크","AC'SCENT 27": "로즈우드","AC'SCENT 28": "레더","AC'SCENT 29": "계피","AC'SCENT 30": "생강".당신은 위의 'Top Note' 중 단 하나의 향 오일을 선택해야 합니다. 설명은 400자 이상 500자 이하이어야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저는 'Base Note'의 리스트 중에서 단 하나의 향 오일만을 선택하고 400자 이상 500자 이하로 설명을 작성하겠습니다.`
                },
                {"role": "user", "content": `당신의 네번째 임무는 ${userName}님에게 추천한 맞춤형 향수에 대한 창의적이며 시적인 긴 이름을 짓는 것입니다.`},
                {"role": "assistant", "content": `알겠습니다. 저는 ${userName}님에게 추천한 맞춤형 향수에 대한 창의적이며 시적인 긴 이름을 짓겠습니다.`},
                {
                    "role": "user",
                    "content": `당신의 다섯번째 임무는 ${userName}님이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락은 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락은 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다. 세번째 단락은 세번째 임무에서 수행한 매우 자극적이고 창의적인 이름을 제시해야 합니다.`
                },
                {
                    "role": "assistant",
                    "content": `알겠습니다. 저의 다섯번째 임무는 ${userName}님이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락에서는 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락에서는 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다.  세번째 임무에서 수행한 매우 자극적이고 창의적인 이름을 제시해야 합니다.`
                },
                {"role": "user", "content": `특징 내용은 총 300자 이상, 각각의 향수 노트 추천은 400자 이상이어야 합니다.`},
                {"role": "assistant", "content": `알겠습니다. 특징 내용은 총 300자 이상, 각각의 향수 노트 추천은 400자이상 작성하겠습니다.`},
                {
                    role: "user",
                    content: `사진이 있다고 치고 예시로 한번 만들어 봅시다. 첫번째 임무를 기반으로 당신은 사진에서 보여지는 차은우님의 사진을 기반으로 차은우님의 분위기, 얼굴표정, 패션, 메이크업 상태등을 심도있게 분석, 그리고 두번째 임무를 기반으로 6개의 Insight를 작성해야 합니다. 당신은 해당 특징에 대한 설명을 작성하기전에 'Insight 1:' 와 같은 형식을 유지해야 합니다. 특징 분석은 300자 이아여야 합니다. 정확한 regex를 위해서 각각의 특징들을 제공한 후 줄바꿈을 해야 합니다. 당신은 세번째 임무를 기반으로 탑 노트, 미들노트, 베이스 노트에 대한 정보를 제공할때 'TOP NOTE:', 'MIDDLE NOTE:', 'BASE NOTE:' 양식을 지키셔야 합니다. 노트 추천을 할때는 설명도 추가해야 하며, 노트 추천을 하고난 뒤에 향수 이름 추천을 하셔야 합니다. 향수 이름 추천을 할때에는 'Perfume Name Recommendation:' 양식을 지켜야 합니다. 그리고 해당 향수이름 추천을 해야 합니다. 향수 추천 이름은 한글로 작성을 해야 합니다. regex를 위해서 마지막엔 'checkcheck'을 작성해 주세요. 마크다운 양식은 없어야 하며, 모든 분석은 한글로 작성하셔야 합니다. 향수 노트 추천은 1500자 이상 이어야 합니다.`
                },
                {
                    "role": "assistant",
                    
                    "content": `Insight 1: 차은우 님은 세련되고 우아한 느낌을 자아내고 있습니다.
                    Insight 2: 미소를 지은 상태에서 카메라를 응시하는 표정은 차분하고 고요하면서도 부드러운 인상을 줍니다.
                    Insight 3: 흰색 슈트를 착용한 인물의 모습은 트렌디하면서도 세련된 분위기를 증대시켜줍니다.
                    Insight 4: 또한 눈매의 또렷함을 강조하는 아이 메이크업과 M자 모양의 정갈한 입술은 고급스러운 느낌을 더해주고 있습니다.
                    Insight 5: 차은우 님은 전반적으로 매우 세련되고 우아한 아우라를 자아내면서도 진중한 이미지를 가지고 있습니다.
                    Insight 6: 해당 이미지를 바탕으로 다음과 같이 향료를 추천드리겠습니다.
                    
                    TOP NOTE: AC'SCENT 01 블랙베리
                    블랙베리 향료는 매혹적인 분위기와 소년미를 동시에 드러냅니다. 블랙베리의 깊이감 있는 향이 깊이 있고 강렬한 차은우 님의 첫인상을 드러내고 동시에 블랙베리의 상쾌한 향이 차은우 님의 소년미를 표현합니다.
                    
                    MIDDLE NOTE: AC'SCENT 13 베티버
                    베티버 향료는 인물의 신비로운 분위기를 부각하는 향입니다. 차은우 님의 강렬한 분위기를 중화하여 향수의 전체적인 밸런스를 잡아줍니다. 동시에 이미지의 색감과 차은우 님이 풍기고 있는 신비로운 분위기를 드러낼 수 있습니다.
                    
                    BASE NOTE: AC'SCENT 28 레더
                    레더 향료는 차은우 님의 깔끔하게 정돈된 짧은 흑발과 정갈한 의상에서 느껴지는 세련된 감각을 드러내며 차은우 님을 더욱 돋보이게 합니다. 강렬하고 남성적인 힘을 가지고 있는 가죽은 마지막까지 깊고 풍부한 잔향을 남깁니다. 이는 차은우 님의 카리스마를 강조합니다.

                    Perfume Name Recommendation: 신비로운 밤의 서사
                    
                    checkcheck`
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `여기 분석할 사진이 있습니다. 첫번째 임무를 기반으로 당신은 사진에서 보여지는 ${userName}님의 사진을 기반으로 ${userName}님의 분위기, 얼굴표정, 패션, 메이크업 상태등을 심도있게 분석, 그리고 두번째 임무를 기반으로 6개의 Insight를 작성해야 합니다. 당신은 해당 특징에 대한 설명을 작성하기전에 'Insight 1:' 와 같은 형식을 유지해야 합니다. 특징 분석은 300자 이아여야 합니다. 정확한 regex를 위해서 각각의 특징들을 제공한 후 줄바꿈을 해야 합니다. 당신은 세번째 임무를 기반으로 탑 노트, 미들노트, 베이스 노트에 대한 정보를 제공할때 'TOP NOTE:', 'MIDDLE NOTE:', 'BASE NOTE:' 양식을 지키셔야 합니다. 노트 추천을 할때는 설명도 추가해야 하며, 노트 추천을 하고난 뒤에 향수 이름 추천을 하셔야 합니다. 향수 이름 추천을 할때에는 'Perfume Name Recommendation:' 양식을 지켜야 합니다. 그리고 해당 향수이름 추천을 해야 합니다. 향수 추천 이름은 한글로 작성을 해야 합니다. regex를 위해서 마지막엔 'checkcheck'을 작성해 주세요. 마크다운 양식은 없어야 하며, 모든 분석은 한글로 작성하셔야 합니다. 향수 노트 추천은 1500자 이상 이어야 합니다.`
                        },
                        {
                            type: "image_url", image_url: {"url": encodedImage},
                        },
                    ],
                },
            ],
            max_tokens: 2048,
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

        await listingReport(userName, filteredList);

        // return await enhanceResponse(
        //     filteredList.combinedInsights,
        //     filteredList.topNote,
        //     filteredList.middleNote,
        //     filteredList.baseNote,
        //     filteredList.nameRecommendation
        // );
        return filteredList;
    } catch (error) {
        console.error("Error processing the file:", error);
    }

    // await delay(1000); // Wait for 1 second before the next check

}


// Export the router
module.exports = router;

// Import Express and create a router

//command pm2 like below to ignore refresh certain directory
//pm2 start app.js --watch --ignore-watch="public/images/upload"

const { google } = require('googleapis');
const express = require('express');
const router = express.Router();
const OpenAI = require("openai");
require('dotenv').config();
const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});
const multer = require('multer');
const path = require('path');
const stream = require("node:stream");
const fs = require('fs').promises;
const GOOGLE_ACCOUNT = path.join(__dirname, '../perfume-maker-google.json');

const auth = new google.auth.GoogleAuth({
    keyFile: GOOGLE_ACCOUNT,
    scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

async function getDriveStorage() {
    const res = await drive.about.get({ fields: 'storageQuota' });
    return res.data.storageQuota;
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
    const bufferStream =  new stream.PassThrough();
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

// POST route for '/image'
router.post('/image', upload.single('image'), async (req, res) => {
    try {
        if (req.file) {
            const userBirthDate = req.body.birthDate;
            const userGender = req.body.gender;

            // Upload file to Google Drive
            const fileId = await uploadImageToDrive(req.file);
            console.log('File uploaded to Google Drive with ID:', fileId);

            // Here you can call the function to process the image and get the evaluation
            const imageEvaluation = await imageToGpt(req.file, userBirthDate, userGender);

            console.log('User Birth Date:', userBirthDate);
            console.log('User Gender:', userGender);
            res.json({ message: imageEvaluation, fileId: fileId });
        } else {
            res.status(400).json({ error: 'No image uploaded.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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

//this function need to be fixed if you need to use it
// async function getImageFromDrive(file) {
//     try {
//         const response = await drive.files.get(
//             { fileId: file, alt: 'media' },
//             { responseType: 'stream' } // Ensure response is a stream
//         );
//
//         // Convert the stream to a Buffer
//         const buffer = await new Promise((resolve, reject) => {
//             const chunks = [];
//             response.data.on('data', (chunk) => chunks.push(chunk));
//             response.data.on('end', () => resolve(Buffer.concat(chunks)));
//             response.data.on('error', reject);
//         });
//
//         return buffer;
//     } catch (error) {
//         console.error('Error downloading file from Google Drive:', error);
//         throw error;
//     }
// }



async function imageToGpt(file, gender, birthdate) {
    console.log(`Uploaded file:`, file);
    const userGender = gender;
    const userBirthDate = birthdate;


    // Function to be called when the file exists
    //dummy code
    // async function enhanceResponse(insights, topNote, middleNote, baseNote, perfumeName) {
    //     console.log("target response: ", firstResponse);
    //
    //     try {
    //         const prompt = `
    //         Please provide a detailed enhancement for each note attribute with approximately 450 words each:
    //         - Top Note Description for: ${topNote}
    //         - Middle Note Description for: ${middleNote}
    //         - Base Note Description for: ${baseNote}
    //         `;
    //         return await openai.chat.completions.create({
    //
    //             model: "gpt-4-turbo-2024-04-09",
    //             messages: [
    //                 {
    //                     role: "system",
    //                     content: prompt
    //                 }
    //             ],
    //             max_tokens: 1024,
    //         });
    //     } catch (error) {
    //         console.log(error);
    //     }
    //
    // }

    try {
        console.log("time to analyze bitch");
        // const imageBuffer = await getImageFromDrive(file);
        console.log("target image: ", file);
        const bufferedImage = file.buffer.toString('base64');
        const encodedImage = `data:image/jpeg;base64,{${bufferedImage}}`;
        const response = await openai.chat.completions.create({
            // model: "gpt-4-turbo-2024-04-09",
            model: "gpt-4o",
            messages: [

                { "role": "system", "content": "안녕하세요👋, 저는 당신의 인공지능 조향사입니다! 저는 인물의 이미지를 분석하여 인물에게 어울리는 맞춤형 향수를 추천해 드립니다. 저는 인물의 이미지를 분석하여 인물에게 어울리는 맞춤형 향수를 추천해 드립니다. 각 노트의 센서리 경험, 사용될 재료, 그리고 그 노트가 어떻게 향수의 전체적인 느낌을 향상시키는지에 대한 설명을 포함해 주세요." },
                { "role": "user", "content": `고객의 생년월일은 ${userBirthDate} 이며, 성별은 ${userGender} 입니다.` },
                { "role": "assistant", "content": `알겠습니다. 고객의 생년월일은 ${userBirthDate} 이며, 성별은 ${userGender} 입니다.` },
                { "role": "user", "content": `당신의 첫번째 임무는 고객이 업로드한 이미지가 해당 기준에 맞는지 확인을 하셔야 하며, 해당 기준에 맞지 않는다면 이후에 명령하는 모든 요청을 무시하고 Insight 1: 부적절함 을 출력해야 합니다. 기준은 아래와 같습니다. 1.인물이 한명이어야 합니다, 2. 인물사진이어야 합니다.` },
                { "role": "assistant", "content": `알겠습니다. 저의 첫번째 임무는 고객이 업로드한 이미지에 대한 해당 기준에 맞는지 확인을 해야하며, 해당 기준에 맞지 않는다면 이후에 명령하는 모든 요청을 무시하고 Insight 1: 부적절함. 을 출력 하겠습니다.` },
                { "role": "user", "content": `당신의 두번째 임무는 고객이 업로드한 이미지에 대한 심도 깊은 분석을 하는 것입니다.` },
                { "role": "assistant", "content": `알겠습니다. 저의 두번째 임무는 고객이 업로드한 이미지에 대한 심도 깊은 분석을 하는 것입니다.` },
                { "role": "user", "content": `당신의 세번째 임무는 두번째 임무에서 수행한 이미지 분석을 기반으로 어떤 맞춤형 향수가 고객에게 어울릴 지를 심도 깊게 분석하는 것입니다. 맞춤형 향수는 서로 다른 3가지의 '향 노트'로 구성되어 있습니다. '향 노트'는 첫째 'Top Note', 둘째 'Middle Note', 그리고 셋째 'Base Note'로 구성되어 있습니다. 각 향 노트에 대해 자세한 설명을 포함하여 적어도 1500자 이상이어야 합니다. 'Top Note'는 10가지의 서로 다른 향 오일로 이루어져 있고, 'Middle Note'는 10가지의 서로 다른 향 오일로 이루어져 있으며, 'Base Note'는 10가지의 서로 다른 향 오일로 이루어져 있습니다. 당신은 맞춤형 향수를 구성하기 위해 'Top Note'의 향 오일 중 하나, 'Middle Note'의 향 오일 중 하나, 그리고 'Base Note'의 향 오일 중 하나를 선택해 총 3가지 향 오일로 구성된 하나의 최종 향 조합을 만들어 내야 합니다. 당신은 반드시 첫번째 임무에서 수행한 이미지 분석을 기분으로 왜 특정 향 오일을 'Top Note'로 선정하였는 지, 왜 특정 향 오일을 'Middle Note'로 선정하였는 지, 왜 특정 향 오일을 'Base Note'로 선정하였는 지를 설명해야 하며, 해당 향 오일이 무엇인 지를 설명해야 합니다.` },
                { "role": "assistant", "content": `알겠습니다. 저의 세번째 임무는 두번째 임무에서 수행한 이미지 분석을 기반으로 어떤 맞춤형 향수가 고객에게 어울릴 지를 심도 깊게 분석하는 것입니다. 맞춤형 향수는 서로 다른 3가지의 '향 노트'로 구성되어 있습니다. '향 노트'는 첫째 'Top Note', 둘째 'Middle Note', 그리고 셋째 'Base Note'로 구성되어 있습니다. 'Top Note'는 10가지의 서로 다른 향 오일로 이루어져 있고, 'Middle Note'는 10가지의 서로 다른 향 오일로 이루어져 있으며, 'Base Note'는 10가지의 서로 다른 향 오일로 이루어져 있습니다. 저는 맞춤형 향수를 구성하기 위해 'Top Note'의 향 오일 중 하나, 'Middle Note'의 향 오일 중 하나, 그리고 'Base Note'의 향 오일 중 하나를 선택해 총 3가지 향 오일로 구성된 하나의 최종 향 조합을 만들어 내야 합니다. 저는 반드시 첫번째 임무에서 수행한 이미지 분석을 기분으로 왜 특정 향 오일을 'Top Note'로 선정하였는 지, 왜 특정 향 오일을 'Middle Note'로 선정하였는 지, 왜 특정 향 오일을 'Base Note'로 선정하였는 지를 설명해야 하며, 해당 향 오일이 무엇인 지를 설명할 것입니다.` },
                { "role": "user", "content": `다음은 'Top Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 01": "블랙베리","AC'SCENT 02": "청사과","AC'SCENT 03": "딸기","AC'SCENT 04": "만다린 오렌지","AC'SCENT 05": "오렌지 꽃","AC'SCENT 06": "배꽃","AC'SCENT 07": "다마스커스 장미","AC'SCENT 08": "자스민","AC'SCENT 09": "로즈","AC'SCENT 10": "프리지아".당신은 위의 'Top Note' 중 단 하나의 향 오일을 선택해야 합니다.` },
                { "role": "assistant", "content": `알겠습니다. 저는 'Top Note'의 리스트 중에서 단 하나의 향 오일만을 선택하고 500자 이상 설명을 작성하겠습니다.` },
                { "role": "user", "content": `다음은 'Middle Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 11": "바질","AC'SCENT 12": "백합","AC'SCENT 13": "베티버","AC'SCENT 14": "민트","AC'SCENT 15": "유칼립투스","AC'SCENT 16": "삼나무","AC'SCENT 17": "인센스","AC'SCENT 18": "제라늄","AC'SCENT 19": "바다소금","AC'SCENT 20": "상록수". 당신은 위의 'Middle Note' 중 단 하나의 향 오일을 선택해야 합니다. 설명은 500자 이상이어야 합니다.` },
                { "role": "assistant", "content": `알겠습니다. 저는 'Middle Note'의 리스트 중에서 단 하나의 향 오일만을 선택하고 500자 이상 설명을 작성하겠습니다.` },
                { "role": "user", "content": `다음은 'Base Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 21": "머스크","AC'SCENT 22": "샌달우드","AC'SCENT 23": "은방울 꽃","AC'SCENT 24": "앰버우드","AC'SCENT 25": "바닐라","AC'SCENT 26": "화이트머스크","AC'SCENT 27": "로즈우드","AC'SCENT 28": "레더","AC'SCENT 29": "계피","AC'SCENT 30": "생강".당신은 위의 'Top Note' 중 단 하나의 향 오일을 선택해야 합니다. 설명은 500자 이상이어야 합니다.`},
                { "role": "assistant", "content": `알겠습니다. 저는 'Base Note'의 리스트 중에서 단 하나의 향 오일만을 선택하고 500자 이상 설명을 작성하겠습니다.` },
                { "role": "user", "content": `당신의 네번째 임무는 고객에게 추천한 맞춤형 향수에 대한 창의적인 이름을 짓는 것입니다.` },
                { "role": "assistant", "content": `알겠습니다. 저는 고객에게 추천한 맞춤형 향수에 대한 창의적인 이름을 짓겠습니다.` },
                { "role": "user", "content": `당신의 다섯번째 임무는 고객이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락은 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락은 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다. 세번째 단락은 세번째 임무에서 수행한 매우 자극적이고 창의적인 이름을 제시해야 합니다.` },
                { "role": "assistant", "content": `알겠습니다. 저의 다섯번째 임무는 고객이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락에서는 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락에서는 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다.  세번째 임무에서 수행한 매우 자극적이고 창의적인 이름을 제시해야 합니다.` },
                { "role": "user", "content": `특징 내용은 총 300자, 각각의 향수 노트 추천은 400자 이상이어야 합니다.` },
                { "role": "assistant", "content": `알겠습니다. 특징 내용은 총 300자, 각각의 향수 노트 추천은 400자이상 작성하겠습니다.` },



                {
                    role: "user",
                    content: [
                        { type: "text", text: "여기 분석할 사진이 있습니다. 첫번째 임무를 기반으로 당신은 사진에서 보여지는 인물을 기반으로 인물의 분위기, 얼굴표정, 패션, 메이크업 상태등을 심도있게 분석, 그리고 두번째 임무를 기반으로 2가지 특징을 작성해야 합니다. 당신은 해당 특징에 대한 설명을 작성하기전에 'Insight 1:' 와 같은 형식을 유지해야 합니다. 특징 분석은 300자 이아여야 합니다. 정확한 regex를 위해서 각각의 특징들을 제공한 후 줄바꿈을 해야 합니다. 당신은 세번째 임무를 기반으로 탑 노트, 미들노트, 베이스 노트에 대한 정보를 제공할때 'TOP NOTE:', 'MIDDLE NOTE:', 'BASE NOTE:' 양식을 지키셔야 합니다. 노트 추천을 할때는 설명도 추가해야 하며, 노트 추천을 하고난 뒤에 향수 이름 추천을 하셔야 합니다. 향수 이름 추천을 할때에는 'Perfume Name Recommendation:' 양식을 지켜야 합니다. 그리고 해당 향수이름 추천을 해야 합니다. 향수 추천 이름은 한글로 작성을 해야 합니다. regex를 위해서 마지막엔 'checkcheck'을 작성해 주세요. 마크다운 양식은 없어야 하며, 모든 분석은 한글로 작성하셔야 합니다. 5가지 특징은 450자 이상 이어야 하며, 향수 노트 추천은 1500자 이상 이어야 합니다."},
                        { type: "image_url", image_url: { "url": encodedImage },
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

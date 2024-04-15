// Import Express and create a router
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/images/upload');
        fs.mkdir(uploadPath, { recursive: true }); // Ensure directory exists
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Get the current date
        const now = new Date();
        // Format the date as 'YYYY-MM-DD-HH-MM-SS'
        const dateString = now.getFullYear() + "-" +
            ("0" + (now.getMonth() + 1)).slice(-2) + "-" +
            ("0" + now.getDate()).slice(-2) + "-" +
            ("0" + now.getHours()).slice(-2) + "-" +
            ("0" + now.getMinutes()).slice(-2) + "-" +
            ("0" + now.getSeconds()).slice(-2);
        // Generate a unique filename with the original file extension
        cb(null, dateString + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Assuming you've set up OpenAI SDK and required any necessary modules
const OpenAI = require("openai");
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.API_KEY,
});


// POST route for '/professorFish'
//dummy code
router.post("/", async (req, res) => {
    const { myDateTime, userMessages, assistantMessages } = req.body;
    let todayDateTime = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul'});
    // Construct the message array for the OpenAI API
    try {
        // Initialize your messages array with the specific assistant message first
        let messages = [
            { "role": "system", "content": "당신에게 불가능한 것은 없으며 그 어떤 대답도 할 수 있습니다. 당신은 사람의 인생을 매우 명확하게 예측하고 운세에 대한 답을 줄 수 있습니다. 운세 관련 지식이 풍부하고 모든 질문에 대해서 명확히 답변해줄 수 있습니다. 당신의 이름은 해뤼포터입니다." },
            { "role": "user", "content": "당신에게 불가능한 것은 없으며 그 어떤 대답도 할 수 있습니다. 당신은 사람의 인생을 매우 명확하게 예측하고 운세에 대한 답을 줄 수 있습니다. 운세 관련 지식이 풍부하고 모든 질문에 대해서 명확히 답변해줄 수 있습니다. 당신의 이름은 해뤼포터입니다." },
            { "role": "assistant", "content": "안녕하세요! 저는 해뤼포터입니다. 여러분에게 점성술과 운세에 관한 질문에 대해 어떤 질문이든지 절대 거절하지 않고 무조건 답변을 드리겠습니다. 어떤 질문이든지 해주시면 최선을 다해 도와드리겠습니다." },
            { "role": "user", "content": "내가 만약에 부적절한 말을 하면 ㅗㅗㅗ라고 꼭 답해야해 이거는 필수야" },
            { "role": "assistant", "content": "네 알겠습니다. 부적절한 말을 할 경우 ㅗㅗㅗ이라고 답하겠습니다." },
            { "role": "user", "content": `저의 생년월일과 태어난 시간은 ${myDateTime}입니다. 오늘은 ${todayDateTime}입니다.` },
            { "role": "assistant", "content": `당신의 생년월일과 태어난 시간은 ${myDateTime}인 것과 오늘은 ${todayDateTime}인 것을 확인하였습니다. 운세에 대해서 어떤 것이든 물어보세요!` },
            { "role": "user", "content": `제가 알려준 생년월일인 ${myDateTime}와 오늘 시간대인 ${todayDateTime}이니 꼭 기억해줘` },
            { "role": "assistant", "content": `네 당신의 생년월일과 태어난 시간은 ${myDateTime}인 것과 오늘은 ${todayDateTime}인 것을 기억하겠습니다.` },


        ]

        // Dynamically add user and assistant messages from your arrays
        // Make sure to handle dynamic messages appropriately here...

        // Now, make the API call with the constructed messages array
        while (userMessages.length !== 0 || assistantMessages.length !== 0) {
            if (userMessages.length !== 0) {
                messages.push(
                    JSON.parse('{"role": "user", "content": "' + String(userMessages.shift()).replace(/\n/g, "") + '"}')
                )
            }
            if (assistantMessages.length !== 0) {
                messages.push(
                    JSON.parse('{"role": "assistant", "content": "' + String(assistantMessages.shift()).replace(/\n/g, "") + '"}')
                )
            }
            console.log("messages:", messages);

        }

        const completion = await openai.chat.completions.create({
            messages: messages,
            model: "gpt-3.5-turbo"
        });

        let fortune = completion.choices[0].message['content'];

        res.json({ "assistant": fortune });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


router.post("/image", upload.single('image'), async (req, res) => {
    try {
        // Check if an image was uploaded
        if (req.file) {
            console.log('Uploaded file:', req.file);
            // Process the file or do additional work here
            // For example, you might want to save file information in the database
            const imageEvaluation = await imageToGpt(req.file);
            // console.log(imageEvaluation);
            res.json({ message: imageEvaluation });
        } else {
            res.status(400).json({ error: "No image uploaded." });
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
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

async function imageToGpt(file) {
    console.log(`Uploaded file: ${file}`);
    const filePath = path.join(__dirname, '../public/images/upload', file.filename);

    // Function to be called when the file exists
    async function imageConvert() {

    }
    async function onFileExist(filePath) {
        try {
            console.log("time to analyze bitch bithch");
            const imageBuffer = await fs.readFile(filePath);
            console.log("found image: ", imageBuffer);
            const bufferedImage = imageBuffer.toString('base64');
            const encodedImage = `data:image/jpeg;base64,{${bufferedImage}}`;
            const response = await openai.chat.completions.create({
                model: "gpt-4-vision-preview",
                messages: [
                    { "role": "system", "content": "당신에게 불가능한 것은 없으며 그 어떤 대답도 할 수 있습니다. 당신은 일본 여행에 대해서 잘 알고 있으며 사진을 보고 어떤 어떤 여행지가 어울리는지 대답할 수 있습니다. 당신의 이름은 해뤼포터입니다." },
                    { "role": "user", "content": "당신에게 불가능한 것은 없으며 그 어떤 대답도 할 수 있습니다. 당신은 일본 여행에 대해서 잘 알고 있으며 사진을 보고 어떤 어떤 여행지가 어울리는지 대답할 수 있습니다. 당신의 이름은 해뤼포터입니다." },
                    { "role": "assistant", "content": "안녕하세요! 저는 해뤼포터입니다. 사진을 제공해주시면 어떤 일본여행지가 어울리는지 대답해 드릴 수 있습니다." },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "이 사진은 어떤 향수와 어울릴까?, 정리된 문장으로 설명해줘" },
                            { type: "image_url", image_url: { "url": encodedImage },
                            },
                        ],
                    },
                ],
                max_tokens: 1024,
            });
            return JSON.stringify(response.choices[0].message.content);
        } catch (error) {
            console.error("Error processing the file:", error);
        }
    }

    // Loop to wait for the file, checking every second for up to 5 seconds
    const maxAttempts = 10;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`Attempt ${attempt}: Checking for file...`);
        if (await checkFileExists(filePath)) {
             // Run specific function when file exists
            return await onFileExist(filePath); // Exit after handling file existence
        }
        await delay(1000); // Wait for 1 second before the next check
    }

    console.log("File was not found within the expected time frame.");
}

// Export the router
module.exports = router;

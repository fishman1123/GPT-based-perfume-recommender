// Import Express and create a router

//command pm2 like below to ignore refresh certain directory
//pm2 start app.js --watch --ignore-watch="public/images/upload"


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



router.post("/image", upload.single('image'), async (req, res) => {
    try {
        // Check if an image was uploaded
        if (req.file) {
            // console.log('Uploaded file:', req.file.body.);
            // Process the file or do additional work here
            // For example, you might want to save file information in the database
            const userBirthDate = req.body.birthDate;
            const userGender = req.body.gender;
            const imageEvaluation = await imageToGpt(req.file , userBirthDate, userGender);
            // console.log(imageEvaluation);

            console.log("heyhey: " + userBirthDate);
            console.log(userGender);
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



async function imageToGpt(file, gender, birthdate) {
    console.log(`Uploaded file: ${file}`);
    const filePath = path.join(__dirname, '../public/images/upload', file.filename);
    const userGender = gender;
    const userBirthDate = birthdate;

    // Function to be called when the file exists
    async function enhanceResponse(insight) {
        console.log("target response: " + insight);
        try {
            const secondResponse = await openai.chat.completions.create({
                model: "gpt-3.5-turbo-0125",
                messages: [
                    { "role": "system", "content": "안녕하세요👋, 저는 당신의 인공지능 분석가입니다! 저는 인물에게 어울리는 맞춤형 향수 분석 문장을 기반으로 더 자세한 설명을 해드리겠습니다." },
                    { "role": "user", "content": `고객에 대한 향수 분석내용은 ${insight}입니다. 해당 내용을 450자 이상 작성하여 더 상세하게 설명하세요.` },
                ],
                max_tokens: 1024,
            });
            let enhancedResponse= JSON.stringify(secondResponse.choices[0].message.content);
            console.log("enhanced answer:", enhancedResponse);
            return enhancedResponse;
        } catch (error) {
            console.log(error);
        }

    }
    async function onFileExist(filePath) {
        try {
            console.log("time to analyze bitch");
            const imageBuffer = await fs.readFile(filePath);
            console.log("found image: ", imageBuffer);
            const bufferedImage = imageBuffer.toString('base64');
            const encodedImage = `data:image/jpeg;base64,{${bufferedImage}}`;
            const response = await openai.chat.completions.create({
                model: "gpt-4-turbo-2024-04-09",
                messages: [
                    // { "role": "system", "content": "👋I am your AC’SCENT AI Perfumer, James! Please upload an image of a person that you’d like to analyze for a custom perfume." },
                    // { "role": "user", "content": `Your first task is to offer a deep-dive analysis of the image that the customer has uploaded.` },
                    // { "role": "assistant", "content": `ok, my first task is to offer a deep-dive analysis of the image that the customer has uploaded.` },
                    // { "role": "user", "content": `Your second task is to offer a deep-dive consultation to which custom perfume may best suit the customer based on the image analysis that you’ve completed on the first task. A custom perfume consists of three different ingredients, the first one being ‘Top Note’, second ‘Middle Note’, and third ‘Base Note’. Top note consists of 10 different perfume oils, middle note consists of 10 different perfume oils, and base note consists of 10 different perfume oils. You must choose one of each perfume oils in each category of ingredients(Top note, middle note, base note) to come up with a final combination of 3 different perfume oils for a single custom perfume. Ensure that you provide a detailed explanation of why you chose a certain ingredient and what that ingredient is.` },
                    // { "role": "assistant", "content": `my second task is to offer a deep-dive consultation to which custom perfume may best suit the customer based on the image analysis that I’ve completed on the first task. A custom perfume consists of three different ingredients, the first one being ‘Top Note’, second ‘Middle Note’, and third ‘Base Note’. Top note consists of 10 different perfume oils, middle note consists of 10 different perfume oils, and base note consists of 10 different perfume oils. I must choose one of each perfume oils in each category of ingredients(Top note, middle note, base note) to come up with a final combination of 3 different perfume oils for a single custom perfume. Ensure that I provide a detailed explanation of why I chose a certain ingredient and what that ingredient is.` },
                    // { "role": "user", "content": `here's top note list. “Blackberry and Bay”: “Blackberry, Laurel Leaf, Cedarwood”,“Bombshell”: “Green apple, Peony / Blueberry, Orchid, Vanilla / Fig, Musk”,“Mont Paris”: “Bergamot, Strawberry, Raspberry / Orange Flower Absolute, Jasmine Absolute, White Peony / Patchouli, White Musk”,“Neoli Portofino”: “Bergamot, Mandarin Orange, Lemon, Lavender, Rosemary, Bitter Orange / African Orange, Neroli, Jasmine / Amber, Ambrette”,“Eau De Sens”: “Bitter Orange, Citrus / Orange Flower, Juniper Berry / Patchouli, Angelica”,“Nashi Blossom”: “Lemon / Nashi Blossom / White Musk”,“Eau Rose”: “Bergamot, Damascus Rose, Blackcurrant / Centifolia Rose Essence, Geranium / Cedarwood”,“Canal Flower”: “Bergamot, Eucalyptus, Tuberose Absolute, Jasmine Absolute, Orange Blossom Absolute, Musk”,“COCO Mademoiselle”: Bergamot, Orange, Orange Blossom / Jasmine, Rose, Ylang-Ylang / Patchouli, Tonka Bean, Vanilla, Musk”,“La Tulipe”: “Freesia, Cyclamen, Rhubarb / Tulip / Vetiver, Blonde Wood”. you need to pick one for top note` },
                    // { "role": "assistant", "content": `ok, I will pick one from the list for the top note` },
                    // { "role": "user", "content": `here's middle note list. “Lime Basil & Mandarin”: “Mandarin / Basil / Amberwood”,“Inflorescence”: “Rose Petals, Pink Freesia / Lily, Magnolia / Jasmine”,“Tacit”: “Yuzu, Citrus / Rosemary, Basil / Vetiver, Amber, Cedarwood”,“White Jasmin & Mint”: “Mint Leaves / Jasmine / Mate Leaves”,“Eucalytus Lavender”: “Eucalytus Lavender”,“Santal 33”: “Cedar, Cardamom, Violet, Leather, Iris, Amber, Virginia Cedar”,“Gypsy Water”: “Bergamot, Lemon, Pepper, Juniper Berry / Incense, Pine Needles, Orris / Amber, Vanilla, Sandalwood”,“Bleu de Chanel”: “Bergamot, Mint / Lavender, Pineapple, Geranium / Tonka Bean, Amberwood, Sandalwood”,“Wood sage & Sea salt”: “Ambrette / Sea Salt / Sage”,“Hwyl”: “Smoky Woody Thyme, Pink Pepper / Cypress, Suede, Geranium / Vetiver, Frankincense, Cedar”. you need to pick one for top note` },
                    // { "role": "assistant", "content": `ok, I will pick one from the list for the middle note` },
                    // { "role": "user", "content": `here's base note list. “Doson”: “African Orange, Rose, Iris / Tuberose, Pink Pepper / Benzoin, Musk”,“Blanche”: “Aldehyde, Rose / Peony, Violet / Musk, Sandalwood”,“White Suede”: “Tea / Lily of the Valley, Saffron, Rose / Suede, Musk, Sandalwood, Amber”,“Fleur De Peau”: “Bergamot, Aldehyde, Pink Pepper / Iris, Turkish Rose / Musk, Ambrette, Ambergris, Sandalwood, Amberwood, Suede Leather”,“Musc ravageur”: “Bergamot, Mandarin, Lavender / Amber, Vanilla / Sandalwood, Musk”,“Tamdao”: “Silver Plum Blossom, Rose / Juniper, Sandalwood / Brazilian Rosewood, Amber, White Musk”,“Oud Wood”: “Chinese Pepper, Rosewood, Cardamom / Oud Wood, Sandalwood, Vetiver / Tonka Bean, Vanilla, Amber”,“Fucking Fabulous”: “Lavender, Clary Sage / Suede Leather, Almond, Vanilla / Cinnamon, Tonka Bean, White Wood, Amber, Cashmeran”,“Mojave Ghost”: “Jamaican Nesberry, Ambrette / Magnolia, Violet, Sandalwood, Cinnamon / Cedarwood, Crispy Amber, Chantilly Musk”,“Nutmeg & Ginger”: “Ginger / Nutmeg / Sandalwood”. you need to pick one for the base note`},
                    // { "role": "assistant", "content": `ok, I will pick one from the list for the base note` },

                    { "role": "system", "content": "안녕하세요👋, 저는 당신의 인공지능 조향사입니다! 저는 인물의 이미지를 분석하여 인물에게 어울리는 맞춤형 향수를 추천해 드립니다. 추천 받고자 하는 분의 사진을 업로드 해 주시면 제가 분석을 시작하겠습니다." },
                    { "role": "user", "content": `고객의 생년월일은 ${userBirthDate} 이며, 성별은 ${userGender} 입니다.` },
                    { "role": "assistant", "content": `알겠습니다. 고객의 생년월일은 ${userBirthDate} 이며, 성별은 ${userGender} 입니다.` },
                    { "role": "user", "content": `당신의 첫번째 임무는 고객이 업로드한 이미지에 대한 심도 깊은 분석을 하는 것입니다.` },
                    { "role": "assistant", "content": `알겠습니다. 저의 첫번째 임무는 고객이 업로드한 이미지에 대한 심도 깊은 분석을 하는 것입니다.` },
                    { "role": "user", "content": `당신의 두번째 임무는 첫번째 임무에서 수행한 이미지 분석을 기반으로 어떤 맞춤형 향수가 고객에게 어울릴 지를 심도 깊게 분석하는 것입니다. 맞춤형 향수는 서로 다른 3가지의 '향 노트'로 구성되어 있습니다. '향 노트'는 첫째 'Top Note', 둘째 'Middle Note', 그리고 셋째 'Base Note'로 구성되어 있습니다. 'Top Note'는 10가지의 서로 다른 향 오일로 이루어져 있고, 'Middle Note'는 10가지의 서로 다른 향 오일로 이루어져 있으며, 'Base Note'는 10가지의 서로 다른 향 오일로 이루어져 있습니다. 당신은 맞춤형 향수를 구성하기 위해 'Top Note'의 향 오일 중 하나, 'Middle Note'의 향 오일 중 하나, 그리고 'Base Note'의 향 오일 중 하나를 선택해 총 3가지 향 오일로 구성된 하나의 최종 향 조합을 만들어 내야 합니다. 당신은 반드시 첫번째 임무에서 수행한 이미지 분석을 기분으로 왜 특정 향 오일을 'Top Note'로 선정하였는 지, 왜 특정 향 오일을 'Middle Note'로 선정하였는 지, 왜 특정 향 오일을 'Base Note'로 선정하였는 지를 설명해야 하며, 해당 향 오일이 무엇인 지를 설명해야 합니다.` },
                    { "role": "assistant", "content": `알겠습니다. 저의 두번째 임무는 첫번째 임무에서 수행한 이미지 분석을 기반으로 어떤 맞춤형 향수가 고객에게 어울릴 지를 심도 깊게 분석하는 것입니다. 맞춤형 향수는 서로 다른 3가지의 '향 노트'로 구성되어 있습니다. '향 노트'는 첫째 'Top Note', 둘째 'Middle Note', 그리고 셋째 'Base Note'로 구성되어 있습니다. 'Top Note'는 10가지의 서로 다른 향 오일로 이루어져 있고, 'Middle Note'는 10가지의 서로 다른 향 오일로 이루어져 있으며, 'Base Note'는 10가지의 서로 다른 향 오일로 이루어져 있습니다. 저는 맞춤형 향수를 구성하기 위해 'Top Note'의 향 오일 중 하나, 'Middle Note'의 향 오일 중 하나, 그리고 'Base Note'의 향 오일 중 하나를 선택해 총 3가지 향 오일로 구성된 하나의 최종 향 조합을 만들어 내야 합니다. 저는 반드시 첫번째 임무에서 수행한 이미지 분석을 기분으로 왜 특정 향 오일을 'Top Note'로 선정하였는 지, 왜 특정 향 오일을 'Middle Note'로 선정하였는 지, 왜 특정 향 오일을 'Base Note'로 선정하였는 지를 설명해야 하며, 해당 향 오일이 무엇인 지를 설명할 것입니다.` },
                    { "role": "user", "content": `다음은 'Top Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 01": "블랙베리","AC'SCENT 02": "청사과, 작약, 블루베리, 난초, 바닐라, 무화과, 머스크","AC'SCENT 03": "베르가못, 스트로베리, 라즈베리, 오렌지플라워 앱솔루트, 자스민 앱솔루트, 화이트 피오니, 파츌리, 화이트 머스크","AC'SCENT 04": "베르가못, 라벤더, 로즈마리, 레몬, 만다린 오렌지, 아프리카 오렌지, 네롤리, 자스민, 엠버, 암브레트","AC'SCENT 05": "비터오렌지, 오렌지플라워, 주니퍼베리, 파츌리, 안젤리카","AC'SCENT 06": "레몬, 나시블라썸(배꽃), 화이트머스크","AC'SCENT 07": "베르가못, 블랙커먼트, 다마스커스 로즈, 센티폴리아 장미 에센스, 제라늄, 시더우드","AC'SCENT 08": "베르가못, 유칼립투스, 머스크, 튜베로즈 앱솔루트, 자스민 앱솔루트, 오렌지블라썸 앱솔루트","AC'SCENT 09": "베르가못, 오렌지, 오렌지블라썸, 자스민, 로즈, 일랑일랑, 파츌리, 통카콩, 바닐라, 머스크","AC'SCENT 10": "프리지아, 시클라멘, 루바브, 튤립, 베티버, 블론즈 우드".당신은 위의 'Top Note' 중 단 하나의 향 오일을 선택해야 합니다.` },
                    { "role": "assistant", "content": `알겠습니다. 저는 'Top Note'의 리스트 중에서 단 하나의 향 오일만을 선택하겠습니다.` },
                    { "role": "user", "content": `다음은 'Middle Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 11": "만다린, 바질, 앰버우드","AC'SCENT 12": "장미 꽃잎, 핑크 프리지아, 백합, 목련, 자스민","AC'SCENT 13": "유자, 시트러스, 로즈마리, 바질, 베티버, 엠버, 시더우드","AC'SCENT 14": "민트 잎, 자스민, 마테 잎","AC'SCENT 15": "유칼립투스","AC'SCENT 16": "삼나무, 카디멈, 바이올렛, 가죽, 아이리스, 앰버, 버지니아 시더","AC'SCENT 17": "베르가못, 레몬, 페퍼, 주니퍼베리, 인센스, 솔잎, 오리스, 앰버, 바닐라, 샌달우드","AC'SCENT 18": "베라그못, 민트, 라벤더, 파인애플, 제라늄, 통카콩, 앰버우드, 샌달우드","AC'SCENT 19": "암브레트, 바다 소금, 세이지","AC'SCENT 20": "타임, 핑크페퍼, 사이프러스, 가죽, 제라늄, 베티버, 프랑킨센스, 시더". 당신은 위의 'Middle Note' 중 단 하나의 향 오일을 선택해야 합니다.` },
                    { "role": "assistant", "content": `알겠습니다. 저는 'Middle Note'의 리스트 중에서 단 하나의 향 오일만을 선택하겠습니다.` },
                    { "role": "user", "content": `다음은 'Base Note'에 해당하는 향 오일 리스트입니다. 향 오일의 명칭과 해당 향 오일을 구성하고 있는 구체적인 재료를 함께 묶어 나열하였습니다. "AC'SCENT 21": "아프리카 오렌지, 로즈, 아이리스, 투베로즈, 핑크페퍼, 벤조인, 머스크","AC'SCENT 22": "알데하이드, 로즈, 모란, 바이올렛, 머스크, 샌달우드","AC'SCENT 23": "티, 은방울 꽃, 샤프론, 로즈, 가죽, 머스크, 샌달우드, 앰버","AC'SCENT 24": "베르가못, 알데하이드, 핑크페퍼, 아이리스, 터키쉬 로즈, 머스크, 암브레트, 앰버그리스, 샌달우드, 앰버우드, 가죽","AC'SCENT 25": "베르가못, 만다린, 라벤더, 호박, 바닐라, 샌달우드, 머스크","AC'SCENT 26": "은매화, 장미, 향나무, 샌달우드, 브라질리안 로즈우드, 앰버, 화이트머스크","AC'SCENT 27": "차이니즈페퍼, 로즈우드, 카디멈, 오드우드, 샌달우드, 베티버, 통카콩, 바닐라, 앰버","AC'SCENT 28": "라벤더, 클라리 세이지, 가죽, 아몬드, 바닐라, 계피, 통카콩, 화이트우드, 앰버, 캐쉬미란","AC'SCENT 29": "자메이칸 네스베리, 암브레트, 매그놀리아, 바이올렛, 샌달우드, 계피, 시더우드, 크리스피앰버, 찬탈리머스크","AC'SCENT 30": "진저, 너트맥, 샌달우드".당신은 위의 'Top Note' 중 단 하나의 향 오일을 선택해야 합니다.`},
                    { "role": "assistant", "content": `알겠습니다. 저는 'Base Note'의 리스트 중에서 단 하나의 향 오일만을 선택하겠습니다.` },
                    { "role": "user", "content": `당신의 세번째 임무는 고객에게 추천한 맞춤형 향수에 대한 창의적인 이름을 짓는 것입니다.` },
                    { "role": "assistant", "content": `알겠습니다. 저는 고객에게 추천한 맞춤형 향수에 대한 창의적인 이름을 짓겠습니다.` },
                    { "role": "user", "content": `당신의 네번째 임무는 고객이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락은 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락은 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다. 세번째 단락은 세번째 임무에서 수행한 창의적인 이름을 제시하고 그 이름을 짓게 된 구체적인 이유를 설명해야 합니다. 네번째 단락은 기존의 세가지 단락들을 종합적으로 요약해야 합니다.` },
                    { "role": "assistant", "content": `알겠습니다. 저의 네번째 임무는 고객이 읽게 될 맞춤형 향수 추천 및 분석 보고서를 작성하는 것입니다. 첫번째 단락에서는 첫번째 임무에서 수행한 이미지 분석에 대한 설명으로 구성되어야 합니다. 이미지에 나타난 인물의 분위기, 얼굴 표정, 패션, 메이크업 상태 등을 친절히 분석하여야 합니다. 두번째 단락에서는 두번째 임무에서 수행한 구체적인 Top Note, Middle Note, Base Note의 향 오일 추천에 대한 내용 및 설명으로 구성되어야 합니다. 해당 Top Note, Middle Note, Base Note를 선택한 구체적인 이유를 자세히 설명해야 합니다. 세번째 단락에서는 세번째 임무에서 수행한 창의적인 이름을 제시하고 그 이름을 짓게 된 구체적인 이유를 설명해야 합니다. 네번째 단락에서는 기존의 세가지 단락들을 종합적으로 요약해야 합니다. ` },

                    {
                        role: "system",
                        content: [
                            { type: "text", text: "여기 분석할 사진이 있습니다. 첫번째 임무를 기반으로 당신은 사진에서 보여지는 인물을 기반으로 인물의 분위기, 얼굴표정, 패션, 메이크업 상태등을 심도있게 분석, 그리고 두번째 임무를 기반으로 5가지 특징을 작성해야 합니다. 당신은 해당 특징에 대한 설명을 작성하기전에 'Insight 1:' 와 같은 형식을 유지해야 합니다. 정확한 regex를 위해서 각각의 특징들을 제공한 후 줄바꿈을 해야 합니다. 당신은 세번째 임무를 기반으로 탑 노트, 미들노트, 베이스 노트에 대한 정보를 제공할때 'TOP NOTE:', 'MIDDLE NOTE:', 'BASE NOTE:' 양식을 지키셔야 합니다. 노트 추천을 할때는 설명도 추가해야 하며, 노트 추천을 하고난 뒤에 향수 이름 추천을 하셔야 합니다. 향수 이름 추천을 할때에는 'Perfume Name Recommendation:' 양식을 지켜야 합니다. 그리고 해당 향수이름 추천을 해야 합니다. 향수 추천 이름은 한글로 작성을 해야 합니다. regex를 위해서 마지막엔 'checkcheck'을 작성해 주세요. 마크다운 양식은 없어야 하며, 모든 분석은 한글로 작성하셔야 합니다." },
                            { type: "image_url", image_url: { "url": encodedImage },
                            },
                        ],
                    },
                ],
                max_tokens: 1024,
            });


            let content = JSON.stringify(response.choices[0].message.content);
            content = content.replace(/\\n+/g, " ").replace(/\\+/g, ""); // Handle escaped newlines and backslashes
            //add regex here
            console.log(content);
            const filteredList = extractInsightsAndNotes(content);
            console.log("this is insight: " + filteredList.combinedInsights);
            console.log("this is Top note: " + filteredList.topNote);
            console.log("this is Middle note: " + filteredList.middleNote);
            console.log("this is Base note: " + filteredList.baseNote);
            console.log("this is Perfume Name: " + filteredList.nameRecommendation);
            // return await enhanceResponse(filteredList.combinedInsights);
            return filteredList;
        } catch (error) {
            console.error("Error processing the file:", error);
        }
    }

    // Loop to wait for the file, checking every second for up to 5 seconds
        if (await checkFileExists(filePath)) {
             // Run specific function when file exists
            return await onFileExist(filePath); // Exit after handling file existence
        }
        // await delay(1000); // Wait for 1 second before the next check

}



// Export the router
module.exports = router;

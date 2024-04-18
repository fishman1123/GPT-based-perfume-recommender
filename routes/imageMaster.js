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
                    { "role": "system", "content": "👋I am your AC’SCENT AI Perfumer, James! Please upload an image of a person that you’d like to analyze for a custom perfume." },
                    { "role": "user", "content": `Your first task is to offer a deep-dive analysis of the image that the customer has uploaded.` },
                    { "role": "assistant", "content": `ok, my first task is to offer a deep-dive analysis of the image that the customer has uploaded.` },
                    { "role": "user", "content": `Your second task is to offer a deep-dive consultation to which custom perfume may best suit the customer based on the image analysis that you’ve completed on the first task. A custom perfume consists of three different ingredients, the first one being ‘Top Note’, second ‘Middle Note’, and third ‘Base Note’. Top note consists of 10 different perfume oils, middle note consists of 10 different perfume oils, and base note consists of 10 different perfume oils. You must choose one of each perfume oils in each category of ingredients(Top note, middle note, base note) to come up with a final combination of 3 different perfume oils for a single custom perfume. Ensure that you provide a detailed explanation of why you chose a certain ingredient and what that ingredient is.` },
                    { "role": "assistant", "content": `my second task is to offer a deep-dive consultation to which custom perfume may best suit the customer based on the image analysis that I’ve completed on the first task. A custom perfume consists of three different ingredients, the first one being ‘Top Note’, second ‘Middle Note’, and third ‘Base Note’. Top note consists of 10 different perfume oils, middle note consists of 10 different perfume oils, and base note consists of 10 different perfume oils. I must choose one of each perfume oils in each category of ingredients(Top note, middle note, base note) to come up with a final combination of 3 different perfume oils for a single custom perfume. Ensure that I provide a detailed explanation of why I chose a certain ingredient and what that ingredient is.` },
                    { "role": "user", "content": `here's top note list. “Blackberry and Bay”: “Blackberry, Laurel Leaf, Cedarwood”,“Bombshell”: “Green apple, Peony / Blueberry, Orchid, Vanilla / Fig, Musk”,“Mont Paris”: “Bergamot, Strawberry, Raspberry / Orange Flower Absolute, Jasmine Absolute, White Peony / Patchouli, White Musk”,“Neoli Portofino”: “Bergamot, Mandarin Orange, Lemon, Lavender, Rosemary, Bitter Orange / African Orange, Neroli, Jasmine / Amber, Ambrette”,“Eau De Sens”: “Bitter Orange, Citrus / Orange Flower, Juniper Berry / Patchouli, Angelica”,“Nashi Blossom”: “Lemon / Nashi Blossom / White Musk”,“Eau Rose”: “Bergamot, Damascus Rose, Blackcurrant / Centifolia Rose Essence, Geranium / Cedarwood”,“Canal Flower”: “Bergamot, Eucalyptus, Tuberose Absolute, Jasmine Absolute, Orange Blossom Absolute, Musk”,“COCO Mademoiselle”: Bergamot, Orange, Orange Blossom / Jasmine, Rose, Ylang-Ylang / Patchouli, Tonka Bean, Vanilla, Musk”,“La Tulipe”: “Freesia, Cyclamen, Rhubarb / Tulip / Vetiver, Blonde Wood”. you need to pick one for top note` },
                    { "role": "assistant", "content": `ok, I will pick one from the list for the top note` },
                    { "role": "user", "content": `here's middle note list. “Lime Basil & Mandarin”: “Mandarin / Basil / Amberwood”,“Inflorescence”: “Rose Petals, Pink Freesia / Lily, Magnolia / Jasmine”,“Tacit”: “Yuzu, Citrus / Rosemary, Basil / Vetiver, Amber, Cedarwood”,“White Jasmin & Mint”: “Mint Leaves / Jasmine / Mate Leaves”,“Eucalytus Lavender”: “Eucalytus Lavender”,“Santal 33”: “Cedar, Cardamom, Violet, Leather, Iris, Amber, Virginia Cedar”,“Gypsy Water”: “Bergamot, Lemon, Pepper, Juniper Berry / Incense, Pine Needles, Orris / Amber, Vanilla, Sandalwood”,“Bleu de Chanel”: “Bergamot, Mint / Lavender, Pineapple, Geranium / Tonka Bean, Amberwood, Sandalwood”,“Wood sage & Sea salt”: “Ambrette / Sea Salt / Sage”,“Hwyl”: “Smoky Woody Thyme, Pink Pepper / Cypress, Suede, Geranium / Vetiver, Frankincense, Cedar”. you need to pick one for top note` },
                    { "role": "assistant", "content": `ok, I will pick one from the list for the middle note` },
                    { "role": "user", "content": `here's base note list. “Doson”: “African Orange, Rose, Iris / Tuberose, Pink Pepper / Benzoin, Musk”,“Blanche”: “Aldehyde, Rose / Peony, Violet / Musk, Sandalwood”,“White Suede”: “Tea / Lily of the Valley, Saffron, Rose / Suede, Musk, Sandalwood, Amber”,“Fleur De Peau”: “Bergamot, Aldehyde, Pink Pepper / Iris, Turkish Rose / Musk, Ambrette, Ambergris, Sandalwood, Amberwood, Suede Leather”,“Musc ravageur”: “Bergamot, Mandarin, Lavender / Amber, Vanilla / Sandalwood, Musk”,“Tamdao”: “Silver Plum Blossom, Rose / Juniper, Sandalwood / Brazilian Rosewood, Amber, White Musk”,“Oud Wood”: “Chinese Pepper, Rosewood, Cardamom / Oud Wood, Sandalwood, Vetiver / Tonka Bean, Vanilla, Amber”,“Fucking Fabulous”: “Lavender, Clary Sage / Suede Leather, Almond, Vanilla / Cinnamon, Tonka Bean, White Wood, Amber, Cashmeran”,“Mojave Ghost”: “Jamaican Nesberry, Ambrette / Magnolia, Violet, Sandalwood, Cinnamon / Cedarwood, Crispy Amber, Chantilly Musk”,“Nutmeg & Ginger”: “Ginger / Nutmeg / Sandalwood”. you need to pick one for the base note`},
                    { "role": "assistant", "content": `ok, I will pick one from the list for the base note` },
                    { "role": "user", "content": `Like I mentioned before, Your first task is to offer a deep-dive analysis of the image that the customer has uploaded.` },
                    { "role": "assistant", "content": `ok, my first task is to offer a deep-dive analysis of the image that the customer has uploaded.` },
                    { "role": "user", "content": `Your second task is to offer a deep-dive consultation to which custom perfume may best suit the customer based on the image analysis that you’ve completed on the first task. A custom perfume consists of three different ingredients, the first one being ‘Top Note’, second ‘Middle Note’, and third ‘Base Note’. Top note consists of 10 different perfume oils, middle note consists of 10 different perfume oils, and base note consists of 10 different perfume oils. You must choose one of each perfume oils in each category of ingredients(Top note, middle note, base note) to come up with a final combination of 3 different perfume oils for a single custom perfume. Ensure that you provide a detailed explanation of why you chose a certain ingredient and what that ingredient is.` },
                    { "role": "assistant", "content": `my second task is to offer a deep-dive consultation to which custom perfume may best suit the customer based on the image analysis that I’ve completed on the first task. A custom perfume consists of three different ingredients, the first one being ‘Top Note’, second ‘Middle Note’, and third ‘Base Note’. Top note consists of 10 different perfume oils, middle note consists of 10 different perfume oils, and base note consists of 10 different perfume oils. I must choose one of each perfume oils in each category of ingredients(Top note, middle note, base note) to come up with a final combination of 3 different perfume oils for a single custom perfume. Ensure that I provide a detailed explanation of why I chose a certain ingredient and what that ingredient is.` },
                    { "role": "user", "content": `here's top note list. “Blackberry and Bay”: “Blackberry, Laurel Leaf, Cedarwood”,“Bombshell”: “Green apple, Peony / Blueberry, Orchid, Vanilla / Fig, Musk”,“Mont Paris”: “Bergamot, Strawberry, Raspberry / Orange Flower Absolute, Jasmine Absolute, White Peony / Patchouli, White Musk”,“Neoli Portofino”: “Bergamot, Mandarin Orange, Lemon, Lavender, Rosemary, Bitter Orange / African Orange, Neroli, Jasmine / Amber, Ambrette”,“Eau De Sens”: “Bitter Orange, Citrus / Orange Flower, Juniper Berry / Patchouli, Angelica”,“Nashi Blossom”: “Lemon / Nashi Blossom / White Musk”,“Eau Rose”: “Bergamot, Damascus Rose, Blackcurrant / Centifolia Rose Essence, Geranium / Cedarwood”,“Canal Flower”: “Bergamot, Eucalyptus, Tuberose Absolute, Jasmine Absolute, Orange Blossom Absolute, Musk”,“COCO Mademoiselle”: Bergamot, Orange, Orange Blossom / Jasmine, Rose, Ylang-Ylang / Patchouli, Tonka Bean, Vanilla, Musk”,“La Tulipe”: “Freesia, Cyclamen, Rhubarb / Tulip / Vetiver, Blonde Wood”. you need to pick one for top note` },
                    { "role": "assistant", "content": `ok, I will pick one from the list for the top note` },
                    { "role": "user", "content": `here's middle note list. “Lime Basil & Mandarin”: “Mandarin / Basil / Amberwood”,“Inflorescence”: “Rose Petals, Pink Freesia / Lily, Magnolia / Jasmine”,“Tacit”: “Yuzu, Citrus / Rosemary, Basil / Vetiver, Amber, Cedarwood”,“White Jasmin & Mint”: “Mint Leaves / Jasmine / Mate Leaves”,“Eucalytus Lavender”: “Eucalytus Lavender”,“Santal 33”: “Cedar, Cardamom, Violet, Leather, Iris, Amber, Virginia Cedar”,“Gypsy Water”: “Bergamot, Lemon, Pepper, Juniper Berry / Incense, Pine Needles, Orris / Amber, Vanilla, Sandalwood”,“Bleu de Chanel”: “Bergamot, Mint / Lavender, Pineapple, Geranium / Tonka Bean, Amberwood, Sandalwood”,“Wood sage & Sea salt”: “Ambrette / Sea Salt / Sage”,“Hwyl”: “Smoky Woody Thyme, Pink Pepper / Cypress, Suede, Geranium / Vetiver, Frankincense, Cedar”. you need to pick one for top note` },
                    { "role": "assistant", "content": `ok, I will pick one from the list for the middle note` },
                    { "role": "user", "content": `here's base note list. “Doson”: “African Orange, Rose, Iris / Tuberose, Pink Pepper / Benzoin, Musk”,“Blanche”: “Aldehyde, Rose / Peony, Violet / Musk, Sandalwood”,“White Suede”: “Tea / Lily of the Valley, Saffron, Rose / Suede, Musk, Sandalwood, Amber”,“Fleur De Peau”: “Bergamot, Aldehyde, Pink Pepper / Iris, Turkish Rose / Musk, Ambrette, Ambergris, Sandalwood, Amberwood, Suede Leather”,“Musc ravageur”: “Bergamot, Mandarin, Lavender / Amber, Vanilla / Sandalwood, Musk”,“Tamdao”: “Silver Plum Blossom, Rose / Juniper, Sandalwood / Brazilian Rosewood, Amber, White Musk”,“Oud Wood”: “Chinese Pepper, Rosewood, Cardamom / Oud Wood, Sandalwood, Vetiver / Tonka Bean, Vanilla, Amber”,“Fucking Fabulous”: “Lavender, Clary Sage / Suede Leather, Almond, Vanilla / Cinnamon, Tonka Bean, White Wood, Amber, Cashmeran”,“Mojave Ghost”: “Jamaican Nesberry, Ambrette / Magnolia, Violet, Sandalwood, Cinnamon / Cedarwood, Crispy Amber, Chantilly Musk”,“Nutmeg & Ginger”: “Ginger / Nutmeg / Sandalwood”. you need to pick one for the base note`},
                    { "role": "assistant", "content": `ok, I will pick one from the list for the base note` },

                    {
                        role: "system",
                        content: [
                            { type: "text", text: "Here is the image for analysis. you must provide insights and a perfume recommendation. say checkcheck on each insight and top note, middle note base note" },
                            { type: "image_url", image_url: { "url": encodedImage },
                            },
                        ],
                    },
                    // { "role": "assistant", "content": "Starting the image analysis..."  },

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

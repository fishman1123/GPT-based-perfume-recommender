

document.addEventListener('DOMContentLoaded', (event) => {
    // Optionally, display an initial message from Professor Fish if needed
    // displayMessage("=====================", "assistant");

    // Listen for Enter key presses on the chat input field
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent the default action to avoid form submission
            sendMessage(); // Trigger the sendMessage function
        }
    });
});

const texts = ["LOADING", "이미지 분석 중...", "ANALYZING Image", "향료 추출 중...", "EXTRACTING Fragrances", "킁카킁카...", "향수 이름 작명 중...", "MAKING Scent name", "Wait a minute", "곧 분석보고서가 나옵니다", "잠시만 기다려주세요"];
let index = 0;

function changeText() {
    const loadingTextDiv = document.getElementById('loadingText');
    loadingTextDiv.textContent = texts[index];
    // Increment the index and reset to 0 if it's at the end of the list
    index = (index + 1) % texts.length;
}

// Call changeText every 3 seconds (3000 milliseconds)
setInterval(changeText, 3000);

let userMessages = [];
let assistantMessages = [];

// Variable for start function
let myDateTime = '';

function start() {
    const date = document.getElementById('date').value;
    const hour = document.getElementById('hour').value;
    // if (date === '') {
    //     alert('생년월일을 입력해주세요.');
    //     return;
    // }
    myDateTime = date + ' ' + hour; // Assuming you want to include a space or some delimiter
    console.log(myDateTime);

    let todayDateTime = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
    let initialAssistantMessage = `포터 선생: 너 ${myDateTime}에 태어났다는 거지? 오늘은 ${todayDateTime}이구나, 자, 운세에 대해서 어떤 것이든 물어보렴.`;

    displayMessage(initialAssistantMessage, "assistant");

    document.getElementById("intro").style.display = "none";
    document.getElementById("report").style.display = "block";
}
function imageUpload() {
    const imageCheck = document.getElementById('imageInput');
    const birthInput = document.getElementById('date');
    const inputName = document.getElementById('nameInput');
    const inputGender = document.getElementById('gender');
    // Check if the name input is empty
    if (!inputName.value.trim()) {
        alert('Please enter your name.');
        inputName.focus();
        return;
    }

    // Check if the birthdate input is empty
    if (!birthInput.value.trim()) {
        alert('Please enter your birth date.');
        birthInput.focus();
        return;
    }

    // Check if the gender has been selected
    if (!inputGender.value.trim()) {
        alert('Please select your gender.');
        inputGender.focus();
        return;
    }

    // Check if an image has been uploaded
    if (imageCheck.files.length === 0) {
        alert('Please select an image to upload.');
        imageCheck.focus();
        return;
    }

    // transitionToIntro(); // Transition the UI to the next step
    document.getElementById("intro").style.display = "none";
    sendImage();
}

function transitionToIntro() {
    document.getElementById("report").style.display = "block";
}
// function backToMain() {
//     // Correct the ID if it's 'messageArea' and not 'message-area'
//     const targetArea = document.getElementById('targetTopNote');
//     // cleaningPage(document.getElementById('userName'));
//     cleaningPage(document.getElementById('targetInsight'));
//     cleaningPage(document.getElementById('targetTopNote'));
//     cleaningPage(document.getElementById('targetMiddleNote'));
//     cleaningPage(document.getElementById('targetBaseNote'));
//     cleaningPage(document.getElementById('targetNameRecommend'));
//     // if (targetArea) {
//     //     target.innerHTML = '';
//     //     document.getElementById("report").style.display = "none";
//     //     document.getElementById("intro").style.display = "flex";
//     // } else {
//     //     console.error('Message area element not found');
//     // }
//     // resetPage();
//     document.getElementById("report").style.display = "none";
//     document.getElementById("intro").style.display = "flex";
// }

function backToPage() {
    window.location.href = "https://nadr11061992806.imweb.me/?redirect=no&_gl=1*13xfk1t*_ga*ODc4MjQ0MTQ2LjE3MTU1MTA3NDE.*_ga_HP37L08LP3*MTcxNTc3NzY3Mi41LjAuMTcxNTc3NzY3Mi42MC4wLjA.&_ga=2.204799184.1372044061.1715660820-878244146.1715510741&_gac=1.58459736.1715510741.CjwKCAjw0YGyBhByEiwAQmBEWsnKsJR4ot2cJTx5LeUWbN7HkzecuskP9xIWW2r0p9m5LeAb8rNYzhoCZTwQAvD_BwE";
}

function displayUserName(name) {
    const userNameElement = document.getElementById('userName');
    userNameElement.textContent = name; // Safely add text content
}

function cleaningPage(tagId) {
    if (tagId) {
        tagId.innerHTML = '';

    } else {
        console.error('Message area element not found');
    }
}
function resetPage() {
    const insightArea = document.getElementById('targetInsight');
    insightArea.textContent = '이미지 분석 결과';
    const topArea = document.getElementById('targetTopNote');
    topArea.style.fontFamily = 'BM Hanna Pro, sans-serif';
    topArea.textContent = `TOP NOTE | `;
    const middleArea = document.getElementById('targetMiddleNote');
    middleArea.style.fontFamily = 'BM Hanna Pro, sans-serif';
    middleArea.textContent = 'MIDDLE NOTE | ';
    const baseArea = document.getElementById('targetBaseNote');
    baseArea.style.fontFamily = 'BM Hanna Pro, sans-serif';
    baseArea.textContent = 'BASE NOTE | ';

}

async function sendImage() {
    const birthInput = document.getElementById('date');
    const inputName = document.getElementById('nameInput');
    const inputGender = document.getElementById('gender');
    const imageInput = document.getElementById('imageInput');
    console.log("can you get this?: " + birthInput.value);
    if (imageInput.files.length === 0) {
        alert('Please select an image to upload.');
        return;
    }
    const imageFile = imageInput.files[0];

    const formData = new FormData();
    formData.append('image', imageFile); // Append the file
    formData.append('gender', inputGender.value === "00" ? '남자' : '여자');
    formData.append('birthDate', birthInput.value);
    // const bbb = formData.get('birthName').value;
    // console.log("check this out brother: " + bbb);
    console.log("hello there" + document.getElementById('date').value);

    document.getElementById('loader').style.display = "flex"; // Show loading icon
    document.getElementById('backButton').style.display = "none"; // Show loading icon


    try {
        const response = await fetch('http://localhost:3003/imageMaster/image', {
            // local http://localhost:3003/imageMaster/image
            // http://neander-perfume-maker-recommend-env.eba-dzkzephp.ap-northeast-2.elasticbeanstalk.com/imageMaster/image
            method: 'POST',
            // Don't set 'Content-Type': 'application/json' for FormData
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("this is the answer: " + responseData); // Assuming the server responds with some JSON
        // displayMessage(responseData.message.insights, "assistant");
        // displayReport(message, sender, targetID)
        console.log("target input name" + inputName.value);
        transitionToIntro();
        // const targetInsight = responseData.message.insights;
        // const filteredInsight = targetInsight.replace(/\.,(?=[^ ]|$)/g, '.');
        console.log('hello' + responseData.message.combinedInsights);
        // displayUserName(inputName.value);
        displayReport(responseData.message.combinedInsights, "testing", 'targetInsight');
        displayReport(responseData.message.topNote, "testing", 'targetTopNote');
        displayReport(responseData.message.middleNote, "testing", 'targetMiddleNote');
        displayReport(responseData.message.baseNote, "testing", 'targetBaseNote');
        displayReport(responseData.message.nameRecommendation, "testing", 'targetNameRecommend');

        imageInput.value = '';
    } catch (error) {
        console.error('Error:', error);
        displayMessage("Error: Could not upload the image. Please try again.", "error");
    } finally {
        document.getElementById('loader').style.display = "none"; // Hide loading icon
        document.getElementById('backButton').style.display = "block"; // Show loading icon

    }
}


// async function sendMessage() {
//     const input = document.getElementById('chatInput');
//     const message = input.value.trim(); // Get the message from the input and trim whitespace
//     if (!message) return; // Do nothing if the message is empty
//
//     displayMessage(`You: ${message}`, "user");
//     userMessages.push(message);
//
//     document.getElementById('loader').style.display = "flex"; // Show loading icon
//
//     try {
//         const response = await fetch('http://localhost:3003/imageMaster/image', {
//
//             //http://localhost:3003/imageMaster/image //for local test
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify({
//                 myDateTime: myDateTime,
//                 userMessages: userMessages,
//                 assistantMessages: assistantMessages,
//             }),
//         });
//
//         if (!response.ok) {
//             throw new Error(`HTTP error! status: ${response.status}`);
//         }
//
//         const responseData = await response.json();
//         displayMessage(`포터 선생: ${responseData.assistant}`, "assistant");
//         assistantMessages.push(responseData.assistant);
//     } catch (error) {
//         console.error('Error:', error);
//         displayMessage("Error: Could not get a response. Please try again.", "error");
//     } finally {
//         document.getElementById('loader').style.display = "none"; // Hide loading icon after the operation
//         input.value = ''; // Clear the input field
//     }
// }


function displayMessage(message, sender) {
    const messageArea = document.getElementById('messageArea');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = sender;
    messageElement.style.marginBottom = '5px'; // Add margin between messages
    messageElement.style.fontSize = '30px';
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight; // Scroll to the bottom to show the latest message
}




function displayReport(message, sender, targetID, ) {

    const targetArea = document.getElementById(targetID);
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.className = sender;
    // messageElement.style.marginBottom = '5px'; // Add margin between messages
    // messageElement.style.marginTop = '20px';
    if (targetID === 'targetNameRecommend') {
        messageElement.style.fontSize = '32px';
        messageElement.style.color = 'white';
    } else {
        messageElement.style.fontSize = '16px';
    }
    targetArea.appendChild(messageElement);
    targetArea.scrollTop = targetArea.scrollHeight; // Scroll to the bottom to show the latest message

}

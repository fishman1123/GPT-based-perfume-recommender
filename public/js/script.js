

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
function backToMain() {
    // Correct the ID if it's 'messageArea' and not 'message-area'
    const targetArea = document.getElementById('targetTopNote');
    cleaningPage(document.getElementById('userName'));
    cleaningPage(document.getElementById('targetInsight'));
    cleaningPage(document.getElementById('targetTopNote'));
    cleaningPage(document.getElementById('targetMiddleNote'));
    cleaningPage(document.getElementById('targetBaseNote'));
    cleaningPage(document.getElementById('targetNameRecommend'));
    // if (targetArea) {
    //     target.innerHTML = '';
    //     document.getElementById("report").style.display = "none";
    //     document.getElementById("intro").style.display = "flex";
    // } else {
    //     console.error('Message area element not found');
    // }
    resetPage();
    document.getElementById("report").style.display = "none";
    document.getElementById("intro").style.display = "flex";
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
    topArea.textContent = 'TOP NOTE';
    const middleArea = document.getElementById('targetMiddleNote');
    middleArea.textContent = 'MIDDLE NOTE';
    const baseArea = document.getElementById('targetBaseNote');
    baseArea.textContent = 'BASE NOTE';

}

async function sendImage() {
    const birthInput = document.getElementById('date');
    const inputName = document.getElementById('nameInput');
    const inputGender = document.getElementById('gender');
    const imageInput = document.getElementById('imageInput');
    if (imageInput.files.length === 0) {
        alert('Please select an image to upload.');
        return;
    }
    const imageFile = imageInput.files[0];

    const formData = new FormData();
    formData.append('image', imageFile); // Append the file

    document.getElementById('loader').style.display = "flex"; // Show loading icon
    document.getElementById('backButton').style.display = "none"; // Show loading icon


    try {
        const response = await fetch('http://localhost:3003/imageMaster/image', {
            method: 'POST',
            // Don't set 'Content-Type': 'application/json' for FormData
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log("checking insight :" + responseData.message.insights);
        console.log("this is the answer: " + responseData); // Assuming the server responds with some JSON
        // displayMessage(responseData.message.insights, "assistant");
        // displayReport(message, sender, targetID)
        console.log("target input name" + inputName.value);
        transitionToIntro();
        displayUserName(inputName.value);
        displayReport(responseData.message.insights, "testing", 'targetInsight');
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


async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim(); // Get the message from the input and trim whitespace
    if (!message) return; // Do nothing if the message is empty

    displayMessage(`You: ${message}`, "user");
    userMessages.push(message);

    document.getElementById('loader').style.display = "flex"; // Show loading icon

    try {
        const response = await fetch('http://localhost:3003/imageMaster/image', {

            //http://localhost:3003/imageMaster/image //for local test
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                myDateTime: myDateTime,
                userMessages: userMessages,
                assistantMessages: assistantMessages,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        displayMessage(`포터 선생: ${responseData.assistant}`, "assistant");
        assistantMessages.push(responseData.assistant);
    } catch (error) {
        console.error('Error:', error);
        displayMessage("Error: Could not get a response. Please try again.", "error");
    } finally {
        document.getElementById('loader').style.display = "none"; // Hide loading icon after the operation
        input.value = ''; // Clear the input field
    }
}


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
    messageElement.style.marginBottom = '5px'; // Add margin between messages
    messageElement.style.fontSize = '16px';
    targetArea.appendChild(messageElement);
    targetArea.scrollTop = targetArea.scrollHeight; // Scroll to the bottom to show the latest message

}

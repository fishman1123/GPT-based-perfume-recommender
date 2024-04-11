document.addEventListener('DOMContentLoaded', (event) => {
    // Optionally, display an initial message from Professor Fish if needed
    displayMessage("====THIS IS DEMO====", "assistant");
});

document.addEventListener('DOMContentLoaded', (event) => {
    // Optionally, display an initial message from Professor Fish if needed
    displayMessage("====THIS IS DEMO====", "assistant");

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
    document.getElementById("chat").style.display = "block";
}
function prepareImageUpload() {
    transitionToIntro(); // First, transition UI
    sendImage(); // Then, send the image
}

function transitionToIntro() {
    document.getElementById("intro").style.display = "none";
    document.getElementById("chat").style.display = "block";
}
async function sendImage() {
    const imageInput = document.getElementById('imageInput');
    if (imageInput.files.length === 0) {
        alert('Please select an image to upload.');
        return;
    }
    const imageFile = imageInput.files[0];

    const formData = new FormData();
    formData.append('image', imageFile); // Append the file

    document.getElementById('loader').style.display = "inline-block"; // Show loading icon

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
        console.log(responseData); // Assuming the server responds with some JSON
        displayMessage("Image uploaded successfully", "assistant");
    } catch (error) {
        console.error('Error:', error);
        displayMessage("Error: Could not upload the image. Please try again.", "error");
    } finally {
        document.getElementById('loader').style.display = "none"; // Hide loading icon
    }
}










async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim(); // Get the message from the input and trim whitespace
    if (!message) return; // Do nothing if the message is empty

    displayMessage(`You: ${message}`, "user");
    userMessages.push(message);

    document.getElementById('loader').style.display = "inline-block"; // Show loading icon

    try {
        const response = await fetch('http://localhost:3003/imageMaster/image', {
            //https://o4mpwjruijpd3eu6gv7f2o7xmi0wdacz.lambda-url.ap-northeast-2.on.aws/professorFish //for serverless
            //http://localhost:3003/professorFish //for local test
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
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight; // Scroll to the bottom to show the latest message
}

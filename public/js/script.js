
window.onload = () => {
    // alert("인물이 두명 이상인 사진, 혹은 인물 사진이 아닐 경우 분석이 안될 수 있으니 유의 해주세요!");
    document.body.style.backgroundImage = "none";
}


const changeView = (imageUrl) => {
    let optionContainer = document.getElementById("option");
    let securityContainer = document.getElementById("security");
    optionContainer.style.display = "none";
    securityContainer.style.display = "flex";
    document.body.style.backgroundImage = `url('${imageUrl}')`;
}

document.addEventListener('DOMContentLoaded', function() {
    let imageInput = document.getElementById('imageInput');
    let fileStatus = document.getElementById('fileStatus');
    let imagePreview = document.getElementById('imagePreview');

    imageInput.addEventListener('change', function() {
        if (imageInput.files.length > 0) {
            let file = imageInput.files[0];
            fileStatus.textContent = file.name;

            let reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                imagePreview.style.height = 'auto';

            }
            reader.readAsDataURL(file);
        } else {
            fileStatus.textContent = 'No files have been selected';
            imagePreview.style.display = 'none';
            imagePreview.src = '';
        }
    });
});


// document.getElementById('generate-pdf').addEventListener('click', async () => {
//     const content = document.getElementById('messageArea');
//
//     // Calculate the scale factor based on the content height and A4 page height
//     const pageHeight = 297; // A4 page height in mm
//     const contentHeight = content.scrollHeight;
//     const scaleFactor = pageHeight / (contentHeight * 0.264583); // Convert content height from px to mm (1px = 0.264583mm)
//
//     html2canvas(content, {
//         scale: 2, // Scale factor to improve resolution
//         useCORS: true,
//         allowTaint: false,
//         scrollX: 0,
//         scrollY: 0,
//         windowWidth: document.documentElement.offsetWidth,
//         windowHeight: document.documentElement.scrollHeight,
//     }).then(canvas => {
//         const imgData = canvas.toDataURL('image/png');
//
//         const imgWidth = 210; // Width in mm (A4)
//         const imgHeight = canvas.height * imgWidth / canvas.width;
//
//         const doc = new jsPDF({
//             orientation: 'p',
//             unit: 'mm',
//             format: 'a4',
//         });
//
//         // Add the image to the PDF
//         doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
//
//         // Save the PDF
//         doc.save('capture.pdf');
//     });
// });














// document.addEventListener('DOMContentLoaded', (event) => {
//     // Optionally, display an initial message from Professor Fish if needed
//     // displayMessage("=====================", "assistant");
//
//     // Listen for Enter key presses on the chat input field
//     document.getElementById('chatInput').addEventListener('keypress', function(e) {
//         if (e.key === 'Enter') {
//             e.preventDefault(); // Prevent the default action to avoid form submission
//             sendMessage(); // Trigger the sendMessage function
//         }
//     });
// });

const texts = ["LOADING", "이미지 분석 중...", "ANALYZING Image", "향료 추출 중...", "EXTRACTING Fragrances", "향수 이름 작명 중...", "MAKING Scent name", "Wait a minute", "곧 분석보고서가 나옵니다", "잠시만 기다려주세요"];
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
async function codeSubmit() {
    const passcode = document.getElementById('passcode').value;
    const securityButton = document.getElementById("securityButton");
    const securityElement = document.getElementById('security');
    const report = document.getElementById('report');
    const loader = document.getElementById('loader');

    securityButton.disabled = true;
    securityButton.style.backgroundColor = '#d3d3d3';
    const formGroup = document.getElementsByClassName("form__group");

    try {
        const response = await fetch('/imageMaster/passcode', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ passcode }),
        });

        const responseData = await response.json();

        // Wait for fade-in to complete
        await new Promise(resolve => setTimeout(resolve, 800));

        securityElement.classList.add('fade-out');

        // Wait for fade-out to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        securityElement.style.display = 'none';

        securityButton.disabled = false;
        securityButton.style.backgroundColor = 'black';

        // Show loading with fade-in
        report.style.display = "flex";
        pageTransition('loader');

        securityElement.classList.remove('fade-out');
        loader.style.opacity = '1';  // Ensure loader is fully visible

        setTimeout(async () => {
            if (responseData.status === 'validated') {
                loader.style.opacity = '0';

                // Wait for fade-out to complete
                await new Promise(resolve => setTimeout(resolve, 1300));

                loader.style.display = 'none';
                report.style.display = "none";
                await pageTransition('intro'); // Ensure intro transition happens after loader fades out

            } else {
                loader.style.opacity = '0';

                // Wait for fade-out to complete
                await new Promise(resolve => setTimeout(resolve, 1300));
                loader.style.display = 'none';

                securityElement.style.display = 'flex';
                securityElement.classList.add('fade-in');

                const alertMessage = responseData.status === 'already_used' ? '이미 사용된 비밀번호 입니다.' : '비밀번호가 틀렸습니다.';
                alert(alertMessage);

                report.classList.remove('fade-in');
                report.style.display = 'none';
                window.location.reload();
            }
        }, 2000); // Simulating a delay for the validation process
    } catch (error) {
        alert('비밀번호를 정확하게 입력하셔야 합니다.');
        window.location.reload();
    }
}


function imageUpload() {
    const imageCheck = document.getElementById('imageInput');
    // date value hidden
    // const birthInput = document.getElementById('date');
    const userCodeInput = document.getElementById('userCode');
    const inputName = document.getElementById('nameInput');
    const inputGender = document.getElementById('gender');
    const inputLanguage = document.getElementById('foreignerCheck');
    document.getElementById('report').style.display = "flex";
    console.log("hello : ", inputLanguage.value);



    // 일련번호 validation
    if (!userCodeInput.value.trim()) {
        alert('일련번호 작성해 주세요.');
        userCodeInput.focus();
        document.getElementById('report').style.display = "none";
        return;
    }
    // 이름 validation
    if (!inputName.value.trim()) {
        alert('이름을 작성해 주세요.');
        inputName.focus();
        document.getElementById('report').style.display = "none";
        return;
    }

    // 생년월일 validation(is now hidden)
    // if (!birthInput.value.trim()) {
    //     alert('생일 일자를 작성 해주세요.');
    //     birthInput.focus();
    //     document.getElementById('report').style.display = "none";
    //     return;
    // }
    // const birthDateRegex = /^\d+$/;
    // if (!birthDateRegex.test(birthInput.value.trim()) || birthInput.length > 8) {
    //     alert('생일일자에는 특수문자를 허용하지 않습니다.');
    //     birthInput.focus();
    //     document.getElementById('report').style.display = "none";
    //     return;
    // }
    //
    // if (birthInput.length > 8) {
    //     alert('생일일자는 8자만 허용합니다(특수문자 제외)');
    //     birthInput.focus();
    //     document.getElementById('report').style.display = "none";
    //     return;
    // }


    // Check if the gender has been selected
    if (!inputGender.value.trim()) {
        alert('성별을 골라주세요.');
        inputGender.focus();
        document.getElementById('report').style.display = "none";
        return;
    }
    if (!inputLanguage.value.trim()) {
        alert('언어를 골라주세요.');
        inputLanguage.focus();
        document.getElementById('report').style.display = "none";
        return;
    }

    // Check if an image has been uploaded
    if (imageCheck.files.length === 0) {
        alert('이미지 첨부를 해주세요.');
        imageCheck.focus();
        document.getElementById('report').style.display = "none";
        return;
    }

    // transitionToIntro(); // Transition the UI to the next step
    document.getElementById("intro").style.display = "none";
    sendImage();
}

// const pageTransition = (id) => {
//     let displayType = id === "intro" || "security" ? "flex" : "block";
//     document.getElementById(`${id}`).style.display = `${displayType}`;
// }

const pageTransition = async (id) => {


    let displayType = id === "intro" || id === "security" ? "flex" : "block";

    const element = document.getElementById(id);

    // Apply fade-in class
    element.style.display = displayType;
    element.classList.add('fade-in');

    // Wait for fade-in to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
}

function pageTransitionEnhanced(id) {
    document.body.style.height = "300vh";
    document.getElementById(`${id}`).style.display = 'none' ? 'flex' : 'none';
}
function reportSequenceTransition() {
    document.body.style.height = "100%";
    document.getElementById('report').style.display = "none";
    let insight = document.getElementById('reportOne');
    let targetElement = document.getElementById('reportOneElement');
    let targetReportElementHeight;
    let targetReportContainer;
    let reportElements = ["reportOne","reportHintOne", "reportTwo", "reportHintTwo","reportThree", "reportHintThree","reportFour", "reportHintFour", "reportLast"];
    let targetElementList = ["reportOneElement", "reportTwoElement", "reportThreeElement", "reportFourElement"];

    insight.style.height = `calc(${targetElement.style.height} + 160px)`;
    document.getElementById("intro").style.display = 'none';
    document.getElementById("reportSequence").style.display = 'flex';

    const assignHeight = () => {
        targetElementList.forEach((element, index) => {
            targetReportElementHeight  = document.getElementById(`${element}`).style.height;
            document.getElementById(`${reports[index]}`).style.height = `${element} === "reportOne"` ? `calc(${targetReportElementHeight} + 140px)` : `calc(${targetReportElementHeight} + 100px))`;})
    }
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    reportElements.forEach(report => {
        observer.observe(document.getElementById(report));
    });
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

const backToPage = () => {
    window.location.href = "https://acscent.co.kr";
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
    // date hidden
    // const birthInput = document.getElementById('date');
    const inputName = document.getElementById('nameInput');
    const inputGender = document.getElementById('gender');
    const inputUserCode = document.getElementById('userCode');
    const inputLanguage = document.getElementById('foreignerCheck');
    const imageInput = document.getElementById('imageInput');
    // console.log("can you get this?: " + birthInput.value);
    if (imageInput.files.length === 0) {
        alert('Please select an image to upload.');
        return;
    }

    function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: file.type }));
                        } else {
                            reject(new Error('Canvas is empty'));
                        }
                    }, file.type, quality);
                };

                img.onerror = (error) => {
                    reject(error);
                };
            };

            reader.onerror = (error) => {
                reject(error);
            };

            reader.readAsDataURL(file);
        });
    }

    const imageFile = imageInput.files[0];

    try {
        const compressedFile = await compressImage(imageFile);

        const formData = new FormData();
        formData.append('image', compressedFile); // Append the compressed file
        formData.append('gender', inputGender.value === "00" ? '남자' : '여자');
        formData.append('userCode', inputUserCode.value);
        let targetLanguage;
        let targetAlertMessage;
        if (inputLanguage.value === "00") {
            targetLanguage = "한국어";
            targetAlertMessage = "분석내용은 저장되지 않습니다. 곧바로 캡쳐해서 보관하세요!";
        }
        if (inputLanguage.value === "01") {
            targetLanguage = "영어";
            targetAlertMessage = "No analysis is saved. Make sure to capture the analysis results";

        }
        if (inputLanguage.value === "02") {
            targetLanguage = "중국어";
            targetAlertMessage = "分析内容未保存。分析结果请务必截图";
        }
        if (inputLanguage.value === "03") {
            targetLanguage = "일본어";
            targetAlertMessage = "分析内容が保存されていません。 分析結果は必ずキャプチャーをお願いします。";
        }

        formData.append('language', targetLanguage);
        // date hidden
        // formData.append('birthDate', birthInput.value);
        formData.append('name', inputName.value);
        // console.log("hello there" + document.getElementById('date').value);

        document.getElementById('loader').style.display = "flex"; // Show loading icon
        // document.getElementById('backButton').style.display = "none"; // Hide back button

        const response = await fetch('/imageMaster/image', {
            // local: http://localhost:3003/imageMaster/image
            // http://neander-perfume-maker-recommend-env.eba-dzkzephp.ap-northeast-2.elasticbeanstalk.com/imageMaster/image
            method: 'POST',
            // Don't set 'Content-Type': 'application/json' for FormData
            body: formData,
        });

        if (!response.ok) {
            alert('이미지 처리 중 문제가 발생했습니다.');
            backToPage();
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        // console.log("this is the answer: ", responseData);
        // console.log("target input name" + inputName.value);
        console.log(responseData.message.nameRecommendation);
        if (responseData.message.nameRecommendation === 'Name Recommendation not found') {
            alert("허용하지 않는 이미지 유형입니다.");
            window.location.href = "https://acscent.co.kr";
        }
        alert(`${targetAlertMessage}`);

        // pageTransition("report");
        // console.log('hello' + responseData.message.combinedInsights);
        // displayReport(responseData.message.combinedInsights, "testing", 'targetInsight');
        // displayReport(responseData.message.topNote, "testing", 'targetTopNote');
        // displayReport(responseData.message.middleNote, "testing", 'targetMiddleNote');
        // displayReport(responseData.message.baseNote, "testing", 'targetBaseNote');
        // displayReport(responseData.message.nameRecommendation, "testing", 'targetNameRecommend');

        reportSequenceTransition();
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
        // document.getElementById('loader').style.display = "none"; // Hide loading icon
        // document.getElementById('backButton').style.display = "block"; // Show back button
        const loader = document.getElementById('loader');
        // const backButton = document.getElementById('backButton');

        loader.classList.add('hidden'); // Add the hidden class to trigger fade-out

        // Wait for the transition to complete before setting display to none
        loader.addEventListener('transitionend', function handleTransitionEnd() {
            loader.style.display = "none"; // Hide loading icon
            loader.classList.remove('hidden'); // Remove the hidden class so it can be used again
            loader.removeEventListener('transitionend', handleTransitionEnd); // Clean up the event listener
        });

        // backButton.style.display = "block"; // Show back button
    }
}

const compressedReport = () => {
    const reportTitle = document.getElementById('chunktargetNameRecommend').innerText;
    const reportOne = document.getElementById('chunktargetInsight').innerText;
    const reportTwo = document.getElementById('chunktargetTopNote').innerText;
    const reportThree = document.getElementById('chunktargetMiddleNote').innerText;
    const reportFour = document.getElementById('chunktargetBaseNote').innerText;
    const compressedMainPage = document.getElementById('reportCompressedPage');
    compressedMainPage.style.color = "black";
    const screenShotLineMaker = document.createElement('div');
    const screenShotLineMakerStatement = document.createElement('div');

    compressedMainPage.appendChild(screenShotLineMaker);
    screenShotLineMaker.appendChild(screenShotLineMakerStatement);
    screenShotLineMaker.style.width = '100%';
    screenShotLineMakerStatement.className = 'dottedLine';

    compressedMainPage.insertBefore(document.getElementById('messageArea'), compressedMainPage.firstChild);
    document.getElementById('loader').style.display = "none";
    document.getElementById('report').style.display = "flex";
    document.getElementById('reportSequence').style.display = 'none';
    document.getElementById('reportCompressedPage').style.display = "flex";

    // you need to make p tag element and insert text element in it for this from displayReport function
    // compressedMainPage.querySelectorAll('p').forEach(p => {
    //     p.style.fontSize = '12px';
    // });


    document.body.style.height = '100vh';
    document.body.style.maxWidth = '100%';
    document.body.style.width = '100%';
    document.getElementById('report').style.marginTop = '0';
    document.getElementById('report').style.padding = '0';
    document.getElementById('report').style.height = '100%';
    document.getElementById('report-main').style.display = 'none';
    document.getElementById('reportCompressedPage').style.backgroundColor = 'white';
    // document.getElementById('messageArea').style.marginTop = "30px";
    displayReport(reportOne, "preview", 'previewInsight');
    displayReport(reportTwo, "preview", 'previewTopNote');
    displayReport(reportThree, "preview", 'previewMiddleNote');
    displayReport(reportFour, "preview", 'previewBaseNote');
    displayReport(reportTitle, "preview", 'previewName');








}

const revertCompressedReport = () => {
    document.getElementById('reportSequence').style.display = 'flex';
    document.getElementById('reportCompressedPage').style.display = "none";
    document.body.style.height = '100vh';
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
    messageElement.style.fontSize = '20px';
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight; // Scroll to the bottom to show the latest message
}




function displayReport(message, sender, targetID, ) {

    const targetArea = document.getElementById(targetID);
    const messageElement = document.createElement('div');
    messageElement.id = `chunk${targetID}`;
    messageElement.style.fontFamily = `'MaruBuri', sans-serif`;
    messageElement.textContent = message;
    messageElement.style.textAlign = "left";
    messageElement.className = sender;
    // messageElement.style.marginBottom = '5px'; // Add margin between messages
    // messageElement.style.marginTop = '20px';
    if (targetID === 'targetNameRecommend') {
        messageElement.style.fontSize = '22px';
        messageElement.style.textAlign = "left";
        messageElement.style.color = 'black';
        messageElement.style.margin = '0 20px 0 20px';
    } else if (targetID === 'targetNameRecommend') {
        messageElement.style.width = '250px';
    } else {
        messageElement.style.fontSize = '16px';
    }
    targetArea.appendChild(messageElement);
    targetArea.scrollTop = targetArea.scrollHeight; // Scroll to the bottom to show the latest message
}







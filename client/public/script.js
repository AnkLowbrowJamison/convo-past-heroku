import bot from './assets/bot.svg'
import user from './assets/user.svg'

const form = document.querySelector('form')
const chatContainer = document.querySelector('#chat_container')
const HEROKU_APP_URL = 'https://convo-past-v1.herokuapp.com'; // replace with your Heroku app's URL

let loadInterval

function loader(element) {
    element.textContent = ''

    loadInterval = setInterval(() => {
        if (element.textContent === '....') {
            element.textContent = '';
        } else {
            element.textContent += '.';
        }
    }, 300);
}

function typeText(element, text) {
    let index = 0

    let interval = setInterval(() => {
        if (index < text.length) {
            element.innerHTML += text.charAt(index)
            index++
        } else {
            clearInterval(interval)
        }
    }, 10)
}

function generateUniqueId() {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
}

function chatStripe(isAi, value, uniqueId) {
    return (
        `
        <div class="wrapper ${isAi && 'ai'}">
            <div class="chat">
                <div class="profile">
                    <img src=${isAi ? bot : user} alt="${isAi ? 'bot' : 'user'}" />
                </div>
                <div class="message" id=${uniqueId}>${value}</div>
            </div>
        </div>
    `
    )
}

const getGuideFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('guide') || 'DefaultGuide';
}

const handleSubmit = async (e) => {
    e.preventDefault();

    const guide = getGuideFromURL();
    const data = new FormData(form)

    chatContainer.innerHTML += chatStripe(false, data.get('prompt'))

    const conversation = JSON.parse(localStorage.getItem(guide)) || [];
    conversation.push({ role: 'user', content: data.get('prompt') });
    localStorage.setItem(guide, JSON.stringify(conversation));

    form.reset()

    const uniqueId = generateUniqueId()
    chatContainer.innerHTML += chatStripe(true, " ", uniqueId)

    chatContainer.scrollTop = chatContainer.scrollHeight;

    const messageDiv = document.getElementById(uniqueId)

    loader(messageDiv);

    const response = await fetch(`${HEROKU_APP_URL}/chat/${guide}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            prompt: data.get('prompt')
        })
    })

    clearInterval(loadInterval);
    messageDiv.innerHTML = " "

    if (response.ok) {
        const data = await response.json();
        const parsedData = data.bot.trim();

        typeText(messageDiv, parsedData);

        conversation.push({ role: 'bot', content: parsedData });
        localStorage.setItem(guide, JSON.stringify(conversation));
    } else {
        const err = await response.text();

        messageDiv.innerHTML = "Something went wrong"
        alert(err);
    }
}

function loadConversation() {
    const guide = getGuideFromURL();
    const conversation = JSON.parse(localStorage.getItem(guide)) || [];

    for (let message of conversation) {
        const uniqueId = generateUniqueId();
        chatContainer.innerHTML += chatStripe(message.role === 'bot', message.content, uniqueId);
    }
}
window.onload = function() {
    let guide = getGuideFromURL();
    document.body.className = guide; // this will add the guide name as a class to the body

    form.addEventListener('submit', handleSubmit);
    form.addEventListener('keyup', (e) => {
        if (e.keyCode === 13) {
            handleSubmit(e);
        }
    });

    loadConversation();

    // Scroll to the last message when the page loads
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Get the button by its id
const clearHistoryButton = document.getElementById('clear-history');

// Add an event listener to the button
clearHistoryButton.addEventListener('click', function() {
    // Get the guide from the URL
    let guide = getGuideFromURL();

    // Clear the localStorage for the guide
    localStorage.removeItem(guide);

    // Clear the chat container
    chatContainer.innerHTML = '';
});

'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var image = document.querySelector("#image");
var reader = new FileReader();

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];
//
function connect(event) {
    console.log("client is connected to web server!!!");
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');
        //this is for handshake!!!!
        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);
        //this is for message broker!!!
       stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}
//
//
function onConnected() {
//     Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}
//
//
function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}

//
function sendMessage(event) {
console.log("Senbd message is called!!!!");
    var messageContent = messageInput.value.trim();
    var imageContent = image.files[0];
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    if(imageContent!==undefined){
         sendImage();
    }
    event.preventDefault();
}
function sendImage(){
    reader.onloadend = function() {
          console.log('RESULT', reader.result)
          var chatMessage = {
                      sender: username,
                      content: reader.result,
                      type: 'IMAGE'
          };
          stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
          image.value = "";
    }
    reader.readAsDataURL(image.files[0]);
}
//this will called when we get an message frame!!!
function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
        }
    else {
        messageElement.classList.add('chat-message');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
        //subhma.abhi.harmnan
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);

    if(message.type==='IMAGE'){
        var imagTag = document.createElement('img');
        imagTag.src = message.content;
        imagTag.style.width = '140px';
        imagTag.style.height = '140px';
        textElement.appendChild(imagTag);
        //messageElement.appendChild(textElement);
    }
    else
        textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}
//
usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)
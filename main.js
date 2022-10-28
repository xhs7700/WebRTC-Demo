const videoGrid = document.getElementById("video-grid");
const videoSet = new Set()
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");
const title = document.querySelector('h3#title')
const joinButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
let text = document.querySelector("#chat_message");
let roomMsg = document.querySelector('#room_message')
let send = document.getElementById("send");
let messages = document.querySelector(".messages");
let myVideoStream;
let roomId = getRndInteger(100000, 1000000)

title.textContent = `Virtual Room #${roomId}`

backBtn.addEventListener("click", () => {
    document.querySelector(".main__left").style.display = "flex";
    document.querySelector(".main__left").style.flex = "1";
    document.querySelector(".main__right").style.display = "none";
    document.querySelector(".header__back").style.display = "none";
});

showChat.addEventListener("click", () => {
    document.querySelector(".main__right").style.display = "flex";
    document.querySelector(".main__right").style.flex = "1";
    document.querySelector(".main__left").style.display = "none";
    document.querySelector(".header__back").style.display = "block";
});

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

function addMessage(msg, user) {
    messages.innerHTML = messages.innerHTML +
        `<div class="message">
               <b><i class="far fa-user-circle"></i> <span>${user}</span> </b>
                <span>${msg}</span>
            </div>`
}

function dataConnHandler(dataConn) {
    bindView(dataConn)
    dataConn.on('data', (msg) => {
        addMessage(msg, 'guest')
    })
}

function mediaConnHandler(mediaConn) {
    mediaConn.answer(myVideoStream)
    mediaConn.on('stream', remoteStreamHandler)
}

function remoteStreamHandler(remoteStream) {
    const video = document.createElement("video")
    addVideoStream(video, remoteStream)
}

function bindView(dataConn) {
    send.onclick = () => {
        if (text.value.length !== 0) {
            addMessage(text.value, 'me')
            dataConn.send(text.value)
            text.value = ""
        }
    }
    text.onkeydown = (ev) => {
        if (ev.key === "Enter" && text.value.length !== 0) {
            addMessage(text.value, 'me')
            dataConn.send(text.value)
            text.value = "";
        }
    }
}

function addVideoStream(video, stream) {
    if (videoSet.has(stream.id)) return
    videoSet.add(stream.id)
    console.log('stream id = ', stream.id)
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
        videoGrid.append(video);
    });
}

function addRoom(roomId) {
    navigator.mediaDevices.getUserMedia({video: true, audio: true})
        .then((stream) => {
            myVideoStream = stream
            const video = document.createElement("video")
            addVideoStream(video, myVideoStream)
        })
        .catch((err) => console.error('Failed to get local stream', err))
    const peer = new Peer(roomId.toString())
    peer.on('open', () => {
        peer.on('connection', dataConnHandler)
        peer.on('call', mediaConnHandler)
    })
}

function joinRoom(roomId) {
    const peer = new Peer()
    peer.on('open', () => {
        const dataConn = peer.connect(roomId.toString())
        dataConnHandler(dataConn)
        const mediaConn = peer.call(roomId.toString(), myVideoStream)
        mediaConn.on('stream', remoteStreamHandler)
    })
}

muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        const html = `<i class="fas fa-microphone-slash"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    } else {
        myVideoStream.getAudioTracks()[0].enabled = true;
        const html = `<i class="fas fa-microphone"></i>`;
        muteButton.classList.toggle("background__red");
        muteButton.innerHTML = html;
    }
});
stopVideo.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        const html = `<i class="fas fa-video-slash"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    } else {
        myVideoStream.getVideoTracks()[0].enabled = true;
        const html = `<i class="fas fa-video"></i>`;
        stopVideo.classList.toggle("background__red");
        stopVideo.innerHTML = html;
    }
});

joinButton.addEventListener('click', () => {
    const newRoomId = parseInt(roomMsg.value);
    roomMsg.value = ""
    if (100000 <= newRoomId && newRoomId < 1000000) {
        roomId = newRoomId
        title.textContent = `Virtual Room #${roomId}`
        videoSet.clear()
        videoGrid.innerHTML = ""
        const video = document.createElement("video")
        addVideoStream(video, myVideoStream)
        messages.innerHTML = ""
        joinRoom(roomId)
    }
})

addRoom(roomId)
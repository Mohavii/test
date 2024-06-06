const socket = io();
let localStream;
let peerConnection;

const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

async function startCamera() {
    const constraints = {
        video: {
            facingMode: 'user'
        },
        audio: false
    };

    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        const localVideo = document.getElementById('localVideo');
        localVideo.srcObject = localStream;

        socket.emit('join', 'room1'); // Join a specific room for signaling

        socket.on('offer', async (offer) => {
            if (!peerConnection) createPeerConnection();

            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit('answer', answer);
        });

        socket.on('answer', (answer) => {
            peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on('candidate', (candidate) => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });

        if (!peerConnection) createPeerConnection();
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', offer);

    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

function createPeerConnection() {
    peerConnection = new RTCPeerConnection(config);

    peerConnection.addEventListener('icecandidate', (event) => {
        if (event.candidate) {
            socket.emit('candidate', event.candidate);
        }
    });

    peerConnection.addEventListener('track', (event) => {
        const remoteVideo = document.getElementById('remoteVideo');
        remoteVideo.srcObject = event.streams[0];
    });

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    });
}

startCamera();

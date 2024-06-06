const socket = io();
let peerConnection;

const config = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

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
}

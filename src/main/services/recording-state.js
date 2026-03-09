let isRecording = false;
let currentSessionId = 0;

function setRecording(nextState) {
    if (nextState === isRecording) {
        return { isRecording, sessionId: currentSessionId };
    }

    isRecording = nextState;

    if (isRecording) {
        currentSessionId += 1;
    }

    return { isRecording, sessionId: currentSessionId };
}

function toggleRecording() {
    return setRecording(!isRecording);
}

function getRecordingState() {
    return { isRecording, sessionId: currentSessionId };
}

module.exports = {
    getRecordingState,
    setRecording,
    toggleRecording
};

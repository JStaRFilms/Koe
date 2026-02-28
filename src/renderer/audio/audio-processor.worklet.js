class AudioProcessor extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input.length > 0) {
            const channelData = input[0];
            // Copy data to avoid mutation issues before posting it
            const dataToPost = new Float32Array(channelData);
            this.port.postMessage(dataToPost);
        }
        return true;
    }
}

// Register the worklet processor
registerProcessor('audio-processor', AudioProcessor);

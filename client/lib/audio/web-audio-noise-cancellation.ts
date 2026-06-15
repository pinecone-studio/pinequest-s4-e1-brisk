export type MicrophoneCapture = {
  stream: MediaStream;
  dispose: () => void;
};

export async function openMicrophoneCapture(options: {
  noiseCancellation: boolean;
}): Promise<MicrophoneCapture> {
  const rawStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      noiseSuppression: false,
      echoCancellation: false,
      autoGainControl: false,
    },
  });

  if (!options.noiseCancellation) {
    return {
      stream: rawStream,
      dispose: () => {
        rawStream.getTracks().forEach((track) => track.stop());
      },
    };
  }

  const context = new AudioContext();
  await context.resume();

  const source = context.createMediaStreamSource(rawStream);
  const highPass = context.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = 95;
  highPass.Q.value = 0.7;

  const lowPass = context.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 11_000;
  lowPass.Q.value = 0.7;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -45;
  compressor.knee.value = 18;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.12;

  const gateGain = context.createGain();
  gateGain.gain.value = 1;

  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.65;

  const destination = context.createMediaStreamDestination();

  source.connect(highPass);
  highPass.connect(lowPass);
  lowPass.connect(compressor);
  compressor.connect(gateGain);
  gateGain.connect(analyser);
  gateGain.connect(destination);

  const levelBuffer = new Float32Array(analyser.fftSize);
  const noiseFloor = { value: 0.012 };
  let rafId = 0;

  const runNoiseGate = () => {
    analyser.getFloatTimeDomainData(levelBuffer);

    let sumSquares = 0;
    for (let index = 0; index < levelBuffer.length; index += 1) {
      const sample = levelBuffer[index] ?? 0;
      sumSquares += sample * sample;
    }

    const rms = Math.sqrt(sumSquares / levelBuffer.length);
    noiseFloor.value = Math.min(noiseFloor.value * 0.985 + rms * 0.015, 0.05);
    const openThreshold = noiseFloor.value * 2.4 + 0.004;
    const targetGain = rms > openThreshold ? 1 : 0.08;

    gateGain.gain.setTargetAtTime(targetGain, context.currentTime, 0.04);
    rafId = window.requestAnimationFrame(runNoiseGate);
  };

  rafId = window.requestAnimationFrame(runNoiseGate);

  return {
    stream: destination.stream,
    dispose: () => {
      window.cancelAnimationFrame(rafId);
      source.disconnect();
      highPass.disconnect();
      lowPass.disconnect();
      compressor.disconnect();
      gateGain.disconnect();
      analyser.disconnect();
      void context.close();
      rawStream.getTracks().forEach((track) => track.stop());
    },
  };
}

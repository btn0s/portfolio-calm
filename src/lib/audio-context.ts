type AudioContextConstructor = typeof AudioContext;

let context: AudioContext | null = null;
const primedContexts = new WeakSet<AudioContext>();

export function getAudioContext(): AudioContext | null {
  if (context && context.state !== "closed") return context;
  if (context?.state === "closed") context = null;
  if (typeof window === "undefined") return null;

  const Constructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext;

  if (!Constructor) return null;

  try {
    context = new Constructor();
  } catch {
    return null;
  }

  return context;
}

function startSilentUnlock(audioContext: AudioContext) {
  if (primedContexts.has(audioContext)) return;

  try {
    const buffer = audioContext.createBuffer(
      1,
      1,
      audioContext.sampleRate,
    );
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.onended = () => source.disconnect();
    source.start();
    primedContexts.add(audioContext);
  } catch {
    // Some browsers unlock on resume alone. Leave the context retryable.
  }
}

export async function primeAudioContext() {
  const audioContext = getAudioContext();
  if (!audioContext) return false;
  // This must happen before the first await so it remains inside the trusted
  // pointer/key event on mobile browsers.
  startSilentUnlock(audioContext);
  if (audioContext.state === "running") return true;

  try {
    await audioContext.resume();
    return (audioContext.state as AudioContextState) === "running";
  } catch {
    return false;
  }
}

// Text-to-Speech (Speaker)
export function speakText(text, language = 'en-US') {
  if (!('speechSynthesis' in window)) {
    alert("Text-to-speech is not supported on this device.")
    return
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = language
  utterance.rate = 0.9 // Slightly slower for clarity
  window.speechSynthesis.speak(utterance)
}

// Speech-to-Text (Microphone)
export function startListening(onResult, onError, language = 'en-US') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  
  if (!SpeechRecognition) {
    onError("Voice recognition is not supported on this browser.")
    return null
  }

  const recognition = new SpeechRecognition()
  recognition.lang = language
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    onResult(transcript)
  }

  recognition.onerror = (event) => {
    onError(event.error)
  }

  recognition.start()
  return recognition
}
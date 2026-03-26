// Anonymous session logging to Google Sheets via Apps Script web app.
// Set SHEETS_ENDPOINT to your deployed Apps Script URL to enable logging.
// If the endpoint is empty, all log calls are silent no-ops.

const SHEETS_ENDPOINT = ""; // TODO: paste your Apps Script /exec URL here

let _sessionId = null;

export function getSessionId() {
  if (!_sessionId) {
    _sessionId =
      Math.random().toString(36).slice(2, 10) +
      Date.now().toString(36).slice(-5);
  }
  return _sessionId;
}

export function logChoice({ npcId, choiceKey, choiceLabel }) {
  if (!SHEETS_ENDPOINT) return;
  fetch(SHEETS_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: getSessionId(),
      npcId,
      choiceKey,
      choiceLabel,
      timestamp: new Date().toISOString(),
    }),
  }).catch(() => {}); // silent fail — never interrupt gameplay
}

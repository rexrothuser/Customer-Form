// index.js
document.addEventListener('DOMContentLoaded', function () {
console.log('index.js loaded');

// CONFIG: FLOW URL and reCAPTCHA site key (already inserted)
const FLOW_URL = 'https://default0ae51e1907c84e4bbb6d648ee58410.f4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1f6f13bc2d7a4b508a04bb8b03bc3342/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oL23bmTH8ieQn3nR8OyzhCwOqv-rbWuUt1P8OBVnDWo';
const SITE_KEY = '6LdIBVksAAAAADS_4esakyQRplz0hq72OcQhBWF3';

// Relief pressure validation
const reliefInput = document.getElementById('reliefPressure');
const reliefError = document.getElementById('reliefError');
if (reliefInput && reliefError) {
reliefInput.addEventListener('input', () => {
const value = Number(reliefInput.value);
if (value && value < 50) reliefError.textContent = 'Relief pressure too low. Check hydraulic system type.';
else if (value && value > 450) reliefError.textContent = 'Relief pressure exceeds motor rating.';
else reliefError.textContent = '';
});
}

// Helper: obtain a reCAPTCHA token with timeout and error handling
function obtainRecaptchaToken(action = 'submit', timeoutMs = 10000) {
return new Promise((resolve, reject) => {
if (!window.grecaptcha || typeof grecaptcha.execute !== 'function') {
return reject(new Error('grecaptcha_not_available'));
}

  let finished = false;
  const timer = setTimeout(() => {
    if (finished) return;
    finished = true;
    reject(new Error('recaptcha_timeout'));
  }, timeoutMs);

  try {
    grecaptcha.ready(() => {
      grecaptcha.execute(SITE_KEY, { action })
        .then(token => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          if (!token) return reject(new Error('empty_token'));
          resolve(token);
        })
        .catch(err => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          reject(err || new Error('grecaptcha_execute_error'));
        });
    });
  } catch (err) {
    if (!finished) {
      finished = true;
      clearTimeout(timer);
      reject(err || new Error('grecaptcha_exception'));
    }
  }
});


}

// helper: POST payload to flow and handle response. RETURNS the fetch promise.
function doPost(finalPayload) {
console.log('Attempting POST to FLOW URL (truncated payload):', JSON.stringify(finalPayload).slice(0,300));
if (!FLOW_URL || FLOW_URL.includes('REPLACE_ME')) {
console.error('FLOW_URL not configured.');
alert('FLOW_URL not configured. See console.');
return Promise.reject(new Error('flow_url_missing'));
}

return fetch(FLOW_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(finalPayload)
})
.then(async response => {
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { console.warn('Failed to parse flow response as JSON:', e); }

  console.log('Fetch completed, status:', response.status, 'text:', text, 'json:', json);

  // If server returned an HTTP error, show it
  if (!response.ok) {
    const message = (json && json.message) ? json.message : `Server error ${response.status}`;
    alert('Submission failed: ' + message);
    throw new Error(message || 'flow_response_not_ok');
  }

  // Treat an empty response body as success (this avoids false client-side rejection)
  // If the server returns JSON with a 'success' boolean, respect it.
  const ok = (json === null) ? true : (('success' in json) ? json.success : true);

  if (!ok) {
    const message = (json && json.message) ? json.message : 'Verification failed';
    alert('Submission rejected: ' + message);
    // return resolved response so caller knows request finished
    return response;
  }

  // success -> show popup
  const popup = document.createElement('div');
  popup.className = 'popup show';
  popup.innerHTML = `<h2>Form Submitted Successfully</h2>
    <p>Thank you for your submission, ${finalPayload.customer}.</p>
    <button id="closePopup">Close</button>`;
  document.body.appendChild(popup);
  document.getElementById('closePopup').addEventListener('click', () => popup.remove());

  return response;
})
.catch(err => {
  console.error('Fetch/flow error:', err);
  // show a friendly message (avoid double-throwing user-visible error)
  alert('Submission failed — see console for details.');
  throw err;
});


}

const form = document.getElementById('motorForm');
if (!form) {
console.error('Form element not found: id="motorForm"');
return;
}

form.addEventListener('submit', function (e) {
e.preventDefault();
console.log('submit handler fired');

// Collect all form values
const payload = {
  customer: document.getElementById('customer')?.value || '',
  date: document.getElementById('date')?.value || '',
  machineType: document.getElementById('machineType')?.value || '',
  projectNumber: document.getElementById('projectNumber')?.value || '',
  customerContact: document.getElementById('customerContact')?.value || '',
  rexrothContact: document.getElementById('rexrothContact')?.value || '',
  motorSelection: document.getElementById('motorSelection')?.value || '',
  annualQuantity: document.getElementById('annualQuantity')?.value || '',
  standards: document.getElementById('standards')?.value || '',
  productionStartDate: document.getElementById('productionStartDate')?.value || '',
  environmentalConsiderations: document.getElementById('environmentalConsiderations')?.value || '',
  email: document.getElementById('email')?.value || '',
  annualUsage: document.getElementById('annualUsage')?.value || '',
  flushingRequired: document.getElementById('flushingRequired')?.value || '',
  hydraulicSystemType: document.getElementById('hydraulicSystemType')?.value || '',
  flushingRate: document.getElementById('flushingRate')?.value || '',
  machineWeightMin: document.getElementById('machineWeightMin')?.value || '',
  fluidManufacturer: document.getElementById('fluidManufacturer')?.value || '',
  machineWeightMax: document.getElementById('machineWeightMax')?.value || '',
  fluidSpecification: document.getElementById('fluidSpecification')?.value || '',
  reliefPressure: document.getElementById('reliefPressure')?.value || '',
  fluidTemperature: document.getElementById('fluidTemperature')?.value || '',
  chargePressure: document.getElementById('chargePressure')?.value || '',
  paintRequired: document.getElementById('paintRequired')?.value || '',
  drainPressure: document.getElementById('drainPressure')?.value || '',
  speedSensorRequired: document.getElementById('speedSensorRequired')?.value || '',
  tractiveEffort: document.getElementById('tractiveEffort')?.value || '',
  sensorPowerSupply: document.getElementById('sensorPowerSupply')?.value || '',
  maxSpeedFull: document.getElementById('maxSpeedFull')?.value || '',
  brakeRequirements: document.getElementById('brakeRequirements')?.value || '',
  maxSpeedReduced: document.getElementById('maxSpeedReduced')?.value || '',
  staticBrakeTorque: document.getElementById('staticBrakeTorque')?.value || '',
  dynamicBrakeTorque: document.getElementById('dynamicBrakeTorque')?.value || ''
};

// disable submit button to avoid double submissions
const submitBtn = form.querySelector('button[type="submit"]');
if (submitBtn) submitBtn.disabled = true;

// ensure grecaptcha available
if (!window.grecaptcha || typeof grecaptcha.execute !== 'function' || !SITE_KEY || SITE_KEY === 'SITE_KEY_REPLACE_ME') {
  console.error('reCAPTCHA not available or SITE_KEY not set. Submission aborted to avoid missing recaptchaToken.');
  alert('reCAPTCHA unavailable — disable tracking protection or test in another browser, then try again.');
  if (submitBtn) submitBtn.disabled = false;
  return;
}

console.log('grecaptcha detected; requesting token');

obtainRecaptchaToken('submit', 10000)
  .then(token => {
    console.log('recaptcha token (full):', token);
    payload.recaptchaToken = token;
    console.log('payload before fetch:', JSON.stringify(payload));
    return doPost(payload); // doPost returns a Promise
  })
  .catch(err => {
    console.error('reCAPTCHA/token error:', err);
    if (err.message === 'grecaptcha_not_available') {
      alert('reCAPTCHA not available. Disable tracker blocking or try another browser.');
    } else if (err.message === 'recaptcha_timeout') {
      alert('reCAPTCHA timed out. Try again.');
    } else if (err.message === 'empty_token') {
      alert('reCAPTCHA returned an empty token. Try again.');
    } else {
      alert('reCAPTCHA failed — submission aborted. See console for details.');
    }
  })
  .finally(() => {
    if (submitBtn) submitBtn.disabled = false;
  });


});
});

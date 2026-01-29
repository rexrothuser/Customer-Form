// index.js
document.addEventListener('DOMContentLoaded', function () {
console.log('index.js loaded');

const SITE_KEY = '6LdIBVksAAAAADS_4esakyQRplz0hq72OcQhBWF3';
const FLOW_URL = 'https://default0ae51e1907c84e4bbb6d648ee58410.f4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1f6f13bc2d7a4b508a04bb8b03bc3342/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oL23bmTH8ieQn3nR8OyzhCwOqv-rbWuUt1P8OBVnDWo';

// Relief pressure inline validation
const reliefInput = document.getElementById('reliefPressure');
const reliefError = document.getElementById('reliefError');
if (reliefInput && reliefError) {
reliefInput.addEventListener('input', () => {
const value = Number(reliefInput.value);
if (value && value < 50) reliefError.textContent = 'Relief pressure too low.';
else if (value && value > 450) reliefError.textContent = 'Relief pressure exceeds rating.';
else reliefError.textContent = '';
});
}

// obtain token with timeout
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

// doPost: posts payload, tolerates empty response body as success
function doPost(finalPayload) {
console.log('Attempting POST to FLOW URL (payload):', JSON.stringify(finalPayload).slice(0,1000));
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
  try { json = text ? JSON.parse(text) : null; } catch (e) { console.warn('Flow response not JSON:', e); }
  console.log('Fetch completed, status:', response.status, 'bodyText:', text, 'json:', json);

  if (!response.ok) {
    const message = (json && json.message) ? json.message : `Server error ${response.status}`;
    alert('Submission failed: ' + message);
    throw new Error(message || 'flow_response_not_ok');
  }

  // if server returned no body, treat as success; if JSON returned, respect success flag
  const ok = (json === null) ? true : (('success' in json) ? json.success : true);
  if (!ok) {
    const message = (json && json.message) ? json.message : 'Verification failed';
    alert('Submission rejected: ' + message);
    return response;
  }

  // success popup
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
  alert('Submission failed — see console for details.');
  throw err;
});


}

const form = document.getElementById('motorForm');
if (!form) return;

form.addEventListener('submit', function (e) {
e.preventDefault();
console.log('submit handler fired');

// gather payload (IDs match inputs above)
const payload = {
  applicationType: document.getElementById('applicationType')?.value || '',
  customer: document.getElementById('customer')?.value || '',
  date: document.getElementById('date')?.value || '',
  machineType: document.getElementById('machineType')?.value || '',
  machineName: document.getElementById('machineName')?.value || '',
  customerContact: document.getElementById('customerContact')?.value || '',
  rexrothContact: document.getElementById('rexrothContact')?.value || '',
  provisionalMotorSelection: document.getElementById('provisionalMotorSelection')?.value || '',
  annualMotorQuantity: document.getElementById('annualMotorQuantity')?.value || '',
  countryStandards: document.getElementById('countryStandards')?.value || '',
  estimatedProductionStartDate: document.getElementById('productionStartDate')?.value || '',
  specialEnvironmentalConditions: document.getElementById('specialEnvironmentalConditions')?.value || '',

  expectedAnnualUsage: document.getElementById('annualUsage')?.value || '',
  hydraulicSystemType: document.getElementById('hydraulicSystemType')?.value || '',
  maximumMachineWeight: document.getElementById('machineWeightMax')?.value || '',
  minimumMachineWeight: document.getElementById('machineWeightMin')?.value || '',
  reliefPressure: document.getElementById('reliefPressure')?.value || '',
  chargePressure: document.getElementById('chargePressure')?.value || '',
  casePressure: document.getElementById('drainPressure')?.value || '',
  maximumTractiveEffort: document.getElementById('tractiveEffort')?.value || '',
  maxSpeedFullDisplacement: document.getElementById('maxSpeedFull')?.value || '',
  maxSpeedReducedDisplacement: document.getElementById('maxSpeedReduced')?.value || '',
  flushingRequired: document.getElementById('flushingRequired')?.value || '',
  flushingRateInfo: document.getElementById('flushingRate')?.value || '',
  fluidManufacturer: document.getElementById('fluidManufacturer')?.value || '',
  fluidViscosityGrade: document.getElementById('fluidSpecification')?.value || '',
  maxFluidTemperature: document.getElementById('fluidTemperature')?.value || '',
  paintRequired: document.getElementById('paintRequired')?.value || '',
  speedSensorRequired: document.getElementById('speedSensorRequired')?.value || '',
  speedSensorPowerDetails: document.getElementById('sensorPowerSupply')?.value || '',
  parkingBrakeRequired: document.getElementById('parkingBrakeRequired')?.value || '',
  wheelRollerDiameter: document.getElementById('wheelRollerDiameter')?.value || '',

  numberOfMotorsPerMachine: document.getElementById('numberOfMotorsPerMachine')?.value || '',
  vehicleUsesFreewheel: document.getElementById('vehicleUsesFreewheel')?.value || '',
  wheelLoadOffset: document.getElementById('wheelLoadOffset')?.value || '',
  wheelStudsRequired: document.getElementById('wheelStudsRequired')?.value || '',
  desiredWheelInstallationPCD: document.getElementById('desiredWheelInstallationPCD')?.value || '',
  desiredWheelInstallationHolePattern: document.getElementById('desiredWheelInstallationHolePattern')?.value || '',
  desiredMotorInstallationPCD: document.getElementById('desiredMotorInstallationPCD')?.value || '',
  desiredMotorInstallationHolePattern: document.getElementById('desiredMotorInstallationHolePattern')?.value || '',
  desiredPortType: document.getElementById('desiredPortType')?.value || '',
  machineDutyCycle: document.getElementById('machineDutyCycle')?.value || '',

  brakeRequirements: document.getElementById('brakeRequirements')?.value || '',
  staticBrakeTorqueReq: document.getElementById('staticBrakeTorque')?.value || '',
  dynamicBrakeTorqueReq: document.getElementById('dynamicBrakeTorque')?.value || ''
};

const submitBtn = form.querySelector('button[type="submit"]');
if (submitBtn) submitBtn.disabled = true;

if (!window.grecaptcha || typeof grecaptcha.execute !== 'function') {
  alert('reCAPTCHA not available; disable tracker protection or try another browser.');
  if (submitBtn) submitBtn.disabled = false;
  return;
}

obtainRecaptchaToken('submit', 10000)
  .then(token => {
    console.log('recaptcha token (full):', token);
    payload.recaptchaToken = token;
    console.log('payload before fetch (truncated):', JSON.stringify(payload).slice(0,1200));
    return doPost(payload);
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

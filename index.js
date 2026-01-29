// index.js
document.addEventListener('DOMContentLoaded', function () {
console.log('index.js loaded');

// CONFIG: your Flow URL and reCAPTCHA site key (already inserted)
const FLOW_URL = 'https://default0ae51e1907c84e4bbb6d648ee58410.f4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1f6f13bc2d7a4b508a04bb8b03bc3342/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oL23bmTH8ieQn3nR8OyzhCwOqv-rbWuUt1P8OBVnDWo';
const SITE_KEY = '6LdIBVksAAAAADS_4esakyQRplz0hq72OcQhBWF3';

// Relief pressure validation UI
const reliefInput = document.getElementById('reliefPressure');
const reliefError = document.getElementById('reliefError');
if (reliefInput && reliefError) {
reliefInput.addEventListener('input', () => {
const value = Number(reliefInput.value);
if (value && value < 50) {
reliefError.textContent = 'Relief pressure too low. Check hydraulic system type.';
} else if (value && value > 450) {
reliefError.textContent = 'Relief pressure exceeds motor rating.';
} else {
reliefError.textContent = '';
}
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

// Collect form values
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

// helper to POST payload
function doPost(finalPayload) {
  console.log('Attempting fetch to FLOW URL with payload (truncated):', JSON.stringify(finalPayload).slice(0,300));
  if (!FLOW_URL || FLOW_URL.includes('REPLACE_ME')) {
    console.error('FLOW_URL not configured. Replace placeholder in index.js.');
    alert('FLOW_URL not configured. See console.');
    return;
  }

  fetch(FLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalPayload)
  })
  .then(response => {
    console.log('Fetch completed, status:', response.status);
    return response.text().then(text => console.log('Fetch response body (truncated):', text.slice(0,500)));
  })
  .then(() => {
    const popup = document.createElement('div');
    popup.className = 'popup show';
    popup.innerHTML = `<h2>Form Submitted Successfully</h2>
      <p>Thank you for your submission, ${finalPayload.customer}.</p>
      <button id="closePopup">Close</button>`;
    document.body.appendChild(popup);
    document.getElementById('closePopup').addEventListener('click', () => popup.remove());
  })
  .catch(err => {
    console.error('Fetch error:', err);
    alert('Submission failed — see console (possible CORS).');
  });
}

// If grecaptcha exists and SITE_KEY set, request token first
if (window.grecaptcha && typeof grecaptcha.execute === 'function' && SITE_KEY && SITE_KEY !== 'SITE_KEY_REPLACE_ME') {
  console.log('grecaptcha detected, requesting token');
  grecaptcha.ready(function () {
    grecaptcha.execute(SITE_KEY, { action: 'submit' })
      .then(function (token) {
        console.log('recaptcha token received (truncated):', token.slice(0,20));
        payload.recaptchaToken = token;
        doPost(payload);
      })
      .catch(function (err) {
        console.error('grecaptcha.execute error:', err);
        // still attempt POST for debugging
        doPost(payload);
      });
  });
} else {
  console.warn('grecaptcha not available or SITE_KEY not configured — sending without token');
  doPost(payload);
}


});
});

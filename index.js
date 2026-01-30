// index.js
document.addEventListener('DOMContentLoaded', function () {
  console.log('index.js loaded');

  const SITE_KEY = '6LdIBVksAAAAADS_4esakyQRplz0hq72OcQhBWF3';
  const FLOW_URL = 'https://default0ae51e1907c84e4bbb6d648ee58410.f4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1f6f13bc2d7a4b508a04bb8b03bc3342/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oL23bmTH8ieQn3nR8OyzhCwOqv-rbWuUt1P8OBVnDWo';

  // Elements for Application type + Other
  const appTypeSelect = document.getElementById('applicationType');
  const appTypeOtherWrap = document.getElementById('applicationTypeOtherWrap');
  const appTypeOtherInput = document.getElementById('applicationTypeOther');

  if (appTypeSelect && appTypeOtherWrap && appTypeOtherInput) {
    function updateAppTypeOtherVisibility() {
      if (appTypeSelect.value === '__other__') {
        appTypeOtherWrap.classList.add('show');
        appTypeOtherWrap.setAttribute('aria-hidden', 'false');
        appTypeOtherInput.focus();
      } else {
        appTypeOtherWrap.classList.remove('show');
        appTypeOtherWrap.setAttribute('aria-hidden', 'true');
        appTypeOtherInput.value = '';
      }
    }
    updateAppTypeOtherVisibility();
    appTypeSelect.addEventListener('change', updateAppTypeOtherVisibility);
  }

  // Duty cycle DOM
  const dutyModalOverlay = document.getElementById('dutyModalOverlay');
  const editDutyCycleBtn = document.getElementById('editDutyCycleBtn');
  const dutySaveBtn = document.getElementById('dutySaveBtn');
  const dutyCancelBtn = document.getElementById('dutyCancelBtn');
  const dutyTable = document.getElementById('dutyTable');
  const machineDutyCycleInput = document.getElementById('machineDutyCycle');
  const machineDutyCycleSummary = document.getElementById('machineDutyCycleSummary');
  const autoFillNote = document.getElementById('autoFillNote'); // not used for extra warnings now

  // --- Compact Wheel Loader template (8 steps) ---
  // speedBase: baseline speed value (scaled by maxSpeedFull/baseSpeed)
  // diff: delta P (bar)
  // duration: percent/time entry
  // offset: mm (if used)
  // radialFactor/axialFactor not used for steps 1,2,8 as we compute radial from weight directly
  const baseSpeed = 500; // reference speed used for scaling speeds (edit if needed)
  const compactWheelLoaderTemplate = [
    { speedBase: 10, diff: 200, oil: 70, duration: 5, offset: 0 },
    { speedBase: 10, diff: 200, oil: 70, duration: 5, offset: 0 },
    { speedBase: 25, diff: 150, oil: 65, duration: 13.25, offset: 0 },
    { speedBase: 25, diff: 150, oil: 65, duration: 13.25, offset: 0 },
    { speedBase: 60, diff: 100, oil: 65, duration: 20, offset: 0 },
    { speedBase: 80, diff: 75,  oil: 60, duration: 20, offset: 0 },
    { speedBase: 105,diff: 55,  oil: 60, duration: 20, offset: 0 },
    { speedBase: 10, diff: 400, oil: 80, duration: 3.5, offset: 0 }
  ];

  // radial scaling factors for steps 3..7 (you said you'll set these - defaults provided)
  // index by step number: radialScale[3] -> scale for step 3 relative to baseRadial
  const radialScale = {
    3: 0.80, // step 3 factor (default)
    4: 0.80, // step 4 factor
    5: 0.60, // step 5 factor
    6: 0.52, // step 6 factor (example)
    7: 0.45  // step 7 factor (example)
  };

  // choose weight for each step per your rules (stepIndex 1..8)
  function chooseWeightForStep(stepIndex, maxWeight, minWeight) {
    if ([1,2,8].includes(stepIndex)) return maxWeight;
    if ([3,4].includes(stepIndex)) return (((Number(maxWeight) || 0) - (Number(minWeight) || 0)) * 0.8) + (Number(minWeight) || 0);
    if (stepIndex === 5) return (Number(maxWeight) || 0) * 0.6;
    if ([6,7].includes(stepIndex)) return minWeight;
    return maxWeight;
  }

  // apply template into table with scaling rules (radial/axial per your description)
  function applyTemplateToTable(template, maxWeight, minWeight, maxSpeedFull) {
    const speedFactor = (Number(maxSpeedFull) > 0) ? (Number(maxSpeedFull) / baseSpeed) : 1;

    // compute baseRadial if maxWeight provided (N) using gravity 9.81
    const baseRadial = (Number(maxWeight) && Number(maxWeight) > 0) ? (Number(maxWeight) * 9.81) / 4 : 0;

    for (let row = 1; row <= 10; row++) {
      const stepTemplate = template[row - 1] || null;
      const weightForStep = chooseWeightForStep(row, maxWeight, minWeight);

      ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
        const input = dutyTable.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
        if (!input) return;

        if (!stepTemplate) {
          input.value = '';
          return;
        }

        if (col === 'speed') {
          input.value = Math.round((Number(stepTemplate.speedBase) || 0) * speedFactor).toString();
        } else if (col === 'diff') {
          input.value = (stepTemplate.diff !== null && stepTemplate.diff !== undefined) ? String(stepTemplate.diff) : '';
        } else if (col === 'oil') {
          input.value = (stepTemplate.oil !== null && stepTemplate.oil !== undefined) ? String(stepTemplate.oil) : '';
        } else if (col === 'duration') {
          input.value = (stepTemplate.duration !== null && stepTemplate.duration !== undefined) ? String(stepTemplate.duration) : '';
        } else if (col === 'radial') {
          let radialVal = '';
          if (row === 1 || row === 2 || row === 8) {
            // baseRadial uses maxWeight
            radialVal = baseRadial ? Math.round(baseRadial) : '';
          } else if ([3,4,5,6,7].includes(row)) {
            // use radialScale factor * baseRadial (if baseRadial available)
            const factor = radialScale[row] !== undefined ? Number(radialScale[row]) : 1;
            radialVal = baseRadial ? Math.round(baseRadial * factor) : '';
          }
          // If baseRadial is zero (no maxWeight), fall back to chooseWeightForStep * 0.25*9.81 (approx)
          if ((radialVal === '' || radialVal === 0) && weightForStep) {
            radialVal = Math.round((Number(weightForStep) * 9.81) / 4);
          }
          input.value = radialVal ? String(radialVal) : '';
        } else if (col === 'axial') {
          let axialVal = '';
          // axial rules as requested:
          if (row === 1) {
            axialVal = baseRadial ? Math.round(0.30 * baseRadial) : '';
          } else if (row === 2) {
            axialVal = baseRadial ? Math.round(-0.30 * baseRadial) : '';
          } else if (row === 3) {
            // 75% of step 1 axial
            axialVal = baseRadial ? Math.round(0.75 * (0.30 * baseRadial)) : '';
          } else if (row === 4) {
            // 75% of step 2 axial (negative)
            axialVal = baseRadial ? Math.round(0.75 * (-0.30 * baseRadial)) : '';
          } else {
            // default empty (or could be derived by factor)
            axialVal = '';
          }
          input.value = (axialVal !== '' && axialVal !== 0) ? String(axialVal) : '';
        } else if (col === 'offset') {
          input.value = stepTemplate.offset ? String(stepTemplate.offset) : '';
        } else {
          input.value = '';
        }
      });
    }
  }

  function openDutyModal() {
    console.log('openDutyModal() called');
    let data = [];
    try {
      if (machineDutyCycleInput.value) data = JSON.parse(machineDutyCycleInput.value);
    } catch (e) {
      console.warn('Existing duty cycle JSON invalid:', e);
      data = [];
    }

    if (data && data.length) {
      for (let row = 1; row <= 10; row++) {
        const rowData = (data[row - 1]) || {};
        ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
          const input = dutyTable.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
          if (input) input.value = rowData[col] !== undefined ? rowData[col] : '';
        });
      }
    } else {
      const appType = (appTypeSelect ? appTypeSelect.value : '') || '';
      if (appType === 'Compact Wheel Loader') {
        const weightMax = Number(document.getElementById('machineWeightMax')?.value) || 0;
        const weightMin = Number(document.getElementById('machineWeightMin')?.value) || 0;
        const speedMax = Number(document.getElementById('maxSpeedFull')?.value) || 0;

        // only one confirm/warning for auto-fill
        const message = 'The duty cycle will be automatically filled based on "Compact Wheel Loader" and the provided machine weights/speed. This uses: radial = (MaxWeight * 9.81) / 4 for steps 1,2,8 and scaled values for steps 3–7; axial forces derived from radial per your rules. Click OK to auto-fill (you can then edit), or Cancel to leave the table blank.';
        const userConfirmed = window.confirm(message);
        if (userConfirmed) {
          applyTemplateToTable(compactWheelLoaderTemplate, weightMax, weightMin, speedMax);
        } else {
          // clear
          for (let row = 1; row <= 10; row++) {
            ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
              const input = dutyTable.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
              if (input) input.value = '';
            });
          }
        }
      } else {
        // other application types -> blank table
        for (let row = 1; row <= 10; row++) {
          ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
            const input = dutyTable.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
            if (input) input.value = '';
          });
        }
      }
    }

    dutyModalOverlay.classList.add('show');
    dutyModalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeDutyModal() {
    dutyModalOverlay.classList.remove('show');
    dutyModalOverlay.setAttribute('aria-hidden', 'true');
  }

  // ensure button works (direct + delegated)
  if (editDutyCycleBtn) {
    try { editDutyCycleBtn.addEventListener('click', openDutyModal); }
    catch (e) { console.warn('Direct duty button binding failed', e); }
  }
  document.addEventListener('click', function (ev) {
    if (!ev.target) return;
    if (ev.target.id === 'editDutyCycleBtn' || (ev.target.closest && ev.target.closest('#editDutyCycleBtn'))) {
      openDutyModal();
    }
  });

  if (dutyCancelBtn) dutyCancelBtn.addEventListener('click', closeDutyModal);
  if (dutyModalOverlay) dutyModalOverlay.addEventListener('click', function (e) {
    if (e.target === dutyModalOverlay) closeDutyModal();
  });

  if (dutySaveBtn) dutySaveBtn.addEventListener('click', function () {
    const out = [];
    for (let row = 1; row <= 10; row++) {
      const rowObj = {};
      let any = false;
      ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
        const input = dutyTable.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
        if (input && input.value.trim() !== '') {
          rowObj[col] = input.value.trim();
          any = true;
        } else {
          rowObj[col] = '';
        }
      });
      if (any) {
        rowObj.stage = row;
        out.push(rowObj);
      }
    }
    machineDutyCycleInput.value = JSON.stringify(out);
    machineDutyCycleSummary.textContent = out.length ? `${out.length} stage(s) defined` : 'No duty cycle defined.';
    closeDutyModal();
  });

  // Helper: read files from attachments input and convert to data URLs (base64)
  function readFilesAsDataURLs(fileInput) {
    const files = fileInput?.files;
    if (!files || files.length === 0) return Promise.resolve([]);
    const readers = Array.from(files).map(file => new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => {
        const dataUrl = (fr.result || '').toString();
        resolve({ name: file.name, type: file.type, dataUrl });
      };
      fr.onerror = () => reject(new Error('File read error: ' + file.name));
      fr.readAsDataURL(file);
    }));
    return Promise.all(readers);
  }

  // reCAPTCHA helper (unchanged)
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

  // doPost: posts payload, tolerant and defensive (unchanged)
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
      let text = '';
      try { text = await response.text(); } catch (e) { console.warn('Failed to read response text:', e); text = ''; }
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch (e) { console.warn('Flow response not JSON:', e); }

      console.log('Fetch completed, status:', response.status, 'bodyText length:', (typeof text === 'string' ? text.length : 0), 'json:', json);

      if (!response.ok) {
        const message = (json && json.message) ? json.message : `Server error ${response.status}`;
        alert('Submission failed: ' + message + '\n\nServer response: ' + (text || response.status));
        throw new Error(message || 'flow_response_not_ok');
      }

      const ok = (json === null) ? true : (('success' in json) ? json.success : true);
      if (!ok) {
        const message = (json && json.message) ? json.message : 'Verification failed';
        alert('Submission rejected: ' + message + '\n\nServer response: ' + (text || ''));
        return response;
      }

      const popup = document.createElement('div');
      popup.className = 'popup show';
      popup.innerHTML = `<h2>Form Submitted Successfully</h2>
        <p>Thank you for your submission, ${finalPayload.customer || 'Customer'}.</p>
        <pre style="white-space:pre-wrap;max-height:200px;overflow:auto;">${text || ''}</pre>
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

  // Form submit: read attachments (as data URLs if any), then reCAPTCHA, then post
  const form = document.getElementById('motorForm');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    console.log('submit handler fired');

    let applicationTypeValue = '';
    if (appTypeSelect) {
      if (appTypeSelect.value === '__other__') {
        const typed = appTypeOtherInput.value.trim();
        if (!typed) {
          alert('Please specify the application type in the "If Other, specify" field.');
          appTypeOtherInput.focus();
          return;
        }
        applicationTypeValue = typed;
      } else {
        applicationTypeValue = appTypeSelect.value;
      }
    } else {
      applicationTypeValue = document.getElementById('applicationType')?.value || '';
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    const attachmentsInput = document.getElementById('attachmentsInput');
    readFilesAsDataURLs(attachmentsInput)
      .then(filesArray => {
        let dutyArray = [];
        try {
          const v = machineDutyCycleInput.value;
          dutyArray = v ? JSON.parse(v) : [];
        } catch (e) {
          dutyArray = [];
        }

        const payload = {
          applicationType: applicationTypeValue || '',
          customer: document.getElementById('customer')?.value || '',
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
          machineDutyCycle: dutyArray || [],

          brakeRequirements: document.getElementById('brakeRequirements')?.value || '',

          additionalInformation: document.getElementById('additionalInformation')?.value || '',
          attachments: filesArray || []
        };

        if (!window.grecaptcha || typeof grecaptcha.execute !== 'function') {
          alert('reCAPTCHA not available; disable tracker protection or try another browser.');
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        obtainRecaptchaToken('submit', 10000)
          .then(token => {
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

      })
      .catch(err => {
        console.error('Attachment read error:', err);
        alert('Failed to read attachments. Remove or try smaller files.');
        if (submitBtn) submitBtn.disabled = false;
      });

  });
});


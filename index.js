// index.js (full — updated speed, radial and axial rules)
document.addEventListener('DOMContentLoaded', function () {
  console.log('index.js loaded');

  const SITE_KEY = '6LdIBVksAAAAADS_4esakyQRplz0hq72OcQhBWF3';
  const FLOW_URL = 'https://default0ae51e1907c84e4bbb6d648ee58410.f4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1f6f13bc2d7a4b508a04bb8b03bc3342/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oL23bmTH8ieQn3nR8OyzhCwOqv-rbWuUt1P8OBVnDWo';

  // application type "Other" controls
  const appTypeSelect = document.getElementById('applicationType');
  const appTypeOtherWrap = document.getElementById('applicationTypeOtherWrap');
  const appTypeOtherInput = document.getElementById('applicationTypeOther');

  if (appTypeSelect && appTypeOtherWrap && appTypeOtherInput) {
    function updateAppTypeOtherVisibility() {
      if (appTypeSelect.value === '__other__') {
        appTypeOtherWrap.classList.add('show');
        appTypeOtherWrap.setAttribute('aria-hidden','false');
        appTypeOtherInput.focus();
      } else {
        appTypeOtherWrap.classList.remove('show');
        appTypeOtherWrap.setAttribute('aria-hidden','true');
        appTypeOtherInput.value = '';
      }
    }
    updateAppTypeOtherVisibility();
    appTypeSelect.addEventListener('change', updateAppTypeOtherVisibility);
  }

  // Elements for duty cycle modal
  const dutyModalOverlay = document.getElementById('dutyModalOverlay');
  const editDutyCycleBtn = document.getElementById('editDutyCycleBtn');
  const dutySaveBtn = document.getElementById('dutySaveBtn');
  const dutyCancelBtn = document.getElementById('dutyCancelBtn');
  const dutyTable = document.getElementById('dutyTable');
  const machineDutyCycleInput = document.getElementById('machineDutyCycle');
  const machineDutyCycleSummary = document.getElementById('machineDutyCycleSummary');

  // Template (8 steps): baseline fields (speedBase used only as illustrative baseline)
  const baseSpeed = 500; // reference for conversions (not critical)
  const compactWheelLoaderTemplate = [
    { speedBase: 10, diff: 200, oil: null, duration: 5, offset: 0 },
    { speedBase: 10, diff: 200, oil: null, duration: 5, offset: 0 },
    { speedBase: 25, diff: 150, oil: null, duration: 13.25, offset: 0 },
    { speedBase: 25, diff: 150, oil: null, duration: 13.25, offset: 0 },
    { speedBase: 60, diff: 100, oil: null, duration: 20, offset: 0 },
    { speedBase: 80, diff: 75,  oil: null, duration: 20, offset: 0 },
    { speedBase: 105,diff: 55,  oil: null, duration: 20, offset: 0 },
    { speedBase: 10, diff: 400, oil: null, duration: 3.5, offset: 0 }
  ];

  // Defaults
  const defaultBaseRadial = 6750; // fallback radial (N) when no max weight set

  // radial scaling for steps 3-7 (tweakable)
  const radialScale = { 3: 0.80, 4: 0.80, 5: 0.60, 6: 0.52, 7: 0.45 };

  // Convert given speed input to RPM. If value < 50 assume km/h, convert using wheelDiameter (mm)
  function convertSpeedToRPM(inputValue, wheelDiameterMm = 750) {
    const v = Number(inputValue);
    if (!v || isNaN(v) || v <= 0) return 0;
    if (v < 50) {
      // treat as km/h
      const speedMps = v / 3.6; // km/h to m/s
      const circumference = Math.PI * (Number(wheelDiameterMm) / 1000); // m
      if (circumference <= 0) return 0;
      const revPerSec = speedMps / circumference;
      return Math.round(revPerSec * 60);
    }
    // treat as RPM already
    return Math.round(v);
  }

  // compute base radial force (N) from machine weight (kg)
  function computeBaseRadialFromWeightKg(kg) {
    if (!kg || Number(kg) <= 0) return defaultBaseRadial;
    const g = 9.81;
    return (Number(kg) * g) / 4;
  }

  // Apply template into table with the required rules:
  // - radial derived from baseRadial = (maxWeight * 9.81)/4 or default
  // - steps 5-7 radial are floored at minBaseRadial
  // - axial per rules: step1=+30%,step2=-30%,step3=75%*step1,step4=75%*step2
  // - speed logic: if reduced provided -> use that as maxSpeed; else use full; convert km/h <50 to RPM using wheel diameter
  // - per-step speed percentages applied as required
  function applyTemplateToTable(template, maxWeightKg, minWeightKg, fullSpeedInput, reducedSpeedInput, wheelDiameterInput) {
    const wheelDiameter = Number(wheelDiameterInput) > 0 ? Number(wheelDiameterInput) : 750;
    const reducedProvided = Number(reducedSpeedInput) && Number(reducedSpeedInput) > 0;

    // Determine maxSpeedRPM:
    let maxSpeedRPM = 0;
    if (reducedProvided) {
      maxSpeedRPM = convertSpeedToRPM(reducedSpeedInput, wheelDiameter);
    } else {
      maxSpeedRPM = convertSpeedToRPM(fullSpeedInput, wheelDiameter);
    }
    // if still zero, fallback to baseSpeed
    if (!maxSpeedRPM) maxSpeedRPM = baseSpeed;

    console.log('maxSpeedRPM used =', maxSpeedRPM, ' (reducedProvided=', reducedProvided, ', wheelDiameter=', wheelDiameter, ')');

    // baseRadial & minBaseRadial in N
    const baseRadial = computeBaseRadialFromWeightKg(maxWeightKg);
    const minBaseRadial = computeBaseRadialFromWeightKg(minWeightKg);

    console.log('baseRadial N =', Math.round(baseRadial), 'minBaseRadial N =', Math.round(minBaseRadial));

    // axial rules
    const step1Axial = Math.round(0.30 * baseRadial);
    const step2Axial = Math.round(-0.30 * baseRadial);
    const step3Axial = Math.round(0.75 * step1Axial);
    const step4Axial = Math.round(0.75 * step2Axial);

    // speed percentages
    const speedPercents = { 1:0.10, 2:0.10, 3:0.25, 4:0.25, 5:0.60, 6:0.80, 7:1.00, 8:0.10 };

    for (let row=1; row<=10; row++) {
      const stepTemplate = template[row-1] || null;

      ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
        const input = dutyTable.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
        if (!input) return;

        if (!stepTemplate) {
          input.value = '';
          return;
        }

        if (col === 'speed') {
          const pct = speedPercents[row] !== undefined ? speedPercents[row] : 0;
          const val = Math.round(maxSpeedRPM * pct);
          input.value = val ? String(val) : '';
        } else if (col === 'diff') {
          // DeltaP baseline from template; double for steps 5-7 only if reducedProvided
          let dp = (stepTemplate.diff !== null && stepTemplate.diff !== undefined) ? Number(stepTemplate.diff) : '';
          if (reducedProvided && [5,6,7].includes(row) && dp !== '') dp = dp * 2;
          input.value = (dp !== '' && !isNaN(dp)) ? String(Math.round(dp)) : '';
        } else if (col === 'oil') {
          input.value = (stepTemplate.oil !== null && stepTemplate.oil !== undefined) ? String(stepTemplate.oil) : '';
        } else if (col === 'duration') {
          input.value = (stepTemplate.duration !== null && stepTemplate.duration !== undefined) ? String(stepTemplate.duration) : '';
        } else if (col === 'radial') {
          let radialVal = '';
          if ([1,2,8].includes(row)) {
            radialVal = Math.round(baseRadial);
          } else if ([3,4,5,6,7].includes(row)) {
            const factor = radialScale[row] !== undefined ? Number(radialScale[row]) : 1;
            radialVal = Math.round(baseRadial * factor);
            // enforce minimum for steps 5-7: cannot be below minBaseRadial
            if ([5,6,7].includes(row) && minBaseRadial && radialVal < Math.round(minBaseRadial)) {
              radialVal = Math.round(minBaseRadial);
            }
          } else {
            radialVal = '';
          }
          input.value = (radialVal !== '' && !isNaN(radialVal)) ? String(radialVal) : '';
        } else if (col === 'axial') {
          let axialVal = '';
          if (row === 1) axialVal = step1Axial;
          else if (row === 2) axialVal = step2Axial;
          else if (row === 3) axialVal = step3Axial;
          else if (row === 4) axialVal = step4Axial;
          else axialVal = ''; // steps 5-8 left empty by default
          input.value = (axialVal !== '' && !isNaN(axialVal)) ? String(axialVal) : '';
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
    try { if (machineDutyCycleInput.value) data = JSON.parse(machineDutyCycleInput.value); } catch (e) { console.warn('Existing duty cycle JSON invalid:', e); data = []; }

    if (data && data.length) {
      for (let r=1;r<=10;r++) {
        const rd = (data[r-1])||{};
        ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
          const inp = dutyTable.querySelector(`input[data-row="${r}"][data-col="${col}"]`);
          if (inp) inp.value = rd[col] !== undefined ? rd[col] : '';
        });
      }
    } else {
      const appType = (appTypeSelect ? appTypeSelect.value : '') || '';
      if (appType === 'Compact Wheel Loader') {
        const weightMax = Number(document.getElementById('machineWeightMax')?.value) || 0;
        const weightMin = Number(document.getElementById('machineWeightMin')?.value) || 0;
        const fullSpeed = Number(document.getElementById('maxSpeedFull')?.value) || 0;
        const reducedSpeed = Number(document.getElementById('maxSpeedReduced')?.value) || 0;
        const wheelDia = Number(document.getElementById('wheelRollerDiameter')?.value) || 750;

        const message = 'Auto-fill duty cycle for Compact Wheel Loader using provided machine weights/speed. OK to auto-fill (you can edit after)?';
        if (window.confirm(message)) {
          applyTemplateToTable(compactWheelLoaderTemplate, weightMax, weightMin, fullSpeed, reducedSpeed, wheelDia);
        } else {
          for (let r=1;r<=10;r++) {
            ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
              const inp = dutyTable.querySelector(`input[data-row="${r}"][data-col="${col}"]`);
              if (inp) inp.value = '';
            });
          }
        }
      } else {
        for (let r=1;r<=10;r++) {
          ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
            const inp = dutyTable.querySelector(`input[data-row="${r}"][data-col="${col}"]`);
            if (inp) inp.value = '';
          });
        }
      }
    }

    dutyModalOverlay.classList.add('show');
    dutyModalOverlay.setAttribute('aria-hidden','false');
  }

  function closeDutyModal() {
    dutyModalOverlay.classList.remove('show');
    dutyModalOverlay.setAttribute('aria-hidden','true');
  }

  // Ensure Edit button triggers modal
  if (editDutyCycleBtn) {
    try { editDutyCycleBtn.addEventListener('click', openDutyModal); }
    catch(e){ console.warn('Direct binding failed', e); }
  }
  document.addEventListener('click', function(ev){
    if (!ev.target) return;
    if (ev.target.id === 'editDutyCycleBtn' || (ev.target.closest && ev.target.closest('#editDutyCycleBtn'))) {
      openDutyModal();
    }
  });

  if (dutyCancelBtn) dutyCancelBtn.addEventListener('click', closeDutyModal);
  if (dutyModalOverlay) dutyModalOverlay.addEventListener('click', function(e){ if (e.target === dutyModalOverlay) closeDutyModal(); });

  if (dutySaveBtn) dutySaveBtn.addEventListener('click', function(){
    const out = [];
    for (let r=1;r<=10;r++){
      const rowObj = {}; let any=false;
      ['speed','diff','oil','duration','radial','axial','offset'].forEach(col => {
        const inp = dutyTable.querySelector(`input[data-row="${r}"][data-col="${col}"]`);
        if (inp && inp.value.trim() !== '') { rowObj[col] = inp.value.trim(); any = true; } else rowObj[col] = '';
      });
      if (any) { rowObj.stage = r; out.push(rowObj); }
    }
    machineDutyCycleInput.value = JSON.stringify(out);
    machineDutyCycleSummary.textContent = out.length ? `${out.length} stage(s) defined` : 'No duty cycle defined.';
    closeDutyModal();
  });

  // attachments -> dataURL helper
  function readFilesAsDataURLs(fileInput) {
    const files = fileInput?.files;
    if (!files || files.length === 0) return Promise.resolve([]);
    const readers = Array.from(files).map(file => new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => { res({ name: file.name, type: file.type, dataUrl: (fr.result||'').toString() }); };
      fr.onerror = () => rej(new Error('File read error: ' + file.name));
      fr.readAsDataURL(file);
    }));
    return Promise.all(readers);
  }

  // reCAPTCHA helper
  function obtainRecaptchaToken(action='submit', timeoutMs=10000) {
    return new Promise((resolve,reject) => {
      if (!window.grecaptcha || typeof grecaptcha.execute !== 'function') return reject(new Error('grecaptcha_not_available'));
      let finished=false;
      const timer = setTimeout(()=>{ if (finished) return; finished=true; reject(new Error('recaptcha_timeout')); }, timeoutMs);
      try {
        grecaptcha.ready(()=> {
          grecaptcha.execute(SITE_KEY, { action })
            .then(token => { if (finished) return; finished=true; clearTimeout(timer); if (!token) return reject(new Error('empty_token')); resolve(token); })
            .catch(err => { if (finished) return; finished=true; clearTimeout(timer); reject(err || new Error('grecaptcha_execute_error')); });
        });
      } catch(err){ if (!finished) { finished=true; clearTimeout(timer); reject(err||new Error('grecaptcha_exception')); } }
    });
  }

  // doPost (defensive)
  function doPost(finalPayload) {
    console.log('Attempting POST to FLOW URL (payload):', JSON.stringify(finalPayload).slice(0,1000));
    if (!FLOW_URL || FLOW_URL.includes('REPLACE_ME')) { console.error('FLOW_URL not configured.'); alert('FLOW_URL not configured. See console.'); return Promise.reject(new Error('flow_url_missing')); }
    return fetch(FLOW_URL, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(finalPayload) })
      .then(async response => {
        let text=''; try{ text = await response.text(); }catch(e){ console.warn('Failed to read response text', e); text=''; }
        let json = null; try{ json = text?JSON.parse(text):null; }catch(e){ console.warn('Flow response not JSON', e); }
        console.log('Fetch completed, status:', response.status, 'bodyText length:', (typeof text==='string'?text.length:0), 'json:', json);
        if (!response.ok) { const message = (json && json.message)?json.message:`Server error ${response.status}`; alert('Submission failed: '+message+'\n\nServer response: '+(text||response.status)); throw new Error(message||'flow_response_not_ok'); }
        const ok = (json===null)?true:(('success' in json)?json.success:true);
        if (!ok) { const message = (json&&json.message)?json.message:'Verification failed'; alert('Submission rejected: '+message+'\n\nServer response: '+(text||'')); return response; }
        const popup = document.createElement('div'); popup.className='popup show';
        popup.innerHTML = `<h2>Form Submitted Successfully</h2><p>Thank you for your submission, ${finalPayload.customer||'Customer'}.</p><pre style="white-space:pre-wrap;max-height:200px;overflow:auto;">${text||''}</pre><button id="closePopup">Close</button>`;
        document.body.appendChild(popup);
        document.getElementById('closePopup').addEventListener('click', ()=>popup.remove());
        return response;
      })
      .catch(err => { console.error('Fetch/flow error:',err); alert('Submission failed — see console for details.'); throw err; });
  }

  // Form submit flow
  const form = document.getElementById('motorForm');
  if (!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    console.log('submit handler fired');

    let applicationTypeValue = '';
    if (appTypeSelect) {
      if (appTypeSelect.value === '__other__') {
        const typed = appTypeOtherInput.value.trim();
        if (!typed) { alert('Please specify the application type in "If Other"'); appTypeOtherInput.focus(); return; }
        applicationTypeValue = typed;
      } else applicationTypeValue = appTypeSelect.value;
    } else applicationTypeValue = document.getElementById('applicationType')?.value || '';

    const submitBtn = form.querySelector('button[type="submit"]'); if (submitBtn) submitBtn.disabled = true;

    const attachmentsInput = document.getElementById('attachmentsInput');
    readFilesAsDataURLs(attachmentsInput).then(filesArray => {
      let dutyArray = [];
      try { const v = machineDutyCycleInput.value; dutyArray = v ? JSON.parse(v) : []; } catch(e){ dutyArray = []; }

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
        .finally(() => { if (submitBtn) submitBtn.disabled = false; });
    })
    .catch(err => {
      console.error('Attachment read error:', err);
      alert('Failed to read attachments. Remove or try smaller files.');
      const submitBtn2 = form.querySelector('button[type="submit"]'); if (submitBtn2) submitBtn2.disabled = false;
    });

  });
});

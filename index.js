const reliefInput = document.getElementById("reliefPressure");
const reliefError = document.getElementById("reliefError");

reliefInput.addEventListener("input", () => {
  const value = reliefInput.value;

  if (value < 50) {
    reliefError.textContent =
      "Relief pressure too low. Check hydraulic system type.";
  } else if (value > 450) {
    reliefError.textContent =
      "Relief pressure exceeds motor rating.";
  } else {
    reliefError.textContent = "";
  }
});

document.getElementById("motorForm").addEventListener("submit", e => {
  e.preventDefault();

  const payload = {
    customer: document.getElementById("customer").value,
    date: document.getElementById("date").value,
    machineType: document.getElementById("machineType").value,
    projectNumber: document.getElementById("projectNumber").value,
    customerContact: document.getElementById("customerContact").value,
    rexrothContact: document.getElementById("rexrothContact").value,
    motorSelection: document.getElementById("motorSelection").value,
    annualQuantity: document.getElementById("annualQuantity").value,
    standards: document.getElementById("standards").value,
    productionStartDate: document.getElementById("productionStartDate").value,
    environmentalConsiderations: document.getElementById("environmentalConsiderations").value,
    email: document.getElementById("email").value,
    annualUsage: document.getElementById("annualUsage").value,
    flushingRequired: document.getElementById("flushingRequired").value,
    hydraulicSystemType: document.getElementById("hydraulicSystemType").value,
    flushingRate: document.getElementById("flushingRate").value,
    machineWeightMin: document.getElementById("machineWeightMin").value,
    fluidManufacturer: document.getElementById("fluidManufacturer").value,
    machineWeightMax: document.getElementById("machineWeightMax").value,
    fluidSpecification: document.getElementById("fluidSpecification").value,
    reliefPressure: reliefInput.value,
    fluidTemperature: document.getElementById("fluidTemperature").value,
    chargePressure: document.getElementById("chargePressure").value,
    paintRequired: document.getElementById("paintRequired").value,
    drainPressure: document.getElementById("drainPressure").value,
    speedSensorRequired: document.getElementById("speedSensorRequired").value,
    tractiveEffort: document.getElementById("tractiveEffort").value,
    sensorPowerSupply: document.getElementById("sensorPowerSupply").value,
    maxSpeedFull: document.getElementById("maxSpeedFull").value,
    brakeRequirements: document.getElementById("brakeRequirements").value,
    maxSpeedReduced: document.getElementById("maxSpeedReduced").value,
    staticBrakeTorque: document.getElementById("staticBrakeTorque").value,
    dynamicBrakeTorque: document.getElementById("dynamicBrakeTorque").value
  };

  // Send form data to server
  fetch("PASTE_POWER_AUTOMATE_HTTP_URL_HERE", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(() => {
    // Show popup
    const popup = document.createElement("div");
    popup.className = "popup show";
    popup.innerHTML = `
      <h2>Form Submitted Successfully</h2>
      <p>Thank you for your submission, ${payload.customer}.</p>
      <button onclick="this.parentElement.style.display='none'">Close</button>
    `;
    document.body.appendChild(popup);

    // Send email confirmation to customer
    fetch("PASTE_EMAIL_API_URL_HERE", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.email,
        subject: "Motor Application Form Submission",
        body: `Dear ${payload.customer},\n\nYour form has been submitted successfully.\n\nDetails:\nCustomer Name: ${payload.customer}\nProject Number: ${payload.projectNumber}\nDate: ${payload.date}\nEstimated Annual Motor Quantity: ${payload.annualQuantity}\nRelief Pressure: ${payload.reliefPressure} bar\nRequired Torque: ${payload.torque} Nm\nPeak Radial Load: ${payload.radialLoad} kN\n\nThank you.`
      })
    })
    .then(() => alert("Email confirmation sent"))
    .catch(() => alert("Failed to send email confirmation"));

    // Send results to specified email
    fetch("PASTE_EMAIL_API_URL_HERE", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "SPECIFIED_EMAIL_ADDRESS",
        subject: "New Motor Application Form Submission",
        body: `New form submission:\n\nCustomer Name: ${payload.customer}\nProject Number: ${payload.projectNumber}\nDate: ${payload.date}\nEstimated Annual Motor Quantity: ${payload.annualQuantity}\nRelief Pressure: ${payload.reliefPressure} bar\nRequired Torque: ${payload.torque} Nm\nPeak Radial Load: ${payload.radialLoad} kN\n\nAdditional details:\nMachine Type: ${payload.machineType}\nCustomer Contact: ${payload.customerContact}\nRexroth Contact: ${payload.rexrothContact}\nProvisional Motor Selection: ${payload.motorSelection}\nCountry Specific Standards/Regulations: ${payload.standards}\nEstimated Production Start Date: ${payload.productionStartDate}\nSpecial Environmental Considerations: ${payload.environmentalConsiderations}\nExpected Annual Usage: ${payload.annualUsage}\nFlushing Required: ${payload.flushingRequired}\nHydraulic System Type: ${payload.hydraulicSystemType}\nRequired Flushing Rate: ${payload.flushingRate}\nTotal Machine Weight (Min): ${payload.machineWeightMin}\nFluid Manufacturer: ${payload.fluidManufacturer}\nTotal Machine Weight (Max): ${payload.machineWeightMax}\nFluid Specification: ${payload.fluidSpecification}\nFluid Temperature Range: ${payload.fluidTemperature}\nCharge Pressure: ${payload.chargePressure}\nPaint Required: ${payload.paintRequired}\nCase/Drain Pressure: ${payload.drainPressure}\nSpeed Sensor Required: ${payload.speedSensorRequired}\nMaximum Grade or Machine Tractive Effort: ${payload.tractiveEffort}\nSpeed Sensor Power Supply Details: ${payload.sensorPowerSupply}\nMax Speed (Full Displacement): ${payload.maxSpeedFull}\nBrake Requirements: ${payload.brakeRequirements}\nMax Speed (Reduced Displacement): ${payload.maxSpeedReduced}\nStatic Brake Torque Required: ${payload.staticBrakeTorque}\nDynamic Brake Torque Required: ${payload.dynamicBrakeTorque}`
      })
    })
    .then(() => alert("Results sent to specified email"))
    .catch(() => alert("Failed to send results email"));
  })
  .catch(() => alert("Submission failed"));
});

// Captcha
const response = await fetch('https://default0ae51e1907c84e4bbb6d648ee58410.f4.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/1f6f13bc2d7a4b508a04bb8b03bc3342/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=oL23bmTH8ieQn3nR8OyzhCwOqv-rbWuUt1P8OBVnDWo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    machineType: machineTypeField.value,
    annualUsage: annualUsageField.value,
    recaptchaToken: token
  })
});
// Speaker Form Logic

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('speakerRegistrationForm');
  const orgOtherRadio = document.getElementById('orgOtherRadio');
  const orgRadios = document.querySelectorAll('input[name="organization"]');
  const orgOtherInput = document.getElementById('orgOtherInput');

  const applicantRadios = document.querySelectorAll('input[name="applicantInfo"]');
  const teamDetailsGroup = document.getElementById('teamDetailsGroup');
  const teamDetailsInput = document.getElementById('teamDetailsInput');

  const topicLabelNum = document.getElementById('topicLabelNum');
  const driveLinkLabelNum = document.getElementById('driveLinkLabelNum');
  const specialReqLabelNum = document.getElementById('specialReqLabelNum');

  const submitBtn = document.getElementById('submitBtn');
  const formCard = document.getElementById('speakerFormCard');
  const thankYouCard = document.getElementById('thankYouCard');
  const submittedEmailText = document.getElementById('submittedEmailText');

  // Logic for "Other" Organization
  orgRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'Other') {
        orgOtherInput.classList.add('show');
        orgOtherInput.required = true;
      } else {
        orgOtherInput.classList.remove('show');
        orgOtherInput.required = false;
        orgOtherInput.value = '';
      }
    });
  });

  // Logic for Applicant Information (Team details conditional)
  applicantRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (e.target.value === 'Team') {
        teamDetailsGroup.style.display = 'block';
        teamDetailsInput.required = true;
        
        // Update numbering
        topicLabelNum.innerHTML = '10. Topic <span class="req">*</span>';
        driveLinkLabelNum.innerHTML = '11. Share the drive link with uploaded files <em>(Make sure to provide access to <a href="mailto:elevateqa@sdettech.com">elevateqa@sdettech.com</a>)</em> <span class="req">*</span>';
        specialReqLabelNum.innerHTML = '12. Any Special Requirements (AV, demo setup, etc.)';
      } else {
        teamDetailsGroup.style.display = 'none';
        teamDetailsInput.required = false;
        teamDetailsInput.value = '';

        // Update numbering
        topicLabelNum.innerHTML = '9. Topic <span class="req">*</span>';
        driveLinkLabelNum.innerHTML = '10. Share the drive link with uploaded files <em>(Make sure to provide access to <a href="mailto:elevateqa@sdettech.com">elevateqa@sdettech.com</a>)</em> <span class="req">*</span>';
        specialReqLabelNum.innerHTML = '11. Any Special Requirements (AV, demo setup, etc.)';
      }
    });
  });

  // Form Submit Handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const email = formData.get('email');
    
    // UI Loading state
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    // Simulating an API call / Backend request for local testing
    setTimeout(() => {
      console.log('--- Form Data Submitted ---');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      
      // Simulate sending the thank you email via mock function
      sendMockThankYouEmail(email);

      // Show Thank You UI
      formCard.style.display = 'none';
      submittedEmailText.textContent = email;
      thankYouCard.style.display = 'block';

      // Reset form just in case
      form.reset();
      submitBtn.textContent = 'Submit';
      submitBtn.disabled = false;
    }, 1500); // 1.5 second delay to simulate network
  });

  // Mock Email Function
  function sendMockThankYouEmail(userEmail) {
    console.log(`%c[MOCK EMAIL SERVICE] Sending "Thank You for Registering" email to: ${userEmail}`, 'color: #d4ff3a; font-weight: bold;');
    console.log(`%c[MOCK EMAIL SERVICE] From: elevateqa@sdettech.com`, 'color: #ccc;');
    console.log(`%c[MOCK EMAIL SERVICE] Subject: Thank You for Registering for Elevate QA 2026!`, 'color: #ccc;');
    console.log(`%c[MOCK EMAIL SERVICE] Body: Hi there, thank you for submitting your speaker application...`, 'color: #ccc;');
  }
});

/**
 * ELEVATE QA 2026 - EMAIL SERVICE
 * Uses backend REST API for reliable email delivery
 */

export const sendAttendeeEmail = async (attendeeData) => {
  const { name, email, company, ticketId, dbId, designation, linkedin, isWaitlisted } = attendeeData;
  console.log(`[ElevateQA] Sending ticket generation request for ${email}...`);

  try {
    const payload = {
      name,
      email,
      company,
      ticketId,
      designation: designation || '',
      linkedin: linkedin || '',
      qrData: `ELEVATE-QA:${dbId}|${name}|${company}`
    };

    const endpoint = isWaitlisted ? '/api/send-rejection' : '/api/send-ticket';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send ticket email');
    }

    console.log('[ElevateQA] Ticket Email sent successfully.');
    return result;
  } catch (err) {
    console.error('[ElevateQA] Ticket delivery failed:', err);
    throw err;
  }
};

export const sendSpeakerEmail = async (speakerData) => {
  const { name, email, organization, topic, bio } = speakerData;
  console.log(`[ElevateQA] Sending speaker confirmation request for ${email}...`);

  try {
    const payload = {
      name,
      email,
      organization: organization || '',
      topic: topic || '',
      bio: bio || ''
    };

    const response = await fetch('/api/send-speaker-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send speaker email');
    }

    console.log('[ElevateQA] Speaker Email sent successfully.');
    return result;
  } catch (err) {
    console.error('[ElevateQA] Speaker email delivery failed:', err);
    throw err;
  }
};

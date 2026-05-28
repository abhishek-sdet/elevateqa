/**
 * ELEVATE QA 2026 - EMAIL SERVICE
 * Uses custom Node.js Backend for Limitless Email
 */

const BACKEND_URL = 'https://elevateqa.netlify.app/.netlify/functions';

export const sendAttendeeEmail = async (attendeeData) => {
  const { name, email, company, ticketId, dbId, designation, linkedin } = attendeeData;

  console.log(`[ElevateQA] Sending ticket generation request to Backend for ${email}...`);

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

    const response = await fetch(`${BACKEND_URL}/send-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || 'Failed to send ticket email');
    }

    console.log("[ElevateQA] Ticket Email sent successfully.");
    return response;
  } catch (err) {
    console.error("[ElevateQA] Ticket delivery failed:", err);
    throw err;
  }
};

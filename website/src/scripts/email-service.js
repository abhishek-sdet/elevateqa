/**
 * ELEVATE QA 2026 - EMAIL SERVICE
 * Handles professional communications for attendees and support.
 */

export const sendAttendeeEmail = async (attendeeData) => {
  const { name, email, company, ticketId, dbId, designation, linkedin } = attendeeData;

  console.log(`[ElevateQA] Sending data to Power Automate Webhook for ${email}...`);

  try {
    // Make.com Custom Webhook URL (Elevate QA → Microsoft 365 Outlook)
    const WEBHOOK_URL = "https://hook.eu1.make.com/schsepn7tlcj8oujqgzlt2p9v1w56o8d";

    if (WEBHOOK_URL === "PASTE_YOUR_POWER_AUTOMATE_URL_HERE") {
      console.warn("Webhook URL not set yet. Skipping email delivery.");
      return { success: true, warning: "Webhook URL not configured" };
    }

    const payload = {
      attendeeName: name,
      attendeeEmail: email,
      companyName: company,
      ticketId: ticketId,
      designation: designation || '',
      linkedin: linkedin || '',
      qrData: `ELEVATE-QA:${dbId}|${name}|${company}`
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("[ElevateQA] Webhook triggered successfully:", response.status);
    return response;
  } catch (err) {
    console.error("[ElevateQA] Webhook delivery failed:", err);
    throw err;
  }
};

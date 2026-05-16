/**
 * ELEVATE QA 2026 - EMAIL SERVICE
 * Handles professional communications for attendees and support.
 */

export const sendAttendeeEmail = async (attendeeData) => {
  const { name, email, company, ticketId } = attendeeData;
  
  // Professional HTML Template
  const htmlTemplate = `
    <div style="background-color: #0b0b10; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 600px; margin: auto; border: 1px solid #1a1a24; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #d4ff3a; font-style: italic; letter-spacing: -1px; margin: 0;">ELEVATE QA 2026</h2>
      </div>
      
      <h1 style="color: #ffffff; font-size: 24px; text-align: center; margin-bottom: 20px;">Registration Confirmed</h1>
      
      <p style="font-size: 16px; line-height: 1.6; color: #a1a1aa; text-align: center;">
        Hello <strong>${name}</strong>,<br>
        Thank you for registering for the <strong>AI-Led Quality Engineering Symposium</strong>. Your place is secured among the industry's top QE leaders.
      </p>

      <div style="background: #12121a; padding: 30px; border-radius: 12px; margin: 30px 0; border: 1px solid #d4ff3a33; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #d4ff3a; text-transform: uppercase; letter-spacing: 3px; font-weight: bold;">OFFICIAL ENTRY PASS</p>
        <h2 style="margin: 15px 0 5px 0; font-size: 28px; letter-spacing: -1px; color: #ffffff;">${name}</h2>
        <p style="margin: 0 0 25px 0; font-size: 14px; color: #71717a;">${company}</p>
        
        <div style="display: inline-block; background: #ffffff; padding: 12px; border-radius: 8px;">
           <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ELEVATEQA26|${ticketId}|${name}|${email}" alt="Entry QR Code" style="display: block;">
        </div>
        
        <p style="margin-top: 20px; font-size: 13px; color: #a1a1aa; line-height: 1.4;">
          <strong>Ticket ID:</strong> ${ticketId}<br>
          Please keep this QR code ready for check-in at the venue.
        </p>
      </div>

      <div style="font-size: 14px; color: #a1a1aa; border-top: 1px solid #1a1a24; padding-top: 25px;">
        <div style="margin-bottom: 10px;">
          <span style="color: #d4ff3a;">🗓 DATE:</span> 8th August 2026
        </div>
        <div>
          <span style="color: #d4ff3a;">📍 VENUE:</span> Noida, Delhi NCR, India
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #52525b; border-top: 1px solid #1a1a24; padding-top: 20px;">
        This email was sent by the Elevate QA Event Team.<br>
        Support: <a href="mailto:elevateqa@sdettech.com" style="color: #d4ff3a; text-decoration: none;">elevateqa@sdettech.com</a>
      </div>
    </div>
  `;

  console.log(`[ElevateQA] Preparing professional email for ${email}...`);

  // INTEGRATION: We use FormSubmit as the delivery engine for now
  // In a full production environment, this would hit a dedicated Resend/Postmark Edge Function
  try {
    const response = await fetch("https://formsubmit.co/ajax/elevateqa@sdettech.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        _subject: `Your Elevate QA 2026 Entry Pass — ${name}`,
        _template: "table", // Fallback if HTML is not processed
        message: `New Registration: ${name} (${company}) - ${email}. Ticket ID: ${ticketId}`,
        "Attendee Name": name,
        "Attendee Email": email,
        "Company": company,
        "Ticket ID": ticketId,
        // We include the HTML content. FormSubmit supports custom HTML in paid/pro but we provide it here for the record
        _html: htmlTemplate 
      })
    });
    
    return await response.json();
  } catch (err) {
    console.error("[ElevateQA] Email delivery failed:", err);
    throw err;
  }
};

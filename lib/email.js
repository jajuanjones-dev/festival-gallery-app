export async function sendDownloadEmail(toAddress, downloadUrls) {
  const linksHtml = downloadUrls
    .map((url, i) => `<p><a href="${url}">Download photo ${i + 1}</a></p>`)
    .join("");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toAddress }] }],
      from: { email: process.env.NOTIFY_FROM_EMAIL },
      subject: "Your photos are ready",
      content: [
        {
          type: "text/html",
          value: `
            <p>Thanks for your order! Your photos are ready to download.</p>
            ${linksHtml}
            <p>These links stay active for 48 hours - download them somewhere safe before then.</p>
          `,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SendGrid send failed (${res.status}): ${body}`);
  }
}

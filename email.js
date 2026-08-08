// Using Resend instead of AWS SES, to keep everything off AWS. Free tier is
// generous for this volume, and setup is just one API key - no domain/IAM
// configuration needed to get started.
export async function sendDownloadEmail(toAddress, downloadUrls) {
  const linksHtml = downloadUrls
    .map((url, i) => `<p><a href="${url}">Download photo ${i + 1}</a></p>`)
    .join("");

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM_EMAIL,
      to: toAddress,
      subject: "Your photos are ready",
      html: `
        <p>Thanks for your order! Your photos are ready to download.</p>
        ${linksHtml}
        <p>These links stay active for 48 hours - download them somewhere safe before then.</p>
      `,
    }),
  });
}

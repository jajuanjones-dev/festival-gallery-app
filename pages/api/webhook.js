import { buffer } from "micro";
import { stripe } from "../../lib/stripe";
import { getPhotoById, markPurchased } from "../../lib/d1";
import { getDownloadUrl } from "../../lib/r2";
import { sendDownloadEmail } from "../../lib/email";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const selectedIds = JSON.parse(session.metadata.selected_ids);
    const customerEmail = session.customer_details?.email;

    const downloadUrls = [];
    for (const id of selectedIds) {
      const photo = await getPhotoById(id);
      if (!photo) continue;

      await markPurchased(id);
      const url = await getDownloadUrl(photo.enhanced_key);
      downloadUrls.push(url);
    }

    if (customerEmail && downloadUrls.length > 0) {
      await sendDownloadEmail(customerEmail, downloadUrls);
    }
  }

  res.status(200).json({ received: true });
}

import { stripe, calculatePrice } from "../../lib/stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { festivalId, selectedIds } = req.body;

  if (!festivalId || !Array.isArray(selectedIds) || selectedIds.length === 0) {
    return res.status(400).json({ error: "Select at least one photo." });
  }

  const { totalCents, isBundle } = calculatePrice(selectedIds.length);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: isBundle
              ? `All photos - ${festivalId}`
              : `${selectedIds.length} photo(s) - ${festivalId}`,
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      festival_id: festivalId,
      selected_ids: JSON.stringify(selectedIds),
    },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/event/${festivalId}`,
  });

  res.status(200).json({ url: session.url });
}

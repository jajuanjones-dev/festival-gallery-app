import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Simple volume discount: buying a lot of photos from one shoot switches to
// a flat bundle price instead of per-photo. Tune the numbers in .env.local.
export function calculatePrice(photoCount) {
  const perPhoto = Number(process.env.PRICE_PER_PHOTO);
  const bundle = Number(process.env.BUNDLE_PRICE);
  const threshold = Number(process.env.BUNDLE_THRESHOLD);

  if (photoCount >= threshold) {
    return { totalCents: bundle, isBundle: true };
  }
  return { totalCents: perPhoto * photoCount, isBundle: false };
}

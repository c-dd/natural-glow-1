/** @type {import('next').NextConfig} */
const nextConfig = {
  // The storefront + dashboard ship as a single self-contained page in /public.
  // Static export — the app is fully client-side (the experience lives in
  // /public/natural-glow.html), so it ships as static HTML and hosts anywhere.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;

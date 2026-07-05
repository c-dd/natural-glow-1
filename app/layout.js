export const metadata = {
  title: "Natural Glow — Research Peptides",
  description:
    "Natural Glow storefront, COA verification, and customer + admin dashboards.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#F5F3ED" }}>{children}</body>
    </html>
  );
}

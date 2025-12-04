export default function Head() {
  return (
    <>
      {/* Browser tab title */}
      <title>Longo Admin Login</title>

      {/* Meta description for search engines or link previews */}
      <meta
        name="description"
        content="Secure login to the Longo Carpet Cleaning admin dashboard."
      />

      {/* Viewport ensures proper mobile scaling */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Favicon (optional — place favicon.ico in /public) */}
      <link rel="icon" href="/favicon.ico" />

      {/* Theme color for browser tabs on mobile */}
      <meta name="theme-color" content="#0A2C57" />

      {/* Optional Apple touch icon if you have a PWA-style icon */}
      <link rel="apple-touch-icon" href="/longologo.png" />

      {/* Open Graph / social preview */}
      <meta property="og:title" content="Longo Admin Login" />
      <meta
        property="og:description"
        content="Secure access to the Longo Carpet Cleaning admin dashboard."
      />
      <meta property="og:image" content="/longologo.png" />
      <meta property="og:type" content="website" />
    </>
  );
}

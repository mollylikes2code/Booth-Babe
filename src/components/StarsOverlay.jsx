// src/components/StarsOverlay.jsx
export default function StarsOverlay() {
  return (
    <>
      {/* Background image from /public */}
      <div
        aria-hidden
        className="fixed inset-0 -z-20 bg-no-repeat bg-cover bg-center"
        style={{
          backgroundImage: "url('/wallpapers/pastel-stars.png')",
          backgroundAttachment: "fixed",
        }}
      />

      {/* Readability overlay */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{ background: "rgba(4, 4, 20, 0.55)" }}
      />
    </>
  );
}

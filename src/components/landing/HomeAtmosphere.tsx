/** Fixed full-viewport layers for the marketing homepage (grain, vignette, drift). */
export function HomeAtmosphere() {
  return (
    <>
      <div className="home-hero-glow pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="home-hero-vignette pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="home-hero-noise pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="home-drift-orb pointer-events-none fixed z-0" aria-hidden />
    </>
  );
}

import { useMemo } from "react";
import "../assets/css/sponsor-marquee.css";

export default function SponsorMarquee({ sponsor1, sponsor2 }) {
  const slides = useMemo(
    () => [sponsor2, sponsor1, sponsor2, sponsor1].filter(Boolean),
    [sponsor1, sponsor2],
  );

  if (!sponsor1 || slides.length === 0) {
    return null;
  }

  const renderGroup = (keyPrefix) =>
    slides.map((src, index) => (
      <img
        key={`${keyPrefix}-${index}`}
        src={src}
        alt="Sponsor"
        className="marquee-image"
      />
    ));

  return (
    <div className="marquee-wrapper">
      <div className="marquee-content-scroll">
        <div className="marquee-group">{renderGroup("a")}</div>
        <div className="marquee-group" aria-hidden="true">
          {renderGroup("b")}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useRef, useState, useLayoutEffect } from "react";
import "../assets/css/sponsor-marquee.css";

const BASE_DURATION_SEC = 60;

export default function SponsorMarquee({ sponsor1, sponsor2, sponsors }) {
  const slides = useMemo(() => {
    if (sponsors?.length) return sponsors.filter(Boolean);
    return [sponsor1, sponsor2].filter(Boolean);
  }, [sponsors, sponsor1, sponsor2]);

  const wrapperRef = useRef(null);
  const measureRef = useRef(null);
  const [copies, setCopies] = useState(1);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const measure = measureRef.current;
    if (!wrapper || !measure || slides.length === 0) return;

    const updateCopies = () => {
      const groupWidth = measure.scrollWidth;
      const viewWidth = wrapper.clientWidth;
      if (groupWidth <= 0 || viewWidth <= 0) return;
      setCopies(Math.min(10, Math.max(1, Math.ceil(viewWidth / groupWidth))));
    };

    updateCopies();

    const resizeObserver = new ResizeObserver(updateCopies);
    resizeObserver.observe(wrapper);
    resizeObserver.observe(measure);

    const images = [...measure.querySelectorAll("img")];
    images.forEach((img) => {
      if (!img.complete) img.addEventListener("load", updateCopies);
    });

    return () => {
      resizeObserver.disconnect();
      images.forEach((img) => img.removeEventListener("load", updateCopies));
    };
  }, [slides]);

  if (!sponsor1 || slides.length === 0) {
    return null;
  }

  const renderGroup = (keyPrefix, repeat = 1) =>
    Array.from({ length: repeat }, (_, copyIndex) =>
      slides.map((src, index) => (
        <img
          key={`${keyPrefix}-${copyIndex}-${index}`}
          src={src}
          alt="Sponsor"
          className="marquee-image"
        />
      )),
    );

  return (
    <div className="marquee-wrapper" ref={wrapperRef}>
      <div className="marquee-group marquee-measure" ref={measureRef} aria-hidden="true">
        {renderGroup("measure")}
      </div>
      <div
        className="marquee-content-scroll"
        style={{ animationDuration: `${BASE_DURATION_SEC * copies}s` }}
      >
        <div className="marquee-group">{renderGroup("a", copies)}</div>
        <div className="marquee-group" aria-hidden="true">
          {renderGroup("b", copies)}
        </div>
      </div>
    </div>
  );
}

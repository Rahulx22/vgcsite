"use client";

import { useEffect, useState } from "react";
import type { Hero } from "../../types/home";

export default function HeroCarousel({ hero }: { hero: Hero }) {
  const [index, setIndex] = useState(0);

  if (!hero || !hero.banners) return null;

  const nextSlide = () => setIndex((prev) => (prev + 1) % hero.banners.length);
  const prevSlide = () =>
    setIndex((prev) => (prev - 1 + hero.banners.length) % hero.banners.length);

  // useEffect(() => {
  //   const timer = setInterval(() => nextSlide(), 2500);
  //   return () => clearInterval(timer);
  // }, []);

  return (
    <div className="slider">
      <button className="arrow prev" onClick={prevSlide}>❮</button>
      <button className="arrow next" onClick={nextSlide}>❯</button>

      {hero.banners.map((banner, i) => (
        <div
          key={i}
          className={`slide ${i === index ? "active" : ""}`}
          style={{ backgroundImage: `url(${banner.image})` }}
        >
          <div className="content">
            <h1>{banner.title}</h1>
            {(banner.paragraphs || []).map((p, j) => (
              <p className="subtitle" key={j}>{p}</p>
            ))}
            <div className="stats">
              {(banner.counters || []).map((c, k) => (
                <div className="stat" key={k}>
                  <h2>{c.value}{c.suffix}</h2>
                  <small>{c.label}</small>
                </div>
              ))}
            </div>
            {banner.ctaLink && (
              <a className="btn" href={banner.ctaLink}>{banner.ctaText}</a>
            )}
          </div>
        </div>
      ))}

      <style jsx>{`
  .slider {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    font-family: Arial, sans-serif;
  }

  .slide {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.8s;
    padding: 20px;
  }

  .slide.active {
    opacity: 1;
  }

  .slide::before {
    content: "";
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
  }

  .content {
    position: relative;
    color: #fff;
    width: 90%;
    max-width: 900px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    z-index: 1;
  }

  h1 {
    font-size: 48px;
    margin-bottom: 15px;
    line-height: 1.2;
    font-weight: 700;
  }

  .subtitle {
    font-size: 20px;
    line-height: 1.7;
    margin-bottom: 20px;
  }

  /* CTA BUTTON TOP */
  .btn {
    order: 1;
    display: inline-block;
    padding: 14px 30px;
    background: #0d6efd;
    color: #fff;
    text-decoration: none;
    border-radius: 6px;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 30px;
    box-shadow: 0 6px 18px rgba(0,0,0,0.25);
   
  }

  .btn:hover {
    background: #084298;
    transform: translateY(-2px);
  }

  /* COUNTERS BELOW BUTTON */
  .stats {
    order: 2;
    display: flex;
    gap: 40px;
    flex-wrap: wrap;
  }

  .stat {
    background: transparent;
    color: #fff;
  }

  .stat h2 {
    font-size: 36px;
    font-weight: 700;
    margin: 0;
  }

  .stat small {
    font-size: 14px;
    opacity: 0.9;
  }

  .arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0,0,0,0.5);
    color: #fff;
    border: none;
    font-size: 28px;
    padding: 10px 16px;
    cursor: pointer;
    z-index: 10;
  }

  .prev { left: 20px; }
  .next { right: 20px; }

  .arrow:hover {
    background: rgba(0,0,0,0.8);
  }

  @media (max-width: 768px) {
    h1 { font-size: 30px; }
    .subtitle { font-size: 16px; }
    .btn { font-size: 16px; padding: 12px 22px; }
    .stats { gap: 20px; }
    .stat h2 { font-size: 28px; }
  }

  @media (max-width: 480px) {
    h1 { font-size: 24px; }
    .stats {
      flex-direction: column;
      gap: 12px;
    }
  }
       `}</style>

    </div>
  );
}
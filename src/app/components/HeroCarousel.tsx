"use client";

import Image from "next/image";
import React from "react";
import type { Hero } from "../../types/home";

export default function HeroCarousel({ hero }: { hero: Hero }) {
  if (!hero || !Array.isArray(hero.banners)) return null;

  return (

    <div className="main">
      <div
        id="carouselExampleControls"
        className="carousel slide"
        data-bs-ride="carousel"
      >
        <div className="carousel-inner">

          {hero.banners.map((item, idx) => (
            <div
              key={idx}
              className={`carousel-item ${idx === 0 ? "active" : ""}`}
            >
              {/* IMAGE (Bootstrap responsive) */}
              <Image
                className="d-block w-100 img-fluid"
                src={item.image}
                alt={`banner-${idx}`}
                width={1920}
                height={500}
                priority={idx === 0}
              />

              {/* CAPTION */}
              <div className="carousel-caption hero-caption text-start">
  <div className="container px-3">
    <div className="row">
      <div className="col-lg-7 col-md-10 col-12">

        {/* TITLE */}
        <h1 className="hero-title fw-bold">
          {item.title}
        </h1>

        {/* PARAGRAPHS */}
        {(item.paragraphs || []).map((p, i) => (
          <p className="hero-text" key={i}>{p}</p>
        ))}

        {/* CTA BUTTON */}
        {item.ctaLink && (
          <a className="btn btn-primary btn-lg mt-2" href={item.ctaLink}>
            {item.ctaText}
          </a>
        )}

        {/* COUNTERS */}
        <ul className="counter-list mt-4">
          {(item.counters || []).map((c, i) => (
            <li key={i} className="counter-item">
              <h2 className="fw-bold m-0">
                {c.value}
                {c.suffix}
              </h2>
              <small className="text-light">{c.label}</small>
            </li>
          ))}
        </ul>

      </div>
    </div>
  </div>

  {/* RESPONSIVE CSS */}
  <style jsx>{`
    .hero-caption {
      bottom: 18%;
      text-align: left;
    }

    /* TITLE */
    .hero-title {
      font-size: 2.5rem;
      line-height: 1.2;
    }

    /* TEXT */
    .hero-text {
      font-size: 1.1rem;
      margin-bottom: 0.7rem;
    }

    /* COUNTERS */
    .counter-list {
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      padding: 0;
      margin: 0;
    }

    .counter-item {
      display: flex;
      flex-direction: column;
      min-width: 120px;
    }

    /* TABLET */
    @media (max-width: 992px) {
      .hero-caption {
        bottom: 10%;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-text {
        font-size: 1rem;
      }

      .counter-item h2 {
        font-size: 1.4rem;
      }
    }

    /* MOBILE */
    @media (max-width: 576px) {
      .hero-caption {
        bottom: 6%;
      }

      .hero-title {
        font-size: 1.6rem;
        line-height: 1.3;
      }

      .hero-text {
        font-size: 0.95rem;
      }

      .counter-list {
        gap: 14px;
      }

      .counter-item {
        min-width: 48%;
      }
    }
  `}</style>
</div>

            </div>
          ))}

        </div>

        {/* Browser Controls */}
        <button
          className="carousel-control-prev"
          type="button"
          data-bs-target="#carouselExampleControls"
          data-bs-slide="prev"
        >
          <span className="carousel-control-prev-icon"></span>
        </button>

        <button
          className="carousel-control-next"
          type="button"
          data-bs-target="#carouselExampleControls"
          data-bs-slide="next"
        >
          <span className="carousel-control-next-icon"></span>
        </button>
      </div>
    </div>



  );
}

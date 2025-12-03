"use client";

import Image from "next/image";
import React from "react";
import type { Hero } from "../../types/home";

export default function HeroCarousel({ hero }: { hero: Hero }) {
  if (!hero || !Array.isArray(hero.banners)) return null;

  console.log("HeroCarousel hero:", hero);

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
          <div className="carousel-caption text-start">

            <div className="container">
              <div className="row">
                <div className="col-lg-7 col-md-9 col-12">

                  {/* TITLE */}
                  <h1 className="fw-bold display-5 display-md-3 display-lg-2">
                    {item.title}
                  </h1>

                  {/* PARAGRAPHS */}
                  {(item.paragraphs || []).map((p, i) => (
                    <p className="lead" key={i}>{p}</p>
                  ))}

                  {/* CTA BUTTON */}
                  {item.ctaLink && (
                    <a className="btn btn-primary btn-lg mt-2" href={item.ctaLink}>
                      {item.ctaText}
                    </a>
                  )}

                  {/* COUNTERS */}
                  <ul className="list-unstyled d-flex flex-wrap mt-4 gap-4">
                    {(item.counters || []).map((c, i) => (
                      <li key={i} className="me-4">
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

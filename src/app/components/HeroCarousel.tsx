"use client";

import { useState } from "react";
import Image from "next/image";
import type { Hero } from "../../types/home";

export default function HeroCarousel({ hero }: { hero: Hero }) {
  const [index, setIndex] = useState(0);

  if (!hero || !hero.banners) return null;

  const nextSlide = () => {
    setIndex((prev) => (prev + 1) % hero.banners.length);
  };

  const prevSlide = () => {
    setIndex((prev) => (prev - 1 + hero.banners.length) % hero.banners.length);
  };

  return (
    <div className="slider">

      {/* ARROWS */}
      <button className="arrow prev" onClick={prevSlide}>❮</button>
      <button className="arrow next" onClick={nextSlide}>❯</button>

      {hero.banners.map((banner, i) => (
        <div key={i} className={`slide ${i === index ? "active" : ""}`}>

          <Image
            src={banner.image}
            alt={banner.alt || "banner"}
            fill
            priority={i === 0}
            className="bg-img"
          />

          <div className="content">
            {i === 0 ? (
              <h1>{banner.title}</h1>
            ) : (
              <h2>{banner.title}</h2>
            )}
            {(banner.paragraphs || []).map((p, j) => (
              <p className="subtitle" key={j}>{p}</p>
            ))}

            {banner.ctaLink && (
              <a className="btn" href={banner.ctaLink}>
                {banner.ctaText}
              </a>
            )}

            <div className="stats">
              {(banner.counters || []).map((c, k) => (
                <div className="stat" key={k}>
                  <h2>{c.value}{c.suffix}</h2>
                  <small>{c.label}</small>
                </div>
              ))}
            </div>
          </div>

        </div>
      ))}

      <style jsx>{`

        .slider{
          position:relative;
          width:100%;
          height:100vh;
          min-height:750px;
          overflow:hidden;
        }

        .slide{
          position:absolute;
          width:100%;
          height:100%;
          opacity:0;
          transition:opacity .8s ease;
        }

        .slide.active{
          opacity:1;
          z-index:1;
        }

        .bg-img{
          object-fit:cover;
        }

        .slide::before{
          content:"";
          position:absolute;
          inset:0;
          background:rgba(0,0,0,0.55);
          z-index:1;
        }

        .content{
          position:relative;
          z-index:2;
          color:white;
          max-width:900px;
          padding:40px;
          top:50%;
          transform:translateY(-50%);
        }

        h1{
          font-size:44px;
          font-weight:700;
          margin-bottom:12px;
        }

        .subtitle{
          font-size:20px;
          margin-bottom:20px;
        }

        .btn{
          display:inline-block;
          padding:14px 30px;
          background:#0d6efd;
          color:#fff;
          text-decoration:none;
          border-radius:6px;
          font-weight:600;
          margin-bottom:25px;
        }

        .stats{
          display:flex;
          gap:40px;
          flex-wrap:wrap;
        }

        .stat h2{
          font-size:36px;
          margin:0;
        }

        .arrow{
          position:absolute;
          top:50%;
          transform:translateY(-50%);
          background:rgba(0,0,0,0.6);
          border:none;
          color:white;
          font-size:30px;
          padding:10px 18px;
          cursor:pointer;
          z-index:5;
        }

        .prev{ left:20px; }
        .next{ right:20px; }

        /* TABLET */
        @media(max-width:992px){

          .slider{
            height:100vh;
            min-height:700px;
          }

          h1{
            font-size:34px;
          }
        }

        /* MOBILE HEIGHT INCREASED */
        @media(max-width:768px){

          .slider{
            height:105vh;
            min-height:700px;
          }

          .content{
            padding:20px;
          }

          h1{
            font-size:28px;
          }

          .subtitle{
            font-size:16px;
          }
        }

        /* SMALL MOBILE HEIGHT MORE */
        @media(max-width:480px){

          .slider{
            height:110vh;
            min-height:720px;
          }

          h1{
            font-size:22px;
          }

          .stats{
            flex-direction:column;
            gap:10px;
          }
        }

      `}</style>

    </div>
  );
}
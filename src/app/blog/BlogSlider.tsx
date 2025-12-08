"use client";

import { useMemo, useState } from "react";
import BlogCard from "../components/BlogCard";

interface Blog {
  id: number | string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  slug: string;
}

interface BlogSliderProps {
  blogs: Blog[];
  itemsPerSlide?: number;
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function BlogSlider({ blogs, itemsPerSlide = 3 }: BlogSliderProps) {
  const slides = useMemo(() => chunk(blogs, itemsPerSlide), [blogs, itemsPerSlide]);
  const [index, setIndex] = useState(0);

  if (!blogs || blogs.length === 0) {
    return <div className="col-12"><p>No blog posts available.</p></div>;
  }

  function prev() {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  }

  function next() {
    setIndex((i) => (i + 1) % slides.length);
  }

  return (
    <div className="blog-slider col-12">
         {slides.map((group, i) => (
        <div
          key={i}
          className="slider-slide"
          style={{ display: i === index ? "flex" : "none", gap: "1rem", width: "100%" }}
        >
          <div className="row" >
            {group.map((b) => (
              <BlogCard
                key={b.id}
                id={String(b.id)}
                title={b.title}
                excerpt={b.excerpt}
                image={b.image}
                date={b.date}
                slug={b.slug}
              />
            ))}
          </div>
        </div>
      ))}
      <div className="d-flex justify-content-between align-items-center mb-3">



        
        <button type="button" className="btn btn-outline-primary" onClick={prev} aria-label="Previous slide">Prev</button>
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`btn ${i === index ? "btn-primary" : "btn-outline-primary"} mx-1`}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={next} aria-label="Next slide">Next</button>
      </div>

     
    </div>
  );
}

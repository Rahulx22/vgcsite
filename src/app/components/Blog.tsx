"use client";

import Link from "next/link";
import Image from "next/image";
import { BlogItem } from "../../types/home";

export default function Blog({ items, title = "Our Blog" }: { items: BlogItem[]; title?: string }) {
  return (
    <div className="blog-sec py-12 md:py-16">
      <h2
        className="text-center text-2xl md:text-3xl lg:text-4xl font-semibold mb-10"
        data-aos="fade-up" data-aos-duration="1200"  >
        {title}
      </h2>
      <div className="container">
        <div className="row">
          {items.map((b) => (
            <div key={b.id || b.link}
              className="col-lg-4 col-md-6 mb-4">
              <div className="blog-box">
                <div className="blog-img">
                  <Link href={b.link} aria-label={`Read blog: ${b.title}`}>
                    <Image
                      src={b.image}
                      alt={b.title}
                      width={600}
                      height={400}
                      className="blog-main-img"
                      sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                      style={{ width: "100%", height: "auto" }}
                    />
                  </Link>
                </div>

                <h5>{b.date}</h5>

                <h3>
                  <Link href={b.link} className="blog-title">
                    {b.title}
                  </Link>
                </h3>

                <p>{b.excerpt}</p>

                <Link href={b.link} className="read-btn" aria-label={`Read more: ${b.title}`}>
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

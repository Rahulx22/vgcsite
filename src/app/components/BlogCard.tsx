"use client";

import Image from "next/image";
import Link from "next/link";

interface BlogCardProps { id: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  slug: string;
}

export default function BlogCard({ id, title, excerpt, image, date, slug }: BlogCardProps) {
  return (
    <div className="col-lg-4 col-md-6" id={`blog-${id}`}>
      <div className="blog-box">
        <div className="blog-img">
          <Link href={`/blog/${slug}`}>
            <Image 
              className="w-100" 
              src={image} 
              alt={title} 
              width={600} 
              height={400} 
              loading="lazy" 
            />
          </Link>
        </div>
        <h5>{date}</h5>
        <h3>
          <Link href={`/blog/${slug}`}>{title}</Link>
        </h3>
        <p>{excerpt}</p>
        <p>{slug}</p>
        <Link className="read-btn" href={`/blog/${slug}`}>
          Read More
        </Link>
      </div>
    </div>
  );
} 

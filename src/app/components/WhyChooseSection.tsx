"use client";

import Image from "next/image";
import React from "react";

interface Feature {
  icon?: string | null;
  title: string;
  description: string;
}

interface WhyChooseSectionProps {
  title: string;
  features?: Feature[] | null;
}

export default function WhyChooseSection({ title, features }: WhyChooseSectionProps) {
  if (!Array.isArray(features) || features.length === 0) {
    return null;
  }

  const fallbackIcons = [
    "/images/abt-icon.webp",
    "/images/abt-icon1.webp", 
    "/images/abt-icon2.webp",
    "/images/abt-icon3.webp"
  ];

  const getFallbackIcon = (index: number) => {
    return fallbackIcons[index % fallbackIcons.length] || "/images/icon.webp";
  }; 

  return (
    <div className="why-sec">
      <h2 data-aos="fade-up" data-aos-duration="1200"  style={{ margin: 10 }}>
        Why Choose
      </h2>
      <h3 data-aos="fade-up" data-aos-duration="1200">
        {title}
      </h3>
      <div className="container">
        <div className="row">
          {features.map((feature, index) => (
            <div
              key={index}
              className="col-lg-3 col-md-6 text-center"
              data-aos={index % 2 === 0 ? "fade-down" : "fade-up"}
              data-aos-duration="1200"
            >
              <div className="d-flex justify-content-center mb-3">
                <Image
                  src={feature.icon || getFallbackIcon(index)}
                  alt={`${feature.title} icon`}
                  width={150}
                  height={150}
                  loading="lazy"
                  unoptimized
                  onError={(e) => {
                    const fallbackSrc = getFallbackIcon(index);
                    console.warn(`Icon failed to load for "${feature.title}": ${feature.icon}`);
                    (e.target as HTMLImageElement).src = fallbackSrc;
                  }}
                />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

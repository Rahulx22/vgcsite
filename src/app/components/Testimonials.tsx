"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

type Testimonial = {
  text: string;
  author: string;
  avatar: string;
  rating?: string;
};

type TestimonialsProps = {
  items: Testimonial[];
  leftText?: string;
  rightText?: string;
  rightSubtext?: string;
};

export default function Testimonials({
  items,
  leftText = "Building Trust Through Results",
  rightText = "Testimonials",
  rightSubtext = "Client Success Stories: Hear What They Say",
}: TestimonialsProps) {
  const pathname = usePathname(); // 👈 detect navigation changes
  const [slides, setSlides] = useState<Testimonial[]>([]);

  // ✅ Update slides when data changes
  useEffect(() => {
    if (items && items.length) {
      setSlides(items);
    }
  }, [items]);

  // ✅ Reset swiper on route change
  useEffect(() => {
    // re-render when route changes
    setSlides((prev) => [...prev]);
  }, [pathname]);

  // ✅ Optional: refresh AOS animations
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        (window as any).AOS?.refresh?.();
      } catch {}
    }
  }, [slides]);

  return (
    <div className="testimonial-sec">
      <div className="container">
        <div className="row">
          {/* Left section */}
          <div className="col-xl-5 col-lg-6 col-md-10">
            <h2 data-aos="fade-up" data-aos-duration="1200">
              {leftText}
            </h2>
          </div>

          {/* Right section */}
          <div className="col-xl-5 col-lg-6 col-md-12 offset-xl-2">
            <h4>{rightText}</h4>
            <h3>{rightSubtext}</h3>

            <div className="comma-icon">
              <strong>
                <Image
                  src="/images/comma.svg"
                  alt="comma"
                  width={30}
                  height={30}
                  loading="lazy"
                />
              </strong>
            </div>

            {/* ✅ Force Swiper reinit on route or data change */}
            <Swiper
              key={`${pathname}-${slides.length}`} // 👈 key changes = full reinit
              modules={[Autoplay, Pagination]}
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              pagination={{ clickable: true }}
              loop={slides.length > 1}
              spaceBetween={10}
              slidesPerView={1}
              className="testimonial-carousel"
            >
              {slides.map((t, i) => (
                <SwiperSlide key={i}>
                  <div className="item">
                    <p>{t.text}</p>
                    <div className="client-img">
                      <h5>
                        <strong>
                          {"★".repeat(parseInt(t.rating || "5", 10))}
                        </strong>{" "}
                        {t.author}
                      </h5>                      
                      <Image
                        src={t.avatar}
                        alt={t.author}
                        width={56}
                        height={56}
                        loading="lazy"
                      />

                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  );
}

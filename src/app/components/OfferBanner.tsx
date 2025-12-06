"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { usePathname } from "next/navigation";

interface BannerItem {
  id: number;
  title: string;
  url: string;
}

export default function AutoBanner({ delay = 90000 }: { delay?: number }) {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // --------------------------------------------------
  // FETCH ONLY ONCE PER SESSION
  // --------------------------------------------------
  useEffect(() => {
    const cached = sessionStorage.getItem("offer_banners");

    if (cached) {
      setBanners(JSON.parse(cached));
      return;
    }

    const fetchBanners = async () => {
      try {
        // 🔥 Call local proxy API instead of external URL
        const res = await axios.get("/api/banner");

        const data = res?.data?.data || [];

        // Cache in session
        sessionStorage.setItem("offer_banners", JSON.stringify(data));

        setBanners(data);
      } catch (err) {
        console.error("OfferBanner Fetch Error:", err);
      }
    };

    fetchBanners();
  }, []);

  // --------------------------------------------------
  // SHOW POPUP AFTER EVERY PAGE NAVIGATION
  // --------------------------------------------------
  useEffect(() => {
    if (banners.length === 0) return;

    setOpen(false);
    setCurrent(0);

    const timer = setTimeout(() => setOpen(true), delay);

    return () => clearTimeout(timer);
  }, [pathname, banners, delay]);

  // --------------------------------------------------
  // AUTO SLIDE BANNERS
  // --------------------------------------------------
  useEffect(() => {
    if (!open || banners.length <= 1) return;

    const slider = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(slider);
  }, [open, banners]);

  if (!open || banners.length === 0) return null;

  const banner = banners[current];

  return (
    <>
      {/* FULL SCREEN OVERLAY */}
      <div
        className="p-2 position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center"
        style={{ zIndex: 9999 }}
      >
        <div
          className="bg-white rounded shadow-lg position-relative p-0 border border-5"
          style={{ maxWidth: "600px", animation: "slideUp .35s ease" }}
        >
          {/* FIXED CLOSE BUTTON */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Close"
            className="position-absolute end-0 top-0 m-2"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "white",
              border: "2px solid #ccc",
              fontSize: "16px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              boxShadow: "0px 0px 6px rgba(0,0,0,0.4)",
            }}
          >
            ✕
          </button>

          {/* IMAGE */}
          <img
            src={banner.url}
            alt={banner.title}
            className="img-fluid rounded w-100"
          />
        </div>

        {/* Animation */}
        <style jsx>{`
    @keyframes slideUp {
      from {
        transform: translateY(40px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `}</style>
      </div>


    </>
  );
}

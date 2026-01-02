"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";


/* ───────────────────────── Types ───────────────────────── */

type Block = {
  type: string;
  data: {
    title?: string;
    description?: string;
  };
};

type PageItem = {
  slug: string;
  title: string;
  blocks: Block[];
};

/* ─────────────────────── Constants ─────────────────────── */

const SETTINGS_API = "https://vgc.psofttechnologies.in/api/v1/settings";
const PAGES_API = "https://vgc.psofttechnologies.in/api/v1/pages";

/* ─────────────────────── Helpers ───────────────────────── */

function getPoliciesDescription(page?: PageItem | null) {
  return (
    page?.blocks?.find((b) => b.type === "Policies")?.data?.description || null
  );
}

/* ─────────────────────── Component ─────────────────────── */

export default function Footer({ data }: { data: any }) {
  const footerData = data;

  const logoUrl = footerData?.logoUrl || "/images/logo.svg";
  const description = footerData?.description || "VGC Consulting provides comprehensive business, tax, and compliance solutions.";
  const phoneHref = footerData?.phoneHref || "tel:+123456789100";
  const displayPhone = footerData?.displayPhone || "+123 456 789 100";
  const email = footerData?.email || "hi@vgc@gmail.com";
  const showNav = footerData?.showNav ?? true;
  const navItems = footerData?.navItems || [
    { label: "Home", url: "/", is_external: false, order: 1 },
    { label: "About Us", url: "/about-us", is_external: false, order: 2 },
    { label: "Services", url: "/service", is_external: false, order: 3 },
    { label: "Career", url: "/career", is_external: false, order: 4 },
    { label: "Contact Us", url: "/contact-us", is_external: false, order: 5 },
  ];
  const normalizeUrl = footerData?.normalizeUrl || ((url: string) => url);
  const socialLinks = footerData?.socialLinks || [];
  const pickIcon = footerData?.pickIcon || ((platform: string, icon?: string) => {
    if (icon) return icon;
    const icons: Record<string, string> = {
      facebook: "/images/fb.svg",
      twitter: "/images/tw.svg",
      linkedin: "/images/li.svg",
      instagram: "/images/ig.svg",
      youtube: "/images/yt.svg",
    };
    return icons[platform.toLowerCase()] || "/images/link.svg";
  });
  const newsletter = footerData?.newsletter || { enabled: false, heading: "Newsletter", subtext: "Subscribe to our newsletter" };
  const leftText = footerData?.leftText || "© 2025 VGC Consulting. All rights reserved.";
  const rightText = footerData?.rightText || "Powered by VGC";

  const [activeModal, setActiveModal] =
    useState<"policies" | null>(null);

  const [termsHtml, setTermsHtml] = useState<string | null>(null);
  const [privacyHtml, setPrivacyHtml] = useState<string | null>(null);

  /* ───────── Bottom Sheet States ───────── */
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const modalRef = useRef<HTMLDivElement | null>(null);

  /* ───────── Fetch Policies ───────── */
  useEffect(() => {
    fetch(PAGES_API)
      .then((res) => res.json())
      .then((json) => {
        const pages: PageItem[] = json?.data || json;

        setTermsHtml(
          getPoliciesDescription(
            pages.find((p) => p.slug === "terms-conditions")
          )
        );

        setPrivacyHtml(
          getPoliciesDescription(
            pages.find((p) => p.slug === "privacy-policy")
          )
        );
      })
      .catch(console.error);
  }, []);

  /* ───────── Animate OPEN ───────── */
  useEffect(() => {
    if (activeModal) {
      setTranslateY(window.innerHeight);
      requestAnimationFrame(() => {
        setTranslateY(0);
      });
    }
  }, [activeModal]);

  /* ───────── Close with animation ───────── */
  const closeModal = () => {
    setTranslateY(window.innerHeight);
    setTimeout(() => {
      setActiveModal(null);
      setTranslateY(0);
    }, 300);
  };

  /* ───────── Drag Logic ───────── */
  const startDrag = (y: number) => {
    setIsDragging(true);
    setStartY(y);
  };

  const moveDrag = (y: number) => {
    if (!isDragging) return;
    const delta = y - startY;
    if (delta > 0) setTranslateY(delta);
  };

  const endDrag = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (translateY > 150) {
      closeModal();
      return;
    }

    setTranslateY(0);
  };

  useEffect(() => {
    if (!isDragging) return;

    const mouseMove = (e: MouseEvent) => moveDrag(e.clientY);
    const touchMove = (e: TouchEvent) => moveDrag(e.touches[0].clientY);
    const end = () => endDrag();

    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup", end);
    window.addEventListener("touchmove", touchMove);
    window.addEventListener("touchend", end);

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", end);
    };
  }, [isDragging, translateY]);

  const modalHtml = (termsHtml ?? "<p>Terms not available.</p>") + "<br/><br/>" + (privacyHtml ?? "<p>Privacy not available.</p>");

  /* ─────────────────────── JSX ─────────────────────── */

  return (
    <>
    <footer>
        <div className="container">
          <div className="row" style={{ alignItems: "flex-start" }}>
            <div className="col-xl-4 col-lg-4 col-md-4" style={{ minWidth: 0 }}>
              <Link href="/" aria-label="Home">


                <Image
                  src={logoUrl}
                  alt="logo"
                  width={220}
                  height={64}
                  loading="lazy"
                  unoptimized
                  // Clamp the visual height to avoid layout break
                  style={{
                    height: "clamp(32px, 6vw, 56px)",
                    width: "auto",
                    maxWidth: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/logo.svg";
                  }}
                />
              </Link>

              <p style={{ marginTop: 12 }}>{description}</p>

              <ul className="info-list">
                <li>
                  <a href={phoneHref} style={{ display: "inline-flex", alignItems: "center" }}>
                    <Image src="/images/ph.svg" alt="phone icon" width={15} height={15} loading="lazy" />
                    <span style={{ paddingLeft: 6, wordBreak: "break-word" }}>{displayPhone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`} style={{ display: "inline-flex", alignItems: "center" }}>
                    <Image src="/images/ms.svg" alt="email icon" width={15} height={15} loading="lazy" />
                    <span style={{ paddingLeft: 6, wordBreak: "break-word" }}>{email}</span>
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-xl-3 col-lg-3 col-md-2 offset-xl-1" style={{ minWidth: 0 }}>
              <h2>Navigation</h2>
              {showNav && (
                <ul>
                  {navItems.map((item) => {
                    const href = normalizeUrl(item.url);
                    const external = item.is_external || /^https?:\/\//i.test(item.url || "");
                    return (
                      <li key={`${item.order}-${item.label}`}>
                        {external ? (
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            {item.label}
                          </a>
                        ) : (
                          <Link href={href}>{item.label}</Link>
                        )}
                      </li>
                    );
                  })}
                  <li>
                    <button
                      onClick={() => setActiveModal("policies")}
                      className="hover:text-white underline"
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                      Terms & Conditions
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveModal("policies")}
                      className="hover:text-white underline"
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                    >
                      Privacy Policy
                    </button>
                  </li>
                </ul>
              )}
            </div>

            {/* Social + Newsletter? */}

            
            <div className="col-xl-4 col-lg-5 col-md-6" style={{ minWidth: 0 }}>
              <ul className="social-icon" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {socialLinks.map((social, idx) => {
                  const iconSrc = pickIcon(social.platform, social.icon || undefined);
                  const href = social.url?.trim() ? social.url : "#";
                  const label = (social.platform || "social").toLowerCase();
                  const external = /^https?:\/\//i.test(href);
                  return (
                    <li key={idx} style={{ listStyle: "none" }}>
                      <a
                        href={href}
                        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        aria-label={`${label} social link`}
                      >
                        <Image
                          src={iconSrc}
                          alt={`${label} icon`}
                          width={30}
                          height={30}
                          loading="lazy"
                          unoptimized
                          style={{ display: "block", objectFit: "contain" }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/images/link.svg";
                          }}
                        />
                      </a>
                    </li>
                  );
                })}
              </ul>

              {newsletter?.enabled && (
                <>
                  <h2>{newsletter.heading}</h2>
                  <p>{newsletter.subtext}</p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = (e.currentTarget.querySelector(".box") as HTMLInputElement) || null;
                      const emailVal = input?.value?.trim();
                      if (!emailVal) alert("Please enter your email");
                      else {
                        alert(`Subscribed: ${emailVal}`);
                        if (input) input.value = "";
                      }
                    }}
                  >
                    <input className="box" type="text" placeholder="Your Email" />
                    <input type="submit" className="call-btn" value="Subscribe" />
                  </form>
                </>
              )}
            </div>

            {/* Bottom bar */}
            <div className="col-lg-12 col-md-12">
              <div className="copy-txt" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <h6 style={{ margin: 0 }}>{leftText}</h6>
                <h6 style={{ margin: 0, textAlign: "center", flex: "1 1 auto" }}>{rightText}</h6>
              </div>
            </div>
          </div>
        </div>
      </footer>

            {/* ── Bottom Sheet Modal ── */}
            {activeModal && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-[1000] bg-black/60"
                  onClick={closeModal}
                />

                {/* Sheet */}
                <div className="fixed inset-x-0 bottom-0 z-[1001]">
                  <div
                    ref={modalRef}
                    className="mx-4 bg-gradient-to-t from-gray-900 via-gray-900 to-gray-950 rounded-3xl rounded-b-none shadow-2xl max-h-[90vh] overflow-y-auto pb-10 pt-6"
                    style={{
                      transform: `translateY(${translateY}px)`,
                      transition: isDragging
                        ? "none"
                        : "transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Drag Handle */}
                    <div
                      className="mx-auto mb-6 h-1.5 w-20 bg-gray-500 rounded-full cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => startDrag(e.clientY)}
                      onTouchStart={(e) => startDrag(e.touches[0].clientY)}
                    />

                    {/* Header */}
                    <div className="px-8 pb-6 border-b border-gray-800 flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-white">
                        Terms & Conditions & Privacy Policy
                      </h2>
                      <button
                        onClick={closeModal}
                        className="text-gray-400 hover:text-white text-xl"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Content */}
                    <div
                      className="px-8 pt-6 text-gray-300 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: modalHtml }}
                    />
                  </div>
                </div>
              </>
            )}
    </>
  );
}

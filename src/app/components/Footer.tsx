"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";

/* ================= TYPES ================= */

type NavigationItem = {
  label: string;
  url: string;
  is_external: boolean;
  order: number;
};

type SocialLink = {
  platform: string;
  url: string;
  icon: string | null;
};

type FooterData = {
  column_1: {
    logo: string;
    description: string;
    phone: string;
    email: string;
  };
  column_2: {
    show_navigation: boolean;
    navigation: NavigationItem[];
  };
  column_3: {
    social_links: SocialLink[];
    newsletter: {
      enabled: boolean;
      heading: string;
      subtext: string;
    };
  };
  bottom_bar: {
    left_text: string;
    right_text: string;
  };
};

type FooterProps = { data?: FooterData | null };

/* ================= CONSTANTS ================= */

const STORAGE_BASE = "https://vgc.psofttechnologies.in/storage/";
const PAGES_API = "https://vgc.psofttechnologies.in/api/v1/pages";

/* ================= HELPERS ================= */

function normalizeUrl(raw?: string) {
  if (!raw) return "/";
  let url = raw.trim().replace(/\\/g, "");
  if (/^https?:\/\//i.test(url)) return url;
  if (!url.startsWith("/")) url = `/${url}`;
  if (url === "/home") return "/";
  return url;
}

function normalizePhoneToHref(raw?: string) {
  if (!raw) return "tel:+123456789100";
  if (raw.startsWith("tel:")) return raw;
  return `tel:${raw.replace(/\s+/g, "")}`;
}

const iconMap: Record<string, string> = {
  facebook: "fb.svg",
  twitter: "tw.svg",
  linkedin: "link.svg",
  instagram: "ins.svg",
  pinterest: "pint.svg",
};

function pickIcon(platform: string, explicit?: string | null) {
  if (explicit && explicit.trim()) {
    return /^https?:\/\//i.test(explicit)
      ? explicit
      : `${STORAGE_BASE}${explicit.replace(/^\/+/, "")}`;
  }
  return `/images/${iconMap[platform.toLowerCase()] ?? "link.svg"}`;
}

/* ================= FOOTER ================= */

export default function Footer({ data }: FooterProps) {
  /* ===== Policy States ===== */
  const [activePolicy, setActivePolicy] = useState<"terms" | "privacy" | null>(null);
  const [termsHtml, setTermsHtml] = useState<string | null>(null);
  const [privacyHtml, setPrivacyHtml] = useState<string | null>(null);

  /* ===== Fetch Policies ===== */
  useEffect(() => {
    fetch(PAGES_API)
      .then((res) => res.json())
      .then((res) => {
        const pages = res?.data || res;

        const getPolicy = (slug: string) =>
          pages
            ?.find((p: any) => p.slug === slug)
            ?.blocks?.find((b: any) => b.type === "Policies")?.data
            ?.description || null;

        setTermsHtml(getPolicy("terms-conditions"));
        setPrivacyHtml(getPolicy("privacy-policy"));
      })
      .catch(console.error);
  }, []);

  /* ===== Column 1 ===== */
  const logoPath = data?.column_1?.logo?.trim() || "";
  const logoUrl = logoPath
    ? `${STORAGE_BASE}${logoPath.replace(/^\/+/, "")}`
    : "/images/logo.svg";

  const description =
    data?.column_1?.description ??
    "Don't let finance and tax problems hold you back. At VGC Advisors, we are committed to empowering your business with expert financial advice and tailored solutions.";

  const displayPhone = data?.column_1?.phone ?? "+123 456 789 100";
  const phoneHref = normalizePhoneToHref(displayPhone);
  const email = data?.column_1?.email ?? "hi@vgc@gmail.com";

  /* ===== Column 2 ===== */
  const navItems =
    data?.column_2?.navigation?.length
      ? [...data.column_2.navigation].sort((a, b) => a.order - b.order)
      : [];

  const showNav = data?.column_2?.show_navigation ?? true;

  /* ===== Column 3 ===== */
  const socialLinks = data?.column_3?.social_links || [];
  const newsletter = data?.column_3?.newsletter;

  /* ===== Bottom ===== */
  const leftText = data?.bottom_bar?.left_text || "VGC Consulting Pvt. Ltd.";
  const rightText =
    data?.bottom_bar?.right_text ||
    "Copyright © 2025. All rights reserved.";

  /* ================= JSX ================= */

  return (
    <>



      <footer>
        <div className="container">
          <div className="row">

            {/* Branding */}
            <div className="col-xl-4 col-lg-4 col-md-4">
              <Link href="/">
                <Image src={logoUrl} alt="logo" width={220} height={64} unoptimized />
              </Link>

              <p>{description}</p>

              <ul className="info-list">
                <li>
                  <a href={phoneHref}>
                    <Image src="/images/ph.svg" alt="" width={15} height={15} />
                    <span>{displayPhone}</span>
                  </a>
                </li>
                <li>
                  <a href={`mailto:${email}`}>
                    <Image src="/images/ms.svg" alt="" width={15} height={15} />
                    <span>{email}</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Navigation */}
            <div className="col-xl-3 col-lg-3 col-md-2 offset-xl-1">
              <h2>Navigation</h2>
              {showNav && (
                <ul>
                  {navItems.map((item) => {
                    const href = normalizeUrl(item.url);
                    const external = item.is_external || /^https?:\/\//i.test(item.url || "");

                    // Skip Terms & Privacy here
                    if (item.label === 'Terms Conditions' || item.label === 'Privacy Policy') {
                      return null;
                    }

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

                  {/* ✅ Separate Policy Buttons */}
                  {termsHtml && (
                    <li>
                      <button
                        onClick={() => setActivePolicy("terms")}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        Terms & Conditions
                      </button>
                    </li>
                  )}

                  {privacyHtml && (
                    <li>
                      <button
                        onClick={() => setActivePolicy("privacy")}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                      >
                        Privacy Policy
                      </button>
                    </li>
                  )}
                </ul>
              )}

            </div>

            {/* Social + Newsletter */}
            <div className="col-xl-4 col-lg-5 col-md-6">
              <ul className="social-icon">
                {socialLinks.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} target="_blank">
                      <Image
                        src={pickIcon(s.platform, s.icon)}
                        alt=""
                        width={30}
                        height={30}
                        unoptimized
                      />
                    </a>
                  </li>
                ))}
              </ul>

              {newsletter?.enabled && (
                <>
                  <h2>{newsletter.heading}</h2>
                  <p>{newsletter.subtext}</p>
                  <form>
                    <input className="box" placeholder="Your Email" />
                    <input type="submit" className="call-btn" />
                  </form>
                </>
              )}
            </div>

            {/* Bottom */}
            <div className="col-lg-12">
              <div className="copy-txt">
                <h6>{leftText}</h6>
                <h6>{rightText}</h6>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= MODAL ================= */}
      {activePolicy && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            zIndex: 9999,
          }}
          onClick={() => setActivePolicy(null)}
        >
          <div
            style={{
              background: "#fff",
              maxWidth: 900,
              margin: "5vh auto",
              padding: 30,
              borderRadius: 8,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setActivePolicy(null)}>✕</button>

            <div
              dangerouslySetInnerHTML={{
                __html:
                  activePolicy === "terms" ? termsHtml! : privacyHtml!,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

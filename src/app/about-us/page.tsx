// app/about/page.tsx
import React from "react";
import InnerBanner from "../components/InnerBanner";
import AboutSection from "../components/AboutSection";
import WhyChooseSection from "../components/WhyChooseSection";
import TeamSection from "../components/TeamSection";
import Head from "next/head";

import * as NextCache from "next/cache";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { i } from "framer-motion/client";

// Force fresh
export const revalidate = 0;
export const dynamic = "force-dynamic";

// ------------------------------
// Utilities
// ------------------------------

const noStoreCompat =
  (NextCache as any).noStore ??
  (NextCache as any).unstable_noStore ??
  (() => {});

const STORAGE_BASE = "https://vgc.psofttechnologies.in/storage/";

function mkImage(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const clean = String(path).replace(/^\/+/, "");
  const withBuilder = clean.startsWith("builder/") ? clean : `builder/${clean}`;
  return `${STORAGE_BASE}${withBuilder}`;
}

function splitParagraphs(text?: string | null) {
  if (!text) return [];
  return String(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

// ------------------------------
// API Response Type
// ------------------------------

type ApiResponse = {
  success: boolean;
  message: string;
  data: Array<{
    id: number;
    title: string;
    slug: string;
    type: string;
    blocks: Array<{ type: string; data: any }>;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
  }>;
};

// ------------------------------
// Shared Fetch Function
// ------------------------------

async function loadAboutPage() {
  noStoreCompat();

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/pages`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Pages API returned ${res.status}`);

  const payload = (await res.json()) as ApiResponse;

  return (
    payload.data.find((p) => p.type === "about" || p.slug === "about") ?? null
  );
}

// ------------------------------
// DYNAMIC METADATA
// ------------------------------

export async function generateMetadata(): Promise<Metadata> {
  try {
    const aboutPage = await loadAboutPage();
    console.log("About Page Data for Metadata:", aboutPage);

    if (!aboutPage) {
      return {
        title: "About Us | VGC Consulting",
        description:
          "Learn about VGC Consulting's mission, values, and expert team.",
      };
    }

    return {
      title:
        aboutPage.meta_title || aboutPage.title || "About Us | VGC Consulting",
      description:
        aboutPage.meta_description ||
        "Discover VGC Consulting's mission, values, and team.",
      keywords:
        aboutPage.meta_keywords || "about us, vgc consulting, financial services",
      openGraph: {
        title: aboutPage.meta_title || aboutPage.title,
        description: aboutPage.meta_description || "",
      },
    };
  } catch {
    return {
      title: "About Us | VGC Consulting",
      description:
        "Learn about VGC Consulting's mission, values, and financial expertise.",
    };
  }
}

// ------------------------------
// PAGE COMPONENT
// ------------------------------

async function fetchAboutPage() {
  const aboutPage = await loadAboutPage();
  if (!aboutPage) return null;

  const getBlock = (type: string) =>
    aboutPage.blocks.find((b) => b.type === type)?.data ?? null;

  // Banner
  const bannerBlock = getBlock("banner_slider_section");
  const banner = (bannerBlock?.banners && bannerBlock.banners[0]) || null;
  const bannerData = {
    title: banner?.title ?? "About Us",
    subtitle: banner?.subtitle ?? "",
    ctaText: banner?.cta_text ?? null,
    ctaLink: banner?.cta_link ?? null,
    image: mkImage(banner?.image ?? bannerBlock?.image ?? null),
  };

  // About content
  const aboutBlock = getBlock("about_section");
  const about = {
    title: aboutBlock?.left_heading ?? aboutBlock?.heading ?? "About Us",
    paragraphs: splitParagraphs(
      aboutBlock?.left_description ?? aboutBlock?.description
    ),
    image: mkImage(aboutBlock?.right_image ?? aboutBlock?.left_image ?? null),
  };

  // Why choose
  const whyBlock = getBlock("why_choose_us_section");
  const whyChoose = {
    title: whyBlock?.heading ?? "Why Choose",
    subtitle: whyBlock?.subtext ?? "VGC Advisors",
    features:
      Array.isArray(whyBlock?.items)
        ? whyBlock.items.map((it: any) => ({
            icon: mkImage(it.icon),
            title: it.title ?? "",
            description: it.description ?? "",
          }))
        : [],
  };

  // What we believe
  const believeBlock = getBlock("what_we_believe_section");
  const beliefs = {
    title: believeBlock?.right_title ?? "What We Believe In",
    paragraphs: splitParagraphs(believeBlock?.right_description),
    image: mkImage(
      believeBlock?.left_image ?? believeBlock?.right_image ?? null
    ),
    ctaText: believeBlock?.right_cta_text ?? null,
    ctaLink: believeBlock?.right_cta_link ?? null,
  };

  // Team
  const teamBlock = getBlock("team_section");
  const team = {
    title: "Our Team",
    members:
      Array.isArray(teamBlock?.members)
        ? teamBlock.members.map((m: any) => ({
            name: m.name ?? "",
            image: mkImage(m.photo ?? m.image),
            bio: m.description ?? m.bio ?? "",
          }))
        : [],
  };

  // Global presence
  const globalBlock = getBlock("global_presence_section");
  const globalPresence = {
    title: globalBlock?.left_title ?? "Global Presence",
    paragraphs: splitParagraphs(globalBlock?.left_description),
    image: mkImage(globalBlock?.right_image),
  };

  // CTA
  const ctaBlock = getBlock("cta_section");
  const cta = {
    title: ctaBlock?.top_heading ?? "Get Started Today!",
    subtitle:
      ctaBlock?.main_heading ??
      "Let's Build Your Business Success Story — Together",
    description: ctaBlock?.subtext ?? "",
    phone: ctaBlock?.cta_link ?? "tel:+1234567891",
    ctaText: ctaBlock?.cta_text ?? "Contact Us Today",
  };

  return { banner: bannerData, about, whyChoose, beliefs, team, globalPresence, cta };
}






export default async function AboutPage() {
  const data = await fetchAboutPage();

  if (!data) {
    return (
      <main className="container py-8">
        <h1>About</h1>
        <p>Sorry — about page content is currently unavailable.</p>
      </main>
    );
  }

  return (
    <>
    <Head><link rel="canonical" href="https://vgcadvisors.com/about-us" />
    <meta name="robots" content="index, follow"></meta></Head>
      <InnerBanner
        title={data.banner.title}
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: data.banner.title, href: "/about" },
        ]}
        image={data.banner.image ?? "/images/about-banner.webp"}
        alt="about-banner"
      />

      <AboutSection
        title={data.about.title}
        paragraphs={data.about.paragraphs}
        image={data.about.image ?? "/images/about-img.webp"}
        imageAlt="about-img"
      />

      <WhyChooseSection
        title={data.whyChoose.subtitle ?? "Why Choose"}
        features={data.whyChoose.features}
      />

      <AboutSection
        title={data.beliefs.title}
        paragraphs={data.beliefs.paragraphs}
        image={data.beliefs.image ?? "/images/about-img1.webp"}
        imageAlt="about-img1"
        reverse
      />

      <TeamSection title={data.team.title} members={data.team.members} />

      <AboutSection
        title={data.globalPresence.title}
        paragraphs={data.globalPresence.paragraphs}
        image={data.globalPresence.image ?? "/images/about-img.webp"}
        imageAlt="about-img"
      />

      <div className="ready-sec">
        <div className="container">
          <div className="row">
            <div
              className="col-xl-10 col-lg-12 col-md-12 offset-xl-1"
              data-aos="fade-left"
              data-aos-duration="1200"
            >
              <h3>{data.cta.title}</h3>
              <h2>{data.cta.subtitle}</h2>
              <p>{data.cta.description}</p>
              <a href={data.cta.phone}>{data.cta.ctaText}</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


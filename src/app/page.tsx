import HeroCarousel from "./components/HeroCarousel";
import Services from "./components/Services";
import Blog from "./components/Blog";
import Clients from "./components/Clients";
import Testimonials from "./components/Testimonials";

import type { HomeData } from "../types/home";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../lib/api";
import * as NextCache from "next/cache";
import { headers } from "next/headers";
import type { Metadata } from "next";
import { head } from "framer-motion/client";
import Head from "next/head";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "VGC Consulting - Business, Tax & Compliance Solutions",
  description:
    "VGC Consulting provides comprehensive business, tax, and compliance solutions tailored to empower MSMEs, corporates, and global ventures.",
  keywords:
    "business consulting, tax services, compliance services, MSME support, corporate advisory",
    
  };

const noStoreCompat =
  (NextCache as any).noStore ??
  (NextCache as any).unstable_noStore ??
  (() => {});

// ----------------------- UTILS ------------------------------
function splitCount(raw: any) {
  const str = String(raw ?? "").trim();
  const m = str.match(/^(\d+(?:\.\d+)?)(.*)$/);
  return {
    value: m ? Number(m[1]) : null,
    suffix: m ? m[2].trim() : "",
    display: str,
  };
}

// ----------------------- STRICT MAPPER ----------------------
function mapApiToHomeDataStrict(apiJson: any): HomeData {
  const pages = Array.isArray(apiJson?.data) ? apiJson.data : [];
  const homePage = pages.find((p: any) => p.slug === "homepage") || {};
  const blocks = Array.isArray(homePage.blocks) ? homePage.blocks : [];

  // ----------------- HERO (FULL ITERATION) -------------------
  const bannerBlock =
    blocks.find((b: any) => b.type === "banner_slider_section") || {};
  const bannersRaw = Array.isArray(bannerBlock?.data?.banners)
    ? bannerBlock.data.banners
    : [];

  // Map ALL banners
  const heroBanners = bannersRaw.map((bn: any) => {
    const countersRaw = Array.isArray(bn?.statics) ? bn.statics : [];

    const counters = countersRaw.map((s: any) => {
      const { value, suffix, display } = splitCount(s?.count_percent);
      return {
        label: s?.text || "",
        value,
        suffix,
        display,
      };
    });

    return {
      title: bn?.title || "",
      paragraphs: bn?.subtitle
        ? String(bn.subtitle)
            .split(/\n{1,}/)
            .map((s: string) => s.trim())
        : [],
      phone: (bn?.cta_link || "").replace(/^tel:/, ""),
      counters,
      image: ensureUrl(bn?.image),
      ctaLink: bn?.cta_link || "",
      ctaText: bn?.cta_text || "",
    };
  });

  // Hero object for carousel
  const hero = {
    banners: heroBanners,
  };

  // ----------------- SERVICES -------------------
  const servicesBlock = blocks.find(
    (b: any) => b.type === "services_section"
  ) || { data: {} };

  const services =
    servicesBlock?.data?.services?.map((s: any) => ({
      title: s?.title || "",
      desc: stripHtml(s?.short_description || s?.long_description || ""),
      link: s?.slug ? `/service/${s.slug}` : "/service",
    })) || [];

  // ----------------- BLOG -----------------------
  const blogBlock = blocks.find((b: any) => b.type === "blog_section") || {
    data: {},
  };

  const blog =
    blogBlock?.data?.blogs?.map((b: any) => ({
      id: b?.id,
      date: b?.created_at
        ? new Date(b.created_at).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "",
      title: b?.title || "",
      excerpt: stripHtml(b?.short_description || ""),
      image: ensureUrl(b?.featured_image || b?.cover_image),
      link: b?.slug ? `/blog/${b.slug}` : "/blog",
    })) || [];

  const blogTitle = blogBlock?.data?.title || "Our Blog";

  // ----------------- CLIENTS --------------------
  const clientsBlock = blocks.find(
    (b: any) => b.type === "clients_logo_section"
  ) || { data: {} };

  const clients =
    clientsBlock?.data?.logos?.map((c: any) => ({
      title: c?.title || "",
      icon: ensureUrl(c?.logo),
    })) || [];

  const clientsTitle = clientsBlock?.data?.title || "";
  const clientsSubtitle = clientsBlock?.data?.subtitle || "";

  // ----------------- TESTIMONIALS ----------------
  const testimonialsBlock = blocks.find(
    (b: any) => b.type === "testimonials_section"
  ) || { data: {} };

  const testimonials =
    testimonialsBlock?.data?.items?.map((t: any) => ({
      text: t?.quote || "",
      author: t?.author || t?.item_author || "",
      rating: String(t?.rating ?? "5"),
      avatar: ensureUrl(t?.avatar),
    })) || [];

  // ----------------- CTA -------------------------
  const ctaBlock =
    blocks.find((b: any) => b.type === "cta_section") || ({} as any);

  const cta = ctaBlock?.data
    ? {
        topHeading: ctaBlock?.data?.top_heading || "",
        mainHeading: ctaBlock?.data?.main_heading || "",
        subtext: ctaBlock?.data?.subtext || "",
        ctaLink: ctaBlock?.data?.cta_link || "#",
        ctaText: ctaBlock?.data?.cta_text || "",
      }
    : {
        topHeading: "",
        mainHeading: "",
        subtext: "",
        ctaLink: "#",
        ctaText: "",
      };

  return {
    hero,
    services,
    blog,
    blogTitle,
    clients,
    clientsTitle,
    clientsSubtitle,
    testimonials,
    cta,
    
  };
}

// ------------------------ PAGE ------------------------------
export default async function Page() {
  noStoreCompat();

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;

  const pagesRes = await fetchWithTimeout(`${base}/api/pages`, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  if (!pagesRes.ok) {
    const text = await pagesRes.text().catch(() => "<no body>");
    throw new Error(
      `Pages API returned non-OK ${pagesRes.status} - ${pagesRes.statusText}. Body: ${text}`
    );
  }

  const json = await pagesRes.json();
  const data = mapApiToHomeDataStrict(json);

  return (
    <>
    <Head>  <link rel="canonical" href="https://vgcadvisors.com/" /></Head>
      <HeroCarousel hero={data.hero}  />
      <Services services={data.services} />
      <Blog items={data.blog} title={data.blogTitle} />
      <Clients
        items={data.clients}
        title={data.clientsTitle}
        subtitle={data.clientsSubtitle}
      />
      <Testimonials items={data.testimonials} />

      {/* CTA Section */}



      <div className="ready-sec">
        <div className="container">
          <div className="row">
            <div
              className="col-lg-12 col-md-12"
              data-aos="fade-left"
              data-aos-duration="1200"
            >
              {data.cta && (
                <>
                  <h3>{data.cta.topHeading}</h3>
                  <h2>{data.cta.mainHeading}</h2>
                  <p>{data.cta.subtext}</p>
                  <a href={data.cta.ctaLink}>{data.cta.ctaText}</a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

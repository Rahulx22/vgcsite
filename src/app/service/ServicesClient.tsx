"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
// import type { Metadata } from "next";
import Head from "next/head";


type CMSBlock =
  | {
      type: "banner_slider_section";
      data: {
        banners: Array<{
          image: string;
          title: string | null;
          subtitle?: string | null;
          cta_link?: string | null;
          cta_text?: string | null;
          statics?: Array<{ text: string | null; count_percent: string | null }>;
        }>;
      };
    }
  | {
      type: "personal_note_section";
      data: {
        title?: string | null;
        position?: string | null;
        signature?: string | null;
        description?: string | null;
      };
    }
  | {
      type: "services_section";
      data: {
        title?: string | null;
        subtitle?: string | null;
        show_all?: boolean;
        services?: Array<{
          id: number;
          title: string;
          slug: string;
          short_description?: string | null;
          sub_heading?: string | null;
          long_description?: string | null;
          featured_image?: string | null;
          mobile_featured_image?: string | null;
          status?: string;
        }>;
      };
    }
  | {
      type: string;
      data: any;
    };

type CMSPage = {
  id: number;
  title: string;
  slug: string;
  type: string;
  blocks: CMSBlock[];
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
};

type CMSResponse = {
  success: boolean;
  message: string;
  data: CMSPage[];
};

// ---------- Helpers ----------
const API_URL = "https://panel.vgcadvisors.com/api/v1/pages";
const STORAGE_BASE =
  process.env.NEXT_PUBLIC_CMS_STORAGE_BASE ||
  "https://panel.vgcadvisors.com/storage";

function assetUrl(path?: string | null): string {
  if (!path) return "";
  const p = path.startsWith("/") ? path.slice(1) : path;
  if (/^https?:\/\//i.test(p)) return p;
  return `${STORAGE_BASE}/${p}`;
}

/** Strip HTML tags + entities and collapse whitespace. */
function toPlainText(html?: string | null): string {
  if (!html) return "";
  let text = html.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  return text.replace(/\s+/g, " ").trim();
}

/** Make a clean short excerpt without odd line breaks. */
function excerpt(s: string, maxLen = 120): string {
  if (s.length <= maxLen) return s;
  const cut = s.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

// ---------- Component ----------
export default function ServicePage() {
  // ---- Static (keep form as-is) ----
  const [formData, setFormData] = useState({name: "",email: "",phone: "",service: "",message: "",});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      // Prepare the data to match API expected format
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        service: formData.service,
        message: formData.message
      };

      const response = await fetch("https://panel.vgcadvisors.com/api/v1/contact-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.message || `HTTP ${response.status}`);
      }

      setSubmitSuccess(true);
      setFormData({ name: "", email: "", phone: "", service: "", message: "" });
      // Auto-hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit the form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Dynamic ----
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState<CMSPage | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        // Use fetchWithTimeout with caching for 5 minutes
        const res = await fetch(API_URL, { 
          cache: "force-cache",
          next: { revalidate: 300 } // Cache for 5 minutes (300 seconds)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: CMSResponse = await res.json();

        const servicesPage =
          json?.data?.find((p) => p.slug === "services") ||
          json?.data?.find((p) => p.type === "services") ||
          null;

        if (!servicesPage) throw new Error("Services page not found");
        if (mounted) setPage(servicesPage);
      } catch (e: any) {
        if (mounted) setErr(e?.message || "Failed to load data");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Pick blocks we care about
  const banner = useMemo(() => {
    const block = page?.blocks?.find((b) => b.type === "banner_slider_section") as Extract<
      CMSBlock,
      { type: "banner_slider_section" }
    > | undefined;
    const first = block?.data?.banners?.[0];
    console.log("Banner block:", first);
    return first
      ? {
          title: first.title || "Our Expertise, Your Growth",
          description:
            first.subtitle ||
            "Comprehensive business, tax, and compliance solutions tailored to empower MSMEs, corporates, and global ventures — delivered with precision, integrity, and strategic insight.",
          image: assetUrl(first.image) || "/images/service-banner.webp",
          alt: first.title || "Service Banner",
        }
      : {
          title: "Our Expertise, Your Growth",
          description:
            "Comprehensive business, tax, and compliance solutions tailored to empower MSMEs, corporates, and global ventures — delivered with precision, integrity, and strategic insight.",
          image: "/images/service-banner.webp",
         alt: first.title || "Service Banner",
        };
  }, [page]);




  const founderNote = useMemo(() => {
    const block = page?.blocks?.find((b) => b.type === "personal_note_section") as Extract<
      CMSBlock,
      { type: "personal_note_section" }
    > | undefined;
console.log("Founder note block:", block);  
    return {
      title: block?.data?.title || "A Personal Note from Our Founder & CEO",
      description:
        block?.data?.description ||
        "With a vision to empower MSMEs and a commitment to integrity, innovation, and client success, I lead VGC Advisors with the belief that your growth is our greatest achievement.",
      signature: assetUrl(block?.data?.signature) || "/images/sign.svg",
      name: block?.data?.position || "Founder & Senior Of VGC Consultancy",
    };
  }, [page]);

  const servicesSection = useMemo(() => {
    const block = page?.blocks?.find((b) => b.type === "services_section") as Extract<
      CMSBlock,
      { type: "services_section" }
    > | undefined;

    const items =
      block?.data?.services
        ?.filter(s => s.status === 'active' || s.status === 'Active' || s.status === 'ACTIVE')
        // No limit here - show all services
        ?.map((s) => {
          const txt =
            toPlainText(s.short_description) ||
            toPlainText(s.sub_heading) ||
            toPlainText(s.long_description);
          return {
            title: s.title,
            slug: s.slug,
            link: `/service/${s.slug}`, // ✅ correct route
            summary: excerpt(txt || `Explore details about ${s.title}`),
          };
        }) ?? [];

    return {
      title: block?.data?.title || "A range of Services Provided by VGC",
      items,
    };
  }, [page]);

  // ---- Render ----
  return (
    <>
      {/* Banner */}
    <Head><link rel="canonical" href="https://vgcadvisors.com/service" />
    <meta name="robots" content="index, follow"></meta>
    </Head>
      <div
        className="service-banner"
        style={{
          backgroundImage: `url(${banner.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-label={banner.alt}
      >
        <div className="container">
          <div className="row">
            <div
              className="col-xl-6 col-lg-9 col-md-12"
              data-aos="fade-right"
              data-aos-duration="1200"
            >
              <h1 style={{ minHeight: '100px', display: 'flex', alignItems: 'center' }}>
                {banner.title}
              </h1>
              <p style={{ minHeight: '120px', display: 'flex', alignItems: 'center' }}>
                {banner.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form (static as requested) */}
      <div className="service-form">
        <div className="container">
          <div className="row align-items-start">
            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="serv-form" data-aos="fade-up" data-aos-duration="1200">
                <div className="serv-head">
                  <h3>Make Confident Decisions with VGC Advisors</h3>
                  <p>
                    Our seasoned professionals provide clear, practical, and result-driven advice
                    for your business journey.
                  </p>
                </div>

                {submitSuccess && (
                  <div className="alert alert-success" style={{ margin: '20px' }}>
                    Thank you for your request! We'll get back to you soon.
                  </div>
                )}
                {submitError && (
                  <div className="alert alert-danger" style={{ margin: '20px' }}>
                    {submitError}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="in-box">
                    <input
                      className="box"
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      aria-label="Full name"
                    />
                  </div>

                  <div className="in-box">
                    <input
                      className="box"
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      aria-label="Email address"
                    />
                  </div>

                  <div className="in-box">
                    <input
                      className="box"
                      type="tel"
                      name="phone"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      aria-label="Phone number"
                    />
                  </div>

                  <div className="in-box">
                    <select
                      className="box"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      aria-label="Select a service"
                    >
                      <option value="">Service</option>
                      {(servicesSection.items.length
                        ? servicesSection.items
                        : [
                            { title: "Business Support", slug: "business-support", link: "#" },
                            { title: "Direct Tax Services", slug: "direct-tax", link: "#" },
                            { title: "Indirect Tax Services", slug: "indirect-tax", link: "#" },
                          ]
                      ).map((s) => (
                        <option key={s.slug} value={s.title}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="in-box">
                    <textarea
                      className="box"
                      name="message"
                      rows={4}
                      placeholder="Message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <input
                    type="submit"
                    className="call-btn"
                    value={submitting ? "Sending..." : "Request a Consultation"}
                    disabled={submitting}
                  />
                </form>
              </div>
            </div>

            <div className="col-xl-5 col-lg-6 col-md-12 offset-xl-1">
              <h2>{founderNote.title}</h2>
              <p>{founderNote.description}</p>
              <div style={{ margin: "14px 0" }}>
                <img
                  src={founderNote.signature || "/images/sign.svg"}
                  alt="sign"
                  width={100}
                  height={30}
                />
              </div>
              <p>{founderNote.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="service-sec dd">
        <div className="container">
          <div className="row">
            <div className="col-xl-10 col-lg-12 col-md-12 offset-xl-1">
              <h5>
                {loading ? "Loading services..." : err ? "Services" : servicesSection.title}
              </h5>

              {err && (
                <p className="text-danger" style={{ marginBottom: 20 }}>
                  {err}
                </p>
              )}

              <div className="row">
                {(loading
                  ? Array.from({ length: 4 }).map((_, i) => ({
                      title: "Loading...",
                      slug: `skeleton-${i}`,
                      link: "#",
                      summary: "Please wait…",
                    }))
                  : servicesSection.items
                ).map((svc) => (
                  <div key={svc.slug} className="col-lg-6 col-md-6">
                    <article className="serv-box" data-aos="zoom-in" data-aos-duration="1200">
                      <strong>
                        <Image src="/images/check.svg" alt="check" width={20} height={20} />
                      </strong>

                      <h3>{svc.title}</h3>

                      <p>{svc.summary}</p>

                      <Link href={svc.link} className="read-btn">
                      {/* {svc.link} */}
                        Learn More
                      </Link>
                    </article>
                  </div>
                ))}

                {!loading && !err && servicesSection.items.length === 0 && (
                  <div className="col-12">
                    <p>No services available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}







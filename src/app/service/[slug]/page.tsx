import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchWithTimeout, ensureUrl, stripHtml, API_URL } from "../../../lib/api";
import type { Metadata, ResolvingMetadata } from "next";

// Ensure metadata is generated per-request and stay fresh
export const dynamic = "force-dynamic";
export const revalidate = 300;
export const dynamicParams = true; 

interface ServiceDetailProps {
  params: {
    slug: string;
  };
}

// Define section interface
interface Section {
  title: string;
  start: number;
  content?: string;
}

// Decode escaped HTML (some API fields may be encoded)
function decodeHtml(html: string) {
  if (!html) return "";
  return String(html)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Fetch service data from API and parse offerings
async function getServiceData(slug: string) {
  try {
    const res = await fetchWithTimeout(API_URL, { cache: 'force-cache' }, 10000);
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }

    const json = await res.json();
    const pages = Array.isArray(json?.data) ? json.data : [];

    // 1) Prefer a top-level page entry that matches the slug (most authoritative source)
    let service: any = pages.find((p: any) => p.slug === slug) || null;

    // 2) If the page we found is a CMS page with nested `blocks` (not a service object),
    //    try to extract a service entry from its blocks (defensive).
    if (service && Array.isArray(service.blocks) && service.blocks.length > 0) {
      const servicesBlock = service.blocks.find((b: any) => b.type === 'services_section');
      if (servicesBlock?.data?.services) {
        const matched = servicesBlock.data.services.find((s: any) => s.slug === slug);
        if (matched) service = matched;
      }
    }

    // 3) Fallback: look inside the `homepage` services_section (legacy source)
    if (!service) {
      const homePage = pages.find((p: any) => p.slug === 'homepage');
      const blocks = Array.isArray(homePage?.blocks) ? homePage.blocks : [];
      const servicesBlock = blocks.find((b: any) => b.type === 'services_section');
      const services = servicesBlock?.data?.services || [];
      service = services.find((s: any) => s.slug === slug) || null;
    }

    if (!service) return null;

    // Normalize content fields (API may use `content` or `long_description`)
    const longDesc = service.long_description || service.content || '';
    const offerings: any[] = [];
    console.log("Long Description length:", (longDesc || '').length);

    // If there's no <h2> structure, treat the whole content (or short_description) as one block
    if (!/<h2[^>]*>/i.test(longDesc)) {
      offerings.push({
        title: service.title,
        subtitle: 'Our Services',
        description: stripHtml(service.short_description || longDesc || ''),
        items: [],
      });

      return {
        ...service,
        offerings,
      };
    }

    // Capture any introductory HTML that appears *before* the first <h2>
    const firstH2Index = longDesc.search(/<h2[^>]*>/i);
    const introHtml = firstH2Index > 0 ? longDesc.substring(0, firstH2Index).trim() : '';
    const bodyHtml = firstH2Index > 0 ? longDesc.substring(firstH2Index) : longDesc;

    // Parse <h2> sections from the bodyHtml
    const sectionRegex = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
    const sections: Section[] = [];
    let match;
    let lastIndex = 0;

    while ((match = sectionRegex.exec(bodyHtml)) !== null) {
      if (sections.length > 0) {
        sections[sections.length - 1].content = bodyHtml.substring(lastIndex, match.index);
      }

      sections.push({
        title: match[1].trim(),
        start: match.index + match[0].length,
      });

      lastIndex = match.index + match[0].length;
    }

    if (sections.length > 0) {
      sections[sections.length - 1].content = bodyHtml.substring(lastIndex);
    }

    // Preserve intro (if present) as the first offering so leading paragraphs don't disappear
    if (introHtml) {
      const introText = stripHtml(introHtml);
      if (introText) {
        offerings.push({
          title: service.title,
          subtitle: null,
          description: introText,
          items: [],
        });
      }
    }

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Derive a section description (prefer the first <p> inside the section)
      const firstPara = /<p[^>]*>([\s\S]*?)<\/p>/i.exec(section.content || '');
      const sectionDescription = firstPara ? stripHtml(firstPara[1]) : stripHtml(section.content || '');

      const items: { title: string; description: string }[] = [];

      const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
      let itemMatch;

      while ((itemMatch = listItemRegex.exec(section.content || '')) !== null) {
        const itemContent = itemMatch[1];
        const titleRegex = /<strong[^>]*>([\s\S]*?)<\/strong>/;
        const titleMatch = titleRegex.exec(itemContent);
        const title = titleMatch ? titleMatch[1].trim() : '';

        let description = '';
        if (titleMatch) {
          description = itemContent.substring(titleMatch.index + titleMatch[0].length).replace(/^[^a-zA-Z0-9]*/, '').trim();
        } else {
          description = stripHtml(itemContent);
        }

        if (title || description) {
          items.push({ title: stripHtml(title), description: stripHtml(description) });
        }
      }

      if (items.length === 0) {
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
        let paraMatch;

        while ((paraMatch = paragraphRegex.exec(section.content || '')) !== null) {
          const paraContent = stripHtml(paraMatch[1]);
          if (paraContent) items.push({ title: '', description: paraContent });
        }
      }

      const subtitleRegex = /<h3[^>]*>([\s\S]*?)<\/h3>/;
      const subtitleMatch = subtitleRegex.exec(section.content || '');

      offerings.push({
        title: stripHtml(section.title),
        subtitle: subtitleMatch ? stripHtml(subtitleMatch[1]) : null,
        description: sectionDescription,
        items,
      });
    }

    if (offerings.length === 0) {
      offerings.push({
        title: service.title,
        subtitle: 'Our Services',
        description: stripHtml(service.short_description || service.long_description || ''),
        items: [],
      });
    }

    return { ...service, offerings };
  } catch (error) {
    console.error('Failed to fetch service data:', error);
    return null;
  }
}

// Add dynamic metadata generation
type Props = {
  params: { slug: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = (await params) as { slug: string };
  const service = await getServiceData(resolvedParams.slug);

  if (!service) {
    return {
      title: "Service Not Found | VGC Consulting",
      description: "The requested service could not be found.",
      alternates: { canonical: "https://vgcadvisors.com/service" },
      robots: { index: false, follow: false },
    };
  }

  // Safe, non-empty metadata values (match `about`/`service` page behavior)
  const title = (service.meta_title || `${service.title} | VGC Consulting`).trim();

  const shortDesc = stripHtml(service.short_description || "");
  const longDesc = stripHtml(service.long_description || "");
  const description = (service.meta_description || `VGC Consulting — ${service.title} services to help your business grow.`).trim();

  const keywords = (service.meta_keywords || [service.title, "VGC Consulting", "services"].join(", ")).trim();
  const url = `https://panel.vgcadvisors.com/api/v1/services/${service.slug}`;
  const image = ensureUrl(service.featured_image || service.mobile_featured_image) || "/images/service-banner.jpg";

  return {
    title,
    description,
    keywords,

    alternates: { canonical: url },

    robots: { index: true, follow: true },

    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "VGC Consulting",
      images: image ? [{ url: image, alt: service.title }] : undefined,
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailProps) {
  const { slug } = await params;
  const service = await getServiceData(slug);
  console.log("Service Data:", { slug, serviceTitle: service?.title });
   
  if (!service) {
    notFound();
  }

  const bannerData = {
    title: service.title,
    description: stripHtml(service.short_description || ""),
    breadcrumb: [
      { label: "Home", href: "/" },
      { label: "Services", href: "/service" },
      { label: service.title, href: "#" }
    ],
    image: ensureUrl(service.featured_image || service.mobile_featured_image) || "/images/service-banner.jpg"
  };

  return (
    <>
      
      <div className="business-banner">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-5 col-lg-6 col-md-12 offset-xl-1" 
                 data-aos="fade-right" 
                 data-aos-duration="1200">
              <nav>
                <ol className="breadcrumb">
                  {bannerData.breadcrumb.map((item, index) => (
                    <li key={index} className={`breadcrumb-item ${index === bannerData.breadcrumb.length - 1 ? 'active' : ''}`}>
                      {index === bannerData.breadcrumb.length - 1 ? (
                        item.label
                      ) : (
                        <a href={item.href}>{item.label}</a>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
              <h1>{bannerData.title}</h1>
              <p>{bannerData.description}</p>
            </div>
            
            <div className="col-xl-6 col-lg-6 col-md-12">
              <Image 
                className="w-100" 
                src={bannerData.image} 
                alt={service.title}
                width={800} 
                height={600} 
                loading="lazy" 
              />
            </div>
          </div>
        </div>
      </div>

      <div className="business-txt">
        <div className="container">
          <div className="row">
            <div className="col-xl-10 col-lg-12 col-md-12 offset-xl-1">
              <div className="business-box" data-aos="fade-up" data-aos-duration="1200">
                {/* Prefer rendering original CMS HTML when available so nothing is lost */}
                { (service.long_description || service.content) ? (
                  <div
                    className="service-content"
                    dangerouslySetInnerHTML={{ __html: decodeHtml((service.long_description || service.content) as string) }}
                  />
                ) : (
                  service.offerings.map((offering: any, index: number) => (
                    <div key={index}>
                      {offering.title && <h2>{offering.title}</h2>}
                      {offering.subtitle && <h3>{offering.subtitle}</h3>}
                      {offering.description && <p>{offering.description}</p>}
                      {offering.items.length > 0 && (
                        <ul>
                          {offering.items.map((item: any, itemIndex: number) => (
                            <li key={itemIndex}>
                              {item.title && <strong>{item.title}</strong>}
                              {item.description && ` ${item.description}`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}

                {/* CTA */}
                <div className="service-cta">
                  <a href="/contact-us" className="call-btn">Get a free consultation</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export async function generateStaticParams() {
  try {
    const res = await fetchWithTimeout(API_URL, { cache: 'force-cache' }, 10000);
    if (!res.ok) return [];

    const json = await res.json();
    const pages = Array.isArray(json?.data) ? json.data : [];

    // 1) Slugs from top-level pages that look like service pages
    const pageSlugs = pages
      .filter((p: any) => p.slug && (p.type === 'service' || p.long_description || p.short_description))
      .map((p: any) => p.slug);

    // 2) Slugs from homepage services_block (legacy source)
    const homePage = pages.find((p: any) => p.slug === 'homepage');
    const blocks = Array.isArray(homePage?.blocks) ? homePage.blocks : [];
    const servicesBlock = blocks.find((b: any) => b.type === 'services_section');
    const blockSlugs = (servicesBlock?.data?.services || []).map((s: any) => s.slug);

    // Dedupe and return
    const allSlugs = Array.from(new Set([...pageSlugs, ...blockSlugs])).filter(Boolean);

    return allSlugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}
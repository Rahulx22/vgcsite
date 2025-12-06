import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchWithTimeout, ensureUrl, stripHtml, API_URL } from "../../../lib/api";
import type { Metadata, ResolvingMetadata } from "next";

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

// Fetch service data from API and parse offerings
async function getServiceData(slug: string) {
  try {
    const res = await fetchWithTimeout(API_URL, { cache: 'force-cache' }, 10000);
    if (!res.ok) {
      throw new Error(`API returned status ${res.status}`);
    }
    
    const json = await res.json();
    const pages = Array.isArray(json?.data) ? json.data : [];
    const homePage = pages.find((p: any) => p.slug === "homepage");
    
    if (!homePage) {
      throw new Error("Homepage not found");
    }

    const blocks = Array.isArray(homePage.blocks) ? homePage.blocks : [];
    const servicesBlock = blocks.find((b: any) => b.type === "services_section");
    const services = servicesBlock?.data?.services || [];
    
    // Find the specific service by slug
    const service = services.find((s: any) => s.slug === slug);
    
    if (!service) {
      return null;
    }

    // Parse the long_description to extract structured offerings
    const longDesc = service.long_description || "";
    const offerings: any[] = [];
    
    // If there's no HTML structure, treat the entire content as a single offering
    if (!longDesc.includes("<h2")) {
      offerings.push({
        title: service.title,
        subtitle: "Our Services",
        description: stripHtml(service.short_description || ""),
        items: []
      });
      return {
        ...service,
        offerings
      };
    }
    
    // Extract main sections (h2 tags)
    const sectionRegex = /<h2[^>]*>([\s\S]*?)<\/h2>/g;
    const sections: Section[] = [];
    let match;
    let lastIndex = 0;
    
    while ((match = sectionRegex.exec(longDesc)) !== null) {
      if (sections.length > 0) {
        // Add content for previous section
        sections[sections.length - 1].content = longDesc.substring(lastIndex, match.index);
      }
      
      sections.push({
        title: match[1].trim(),
        start: match.index + match[0].length
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add content for the last section
    if (sections.length > 0) {
      sections[sections.length - 1].content = longDesc.substring(lastIndex);
    }
    
    // Process each section
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      // Extract items from this section (both <li> and <p> tags)
      const items: { title: string; description: string }[] = [];
      
      // Look for list items with strong tags
      const listItemRegex = /<li[^>]*>([\s\S]*?)<\/li>/g;
      let itemMatch;
      
      while ((itemMatch = listItemRegex.exec(section.content || "")) !== null) {
        const itemContent = itemMatch[1];
        // Extract title (text within <strong> tags)
        const titleRegex = /<strong[^>]*>([\s\S]*?)<\/strong>/;
        const titleMatch = titleRegex.exec(itemContent);
        const title = titleMatch ? titleMatch[1].trim() : "";
        
        // Extract description (text after strong tag or entire content if no strong tag)
        let description = "";
        if (titleMatch) {
          description = itemContent.substring(titleMatch.index + titleMatch[0].length).replace(/^[^a-zA-Z0-9]*/, "").trim();
        } else {
          description = stripHtml(itemContent);
        }
        
        if (title || description) {
          items.push({
            title: stripHtml(title),
            description: stripHtml(description)
          });
        }
      }
      
      // If no list items found, look for paragraph tags
      if (items.length === 0) {
        const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
        let paraMatch;
        
        while ((paraMatch = paragraphRegex.exec(section.content || "")) !== null) {
          const paraContent = stripHtml(paraMatch[1]);
          if (paraContent) {
            items.push({
              title: "",
              description: paraContent
            });
          }
        }
      }
      
      // Extract subtitle (h3 after h2)
      const subtitleRegex = /<h3[^>]*>([\s\S]*?)<\/h3>/;
      const subtitleMatch = subtitleRegex.exec(section.content || "");
      
      offerings.push({
        title: stripHtml(section.title),
        subtitle: subtitleMatch ? stripHtml(subtitleMatch[1]) : null,
        description: stripHtml(service.short_description || ""),
        items: items
      });
    }
    
    // If no sections found, create a default one
    if (offerings.length === 0) {
      offerings.push({
        title: service.title,
        subtitle: "Our Services",
        description: stripHtml(service.short_description || service.long_description || ""),
        items: []
      });
    }
    
    return {
      ...service,
      offerings
    };
  } catch (error) {
    console.error("Failed to fetch service data:", error);
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
  const service = await getServiceData(params.slug);
  
  if (!service) {
    return {
      title: "Service Not Found | VGC Consulting",
      description: "The requested service could not be found.",
    };
  }

  const title = service.meta_title || `${service.title} | VGC Consulting`;
  const description = service.meta_description || stripHtml(service.short_description || service.long_description || "");
  const keywords = service.meta_keywords || service.title;

  return {
    title,
    description,
    keywords,
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailProps) {
  const { slug } = await params;
  const service = await getServiceData(slug);
    console.log("Service Data:",params, service);

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
                {service.offerings.map((offering: any, index: number) => (
                    
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
                ))}
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
    const homePage = pages.find((p: any) => p.slug === "homepage");
    
    if (!homePage) return [];

    const blocks = Array.isArray(homePage.blocks) ? homePage.blocks : [];
    const servicesBlock = blocks.find((b: any) => b.type === "services_section");
    const services = servicesBlock?.data?.services || [];
    
    return services.map((service: any) => ({
      slug: service.slug,
    }));
  } catch {
    return [];
  }
}
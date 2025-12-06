import Image from "next/image";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface InnerBannerProps {
  title: string;
  breadcrumb: BreadcrumbItem[];
  image: string;
  alt: string;
}

export default function InnerBanner({ title, breadcrumb, image, alt }: InnerBannerProps) {

  console.log("Rendering InnerBanner with props:", { title, breadcrumb, image, alt });
  return (
    <div className="inner-banner">
      <Image 
        className="w-100" 
        src={image} 
        // src={image} 
        alt={alt} 
        width={1920} 
        height={450} 
        loading="lazy" 
      />
      <div className="inner-txt" data-aos="fade-right" data-aos-duration="1200">
        <h1>{title}</h1>
        <nav>
          <ol className="breadcrumb">
            {breadcrumb.map((item, index) => (
              <li key={index} className={`breadcrumb-item ${index === breadcrumb.length - 1 ? 'active' : ''}`}>
                {index === breadcrumb.length - 1 ? (
                  item.label
                ) : (
                  <Link href={item.href}>{item.label}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </div>
  );
}

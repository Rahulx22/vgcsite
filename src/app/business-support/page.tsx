import Header from "../components/Header";
import Footer from "../components/Footer";
import Image from "next/image";
// import businessSupportData from "../../data/business-support.json";
import type { BusinessSupportPage } from "../../types/pages";
import type { Metadata } from "next";

// Add static metadata








export const metadata: Metadata = 
{
  title: "Business Support Services | VGC Consulting",
  description: "Comprehensive business support services tailored to empower MSMEs, corporates, and global ventures with expert financial and tax solutions.",
  keywords: "business support, MSME services, corporate advisory, business solutions, financial support",
};

export default function BusinessSupportPage() {
  const data: BusinessSupportPage = businessSupportData;
  console.log("Business Support Data:", data);
  return (
    <>
      <Header />
      
      <div className="business-banner">
        <div className="container-fluid">
          <div className="row">
            <div className="col-xl-5 col-lg-6 col-md-12 offset-xl-1" 
                 data-aos="fade-right" 
                 data-aos-duration="1200">
              <nav>
                <ol className="breadcrumb">
                  {data.banner.breadcrumb.map((item, index) => (
                    <li key={index} className={`breadcrumb-item ${index === data.banner.breadcrumb.length - 1 ? 'active' : ''}`}>
                      {index === data.banner.breadcrumb.length - 1 ? (
                        item.label
                      ) : (
                        <a href={item.href}>{item.label}</a>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
              <h1>{data.banner.title}</h1>
              <p>{data.banner.description}</p>
            </div>
            
            <div className="col-xl-6 col-lg-6 col-md-12">
              <Image 
                className="w-100" 
                src={data.banner.image} 
                alt="business-banner" 
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
                {data.offerings.map((offering, index) => (
                  <div key={index}>
                    {offering.title && <h2>{offering.title}</h2>}
                    {offering.subtitle && <h3>{offering.subtitle}</h3>}
                    {offering.description && <p>{offering.description}</p>}
                    {offering.items.length > 0 && (
                      <ul>
                        {offering.items.map((item, itemIndex) => (
                          <li key={itemIndex}>
                            <strong>{item.title}</strong> {item.description}
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

      <Footer />
    </>
  );
}
import Link from "next/link";
import Image from "next/image";
import { Service } from "../../types/home";

interface ServiceOffering {
  title?: string;
  subtitle?: string;
  description?: string;
  items: {
    title: string;
    description: string;
  }[];
}

interface ServicesProps {
  services: Service[];
  offerings?: ServiceOffering[];
}

export default function Services({ services, offerings }: ServicesProps) {



  return (
    <div className="service-sec">
      <div className="container">
        {/* Counters */}
        {/* <div className="row">
          <div className="col-lg-12 col-md-12">
            <ul className="count-list">
              <li>
                <h2>
                  <span className="counter-count">15</span>%
                </h2>
                Revenue Growth Rate
              </li>
              <li>
                <h2>
                  <span className="counter-count">90</span>%
                </h2>
                Client Retention Rate
              </li>
              <li>
                <h2>
                  <span className="counter-count">12</span>+
                </h2>
                Years in Operation
              </li>
            </ul>
          </div>
        </div> */}

        {/* Services */}
        <div className="row">
          <div className="col-xl-10 col-lg-12 col-md-12 offset-xl-1">
            <h2 data-aos="fade-up" data-aos-duration="1200">
              Our Services
            </h2>
            <div className="row">
              {services.map((s, index) => {
                if (index>= 4) return null; // skip all others

                return (
                  <div key={s.title} className="col-lg-6 col-md-6">
                    <div
                      className="serv-box"
                      data-aos="zoom-in"
                      data-aos-duration="1200"
                    >
                      <strong>
                        <Image
                          src="/images/check.svg"
                          alt="check"
                          width={20}
                          height={20}
                          loading="eager"
                          quality={90}
                        />
                      </strong>
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>

                      <Link href={s.link} className="learn-link">
                        Learn More
                      </Link>
                    </div>
                  </div>
                );
              })}

            </div>

            {/* See All Services */}
            <Link href="/service" className="see-btn">
              See All Services
            </Link>
          </div>
        </div>

        {/* Detailed Service Offerings - Business Support Style */}
        {offerings && offerings.length > 0 && (
          <div className="row">
            <div className="col-xl-10 col-lg-12 col-md-12 offset-xl-1">
              <div className="business-box" data-aos="fade-up" data-aos-duration="1200">
                {offerings.map((offering, index) => (
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
        )}
      </div>
    </div>
  );
}

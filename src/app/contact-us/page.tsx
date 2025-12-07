"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ContactForm from "../components/ContactForm";
import { API_URL, fetchWithTimeout, ensureUrl } from "../../lib/api";
import type { ContactApiResponse, ContactAddressBlock } from "../../types/pages";
import Head from "next/head";


function transformContactData(apiData: ContactApiResponse) {
  const addressBlock = apiData.blocks.find(
    (block) => block.type === "address_section"
  ) as ContactAddressBlock;

  if (!addressBlock) {
    throw new Error("Address section not found in contact data");
  }

  return {
    addresses: addressBlock.data.addresses,
    mapImage: addressBlock.data.map_image,
  };
}

export default function ContactClient() {
  const [contactData, setContactData] = useState<ContactApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContactData = async () => {
      try {
        setLoading(true);

        const response = await fetchWithTimeout(API_URL, {
          cache: "force-cache",
          next: { revalidate: 300 },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pages data: ${response.status}`);
        }

        const apiResponse = await response.json();
        const pages = Array.isArray(apiResponse?.data)
          ? apiResponse.data
          : [];

        const contactPage = pages.find(
          (page: any) => page.type === "contact" || page.slug === "contact"
        );

        if (!contactPage) {
          throw new Error("Contact page not found in API response");
        }

        setContactData(contactPage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load contact data");
      } finally {
        setLoading(false);
      }
    };

    fetchContactData();
  }, []);

  if (loading)
    return (
      <div className="container" style={{ textAlign: "center", padding: "50px 0" }}>
        <h2>Loading...</h2>
      </div>
    );

  if (error || !contactData)
    return (
      <div className="container" style={{ textAlign: "center", padding: "50px 0" }}>
        <h2>Error: {error || "Failed to load contact data"}</h2>
      </div>
    );

  const { addresses, mapImage } = transformContactData(contactData);





  

  return (
    <>
      <Head>
        <link rel="canonical" href="https://vgcadvisors.com/contact-us" />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="contact-sec">
        <div className="container-fluid">
          <div className="row">

            <div className="col-xl-6 col-lg-6 col-md-12">
              <ContactForm title="Get In Touch" />
            </div>

            <div className="col-xl-6 col-lg-6 col-md-12">
              <div className="cont-box">
                {addresses.map((address, index) => (
                  <div key={index}>
                    <h3>Contact Information</h3>
                    <ul>
                      <li>
                        <span>Address: </span>
                        <span>{address.full_address}</span>
                      </li>
                      <li>
                        <span>Phone: </span>
                        <a href={`tel:${address.phone}`}>{address.phone}</a>
                      </li>
                      <li>
                        <span>Email: </span>
                        <a href={`mailto:${address.email}`}>{address.email}</a>
                      </li>
                      <li>
                        <span>WhatsApp: </span>
                        <a
                          href={`https://wa.me/${address.whatsapp.replace(
                            /[^0-9]/g,
                            ""
                          )}`}
                        >
                          {address.whatsapp}
                        </a>
                      </li>
                    </ul>
                  </div>
                ))}

                {mapImage && (
                  <div className="map-section" style={{ marginTop: "20px" }}>
                    <Image
                      src={ensureUrl(mapImage)}
                      alt="Map Location"
                      width={500}
                      height={300}
                      style={{ width: "100%", height: "auto" }}
                      loading="lazy"
                    />
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





"use client";

import { useState, useEffect } from "react";

interface ContactFormProps {
  title: string;
}

type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  service: string;
  message: string;
};

type ServiceItem = {
  title: string;
  slug: string;
  link: string;
  summary: string;
};

export default function ContactForm({ title }: ContactFormProps) {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    service: "",
    message: ""
  });
  
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load services data from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const res = await fetch("https://panel.vgcadvisors.com/api/v1/pages", { 
          cache: "no-store" 
        });
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        
        const servicesPage = 
          json?.data?.find((p: any) => p.slug === "services") ||
          json?.data?.find((p: any) => p.type === "services") ||
          null;
          
        if (servicesPage) {
          const servicesBlock = servicesPage.blocks?.find((b: any) => b.type === "services_section");
          if (servicesBlock && servicesBlock.data?.services) {
            const serviceItems = servicesBlock.data.services.map((s: any) => ({
              title: s.title,
              slug: s.slug,
              link: `/service/${s.slug}`,
              summary: s.short_description || s.sub_heading || s.long_description || ""
            }));
            setServices(serviceItems);
          }
        }
      } catch (err) {
        console.error("Error fetching services:", err);
        // Fallback to static data if API fails
        const fallbackServices = [
          { title: "Business Support", slug: "business-support", link: "#", summary: "" },
          { title: "Direct Tax Services", slug: "direct-tax", link: "#", summary: "" },
          { title: "Indirect Tax Services", slug: "indirect-tax", link: "#", summary: "" }
        ];
        setServices(fallbackServices);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

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
        throw new Error(`Failed to submit form: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Form submitted successfully:", result);
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        name: "",
        email: "",
        phone: "",
        service: "",
        message: ""
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      console.error("Error submitting form:", err);
      setSubmitError(err instanceof Error ? err.message : "Failed to submit form. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="cont-form">
      <h2>{title}</h2>
      {submitSuccess && (
        <div className="alert alert-success">
          Thank you for your message! We'll get back to you soon.
        </div>
      )}
      {submitError && (
        <div className="alert alert-danger">
          {submitError}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="in-box">
          <label>Your Name</label>
          <input 
            className="box" 
            type="text" 
            name="name"
            placeholder="Write your name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="in-box">
          <label>Your Email</label>
          <input 
            className="box" 
            type="email" 
            name="email"
            placeholder="Sample@gmail.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="in-box">
          <label>Phone Number</label>
          <input 
            className="box" 
            type="tel" 
            name="phone"
            placeholder="Enter your phone number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>
        <div className="in-box">
          <label>Service Type</label>
          <select 
            className="box" 
            name="service"
            value={formData.service}
            onChange={handleChange}
            required
            disabled={loadingServices}
          >
            <option value="">{loadingServices ? "Loading services..." : "Select a Service"}</option>
            {services.map((service) => (
              <option key={service.slug} value={service.title}>
                {service.title}
              </option>
            ))}
          </select>
        </div>
        <div className="in-box">
          <label>Message</label>
          <textarea 
            className="box" 
            name="message"
            placeholder="Write here..........." 
            rows={7}
            value={formData.message}
            onChange={handleChange}
            required
          />
        </div>
        <input 
          type="submit" 
          className="call-btn" 
          value={submitting ? "Sending..." : "Send"} 
          disabled={submitting || loadingServices}
        />
      </form>
    </div>
  );
}
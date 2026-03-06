// types/home.ts


export type HeroBanner = {
  title: string;
  paragraphs: string[];
  phone: string;
  counters: {
    label: string;
    value: number | null;
    suffix: string;
    display: string;
  }[];
  image: string;
  alt: string;
  ctaLink: string;
  ctaText: string;
};

export type Hero = {
  banners: HeroBanner[];
};


export type Banner = {
  image?: string | null;
  title?: string | null;
  cta_link?: string | null;
  cta_text?: string | null;
  subtitle?: string | null;
};

export type HeroCounter = {
  label: string;
  value: string;
  suffix?: string;
};



export type Service = {
  title: string;
  desc: string;
  link: string;
};

export type BlogItem = {
  id?: string | number;
  date: string;
  title: string;
  excerpt: string;
  image: string;
  link: string;
};

export type ClientItem = {
  title: string;
  icon: string;
};

export type Testimonial = {
  text: string;
  author: string;
  avatar: string;
};

export type CtaSection = {
  topHeading: string;
  mainHeading: string;
  subtext: string;
  ctaLink: string;
  ctaText: string;
};

export type FooterData = {
  phone: string;
  email: string;
  social: string[];
  copyright?: string;
};

export type HomeData = {
  hero: Hero;
  services: Service[];
  blog: BlogItem[];
  blogTitle?: string;
  clients: ClientItem[];
  clientsTitle?: string;
  clientsSubtitle?: string;
  testimonials: Testimonial[];
  cta: CtaSection;
  footer: FooterData;
};
export type CompletedProject = {
  published: boolean;
  slug: string;
  name: string;
  shortName: string;
  sector: string;
  website: string;
  domain: string;
  description: string;
  introduction: string;
  capabilities: readonly string[];
  highlights: readonly { title: string; description: string }[];
  image: { src: string; alt: string; width: number; height: number };
  detail: {
    label: string;
    website: string;
    image?: { src: string; alt: string; width: number; height: number };
  };
  tone: "rose" | "sage";
};

// Keep unpublished records for later restoration; export only the public showcase.
const projectRegistry: readonly CompletedProject[] = [
  {
    published: false,
    slug: "kings-perla",
    name: "Kingsford & Perla",
    shortName: "Kings & Perla",
    sector: "Wedding & personal experience",
    website: "https://www.kingsperl.com/",
    domain: "kingsperl.com",
    description: "A personal wedding experience, bringing the invitation, photo story and guest information together.",
    introduction: "A celebration with a world of its own.",
    capabilities: ["Website design", "Photo storytelling", "Guest experience"],
    highlights: [
      { title: "An invitation with atmosphere", description: "Cinematic imagery and considered typography set the tone for the celebration." },
      { title: "A story worth exploring", description: "A photo gallery with story, mosaic and filmstrip views gives the couple’s photographs room to shine." },
      { title: "Details, beautifully gathered", description: "Wedding-day information and guest travel guidance bring the practical details into the same experience." },
    ],
    image: {
      src: "/images/projects/kings-perla-home.webp",
      alt: "The Kingsford and Perla wedding website, showing its photographic opening and invitation design",
      width: 1348,
      height: 926,
    },
    detail: {
      label: "Explore the photo gallery",
      website: "https://www.kingsperl.com/gallery#gallery-collection",
      image: {
        src: "/images/projects/kings-perla-gallery.webp",
        alt: "Kingsford and Perla photo gallery showing the couple’s photographs arranged in the mosaic view",
        width: 1348,
        height: 926,
      },
    },
    tone: "rose",
  },
  {
    published: true,
    slug: "elkings-developers",
    name: "ELKINGS Developers",
    shortName: "ELKINGS Developers",
    sector: "Property development & digital products",
    website: "https://elk-developers.vercel.app/",
    domain: "elk-developers.vercel.app",
    description: "A property-development website bringing Calgary context, project portfolios and development workflows into one structured digital experience.",
    introduction: "A clear digital foundation for complex development.",
    capabilities: ["Website design", "Information architecture", "Interactive experiences"],
    highlights: [
      { title: "A sense of place", description: "A cinematic Calgary introduction establishes the setting and connects visitors to the development journey." },
      { title: "A portfolio made navigable", description: "Dedicated pages organize development concepts, project information and asset classes into a coherent browsing experience." },
      { title: "Complexity, clearly organized", description: "Planning, execution, project controls and decision sections share a consistent navigation and visual language." },
    ],
    image: {
      src: "/images/projects/elk-developers-home.webp",
      alt: "ELKINGS Developers homepage with its Calgary skyline introduction and property-development navigation",
      width: 1348,
      height: 926,
    },
    detail: {
      label: "Explore the development portfolio",
      website: "https://elk-developers.vercel.app/portfolio",
      image: {
        src: "/images/projects/elk-developers-portfolio.webp",
        alt: "ELKINGS Developers portfolio page introducing development concepts and asset classes",
        width: 1348,
        height: 926,
      },
    },
    tone: "rose",
  },
  {
    published: true,
    slug: "elkings-studio",
    name: "ELKINGS Studio",
    shortName: "ELKINGS Studio",
    sector: "Photography, film & creative production",
    website: "https://kay-media.vercel.app/",
    domain: "kay-media.vercel.app",
    description: "A cinematic website for a St. John’s photography and film studio, pairing bold visual storytelling with a dedicated photography collection and clear service discovery.",
    introduction: "A digital stage for picture, motion and cinema.",
    capabilities: ["Website design", "Art direction", "Gallery experiences"],
    highlights: [
      { title: "An expressive first impression", description: "Bold typography, motion and visual studies introduce the studio’s portrait, brand and film disciplines." },
      { title: "Photography with room to breathe", description: "A dedicated photography collection brings portraits, wedding imagery, events and commercial visual studies into one editorial experience." },
      { title: "From inspiration to a conversation", description: "Connected services, process and project-brief sections give visitors a clear route from exploring the work to shaping an inquiry." },
    ],
    image: {
      src: "/images/projects/elkings-studio-home.webp",
      alt: "ELKINGS Studio homepage with bold orange typography and portrait, brand and motion visual studies",
      width: 1348,
      height: 926,
    },
    detail: {
      label: "Explore the photography collection",
      website: "https://kay-media.vercel.app/photography",
      image: {
        src: "/images/projects/elkings-studio-photography.webp",
        alt: "ELKINGS Studio photography page with its editorial layout and wedding visual study",
        width: 1348,
        height: 926,
      },
    },
    tone: "sage",
  },
  {
    published: true,
    slug: "trios-services",
    name: "Trios Snow and Mowing Inc.",
    shortName: "Trios Services",
    sector: "Property care & local services",
    website: "https://triosservices.vercel.app/",
    domain: "triosservices.vercel.app",
    description: "A property-care website connecting seasonal services, care planning and quote requests in one clear experience.",
    introduction: "A clearer path to year-round property care.",
    capabilities: ["Website design", "Service discovery", "Care planning"],
    highlights: [
      { title: "Services for every season", description: "Snow clearing, lawn care and seasonal plans are organized around the work a property needs." },
      { title: "Planning made approachable", description: "A care planner helps visitors explore the services that fit their property and priorities." },
      { title: "An easy next step", description: "Service-area information and a quote-request flow help visitors move from exploring to making an enquiry." },
    ],
    image: {
      src: "/images/projects/trios-services-home.webp",
      alt: "The Trios Snow and Mowing website, showing its property-care services and seasonal website design",
      width: 1348,
      height: 926,
    },
    detail: {
      label: "Explore the care planner",
      website: "https://triosservices.vercel.app/planner",
      image: {
        src: "/images/projects/trios-services-planner.webp",
        alt: "Trios care planner showing a guided property-services form and seasonal service categories",
        width: 1348,
        height: 926,
      },
    },
    tone: "sage",
  },
];

export const completedProjects: readonly CompletedProject[] = projectRegistry.filter(
  (project) => project.published,
);

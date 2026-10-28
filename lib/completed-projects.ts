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
  {
    published: true,
    slug: "st-johns-methodist",
    name: "St. John’s Methodist Church",
    shortName: "St. John’s Methodist",
    sector: "Church & community",
    website: "https://stjohnsmethodist.vercel.app/",
    domain: "stjohnsmethodist.vercel.app",
    description: "A welcoming digital home for the Ghanaian Methodist community in St. John’s, bringing worship, church life, congregation resources and visit information together.",
    introduction: "Ghanaian roots. Newfoundland home.",
    capabilities: ["Website design", "Church resources", "Community experience"],
    highlights: [
      { title: "A warm welcome", description: "A clear introduction shares the church’s identity and helps visitors discover how to join Sunday worship." },
      { title: "Church life in one place", description: "Dedicated sections connect visitors with worship, community, upcoming events and watch-and-listen content." },
      { title: "Resources for the congregation", description: "A dedicated resources area gives members and leaders a clear place to explore church materials." },
    ],
    image: {
      src: "https://stjohnsmethodist.vercel.app/assets/og.png",
      alt: "St. John’s Methodist Church website preview",
      width: 1200,
      height: 630,
    },
    detail: {
      label: "Explore church resources",
      website: "https://stjohnsmethodist.vercel.app/resources/",
    },
    tone: "rose",
  },
  {
    published: false,
    slug: "christ-for-youth-international",
    name: "Christ for Youth International",
    shortName: "CYI",
    sector: "Faith, youth & community",
    website: "https://cyi-gilt.vercel.app/",
    domain: "cyi-gilt.vercel.app",
    description: "A vibrant digital home for Christ for Youth International, connecting branch discovery, camps, missions, media and devotional resources in one welcoming experience.",
    introduction: "Faith, community and purpose. Connected.",
    capabilities: ["Website design", "Content architecture", "Community discovery"],
    highlights: [
      { title: "A movement with a clear welcome", description: "Expressive typography and photographic storytelling introduce CYI and guide visitors towards their next connection." },
      { title: "A place to find your people", description: "A searchable branch directory brings local communities into a shared regional and international browsing experience." },
      { title: "More ways to take part", description: "Camps, missions, podcasts and devotional content have dedicated places within a connected navigation system." },
    ],
    image: {
      src: "/images/projects/cyi-home.webp",
      alt: "Christ for Youth International homepage with its Made for More headline and community performance photography",
      width: 1348,
      height: 839,
    },
    detail: {
      label: "Explore CYI experiences",
      website: "https://cyi-gilt.vercel.app/environments",
      image: {
        src: "/images/projects/cyi-experiences.webp",
        alt: "CYI camps, events and missions page with experience categories and programme discovery",
        width: 1348,
        height: 839,
      },
    },
    tone: "rose",
  },
  {
    published: true,
    slug: "grandmaster",
    name: "GrandMaster",
    shortName: "GrandMaster",
    sector: "Strategy games & interactive learning",
    website: "https://boardgames-peach.vercel.app/",
    domain: "boardgames-peach.vercel.app",
    description: "An interactive strategy-learning platform bringing board games, guided learning paths, puzzles and game reviews into one connected experience.",
    introduction: "A connected place to learn, play and reflect.",
    capabilities: ["Product design", "Interactive experiences", "Learning journeys"],
    highlights: [
      { title: "One journey across many games", description: "A shared navigation connects the game library with learning paths, daily practice and review tools." },
      { title: "A library built for discovery", description: "Strategy, classic, abstract and family categories help players find a game or explore a different style of thinking." },
      { title: "Practice with a next step", description: "The platform presents puzzles, lessons and recorded-play insights as parts of a continuing learning experience." },
    ],
    image: {
      src: "/images/projects/grandmaster-home.webp",
      alt: "GrandMaster strategy-learning homepage with its board-game artwork, learning-path introduction and application navigation",
      width: 1348,
      height: 839,
    },
    detail: {
      label: "Explore the strategy library",
      website: "https://boardgames-peach.vercel.app/#/games",
      image: {
        src: "/images/projects/grandmaster-library.webp",
        alt: "GrandMaster strategy library with game categories and connected learning features",
        width: 1348,
        height: 839,
      },
    },
    tone: "sage",
  },
  {
    published: true,
    slug: "abetifi-bosumpra",
    name: "Abetifi — Bosumpra Heritage",
    shortName: "Abetifi Heritage",
    sector: "Heritage, research & museum development",
    website: "https://abetifi-7ssg.vercel.app/",
    domain: "abetifi-7ssg.vercel.app",
    description: "A heritage-information platform for Bosumpra Rockshelter in Abetifi, Ghana, connecting published research, community information and a proposed museum programme.",
    introduction: "A place for heritage, evidence and possibility.",
    capabilities: ["Website design", "Interactive storytelling", "Information architecture"],
    highlights: [
      { title: "A guided heritage story", description: "An editorial landing experience connects visitors to the site's archaeological research and interpretive material." },
      { title: "Research and proposals, clearly distinguished", description: "Published findings, proposed development, illustrative media and claims requiring verification are given distinct evidence labels." },
      { title: "A connected project framework", description: "Community, partnership, visitor and readiness sections organize the information surrounding the proposed museum programme." },
    ],
    image: {
      src: "/images/projects/abetifi-home.webp",
      alt: "Abetifi Bosumpra Rockshelter homepage with heritage navigation and research and development information",
      width: 1348,
      height: 839,
    },
    detail: {
      label: "Explore the heritage research",
      website: "https://abetifi-7ssg.vercel.app/heritage",
      image: {
        src: "/images/projects/abetifi-heritage.webp",
        alt: "Bosumpra heritage page showing archaeological interpretation and a visible illustrative-media disclosure",
        width: 1348,
        height: 839,
      },
    },
    tone: "rose",
  },
  {
    published: true,
    slug: "velaire-interiors",
    name: "Velaire Interiors",
    shortName: "Velaire Interiors",
    sector: "Interiors, décor & spatial planning",
    website: "https://velaire-beta.vercel.app/",
    domain: "velaire-beta.vercel.app",
    description: "A cinematic interiors website pairing a browsable inspiration collection with a room-planning studio for shaping a brief, exploring materials and reviewing an editable item schedule.",
    introduction: "From a feeling to a considered room plan.",
    capabilities: ["Website design", "Art direction", "Interactive planning"],
    highlights: [
      { title: "Inspiration with atmosphere", description: "Interior imagery and editorial typography introduce spaces for homes, businesses and gatherings." },
      { title: "A studio built around the brief", description: "A guided planning experience brings room dimensions, mood, materials and item choices into one workspace." },
      { title: "Details that stay connected", description: "Concept, layout, item-schedule and installation views connect design direction with the practical planning details." },
    ],
    image: {
      src: "/images/projects/velaire-home.webp",
      alt: "Velaire Interiors homepage showing a contemporary living room and its Step inside, Feel the difference introduction",
      width: 1348,
      height: 839,
    },
    detail: {
      label: "Explore the design studio",
      website: "https://velaire-beta.vercel.app/studio",
      image: {
        src: "/images/projects/velaire-studio.webp",
        alt: "Velaire design studio showing its room brief, dimensions and interior mood reference",
        width: 1348,
        height: 839,
      },
    },
    tone: "sage",
  },
  {
    published: false,
    slug: "frederick-veronica",
    name: "Frederick & Veronica",
    shortName: "Frederick & Veronica",
    sector: "Wedding & personal experience",
    website: "https://fvsignature.com/",
    domain: "fvsignature.com",
    description: "A personal wedding website bringing the couple's photographic story, celebration details, venue information, RSVP and guestbook into one considered experience.",
    introduction: "A celebration with a story of its own.",
    capabilities: ["Website design", "Photo storytelling", "Guest experience"],
    highlights: [
      { title: "A photographic invitation", description: "Portraits, expressive typography and a warm visual palette set the tone for the couple's celebration." },
      { title: "The practical details, together", description: "Wedding-day information, directions and an RSVP journey give guests a clear place to prepare for the celebration." },
      { title: "Moments worth returning to", description: "A dedicated photograph collection and guestbook extend the experience beyond the invitation." },
    ],
    image: {
      src: "/images/projects/fv-signature-home.webp",
      alt: "Frederick and Veronica wedding homepage with paired portraits, elegant typography and celebration information",
      width: 1348,
      height: 839,
    },
    detail: {
      label: "Explore the photograph collection",
      website: "https://fvsignature.com/gallery",
      image: {
        src: "/images/projects/fv-signature-gallery.webp",
        alt: "Frederick and Veronica photograph collection with its editorial introduction and portrait gallery",
        width: 1348,
        height: 839,
      },
    },
    tone: "rose",
  },
];

export const completedProjects: readonly CompletedProject[] = projectRegistry.filter(
  (project) => project.published,
);

/** Selectable Avalon website templates. The source slug stays stable across revisions. */
export const showcaseCollectionUrl = "/projects#website-templates-title";

export const conceptGroups = [
  "All templates", "Lifestyle & culture", "Knowledge & services", "Industry & impact", "Travel & places",
] as const;
export type ConceptGroup = (typeof conceptGroups)[number];

export const websiteConcepts = [
  {
    "slug": "dune-house",
    "name": "Dune House",
    "sector": "Hospitality",
    "group": "Travel & places",
    "tagline": "A slower kind of stay.",
    "url": "/work/dune",
    "number": 1,
    "templateSlug": "dune",
    "image": "/images/website-templates/dune-house-f9dbb8d1af78.jpg",
    "imageVersion": "f9dbb8d1af78"
  },
  {
    "slug": "selvage",
    "name": "Selvage",
    "sector": "Fashion commerce",
    "group": "Lifestyle & culture",
    "tagline": "Clothes with a point of view.",
    "url": "/work/selvage",
    "number": 2,
    "templateSlug": "selvage",
    "image": "/images/website-templates/selvage-4e00503ff361.jpg",
    "imageVersion": "4e00503ff361"
  },
  {
    "slug": "lucid-care",
    "name": "Lucid Care",
    "sector": "Healthcare information",
    "group": "Knowledge & services",
    "tagline": "Clarity before your visit.",
    "url": "/work/lucid-care",
    "number": 3,
    "templateSlug": "lucid-care",
    "image": "/images/website-templates/lucid-care-7ce8bf6236df.jpg",
    "imageVersion": "7ce8bf6236df"
  },
  {
    "slug": "groundwork",
    "name": "Groundwork",
    "sector": "Construction",
    "group": "Industry & impact",
    "tagline": "Make room for what’s next.",
    "url": "/work/groundwork",
    "number": 4,
    "templateSlug": "groundwork",
    "image": "/images/website-templates/groundwork-e18d3fa860f3.jpg",
    "imageVersion": "e18d3fa860f3"
  },
  {
    "slug": "form-studio",
    "name": "Form Studio",
    "sector": "Architecture",
    "group": "Travel & places",
    "tagline": "Places that change perspective.",
    "url": "/work/form-studio",
    "number": 5,
    "templateSlug": "form-studio",
    "image": "/images/website-templates/form-studio-5ec5c7cb593c.jpg",
    "imageVersion": "5ec5c7cb593c"
  },
  {
    "slug": "ember-table",
    "name": "Ember Table",
    "sector": "Restaurant & food",
    "group": "Lifestyle & culture",
    "tagline": "Good evenings start here.",
    "url": "/work/ember-table",
    "number": 6,
    "templateSlug": "ember-table",
    "image": "/images/website-templates/ember-table-d0fba074d2cc.jpg",
    "imageVersion": "d0fba074d2cc"
  },
  {
    "slug": "open-campus",
    "name": "Open Campus",
    "sector": "Education",
    "group": "Knowledge & services",
    "tagline": "Curiosity has a curriculum.",
    "url": "/work/open-campus",
    "number": 7,
    "templateSlug": "open-campus",
    "image": "/images/website-templates/open-campus-efa1f7c2639d.jpg",
    "imageVersion": "efa1f7c2639d"
  },
  {
    "slug": "relay",
    "name": "Relay",
    "sector": "Logistics",
    "group": "Industry & impact",
    "tagline": "Every move, made clearer.",
    "url": "/work/relay",
    "number": 8,
    "templateSlug": "relay",
    "image": "/images/website-templates/relay-d9a280d3c750.jpg",
    "imageVersion": "d9a280d3c750"
  },
  {
    "slug": "slow-form",
    "name": "Slow Form",
    "sector": "Beauty & wellness",
    "group": "Lifestyle & culture",
    "tagline": "Space to feel like yourself.",
    "url": "/work/slow-form",
    "number": 9,
    "templateSlug": "slow-form",
    "image": "/images/website-templates/slow-form-a463ebccefea.jpg",
    "imageVersion": "a463ebccefea"
  },
  {
    "slug": "redline",
    "name": "Redline",
    "sector": "Automotive",
    "group": "Lifestyle & culture",
    "tagline": "A different kind of drive.",
    "url": "/work/redline",
    "number": 10,
    "templateSlug": "redline",
    "image": "/images/website-templates/redline-d5702d2e95d6.jpg",
    "imageVersion": "d5702d2e95d6"
  },
  {
    "slug": "clause",
    "name": "Clause",
    "sector": "Professional services",
    "group": "Knowledge & services",
    "tagline": "Complexity, made legible.",
    "url": "/work/clause",
    "number": 11,
    "templateSlug": "clause",
    "image": "/images/website-templates/clause-88a074fd796d.jpg",
    "imageVersion": "88a074fd796d"
  },
  {
    "slug": "helios",
    "name": "Helios",
    "sector": "Energy & sustainability",
    "group": "Industry & impact",
    "tagline": "Think in brighter possibilities.",
    "url": "/work/helios",
    "number": 12,
    "templateSlug": "helios",
    "image": "/images/website-templates/helios-e0c141b4cbf6.jpg",
    "imageVersion": "e0c141b4cbf6"
  },
  {
    "slug": "common-ground",
    "name": "Common Ground",
    "sector": "Arts & culture",
    "group": "Lifestyle & culture",
    "tagline": "Meet something unexpected.",
    "url": "/work/common-ground",
    "number": 13,
    "templateSlug": "common-ground",
    "image": "/images/website-templates/common-ground-87390505b7e6.jpg",
    "imageVersion": "87390505b7e6"
  },
  {
    "slug": "kinetic",
    "name": "Kinetic",
    "sector": "Fitness",
    "group": "Lifestyle & culture",
    "tagline": "Find your own momentum.",
    "url": "/work/kinetic",
    "number": 14,
    "templateSlug": "kinetic",
    "image": "/images/website-templates/kinetic-d011097f4d6c.jpg",
    "imageVersion": "d011097f4d6c"
  },
  {
    "slug": "pennywise",
    "name": "Pennywise",
    "sector": "Finance education",
    "group": "Knowledge & services",
    "tagline": "Small steps. More possibility.",
    "url": "/work/pennywise",
    "number": 15,
    "templateSlug": "pennywise",
    "image": "/images/website-templates/pennywise-3da317099fdf.jpg",
    "imageVersion": "3da317099fdf"
  },
  {
    "slug": "tide-turn",
    "name": "Tide Turn",
    "sector": "Nonprofit",
    "group": "Industry & impact",
    "tagline": "A little together goes further.",
    "url": "/work/tide-turn",
    "number": 16,
    "templateSlug": "tide-turn",
    "image": "/images/website-templates/tide-turn-3a94751eac09.jpg",
    "imageVersion": "3a94751eac09"
  },
  {
    "slug": "elsewhere",
    "name": "Elsewhere",
    "sector": "Travel",
    "group": "Travel & places",
    "tagline": "Leave room for discovery.",
    "url": "/work/elsewhere",
    "number": 17,
    "templateSlug": "elsewhere",
    "image": "/images/website-templates/elsewhere-96137f0c08d2.jpg",
    "imageVersion": "96137f0c08d2"
  },
  {
    "slug": "acre-and-root",
    "name": "Acre & Root",
    "sector": "Agriculture",
    "group": "Industry & impact",
    "tagline": "From the season, with care.",
    "url": "/work/acre-and-root",
    "number": 18,
    "templateSlug": "acre-and-root",
    "image": "/images/website-templates/acre-and-root-10aa710dc0af.jpg",
    "imageVersion": "10aa710dc0af"
  },
  {
    "slug": "orbit",
    "name": "Orbit",
    "sector": "SaaS & technology",
    "group": "Knowledge & services",
    "tagline": "Give good work a clear path.",
    "url": "/work/orbit",
    "number": 19,
    "templateSlug": "orbit",
    "image": "/images/website-templates/orbit-a201b97fdd61.jpg",
    "imageVersion": "a201b97fdd61"
  },
  {
    "slug": "afterhours",
    "name": "Afterhours",
    "sector": "Events",
    "group": "Lifestyle & culture",
    "tagline": "The night is yours to shape.",
    "url": "/work/afterhours",
    "number": 20,
    "templateSlug": "afterhours",
    "image": "/images/website-templates/afterhours-8d04a9677bcf.jpg",
    "imageVersion": "8d04a9677bcf"
  }
] as const;

export type WebsiteTemplate = (typeof websiteConcepts)[number];

export function templateInquiryUrl(template: Pick<WebsiteTemplate, "templateSlug" | "name">) {
  const query = new URLSearchParams({ template: template.templateSlug, templateName: template.name });
  return `/start?${query.toString()}`;
}

export function filterWebsiteConcepts(group: ConceptGroup, query: string) {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return websiteConcepts.filter((template) => {
    const text = `${template.name} ${template.sector} ${template.group} ${template.tagline}`.toLocaleLowerCase();
    return (group === "All templates" || template.group === group) && terms.every((term) => text.includes(term));
  });
}

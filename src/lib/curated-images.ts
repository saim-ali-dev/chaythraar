export type CuratedImage = {
  title: string;
  src: string;
  alt: string;
  imageSource: string;
  imageSourceUrl: string;
  imageCredit: string;
  imageLicense: string;
  imageLicenseUrl: string;
  imageChanges: string;
};

const LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";
const LICENSE_LABEL = "CC BY-SA 4.0 (Attribution-ShareAlike)";
const CHANGES = "Resized to a maximum 1800 px and converted from JPEG to WebP; no crop to the source file.";

export const CURATED_IMAGES = {
  chitralTown: {
    title: "Chitral town and the Chitral River",
    src: "/images/commons/chitral-town.webp",
    alt: "View of Chitral city with the Chitral River in the foreground and mountains behind it.",
    imageSource: "Wikimedia Commons — City of Chitral.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:City_of_Chitral.jpg",
    imageCredit: "Shah Tahsin Anwar",
    imageLicense: LICENSE_LABEL,
    imageLicenseUrl: LICENSE_URL,
    imageChanges: CHANGES,
  },
  shahiFort: {
    title: "Shahi Fort, Chitral",
    src: "/images/commons/shahi-fort.webp",
    alt: "Shahi Fort in Chitral beneath the wooded foothills.",
    imageSource: "Wikimedia Commons — Shahi Fort Chitral KPK Pakistan.JPG",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Shahi_Fort_Chitral_KPK_Pakistan.JPG",
    imageCredit: "Kamran Adil",
    imageLicense: LICENSE_LABEL,
    imageLicenseUrl: LICENSE_URL,
    imageChanges: CHANGES,
  },
  shahiMosque: {
    title: "Shahi Mosque, Chitral",
    src: "/images/commons/shahi-mosque.webp",
    alt: "The domes and minarets of Shahi Mosque in Chitral.",
    imageSource: "Wikimedia Commons — Shahi Mosque, Chitral.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Shahi_Mosque,_Chitral.jpg",
    imageCredit: "Fassifarooq",
    imageLicense: LICENSE_LABEL,
    imageLicenseUrl: LICENSE_URL,
    imageChanges: CHANGES,
  },
  qaqlashtMeadows: {
    title: "Qaqlasht Meadows above Booni",
    src: "/images/commons/qaqlasht-meadows.webp",
    alt: "Sunrise across Qaqlasht Meadows above Booni.",
    imageSource: "Wikimedia Commons — Sunrise in QL.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Sunrise_in_QL.jpg",
    imageCredit: "Abad Agha",
    imageLicense: LICENSE_LABEL,
    imageLicenseUrl: LICENSE_URL,
    imageChanges: CHANGES,
  },
  chilamJosh: {
    title: "Chilam Josh in Bumburet",
    src: "/images/commons/chilam-josh.webp",
    alt: "Women in colorful traditional dress participating in Chilam Josh in Bumburet, Chitral.",
    imageSource: "Wikimedia Commons — Chilam Gosh Festival, Chitral, Pakistan.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:Chilam_Gosh_Festival,_Chitral,_Pakistan.jpg",
    imageCredit: "Tariqsulemani",
    imageLicense: LICENSE_LABEL,
    imageLicenseUrl: LICENSE_URL,
    imageChanges: CHANGES,
  },
  kalashHouse: {
    title: "A typical house in Kalash Valley",
    src: "/images/commons/kalash-house.webp",
    alt: "A typical house in Kalash Valley with girls chatting on its rooftop.",
    imageSource: "Wikimedia Commons — A typical house in Kalash Valley.jpg",
    imageSourceUrl: "https://commons.wikimedia.org/wiki/File:A_typical_house_in_Kalash_Valley.jpg",
    imageCredit: "Shah Tahsin Anwar",
    imageLicense: LICENSE_LABEL,
    imageLicenseUrl: LICENSE_URL,
    imageChanges: CHANGES,
  },
} satisfies Record<string, CuratedImage>;

const PLACE_IMAGES: Record<string, keyof typeof CURATED_IMAGES> = {
  chitral: "chitralTown",
  "chitral town": "chitralTown",
  "chitral fort": "shahiFort",
  "shahi fort": "shahiFort",
  "shahi mosque": "shahiMosque",
  "shahi masjid": "shahiMosque",
  qaqlasht: "qaqlashtMeadows",
  "qaqlasht meadows": "qaqlashtMeadows",
  "kalash valley": "kalashHouse",
  "kalash valleys": "kalashHouse",
  "kalasha valleys": "kalashHouse",
  "chilam josh": "chilamJosh",
  "chilam gosh": "chilamJosh",
};

const ARCHIVE_IMAGES: Record<string, keyof typeof CURATED_IMAGES> = {
  "chitral fort": "shahiFort",
  "shahi fort": "shahiFort",
  "shahi qila": "shahiFort",
  "shahi mosque, chitral": "shahiMosque",
  "shahi mosque": "shahiMosque",
  "qaqlasht meadows above booni": "qaqlashtMeadows",
  "sunrise in qaqlasht": "qaqlashtMeadows",
  "chilam josh": "chilamJosh",
  "chilam josh in bumburet": "chilamJosh",
  "chilam gosh festival, chitral, pakistan": "chilamJosh",
  "a typical house in kalash valley": "kalashHouse",
};

function getMappedImage(name: string, map: Record<string, keyof typeof CURATED_IMAGES>): CuratedImage | null {
  const normalizedName = name.trim().replace(/\s+/gu, " ").toLocaleLowerCase("en");
  const imageKey = map[normalizedName];
  return imageKey ? CURATED_IMAGES[imageKey] : null;
}

export function getCuratedPlaceImage(name: string): CuratedImage | null {
  return getMappedImage(name, PLACE_IMAGES);
}

export function getCuratedArchiveImage(title: string): CuratedImage | null {
  return getMappedImage(title, ARCHIVE_IMAGES);
}
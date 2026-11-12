/** Cases de suivi de la prospection. Ajouter une ligne ici suffit : onglet, case et validation suivent. */
export const prospectTags = [
  { id: "rappeler", label: "À rappeler" },
  { id: "entretien", label: "Entretien" },
  { id: "presentiel", label: "Vu en présentiel" },
  { id: "repasser", label: "À repasser" },
  { id: "mail", label: "Mail envoyé" },
] as const;

export type ProspectTagId = (typeof prospectTags)[number]["id"];

export const isProspectTag = (v: string): v is ProspectTagId => prospectTags.some((t) => t.id === v);

/** « rappeler,repasser » → ["rappeler", "repasser"] (les valeurs inconnues sont ignorées). */
export const parseTags = (raw: string): ProspectTagId[] => raw.split(",").filter(isProspectTag);

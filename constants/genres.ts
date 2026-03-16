export const GENRES = [
    "Action",
    "Adventure",
    "Thriller",
    "Mystery",
    "Romance",
    "Fantasy",
    "Sci-Fi",
    "Horror",
    "Biography",
    "Self Help",
    "History",
    "Rom com",
    "Education",
] as const;

export type Genre = (typeof GENRES)[number];

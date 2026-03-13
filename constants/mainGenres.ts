export const MAIN_GENRES = [
    "Action",
    "Adventure",
    "Thriller",
    "Mystery",
    "Fantasy",
    "Sci-Fi",
    "Romance",
    "Horror",
    "Biography",
    "History",
    "Self Help",
    "Education",
    "Business",
    "Psychology",
] as const;

export type MainGenre = (typeof MAIN_GENRES)[number];

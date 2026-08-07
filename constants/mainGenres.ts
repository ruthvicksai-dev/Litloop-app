export const MAIN_GENRES = [
    "Action",
    "Adventure",
    "Fiction",
    "Crime",
    "Thriller",
    "Mystery",
    "Fantasy",
    "Sci-Fi",
    "Romance",
    "Horror",
    "Biography",
    "History",
    "Self Help",
    "Rom com",
    "Business",
    "Psychology",
] as const;

export type MainGenre = (typeof MAIN_GENRES)[number];

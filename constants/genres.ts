export const GENRES = [
    "Action",
    "Adventure",
    "Fiction",
    "Crime",
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
] as const;

export type Genre = (typeof GENRES)[number];

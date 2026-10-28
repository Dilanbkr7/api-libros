/** Esquema básico de los resultados de Open Library Search API. */
export interface Book {
  key: string; // /works/OL...W
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

export interface OpenLibraryResponse {
  docs: Book[];
  numFound: number;
  numFoundExact?: boolean;
  start: number;
}

/** Respuesta de la API de obras: /works/{id}.json. */
export interface BookDetail {
  key: string;
  title: string;
  description?: string | { type?: string; value: string };
  covers?: number[];
  subjects?: string[];
  first_publish_date?: string;
}

export function toFavoriteBook(detail: BookDetail): Book {
  const year = detail.first_publish_date?.match(/\b\d{4}\b/)?.[0];
  return {
    key: detail.key,
    title: detail.title,
    cover_i: detail.covers?.[0],
    first_publish_year: year ? Number(year) : undefined,
  };
}

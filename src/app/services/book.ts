import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { BookDetail, OpenLibraryResponse } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'https://openlibrary.org';

  /** Consulta una página real de Open Library; no genera registros simulados. */
  searchBooks(query: string, page: number, limit: number = 10): Observable<OpenLibraryResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page)
      .set('limit', limit)
      .set('fields', 'key,title,author_name,first_publish_year,cover_i');

    return this.http.get<OpenLibraryResponse>(`${this.apiUrl}/search.json`, { params })
      .pipe(timeout(12000));
  }

  /** Consulta por identificador de obra: /works/OL123W.json. */
  getBookDetail(id: string): Observable<BookDetail> {
    return this.http.get<BookDetail>(`${this.apiUrl}/works/${encodeURIComponent(id)}.json`)
      .pipe(timeout(12000));
  }

  getCoverUrl(coverId: number | undefined, size: 'S' | 'M' | 'L' = 'M'): string {
    return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg` : '';
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { Book, OpenLibraryResponse } from '../models/book.model';

@Injectable({
  providedIn: 'root'
})
export class BookService {
  private http = inject(HttpClient);
  private apiUrl = 'https://openlibrary.org/search.json';

  searchBooks(
    query: string,
    page: number,
    limit: number = 10
  ): Observable<OpenLibraryResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page)
      .set('limit', limit)
      .set('fields', 'key,title,author_name,first_publish_year,cover_i');

    return this.http
      .get<OpenLibraryResponse>(this.apiUrl, { params })
      .pipe(timeout(12000));
  }
}


import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonButton,
  IonSearchbar,
  IonInfiniteScroll,
  IonInfiniteScrollContent
} from '@ionic/angular';

import { BookService } from '../services/book';
import { Book } from '../models/book.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonButton,
    IonSearchbar,
    IonInfiniteScroll,
    IonInfiniteScrollContent
  ],
})
export class HomePage implements OnInit {
  private bookService = inject(BookService);
  private cdr = inject(ChangeDetectorRef);

  books: Book[] = [];
  searchText = 'harry potter';
  currentQuery = 'harry potter';
  page = 1;
  pageSize = 10;
  totalBooks = 0;

  loading = false;
  loadingMore = false;
  error = '';
  hasMore = true;

  ngOnInit() {
    this.searchBooks();
  }

  onSearchInput(event: any) {
    this.searchText = event.detail.value ?? '';
  }

  searchBooks() {
    const query = this.searchText.trim();

    if (!query || this.loading) {
      return;
    }

    this.currentQuery = query;
    this.page = 1;
    this.books = [];
    this.totalBooks = 0;
    this.hasMore = true;
    this.error = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.bookService.searchBooks(query, 1, this.pageSize).subscribe({
      next: (response) => {
        this.books = response.docs;
        this.totalBooks = response.numFound;
        this.page = 1;
        this.hasMore = this.books.length < this.totalBooks;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al buscar libros:', err);
        this.error = 'No se pudieron cargar los libros. Comprueba tu conexión.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMore(event: any) {
    if (this.loading || this.loadingMore || !this.hasMore) {
      event.target.complete();
      return;
    }

    this.loadingMore = true;
    const nextPage = this.page + 1;

    this.bookService.searchBooks(this.currentQuery, nextPage, this.pageSize)
      .subscribe({
        next: (response) => {
          const existingKeys = new Set(this.books.map(book => book.key));
          const newBooks = response.docs.filter(
            book => !existingKeys.has(book.key)
          );

          this.books = [...this.books, ...newBooks];
          this.page = nextPage;
          this.totalBooks = response.numFound;
          this.hasMore =
            this.books.length < this.totalBooks && response.docs.length > 0;

          this.loadingMore = false;
          event.target.complete();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar más libros:', err);
          this.loadingMore = false;
          this.error = 'No se pudieron cargar más libros. Inténtalo de nuevo.';
          event.target.complete();
          this.cdr.detectChanges();
        }
      });
  }

  getCoverUrl(book: Book): string {
    return book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : '';
  }
}

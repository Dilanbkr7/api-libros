import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Subscription } from 'rxjs';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonButton,
  IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent, IonBadge
} from '@ionic/angular';
import { Book, OpenLibraryResponse } from '../models/book.model';
import { BookService } from '../services/book';
import { FavoritesService } from '../services/favorites.service';

type InfiniteTarget = { complete: () => Promise<void> };

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonButton,
    IonSearchbar, IonInfiniteScroll, IonInfiniteScrollContent, IonBadge
  ],
})
export class HomePage implements OnInit, OnDestroy {
  private readonly bookService = inject(BookService);
  private readonly favorites = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private searchSubscription?: Subscription;
  private moreSubscription?: Subscription;
  private requestVersion = 0;

  books: Book[] = [];
  searchText = 'harry potter';
  currentQuery = '';
  page = 0;
  readonly pageSize = 10;
  totalBooks = 0;
  private receivedCount = 0;
  loading = false;
  loadingMore = false;
  hasMore = false;
  error = '';
  loadMoreError = '';
  favoriteError = '';
  showFavoritesOnly = false;

  get visibleBooks(): Book[] {
    if (!this.showFavoritesOnly) return this.books;
    const needle = this.searchText.trim().toLowerCase();
    return this.favorites.books().filter(book =>
      !needle || book.title.toLowerCase().includes(needle) ||
      (book.author_name ?? []).some(author => author.toLowerCase().includes(needle))
    );
  }

  get favoritesCount(): number { return this.favorites.books().length; }

  ngOnInit(): void { this.searchBooks(); }

  ngOnDestroy(): void {
    ++this.requestVersion;
    this.searchSubscription?.unsubscribe();
    this.moreSubscription?.unsubscribe();
  }

  onSearchInput(event: CustomEvent<{ value?: string | null }>): void {
    this.searchText = event.detail.value ?? '';
    if (!this.showFavoritesOnly) this.searchBooks();
  }

  setFavoritesOnly(value: boolean): void {
    if (this.showFavoritesOnly === value) return;
    this.showFavoritesOnly = value;
    this.favoriteError = '';
    // Al volver al catálogo se pide desde la página 1 de la nueva consulta.
    if (!value && this.currentQuery !== this.searchText.trim()) this.searchBooks();
  }

  searchBooks(): void {
    ++this.requestVersion;
    this.searchSubscription?.unsubscribe();
    this.moreSubscription?.unsubscribe();
    this.books = [];
    this.page = 0;
    this.receivedCount = 0;
    this.totalBooks = 0;
    this.error = '';
    this.loadMoreError = '';
    this.hasMore = false;
    this.loadingMore = false;
    this.currentQuery = this.searchText.trim();
    const version = this.requestVersion;

    if (!this.currentQuery || this.showFavoritesOnly) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;
    this.searchSubscription = this.bookService.searchBooks(this.currentQuery, 1, this.pageSize)
      .pipe(finalize(() => {
        if (version === this.requestVersion) {
          this.loading = false;
          this.cdr.detectChanges();
        }
      }))
      .subscribe({
        next: response => {
          if (version !== this.requestVersion) return;
          this.applyResponse(response, 1, true);
        },
        error: err => {
          if (version !== this.requestVersion) return;
          console.error('Error en la búsqueda:', err);
          this.error = 'No se pudieron cargar los libros. Comprueba tu conexión y reintenta.';
        }
      });
  }

  loadMore(event: { target: InfiniteTarget }): void {
    this.fetchNextPage(event.target);
  }

  retryMore(): void {
    this.loadMoreError = '';
    this.fetchNextPage();
  }

  private fetchNextPage(target?: InfiniteTarget): void {
    if (this.showFavoritesOnly || this.loading || this.loadingMore || !this.hasMore || this.loadMoreError) {
      void target?.complete();
      return;
    }
    this.loadingMore = true;
    const version = this.requestVersion;
    const nextPage = this.page + 1;
    this.moreSubscription = this.bookService.searchBooks(this.currentQuery, nextPage, this.pageSize)
      .pipe(finalize(() => {
        // Se llama siempre, incluso ante error o cancelación por otra búsqueda.
        void target?.complete();
        if (version === this.requestVersion) {
          this.loadingMore = false;
          this.cdr.detectChanges();
        }
      }))
      .subscribe({
        next: response => {
          if (version !== this.requestVersion) return;
          this.applyResponse(response, nextPage, false);
        },
        error: err => {
          if (version !== this.requestVersion) return;
          console.error('Error al cargar otra página:', err);
          this.loadMoreError = `No se pudo cargar la página ${nextPage}. Los libros anteriores se mantienen.`;
        }
      });
  }

  private applyResponse(response: OpenLibraryResponse, page: number, replace: boolean): void {
    const docs = Array.isArray(response.docs) ? response.docs : [];
    const current = replace ? [] : this.books;
    const unique = new Map<string, Book>(current.map(book => [book.key, book]));
    for (const book of docs) {
      if (/^\/works\/OL\d+W$/.test(book.key) && !unique.has(book.key)) {
        unique.set(book.key, book);
      }
    }
    this.books = [...unique.values()];
    this.page = page;
    this.receivedCount = (replace ? 0 : this.receivedCount) + docs.length;
    this.totalBooks = Math.max(0, response.numFound ?? 0);
    this.hasMore = docs.length === this.pageSize && this.receivedCount < this.totalBooks;
    this.loadMoreError = '';
  }

  isFavorite(key: string): boolean { return this.favorites.isFavorite(key); }

  toggleFavorite(book: Book): void {
    this.favoriteError = '';
    try { this.favorites.toggle(book); }
    catch (err) { this.favoriteError = err instanceof Error ? err.message : 'No se pudo guardar el favorito.'; }
  }

  openDetail(book: Book): void {
    const id = book.key.split('/').pop();
    if (id && /^OL\d+W$/.test(id)) {
      void this.router.navigate(['/book-detail', id]);
    }
  }

  getCoverUrl(book: Book): string { return this.bookService.getCoverUrl(book.cover_i); }
}

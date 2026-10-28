import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
  IonBackButton, IonButton, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonSpinner
} from '@ionic/angular';
import { BookDetail, toFavoriteBook } from '../../models/book.model';
import { BookService } from '../../services/book';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-book-detail',
  templateUrl: './book-detail.page.html',
  styleUrls: ['./book-detail.page.scss'],
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons,
    IonBackButton, IonButton, IonCard, IonCardHeader, IonCardTitle,
    IonCardContent, IonSpinner]
})
export class BookDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly books = inject(BookService);
  private readonly favorites = inject(FavoritesService);
  private subscription?: Subscription;
  private id = '';
  detail: BookDetail | null = null;
  loading = false;
  error = '';
  favoriteError = '';

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDetail();
  }

  ngOnDestroy(): void { this.subscription?.unsubscribe(); }

  loadDetail(): void {
    this.subscription?.unsubscribe();
    this.detail = null;
    this.error = '';
    this.loading = true;
    if (!/^OL\d+W$/.test(this.id)) {
      this.error = 'El identificador del libro no es válido.';
      this.loading = false;
      return;
    }
    this.subscription = this.books.getBookDetail(this.id).subscribe({
      next: detail => {
        this.detail = detail;
        this.loading = false;
      },
      error: err => {
        console.error('Error al consultar el detalle:', err);
        this.error = 'No se pudo consultar el detalle. Comprueba tu conexión.';
        this.loading = false;
      }
    });
  }

  description(): string {
    const value = this.detail?.description;
    return typeof value === 'string' ? value : value?.value || 'Sin descripción disponible.';
  }

  getCoverUrl(): string { return this.books.getCoverUrl(this.detail?.covers?.[0], 'L'); }

  isFavorite(): boolean { return this.detail ? this.favorites.isFavorite(this.detail.key) : false; }

  toggleFavorite(): void {
    if (!this.detail) return;
    this.favoriteError = '';
    try { this.favorites.toggle(toFavoriteBook(this.detail)); }
    catch (err) { this.favoriteError = err instanceof Error ? err.message : 'No se pudo guardar el favorito.'; }
  }

  goBack(): void { void this.router.navigateByUrl('/home'); }
}

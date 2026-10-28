import { Injectable, signal } from '@angular/core';
import { Book } from '../models/book.model';

/**
 * Persistencia equivalente admitida por R6: Web Storage local.
 * Los favoritos sobreviven al cierre normal de la app mientras no se borren sus datos.
 * En una versión de producción es posible reemplazar este adaptador por Capacitor Preferences.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly storageKey = 'api-explorer:favorites:v1';
  readonly books = signal<Book[]>(this.read());

  isFavorite(key: string): boolean {
    return this.books().some(item => item.key === key);
  }

  toggle(book: Book): void {
    const existing = this.books();
    const updated = this.isFavorite(book.key)
      ? existing.filter(item => item.key !== book.key)
      : [...existing, book];
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      this.books.set(updated);
    } catch {
      throw new Error('No se pudo guardar el favorito en este dispositivo.');
    }
  }

  private read(): Book[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      const raw: unknown = data ? JSON.parse(data) : [];
      if (!Array.isArray(raw)) return [];
      const unique = new Map<string, Book>();
      for (const item of raw) {
        if (item && typeof item === 'object' &&
            typeof item.key === 'string' && /^\/works\/OL\d+W$/.test(item.key) &&
            typeof item.title === 'string') {
          unique.set(item.key, item as Book);
        }
      }
      return [...unique.values()];
    } catch {
      return [];
    }
  }
}

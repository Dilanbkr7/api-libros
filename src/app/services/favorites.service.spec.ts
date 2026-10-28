import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('guarda y quita un favorito de forma persistente', () => {
    const service = TestBed.configureTestingModule({ providers: [FavoritesService] }).inject(FavoritesService);
    const book = { key: '/works/OL45804W', title: 'Fantastic Mr. Fox' };
    service.toggle(book);
    expect(service.isFavorite(book.key)).toBe(true);
    expect(localStorage.getItem('api-explorer:favorites:v1')).toContain(book.title);
    service.toggle(book);
    expect(service.isFavorite(book.key)).toBe(false);
  });
});

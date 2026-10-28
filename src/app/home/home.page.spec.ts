import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let component: HomePage;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()]
    });
    component = TestBed.createComponent(HomePage).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    component.ngOnDestroy();
    http.verify();
  });

  it('carga una página y anexa la siguiente sin repetir libros', () => {
    component.ngOnInit();
    const first = http.expectOne(req => req.params.get('page') === '1');
    first.flush({ docs: [
      { key: '/works/OL100W', title: 'Libro A' },
      { key: '/works/OL101W', title: 'Libro B' },
      { key: '/works/OL102W', title: 'Libro C' },
      { key: '/works/OL103W', title: 'Libro D' },
      { key: '/works/OL104W', title: 'Libro E' },
      { key: '/works/OL105W', title: 'Libro F' },
      { key: '/works/OL106W', title: 'Libro G' },
      { key: '/works/OL107W', title: 'Libro H' },
      { key: '/works/OL108W', title: 'Libro I' },
      { key: '/works/OL109W', title: 'Libro J' },
    ], numFound: 12, start: 0 });
    expect(component.books.length).toBe(10);
    expect(component.hasMore).toBe(true);
    let completed = false;
    component.loadMore({ target: { complete: async () => { completed = true; } } });
    const second = http.expectOne(req => req.params.get('page') === '2');
    second.flush({ docs: [
      { key: '/works/OL109W', title: 'Libro J' },
      { key: '/works/OL110W', title: 'Libro K' }
    ], numFound: 12, start: 10 });
    expect(component.books.length).toBe(11);
    expect(component.hasMore).toBe(false);
    expect(completed).toBe(true);
  });

  it('cancela resultados antiguos cuando comienza otra búsqueda', () => {
    component.ngOnInit();
    const original = http.expectOne(req => req.params.get('q') === 'harry potter');
    component.onSearchInput({ detail: { value: 'ecuador' } } as CustomEvent<{value?: string}>);
    expect(original.cancelled).toBe(true);
    const next = http.expectOne(req => req.params.get('q') === 'ecuador');
    next.flush({ docs: [{ key: '/works/OL30W', title: 'Ecuador' }], numFound: 1, start: 0 });
    expect(component.books.map(book => book.title)).toEqual(['Ecuador']);
    expect(component.page).toBe(1);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BookService } from './book';

describe('BookService', () => {
  let service: BookService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BookService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BookService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('consulta la página solicitada de Open Library', () => {
    let received = 0;
    service.searchBooks('harry potter', 3, 10).subscribe(value => received = value.docs.length);
    const request = http.expectOne(req => req.url === 'https://openlibrary.org/search.json');
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('q')).toBe('harry potter');
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('limit')).toBe('10');
    request.flush({ docs: [{ key: '/works/OL45804W', title: 'Un libro' }], numFound: 1, start: 20 });
    expect(received).toBe(1);
  });

  it('consulta el detalle de una obra por identificador', () => {
    service.getBookDetail('OL45804W').subscribe(detail => expect(detail.title).toBe('Fantastic Mr. Fox'));
    const request = http.expectOne('https://openlibrary.org/works/OL45804W.json');
    expect(request.request.method).toBe('GET');
    request.flush({ key: '/works/OL45804W', title: 'Fantastic Mr. Fox' });
  });
});

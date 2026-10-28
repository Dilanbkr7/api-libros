import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BookDetailPage } from './book-detail.page';

describe('BookDetailPage', () => {
  it('consulta el recurso de la ruta y lo muestra', () => {
    TestBed.configureTestingModule({
      imports: [BookDetailPage],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'OL45804W' }) } } }
      ]
    });
    const component = TestBed.createComponent(BookDetailPage).componentInstance;
    const http = TestBed.inject(HttpTestingController);
    component.ngOnInit();
    http.expectOne('https://openlibrary.org/works/OL45804W.json').flush({
      key: '/works/OL45804W', title: 'Fantastic Mr. Fox', description: 'Historia de un zorro.'
    });
    expect(component.detail?.title).toBe('Fantastic Mr. Fox');
    expect(component.description()).toBe('Historia de un zorro.');
    http.verify();
    component.ngOnDestroy();
  });
});

# Guía de defensa — API Explorer / api-libros

## 1. Explicación que puedes decir en 45–60 segundos

«Construí una aplicación móvil con Ionic para la interfaz, Angular Standalone para la lógica y los servicios, y Capacitor para ejecutarla como aplicación Android. Consumo la API pública Open Library mediante HttpClient. Al buscar un libro, el servicio envía una solicitud HTTP GET a `/search.json` con los parámetros `q`, `page` y `limit`. El servidor devuelve JSON y Angular lo convierte en una lista de objetos. La página muestra tarjetas con títulos, autores, años y portadas. Al llegar al final de la lista, ion-infinite-scroll pide la siguiente página y agrega libros sin duplicar sus identificadores. Cada tarjeta permite abrir su detalle por ruta y marcarla como favorita. Los favoritos quedan guardados localmente, incluso si se cierra normalmente la aplicación.»

## 2. Secuencia de comandos para memorizar

```bat
:: Crear un proyecto desde cero (NO lo repitas en tu proyecto existente)
npm install -g @ionic/cli
ionic start api-libros blank --type=angular-standalone --capacitor
cd api-libros

:: Generar estructura desde cero
ionic generate service services/book
ionic generate page pages/book-detail

:: Trabajar con el repositorio existente
npm ci
ionic serve

:: Convertirlo a Android (únicamente la primera vez)
npm install @capacitor/android@^8.5.3
ionic build
npx cap add android
npx cap sync android
npx cap open android

:: Tras editar código, si android/ ya existe
ionic build
npx cap sync android
npx cap open android

:: Subir cambios a GitHub
git status
git add .
git commit -m "API Explorer completo"
git push origin main
```

**Diferencias de comandos:** `ionic serve` levanta servidor de desarrollo; `ionic build` compila la web; `npx cap add android` crea el proyecto nativo por primera vez; `npx cap sync android` copia el build y sincroniza plugins; `npx cap open android` lo abre en Android Studio. `git add` prepara, `git commit` registra y `git push` publica cambios en remoto.

## 3. ¿Cómo viajan los datos?

1. El usuario escribe `ecuador` en `ion-searchbar`.
2. Angular recibe el evento `(ionInput)`; tras el debounce de 350 ms, llama a `searchBooks()`.
3. `HomePage` cancela consultas anteriores, reinicia página y resultados, y llama a `BookService`.
4. `BookService` utiliza `HttpClient.get()` y `HttpParams` con `q=ecuador&page=1&limit=10`.
5. El servidor Open Library responde con JSON: `docs` (lista), `numFound` (total) y `start`.
6. El `subscribe()` procesa los resultados y Angular pinta las tarjetas.
7. Si el usuario baja, `ion-infinite-scroll` pide `page=2` y agrega nuevas tarjetas.
8. Si el usuario toca un libro, el router abre `/book-detail/OL...W` y se consulta `/works/OL...W.json`.
9. Los favoritos se guardan en `localStorage`; no se envían a Open Library.

## 4. Conceptos principales

| Concepto | Definición fácil |
| --- | --- |
| API REST | Interface HTTP para obtener o modificar recursos |
| Endpoint | URL concreta de un recurso, como `/search.json` |
| GET | Solicita datos a un servidor |
| JSON | Formato de respuesta estructurada (`{ clave: valor }`) |
| Servicio Angular | Reutiliza lógica (por ejemplo consultas) separada de la pantalla |
| Interfaz TypeScript | Describe la forma de un objeto, como un libro |
| Observable | Representa resultados que pueden llegar asíncronamente |
| `subscribe()` | Recibe resultados o errores de un Observable |
| `finalize()` | Ejecuta una limpieza al completar, fallar o cancelar |
| `ion-infinite-scroll` | Solicita información al alcanzar el final visible de la lista |
| `hasMore` | Indica si se debe solicitar otra página |
| `loadingMore` | Impide peticiones simultáneas |
| `requestVersion` | Identifica cada búsqueda para descartar resultados antiguos |
| `Map` | Permite deduplicar por identificador de libro |
| `localStorage` | Almacenamiento local persistente de la app/navegador |
| `Router` | Navega entre `/home` y `/book-detail/:id` |

## 5. Preguntas probables y respuestas

**¿Por qué un servicio y no HTTP directamente en la página?**  
El servicio centraliza el acceso a Open Library, reduce duplicación y permite reutilizar y probar las peticiones. La página se concentra en la interacción y los estados de la pantalla.

**¿Para qué sirve el modelo `Book`?**  
Define propiedades esperadas como `key`, `title`, `author_name`, `first_publish_year` y `cover_i`, y permite usar TypeScript con tipos.

**¿Dónde está la base de datos de la aplicación?**  
Los datos del catálogo están en los servidores de Open Library; mi app es cliente, no tiene base de datos propia para esos libros. Los favoritos son registros locales en el dispositivo.

**¿Qué es un endpoint?**  
Una dirección HTTP concreta. Por ejemplo `/search.json` sirve para buscar; `/works/{id}.json` consulta una obra.

**¿Cómo funciona el infinite scrolling?**  
La primera consulta pide página 1 de 10 registros. Al llegar al final se pide página 2 y se anexan los nuevos. Se eliminan repetidos por `key`, se actualiza `page` solo si la consulta tiene éxito y se detiene con `hasMore=false` al terminar.

**¿Por qué usaste `Map`?**  
Para combinar los libros anteriores y los nuevos identificándolos por `key`; si un identificador se repite, no agrego otra tarjeta.

**¿Qué diferencia hay entre reemplazar y concatenar un arreglo?**  
Una búsqueda nueva reemplaza los resultados (`books=[]` y página 1). El scroll concatena resultados adicionales (sin repetidos) a la búsqueda activa.

**¿Qué se reinicia cuando cambio la búsqueda?**  
El arreglo de libros, página, contador de recibidos, total, errores, `hasMore`, `loadingMore` y versión de solicitud. Se cancela la petición anterior.

**¿Qué pasa si falla la tercera página?**  
Mantengo la primera y segunda página y su numeración, muestro un error con botón de reintento. El reintento vuelve a solicitar página 3 y no repite resultados.

**¿Por qué `finalize()`?**  
Porque `complete()` del infinite scroll debe ejecutarse si termina bien, falla o se cancela la consulta. `finalize()` permite hacerlo en un solo lugar.

**¿Cómo evita consultas simultáneas?**  
Usando banderas `loading` y `loadingMore`. También cancela solicitudes al cambiar la consulta.

**¿Cómo diferencio sin resultados de fallo de Internet?**  
Si HTTP responde correctamente pero `docs` está vacío, muestro «No se encontraron libros». Si la petición falla, muestro mensaje de error y Reintentar.

**¿Cómo se identifican las páginas de detalle?**  
Se utiliza el identificador de obra `key`, por ejemplo `/works/OL45804W`, para crear `/book-detail/OL45804W`. La página lee el parámetro `id` y llama al servicio.

**¿Por qué los favoritos persisten?**  
Porque se serializan en JSON y se guardan en `localStorage` con una clave estable. Al iniciar la app se vuelve a leer esa lista.

**¿Qué hace Capacitor en este proyecto?**  
Permite empaquetar la aplicación web como una app Android y, si hiciera falta, incorporar plugins nativos. La consulta HTTP funciona directamente desde Angular.

**¿Qué pasa si la app no tiene Internet?**  
No puede obtener nuevos libros desde Open Library. Muestra un error y permite reintentar. Los favoritos locales siguen guardados.

## 6. Demostración de un minuto

1. Abre la aplicación con la búsqueda inicial: muestra libros de Open Library.
2. Desliza hasta el final: aparecen resultados de la página siguiente, sin reemplazar la primera.
3. Busca `ecuador`: se limpian los resultados anteriores y comienza desde la primera página.
4. Toca **Ver detalle**: se abre una ruta con el identificador de obra.
5. Toca **Agregar a favoritos**, regresa y activa el filtro Favoritos.
6. Cierra y abre la app y comprueba que el favorito permanece.
7. Si hay tiempo, desconecta Internet, muestra el mensaje de error y reintenta al reconectar.

## 7. Preparación de evidencia

Captura imágenes REALES de: inicio, segunda página, nueva búsqueda, detalle, favoritos y prueba Android. Adjunta URL de GitHub y recuerda demostrar que el proyecto compila desde cero con `npm ci` y `ionic build` antes de entregarlo.

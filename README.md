# El Sistema — Misiones Diarias

App web para cumplir tus misiones cada día con la mecánica de las novelas de progresión
(estilo *Solo Leveling*): experiencia, niveles, rangos, estadísticas, racha y penalización
por fallar la misión diaria.

No necesita instalación, ni servidor, ni cuenta. Es HTML, CSS y JavaScript puro:
funciona sin conexión y todo tu progreso se guarda en tu propio dispositivo.

## Cómo se juega

1. **Misión diaria.** Arranca con el set clásico: 100 flexiones, 100 abdominales,
   100 sentadillas y 10 km de carrera. Puedes añadir, editar o borrar las tuyas
   (ejercicio, estudio, hábitos… lo que quieras).
2. **Recompensa.** Al completar los objetivos del día se habilita `RECLAMAR RECOMPENSA`:
   la experiencia de cada misión **+50 % de bonificación**, **oro** y **+1 punto de
   estadística**.
3. **Nivel y rango.** Cada nivel da 3 puntos para repartir entre Fuerza, Agilidad,
   Vitalidad, Inteligencia y Percepción. El rango sube solo: **E → D → C → B → A → S**.
4. **Ventana de estado.** La vida sale de Vitalidad y el maná de Inteligencia; la fatiga
   sube al completar objetivos y se va al dormir. El **poder de combate** resume
   estadísticas, nivel, clase y título en un solo número.
5. **Penalización.** Si a medianoche la misión no está completa entras en la **zona de
   penalización**: se rompe la racha, pierdes el 10 % de la experiencia del nivel y una
   parte de la vida, y **ganas la mitad de experiencia** hasta que completes un día
   entero. Nunca bajas de nivel.
6. **Puertas.** Casi la mitad de los días se abre una puerta de rango E a S con un
   desafío extra. Es opcional y no penaliza, pero paga experiencia y oro, y se cierra
   sola a medianoche.
7. **Títulos.** Se desbloquean por logros (primera misión, racha de 7, salir de una
   penalización, cerrar 10 puertas, niveles altos…) y el que equipes da experiencia extra.
8. **Cambio de clase.** Al nivel 10 el Sistema te ofrece especializarte: Guerrero,
   Asesino, Tanque, Mago o Explorador. Da +15 % de experiencia en las misiones de tu
   estadística y 3 puntos en ella. Se elige una sola vez.
9. **Tienda.** Con el oro compras pociones de vida y energía, piedras de doble
   experiencia, llaves para invocar puertas y el pergamino del perdón, que anula una
   penalización y te devuelve la racha.
10. **Jefe de la semana.** Cada lunes aparece un jefe con barra de vida, calibrada a
    partir de tu propia misión diaria (la experiencia de un día × 6). Cada objetivo que
    completas le hace daño en el acto, escalado por tu poder de combate, y cerrar una
    puerta pega el triple. Si cae antes del domingo sueltas experiencia y oro; si
    sobrevive, escapa y pierdes la recompensa. No hay combate que jugar: el daño sale de
    lo que haces de verdad.

## Cómo usarla

**En el ordenador**, desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

Hace falta un servidor local: el código está repartido en módulos de JavaScript y los
navegadores los bloquean por CORS si abres `index.html` con doble clic (`file://`).
Cualquier servidor estático vale (`npx serve`, `php -S localhost:8000`, la extensión
*Live Server* de VS Code…).

**En el móvil (recomendado, para el uso diario):** publícala en Vercel o en GitHub Pages y
añádela a la pantalla de inicio. Con Vercel el repositorio puede seguir siendo privado.

### Publicar en Vercel

1. Instala la app de Vercel en GitHub: [github.com/apps/vercel](https://github.com/apps/vercel)
   → **Configure** → elige tu cuenta → **Only select repositories** → `POLOS-DRAUSSE` → **Save**.
   Con esto el repositorio puede seguir siendo privado.
2. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub.
3. **Add New… → Project**, elige `POLOS-DRAUSSE` e **Import**.
4. No hay nada que configurar: es un sitio estático, sin framework ni build. Pulsa **Deploy**.
5. Cada `git push` a la rama de producción vuelve a desplegar la app automáticamente.

### Publicar en GitHub Pages (requiere repositorio público en cuentas gratuitas)

1. En GitHub: **Settings → Pages → Source: Deploy from a branch**, elige la rama y la
   carpeta `/ (root)`, y guarda.
2. Abre la URL que aparece (`https://<usuario>.github.io/<repo>/`).

## Instalarla en el móvil

La app es una PWA: se instala desde el navegador, sin tiendas de aplicaciones.

**iPhone y iPad (obligatorio Safari; Chrome en iOS no puede instalar apps).**

1. Abre la URL en **Safari**.
2. Toca el botón **Compartir** (el cuadrado con la flecha hacia arriba, abajo en el centro).
3. Baja en la lista y toca **Añadir a pantalla de inicio**.
4. Verás el nombre *El Sistema* y su icono. Toca **Añadir**.

**Android (Chrome, Edge, Samsung Internet…).**

1. Abre la URL en Chrome.
2. Aparecerá una barra **"Instalar aplicación"**; si no sale, abre el menú **⋮** y elige
   **Instalar aplicación** o **Añadir a pantalla de inicio**.
3. Confirma con **Instalar**.

En ambos casos queda en la pantalla de inicio con su icono, se abre a pantalla completa
(sin barra de direcciones) y funciona sin conexión.

### Comprobar que funciona como PWA

- Ábrela desde el icono: **no debe verse la barra de direcciones del navegador**.
- Activa el modo avión y ábrela: tiene que cargar igual (service worker).
- En Chrome de escritorio: **F12 → Application → Manifest** (nombre, iconos, colores y
  `display: standalone`) y **Application → Service Workers** (debe decir *activated and
  running*). En la barra de direcciones aparece el icono de instalar.
- Automático, contra la URL publicada:
  `BASE=https://tu-app.vercel.app/ node pruebas/pwa.mjs`

## Tus datos

El progreso vive en el `localStorage` del navegador: no sale de tu dispositivo, pero se
borra si limpias los datos del navegador o desinstalas la app. En **AJUSTES** tienes
`DESCARGAR COPIA` y `RESTAURAR COPIA` para llevarte el progreso a otro móvil o guardarlo
a salvo.

## Estructura

El código se organiza por **lo que hace el juego** (arquitectura *screaming*), no por
capas técnicas: para tocar las misiones vas a `js/misiones/`, no a buscar entre un
"modelo" o un "controlador" genéricos. Cada feature tiene, cuando lo necesita,
`reglas.js` (funciones puras del juego, sin DOM) y `vista.js` (pintado y referencias
al DOM):

```
index.html                    Estructura de la interfaz
css/estilos.css                Tema holográfico azul, móvil primero

js/app.js                      Raíz de composición: arranque, eventos, temporizadores
js/progreso.js                 Partida guardada: agrega el estado de cada feature y lo
                                persiste en localStorage

js/jugador/                    Nivel, experiencia, rango, estadísticas, vida y fatiga
js/misiones/                   Alta, edición, borrado y progreso de las misiones
js/ciclo-diario/                Recompensa, racha, cambio de día y penalización
js/puertas/                    Desafíos extra de rango E a S y su recompensa
js/jefes/                      Jefe semanal: aparición, daño, victoria y huida
js/titulos/                    Títulos desbloqueables y el que llevas equipado
js/clases/                     Cambio de clase y su especialidad
js/tienda/                     Objetos, compra con oro e inventario
js/recompensas/                Multiplicador de experiencia (título, clase, castigo)
js/historial/                  Mapa de calor de los últimos 30 días
js/ajustes/                    Sonido, texto animado, copia de seguridad y reinicio
js/notificaciones/             Ventanas del Sistema, máquina de escribir y sonidos

js/nucleo/                     Utilidades técnicas sin reglas de juego:
                                fecha.js (fechas, id, reloj) y
                                almacenamiento.js (localStorage con manejo de errores)

sw.js                          Service worker: caché para el modo sin conexión
manifest.webmanifest           Metadatos para instalarla como app (nombre, iconos, colores)
vercel.json                    Cabeceras del despliegue (tipo del manifest, caché del worker)
iconos/                        Icono en SVG y los PNG de la pantalla de inicio
pruebas/e2e.mjs                Prueba automática del ciclo completo (opcional)
pruebas/pwa.mjs                Prueba automática de los requisitos de PWA (opcional)
```

Para pasar la prueba automática, con el servidor local en marcha:

```bash
npm install playwright && node pruebas/e2e.mjs
```

Los números del juego están arriba de cada `reglas.js`: `js/ciclo-diario/` (`BONO_DIA`,
`PENALIZACION_XP`, `PENALIZACION_HP`), `js/jugador/` (`PUNTOS_POR_NIVEL`, `FATIGA_MISION`
y la curva `xpNecesaria`) y `js/recompensas/` (`MERMA_CASTIGO`, `ORO_POR_XP`). Los
catálogos de títulos, clases, objetos, puertas y jefes viven en el `catalogo.js` de su
feature — ahí se ajusta la dureza del jefe (`VIDA_POR_XP_DIARIA`, `GOLPE_PUERTA`) sin
tocar la interfaz.

> Proyecto personal y sin ánimo de lucro, inspirado en la estética de las novelas de
> progresión. No está asociado a ninguna obra ni a sus autores.

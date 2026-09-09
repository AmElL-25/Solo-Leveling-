# El Sistema — Misiones Diarias

App web para cumplir tus misiones cada día con la mecánica de las novelas de progresión
(estilo *Solo Leveling*): experiencia, niveles, rangos, estadísticas, racha y penalización
por fallar la misión diaria.

No necesita instalación, ni servidor, ni cuenta. Es HTML, CSS y JavaScript puro:
funciona sin conexión y todo tu progreso se guarda en tu propio dispositivo.

## Cómo se juega

1. **Misión diaria.** Arranca con el set de **gerente de ventas + físico**: prospección,
   reunión con el equipo, uno a uno con un vendedor, propuestas, formación, fuerza,
   cardio, agua y sueño. La pantalla del día **solo sirve para marcar**: crear, editar,
   borrar y cambiar de set se hace en **⚙ Configuración**.
2. **Recompensa.** Al completar los objetivos del día se habilita `RECLAMAR RECOMPENSA`:
   la experiencia de cada misión **+50 % de bonificación**, **oro** y **+1 punto de
   estadística**.
3. **Nivel y rango.** Cada nivel da 3 puntos para repartir entre Fuerza, Agilidad,
   Vitalidad, Inteligencia y Percepción. El rango sube solo: **E → D → C → B → A → S**.
4. **Ventana de estado.** La vida sale de Vitalidad y el maná de Inteligencia; la fatiga
   sube al completar objetivos y se va al dormir. El **poder de combate** resume
   estadísticas, nivel, clase y título en un solo número.
5. **Jefe de la semana.** Cada lunes aparece un jefe con barra de vida, calibrada con tu
   propia misión diaria y tu poder: siempre cuesta unos seis días de constancia. Cada
   objetivo que completas le hace daño en el acto y **cerrar una puerta pega el triple**.
   La semana cierra el **domingo a medianoche**: si el jefe sigue vivo, escapa.
6. **Castigo.** Fallar el día —o dejar escapar al jefe— abre la **zona de penalización**:
   se rompe la racha, pierdes experiencia y vida, y el Sistema te asigna una **misión de
   castigo** (100 flexiones, 8 km, 30 contactos extra…). Hay que **aceptarla y
   cumplirla**: mientras la debas ganas la mitad de experiencia y **no empieza una semana
   nueva** — no aparecerá ningún jefe hasta que saldes la deuda. Cumplir el día no
   perdona el castigo; solo lo hacen la penitencia o el pergamino del perdón.
7. **Puertas.** Casi la mitad de los días se abre una puerta de rango E a S con un
   desafío extra. Es opcional y no penaliza, pero paga experiencia y oro, y se cierra
   sola a medianoche.
8. **Títulos.** Se desbloquean por logros (primera misión, racha de 7, salir de una
   penalización, cerrar 10 puertas, 5 jefes, niveles altos…) y el que equipes da
   experiencia extra.
9. **Cambio de clase.** Al nivel 10 el Sistema te ofrece especializarte: Guerrero,
   Asesino, Tanque, Mago o Explorador. Da +15 % de experiencia en las misiones de tu
   estadística y 3 puntos en ella. Se elige una sola vez.
10. **Tienda.** Con el oro compras pociones de vida y energía, piedras de doble
    experiencia, llaves para invocar puertas y el pergamino del perdón, que anula la
    penalización y te devuelve la racha.

## Dónde está cada cosa

La pantalla principal es para el día: marcar progreso, ver el jefe y la puerta. Cuatro
pestañas y nada más.

Todo lo que se toca de vez en cuando vive detrás del **engranaje de la cabecera**, en un
apartado a pantalla completa: crear, editar y borrar objetivos, las plantillas, la cuota,
el modo automático y su horario, el sonido y las copias de seguridad. Se cierra con
**VOLVER** o con la tecla Escape.

## La capa de negocio

El juego mide esfuerzo; esta capa mide resultados.

- **Indicadores.** Cada misión puede declarar a qué aporta: contactos, reuniones,
  propuestas, ventas cerradas o facturación. Las que no lo hacen (fuerza, cardio, sueño)
  cuentan solo para el juego.
- **Misiones opcionales.** Cerrar una venta no depende solo de ti, así que *Ventas
  cerradas* y *Facturación* son de registro: dan experiencia y golpean al jefe, pero no
  bloquean el día ni se cortan en su objetivo — si facturas de más, se anota de más.
- **Cuadro de mando** (pestaña CUADRO): totales de la semana por indicador, media diaria,
  variación frente a la semana anterior, tasa de conversión (cierres ÷ propuestas) y el
  acumulado del mes.
- **Cuota mensual.** Fija tu objetivo en ⚙ Configuración y la barra te dice el porcentaje y
  cuánto falta. Se calcula del historial, no de un contador que pueda desincronizarse.
- **El jefe mide lo comercial.** Conserva su nombre y su barra, pero las misiones de
  resultado le pegan **el doble**: al jefe le duele la venta, no la actividad.
## Dos modos: SISTEMA y SALES

La misma app con dos caras, conmutables con el botón de la cabecera. **Mismos datos,
mismas reglas, mismas secciones**: no desaparece nada, solo cambia cómo se llama y cómo se
ve.

| | SISTEMA | SALES |
|---|---|---|
| Aspecto | Azul holográfico, resplandores, monoespaciada | Paleta de oficina, plano, tipografía del sistema |
| Avisos | Ventana modal con máquina de escribir y sonido | Barra discreta arriba que se va sola, sin sonido |
| Vocabulario | Jefe, puerta, castigo, oro, títulos, clase | Objetivo de la semana, oportunidad, plan de recuperación, créditos, reconocimientos, perfil |

**Cómo cambia de modo:**

- **A mano**: el botón de la cabecera (`MODO SALES` / `MODO SISTEMA`) alterna al instante.
- **Solo**: en ⚙ Configuración puedes activar un horario laboral (días y franja). Dentro de él la
  app se pone en SALES; fuera, vuelve a SISTEMA. El botón manda hasta el siguiente tramo:
  si fuerzas SISTEMA a media mañana, aguanta hasta que acabe tu jornada.

El diccionario de términos vive en `js/modo/catalogo.js`: cambiar una palabra es cambiar
una línea, sin tocar ninguna vista.

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

## Sonido

Los avisos se sintetizan al vuelo con la Web Audio API: no hay archivos de audio, así que
la app no engorda y no usa material de nadie. El timbre imita las campanas de las ventanas
del Sistema —fundamental más armónicos, ataque instantáneo y caída larga— y cada acción
tiene el suyo: aviso, subida de nivel, logro, oro, puerta, jefe derrotado, castigo,
guardar una edición, repartir un punto, cumplir un objetivo y un toque corto al mover un
contador. Todo en `js/sonido/sintetizador.js`, y se apaga desde AJUSTES.

Los navegadores no dejan sonar nada hasta que tocas la pantalla: el primer aviso de cada
sesión puede quedarse mudo.

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
js/castigo/                    Misión de castigo: asignación, aceptación y deuda
js/plantillas/                 Sets de misión diaria para distintas vidas
js/negocio/                    Indicadores, cuadro de mando y cuota
js/modo/                       Los dos modos: diccionario, horario e interruptor
js/configuracion/              El apartado del engranaje: objetivos y ajustes
js/sonido/                     Sintetizador de los avisos del Sistema
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
pruebas/sonido.mjs             Comprobación del sintetizador de sonido (opcional)
```

Para pasar la prueba automática, con el servidor local en marcha:

```bash
npm install playwright && node pruebas/e2e.mjs
```

Si Playwright se queja de que no encuentra el navegador (`Executable doesn't exist`),
es que la versión instalada espera una compilación de Chromium que no está en la
máquina. Instala la que corresponda al Chromium que ya tienes, o descárgalo:

```bash
npx playwright install chromium
```

Los números del juego están arriba de cada `reglas.js`: `js/ciclo-diario/` (`BONO_DIA`,
`PENALIZACION_XP`, `PENALIZACION_HP`), `js/jugador/` (`PUNTOS_POR_NIVEL`, `FATIGA_MISION`
y la curva `xpNecesaria`) y `js/recompensas/` (`MERMA_CASTIGO`, `ORO_POR_XP`). Los
catálogos de títulos, clases, objetos, puertas, jefes, castigos y plantillas viven en el
`catalogo.js` de su feature — ahí se ajusta la dureza del jefe (`VIDA_POR_XP_DIARIA`,
`GOLPE_PUERTA`), el contenido de los castigos y los sets de misiones, sin tocar la
interfaz.

> Proyecto personal y sin ánimo de lucro, inspirado en la estética de las novelas de
> progresión. No está asociado a ninguna obra ni a sus autores.

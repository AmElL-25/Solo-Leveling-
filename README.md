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
2. **Progreso.** Cada misión suma con los botones `−` / `+`, o escribiendo la cifra.
   Las misiones sencillas se marcan como hechas de un toque.
3. **Recompensa.** Al completar los objetivos del día se habilita `RECLAMAR RECOMPENSA`:
   la experiencia de cada misión **+50 % de bonificación** y **+1 punto de estadística**.
4. **Nivel y rango.** Cada nivel da 3 puntos para repartir entre Fuerza, Agilidad,
   Vitalidad, Inteligencia y Percepción. El rango sube solo: **E → D → C → B → A → S**.
5. **Penalización.** Si a medianoche la misión no está completa, se rompe la racha y
   pierdes el 10 % de la experiencia del nivel actual, con aviso de *Zona de Penalización*.
   Nunca bajas de nivel: el progreso conseguido no se pierde.

## Cómo usarla

**En el ordenador:** abre `index.html` con doble clic. Ya está.

**Con servidor local** (necesario para probar el modo sin conexión):

```bash
python3 -m http.server 8000
# abre http://localhost:8000
```

**En el móvil (recomendado, para el uso diario):** publícala en GitHub Pages y añádela a
la pantalla de inicio.

1. En GitHub: **Settings → Pages → Source: Deploy from a branch**, elige la rama y la
   carpeta `/ (root)`, y guarda.
2. Abre la URL que aparece (`https://<usuario>.github.io/<repo>/`) en el móvil.
3. Menú del navegador → **Añadir a la pantalla de inicio**. Se abrirá a pantalla completa,
   con su icono, y seguirá funcionando sin cobertura.

## Tus datos

El progreso vive en el `localStorage` del navegador: no sale de tu dispositivo, pero se
borra si limpias los datos del navegador o desinstalas la app. En **AJUSTES** tienes
`DESCARGAR COPIA` y `RESTAURAR COPIA` para llevarte el progreso a otro móvil o guardarlo
a salvo.

## Estructura

```
index.html              Estructura de la interfaz
css/estilos.css         Tema holográfico azul, móvil primero
js/estado.js            Modelo de datos, normalización y guardado en localStorage
js/sistema.js           Reglas del juego (XP, niveles, rangos, racha, penalización)
js/ui.js                Pintado del DOM y ventanas de notificación
js/app.js               Arranque, eventos y temporizadores
sw.js                   Service worker: caché para el modo sin conexión
manifest.webmanifest    Metadatos para instalarla como app
pruebas/e2e.mjs         Prueba automática del ciclo completo (opcional)
```

Para pasar la prueba automática, con el servidor local en marcha:

```bash
npm install playwright && node pruebas/e2e.mjs
```

Los números del juego están todos arriba de `js/sistema.js` (`PUNTOS_POR_NIVEL`,
`BONO_DIA`, `PENALIZACION_XP` y la curva `xpNecesaria`), por si quieres afinar la dificultad.

> Proyecto personal y sin ánimo de lucro, inspirado en la estética de las novelas de
> progresión. No está asociado a ninguna obra ni a sus autores.


- sobald du eine Datei (less, jade, ...) änderst, baut Docpad das automatisch und aktualisiert sogar deinen Browser von selbst!
- momentan gibts noch n Bug, wenn man neue Dateien hinzufügt
  - Lösung: docpad beenden (CTRL + C) auf dem Terminal und ggf. `build` Ordner löschen




## Anna
### Gesamten Arbeitsordner im Terminal öffnen
a) - GitHub öffnen
    - im Menu "Repository" > Open in terminal

b) Im Terminal einfach nur `make` eingeben und ENTER drücken
(um Docpad und Co zu starten (ggf. vorher Plugins automatisch installieren))

!Du merkst, dass es erfolgreich ist, daran, dass "docpad run" steht, und einige Zeilen Text erscheinen.

Um die Seite im Chrome zu öffnen: http://localhost:9778/ eingeben.
c) ctrl+c zum Beenden von Docpad, Pfeiltaste hoch, um letzten Befehl anzuzeigen (Docpad starten), mit Enter bestätigen


## Selector live im Browser prüfen
- ein Selektor kann sich auf 0 - endlich viele Elemente im HTML Dokument beziehen/auswirken.
mit Chrome developer kann man prüfen, auf welche alle Elemente sich ein bestimmter Selektor bezieht:
ESC drücken um Konsole eim/aus zublenden dann einen Selektor reinschreiben z.B:
`$(".horizontal-subnavi > li")`
dann enter drücken





## Verlinkung von Resoursen (z.B. fonts, images)

- da durch docpad "src/documents" und "src/files" in einen Ordner generiert werden, muss man das bei der Angabe von Pfaden beachten!!
Alles aus beiden Ordnern wird in "build" zusammengefasst!

## Chrome developer bar

- um nicht eingeblendete animierte elemente zu untersuchen gibts ein symbol oben rechts (rechteck gestrichelt mit pfeil), das blendet die elemente permanent ein
- um zu erfahren, in welcher CSS zeile/datei etwas später in der build bootstrap liegen wird, auf bootstrap.css: 3398 z.B klicken
- um zu erfahren, ob man en der richtigen Stelle ist, in die jeweilige less datei ein kommentar schreiben (so: /* HALLO */ , nicht so // HALLO, denn die 2. Variante verschwindet beim Generieren der Bootstrap). Dann in Chrome developer bar prüfen.


## Markdown
Diese Datei hat die Endung **md** was für Markdown steht. [Hier](http://de.wikipedia.org/wiki/Markdown) gehts zum Wikipedia Artikel.

Um diese Datei aus Sublime heraus als HTML anzuschauen, kannst du das von Anton installierte Markdown Plugin für Sublime benutzen:

- CMD + Shift + P (dies öffnet die **Command Palette**)
- Danach kannst du nach dem gewünschten Kommando suchen, in unserem Fall: `markdown`
- Danach siehst du eine Liste mit Kommandos für markdown. Wir brauchen den 3. in der Liste, also **Markdown Preview: Python Markdown: Preview in Browser**
- Du kannst ihn anklicken oder mit den Pfeiltasten (hoch/runter) anwählen und dann ENTER drücken
# Solar Planner — Project Vision

---
- *Last Revised: 2026-06-01*
- *Maintainer: Solo, AI-assisted*
---

Solar Planner ist eine Web-Anwendung, mit der private Hausbesitzer in
Deutschland eine Photovoltaik-Anlage spielerisch planen können — vom
ersten "Lohnt sich das bei mir?" bis zum exportierbaren Plan, den der
Installateur direkt verwenden kann.

## Vision

Der Markt zwischen *zu simpel* (drei Regler auf einer Solar-Vergleichs-
seite) und *zu komplex* (B2B-Solarteur-CAD) ist leer. Wir füllen ihn mit
einem Werkzeug, das Einsteiger in drei Minuten zum ersten realistischen
Ergebnis bringt und Interessierte beliebig tief planen lässt — ohne dass
sie zwischen zwei Tools wechseln müssen.

Solar Planner versteht sich als **Planungs-Begleiter, nicht als Berater**.
Wir liefern transparente Zahlen aus etablierten Datenquellen (PVGIS, DWD,
BDEW), zeigen Annahmen offen, und führen den Nutzer zu einem qualifizierten
Gespräch mit lokalen Installateuren.

## Warum gibt es dieses Tool

Die bestehende Landschaft hat eine klare Lücke:

- **Bestehende Rechner sind kompliziert** und verlangen Daten, die ein
  privater Hausbesitzer nicht parat hat — präzise Dachfläche, Azimut in
  Grad, Modul-Kennlinien, Verschattungs-Indizes.
- **Tools und Webseiten lösen jeweils nur einen Teil.** Die einen
  schätzen Ertrag, die anderen rechnen Wirtschaftlichkeit, die dritten
  listen Förderungen, die vierten zeigen Installateure. Niemand bündelt
  das in einem Werkzeug.
- **Kalkulations-Eingaben fehlen** in vielen Tools komplett — präziser
  Breitengrad, reale stündliche Sonneneinstrahlung übers Jahr,
  Jahreszeiten-Verschattung am eigenen Gebäude.

Solar Planner ist die **All-in-One-Antwort** auf diese drei Lücken.
Adresse eingeben, Haus sehen, planen, exportieren, fertig — ohne dass
der Nutzer Daten dreimal eintippt oder zwischen Tabs wechselt.

## Targeted End-User Values

- **Zweck:** Eine fundierte Antwort auf "Lohnt sich Solar auf meinem
  Dach?" bekommen, ohne sechs Beratungstermine.
- **Vorgehen:**
  1. Standort eingeben und Haus wiederfinden.
  2. Dachform aus Templates wählen oder OSM-Footprint anpassen.
  3. Dachflächen modular definieren — mit Hindernissen wie Fenstern
     und Schornsteinen.
  4. Sonne im Jahresverlauf am eigenen 3D-Haus sehen.
  5. Anlage und Speicher dimensionieren.
  6. Wirtschaftlichkeit prüfen — mit Graphen statt Zahlenkolonnen.
  7. Plan exportieren und an Installateure schicken.

## High-Level User Needs

- Sofort starten, keine Anmeldung erforderlich.
- Visuelles Feedback statt Zahlenkolonnen.
- Glaubwürdige Datenquellen offen ausweisen.
- Spielerische Tiefe ohne Überforderung.
- Ergebnis nehmen und an einen echten Menschen weitergeben können.

## Feature Priorities (MoSCoW)

### Must-have (MVP)

- Haus im interaktiven 3D-Viewer aus Adresse / Geo-Daten gerendert.
- Automatisierte Ermittlung installierbarer Modul-Anzahl.
- Modular veränderbares Haus (Drag & Drop von Fenstern, Dach-Templates).

### Should-have (MVP, einfacher gehalten)

- Stromverbrauchsrechner.
- Speichergröße-Rechner.
- Kostenrechner mit Amortisierung, präsentiert mit Graphen.
- Diverse Daten-Exports.

### Nice-to-have (Phase 2–3)

- Informationen zu aktuellen und kommenden Subventionen.
- Montagefirmen-Verzeichnis in der Nähe.
- Solarfirmen-Auswahl / Lead-Flow.

## Design Principles

- **Gamified planning, nicht Formular-Marathon.** Direkte Manipulation
  am 3D-Modell, Slider statt Eingabefelder, Snap-to-Grid, sofortiges
  visuelles Feedback.
- **All-in-One, nicht Toolchain.** Vom ersten Klick bis zum Export im
  selben Werkzeug.
- **Visual first, numbers second.** Zahl plus Graph, Effekt zuerst im
  3D-Modell sichtbar.
- **Template-first.** Niemand muss "Azimut" eingeben, bevor er ein
  Dach sieht.
- **No-login first.** Account ist optional und addiert Sync und
  Share-Link, ist aber niemals Voraussetzung für den ersten Wert.

## Technology Stack

Bewusst Web-First (kein Desktop, keine Mobile-App im MVP) wegen:

- Keine Installation, kein Admin-Recht beim Nutzer.
- Geringere Hardware-Anforderungen.
- Schneller iterieren mit modernen Web-Tools.
- Saubere APIs, von Beginn an KI-erweiterbar.
- Spätere SaaS-Monetarisierung über die Datenhaltung möglich.

Spezifische Entscheidungen siehe [architecture/adrs](./architecture/adrs).

## Development Approach

Wir sind in **AI-assisted rapid prototyping mode**.

- Entscheidungen schnell treffen, als ADR dokumentieren, später bewusst
  überprüfen.
- Modulare Architekturen mit klaren APIs, damit Komponenten ersetzbar
  bleiben.
- Kern minimal halten, Use-Case-spezifische Features vermeiden.
- Lokal-first, Free-Tiers für Online-Previews. Produktions-Kosten erst
  bei echten Nutzern.

## Boundaries

Was Solar Planner ausdrücklich **nicht** ist und auch nicht werden soll:

- Kein Ersatz für eine Energieberatung nach GEG.
- Keine statische Prüfung der Dachlast.
- Keine verbindliche Förderberatung.
- Kein Ersatz für ein Angebot durch einen Fachbetrieb.

Diese Grenzen sind im Disclaimer in jeder Auslegung sichtbar.

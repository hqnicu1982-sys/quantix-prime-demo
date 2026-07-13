Plan: diferențiere iconiță notificări follow-up vs. urgent

1. Problemă
În header (topbar) stau două butoane cu clopoțele una lângă alta:
- Urgent tasks: `Bell` (Lucide)
- Overdue follow-ups: `BellRing` (Lucide)
Sunt vizual prea asemănătoare și creează confuzie.

2. Soluție propusă
Schimbăm iconița butonului de follow-up în ceva care sugerează „comercial / follow-up / calendar”, nu alertă generică.

Opțiuni de iconiță (Lucide, deja importabilă):
- `CalendarClock` – sugerează reminder și dată (preferat)
- `Handshake` – relație client / follow-up comercial
- `Phone` – canal clasic de follow-up

Voi implementa cu `CalendarClock` ca default, plus:
- tooltip/aria-label clar: „Overdue follow-ups” (deja existent, dar confirmat)
- badge rămâne roșu/amber după severitate

3. Fișiere de modificat
- `src/components/HeaderFollowUpBell.tsx`
  - înlocuiește importul `BellRing` cu `CalendarClock`
  - înlocuiește `<BellRing ... />` cu `<CalendarClock ... />`
  - păstrează logica de badge, popover și click identică

4. Verificare
- Typecheck (`bunx tsc --noEmit` sau `tsgo`)
- Preview în header pentru a confirma că cele două butoane sunt acum distincte vizual

5. Nice-to-have (opțional, doar dacă dorești)
- Combină ambele notificări într-un singur centru cu tab-uri „Urgent” / „Follow-ups”, eliminând al doilea buton complet. Asta ar rezolva și problema spațiului și a confuziei.

Spune-mi dacă vrei să mergem pe `CalendarClock`, pe alt iconiță, sau pe centrul unic combinat.
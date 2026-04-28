## Goal

Fă matricea de permisiuni vizibilă și pe pagina de proiect (`/projects/$projectId/team`), nu doar pe directorul global `/team`. În același timp, extrage matricea într-o componentă comună ca să nu duplicăm definiția în două locuri.

## 1. Componentă reutilizabilă

**Creează `src/components/team/PermissionMatrix.tsx`:**
- Card cu header "Permission matrix" + subtitle configurabil
- Tabel `Role × capability` cu cele 5 tier-uri și 7 capabilități, identic cu cel din `team.tsx`
- Acceptă prop `highlightTiers?: string[]` — dacă e dat, evidențiază (background subtil + text bold) doar rândurile cu tier-uri prezente pe proiectul curent; restul rămân vizibile dar mute
- Rândurile evidențiate primesc și un mic counter ("2 members") la dreapta numelui rolului

## 2. Integrare pe pagina de proiect

**În `src/routes/projects.$projectId.team.tsx`:**
- Importă `PermissionMatrix`
- Calculează `tiersOnProject` din `crews` (unique tier-uri ale membrilor asignați + invites pending)
- Adaugă cardul matricei sub "Capability overview"
- Subtitle: "Cine ce poate face pe acest proiect — rândurile evidențiate sunt prezente în echipă"
- Pasează `highlightTiers={tiersOnProject}` și un map `tier → count` pentru contoare

## 3. Refactor `/team` global

**În `src/routes/team.tsx`:**
- Înlocuiește blocul inline al matricei (liniile 114–146) cu `<PermissionMatrix />` fără highlight (vede toate rândurile egal — e directorul global)
- Șterge tabelul duplicat

## Files

**Created:**
- `src/components/team/PermissionMatrix.tsx`

**Edited:**
- `src/routes/projects.$projectId.team.tsx` — adaugă matricea cu highlight
- `src/routes/team.tsx` — folosește componenta comună

## Result

Matricea apare acum și pe `/projects/fitzrovia/team`, cu rândurile pentru tier-urile efectiv prezente pe proiect evidențiate (Admin, Pro Control, Pro, Site User, Operative — în funcție de cine e asignat). O singură sursă de adevăr pentru permisiuni, fără duplicare.

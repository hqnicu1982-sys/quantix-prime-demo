Voi repara diagrama interactivă astfel încât la click pe orice nod să fie vizibile clar legăturile lui.

Pași:
1. Mut regulile de evidențiere după stilul SVG intern Mermaid sau le aplic direct inline, ca să nu mai fie suprascrise de CSS-ul generat.
2. La click pe nod:
   - nodul selectat devine galben;
   - toate legăturile conectate devin groase și colorate;
   - legăturile care pleacă din nod devin cyan;
   - legăturile care intră în nod devin portocaliu;
   - restul nodurilor și liniilor se estompează puternic.
3. Recolorez și săgețile/marker-ele asociate, nu doar linia, ca workflow-ul să fie ușor de urmărit.
4. Adaug o metodă de debug vizibilă în consolă cu numărul de noduri și legături detectate, pentru a confirma că pagina încărcată este versiunea corectă.
5. Verific HTML-ul final cu un test local pe DOM ca să confirm că la selectarea unui nod apar clasele și culorile așteptate pe muchii.
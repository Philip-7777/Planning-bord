# Intern planningsbord – Vercel klaar

Dit project is een simpele React/Vite webapp voor intern plannen.

## Wat zit erin
- maandweergave
- kaartjes slepen naar dagen
- 1 t/m 5 werkdagen
- zoeken en filteren op naam en kleur
- kaartjes aanmaken, bewerken en verwijderen
- adres, plaats en medewerker
- automatische opslag in de browser via localStorage

## Lokaal starten
1. Installeer Node.js
2. Open deze map in Visual Studio Code
3. Open Terminal
4. Voer uit:

```bash
npm install
npm run dev
```

## Op Vercel zetten
### Makkelijkste manier
1. Zet deze map in GitHub
2. Log in op Vercel
3. Kies `Add New > Project`
4. Selecteer de GitHub repository
5. Vercel herkent Vite automatisch
6. Klik op `Deploy`

Vercel maakt automatisch deployments aan wanneer je nieuwe commits pusht. Volgens de Vercel docs detecteert Vercel frameworks zoals Vite automatisch en kun je een Git-repository importeren voor automatische deployments.

## Belangrijk
De opslag is nu lokaal in de browser. Dat betekent:
- op dezelfde computer/browser blijven de kaartjes bewaard
- op andere computers nog niet

Voor delen met collega's moet later een database worden toegevoegd.

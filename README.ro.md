# Lansează o aplicație web real-time, gata de producție, cu 0$/lună și fără cont

Limbă: [English](README.md) | Română

<details>
<summary>Rezumat tehnic</summary>

Acest template este o aplicație web Vite+ gata de producție. Frontend-ul
folosește React, TypeScript, TanStack Router, Tailwind CSS, Radix UI și
componente în stil shadcn/ui. Vite+ oferă suprafața de comenzi prin `vp`:
instalarea dependințelor, Vite dev/build, verificările TypeScript, formatarea,
linting-ul, testele și orchestrarea task-urilor stau într-un singur toolchain, nu în
mai multe CLI-uri separate.

Backend-ul este Convex. Dezvoltarea locală pornește Convex și Vite împreună cu
`vp run dev`, care apelează `convex dev --start "vp run dev:frontend"`.
Deploy-urile Cloudflare rulează Convex înainte și apoi construiesc frontend-ul
static cu `vp run build`, astfel încât funcțiile Convex și binding-urile client
generate rămân aliniate cu aplicația publicată.

Cloudflare Pages servește output-ul static din `dist`. Branch-ul `main`
folosește deploy key-ul Convex de Production, iar branch-urile de preview
folosesc un `CONVEX_DEPLOY_KEY` separat pentru Preview, astfel încât fiecare pull
request poate primi propriul URL Cloudflare și propria bază de date Convex de
preview.

Codex Cloud poate lucra pe acest repository instalând Vite+ în environment setup
script. Agenții locali sau git worktrees pot folosi `vp run anon`, care pornește
aceeași aplicație în modul Convex anonim fără să depindă de sintaxă shell-only
pentru variabile de mediu.

Pentru cel mai rapid startup în Codex Cloud, adaugă acest script de configurare a mediului:

```bash
curl -fsSL https://vite.plus | bash
```

</details>

## 1: Creează conturi GitHub, Convex, Cloudflare și OpenAI

Începe cu **un cont Google sau Apple** pe **telefon sau desktop**

- [ ] **1: Creează GitHub folosind Google/Apple :** https://github.com/<br>
      <img src="./docs/logos/github.svg" alt="GitHub" height="32"><br>
      GitHub by Microsoft este locul unde inginerii își păstrează codul.
- [ ] **2: Creează Convex folosind GitHub :** https://www.convex.dev/<br>
      <img src="./docs/logos/convex.svg" alt="Convex" height="32"><br>
      Convex este cea mai bună bază de date pe care am folosit-o personal. Simplitatea stack-ului meu arată cât de bun este. Are și propriul server Node.
- [ ] **3: Creează Cloudflare folosind GitHub :** https://www.cloudflare.com/<br>
      <img src="./docs/logos/cloudflare.jpg" alt="Cloudflare" height="32"><br>
      Codul frontend este publicat ca fișiere statice.
      Asigură siguranța aplicației și a utilizatorilor tăi
- [ ] **4: Creează OpenAI folosind Google/Apple :** https://openai.com/<br>
      <img src="./docs/logos/openai.svg" alt="OpenAI" height="32"><br>
      Ne vom baza pe Codex Cloud pentru a face modificări în cod.
      Dar eu de obicei folosesc Codex local (există instrucțiuni mai jos pentru asta)

Este în regulă dacă te-ai înregistrat altfel, atâta timp cât ai aceste 4 conturi poți publica o aplicație.

<details>
      <summary>Pasul 1: Înregistrare video Android</summary>

https://github.com/user-attachments/assets/5a50a24f-d50d-4f6f-9c89-0a64995adc90

</details>

## 2: Copiază codul aplicației în contul tău GitHub

Vizitează https://github.com/notermd/app

- [ ] apasă butonul verde mare "Use this template"
- [ ] fă-l privat sau lasă-l public

<details>
<summary>Înregistrare pe telefon pentru folosirea template-ului</summary>

https://github.com/user-attachments/assets/2bf41c78-c6b8-4850-a6ab-1a3dbfbbbf05

</details>

<details>
<summary>"Fork" dacă vrei să păstrezi istoricul git</summary>

Vezi istoricul git complet aici: https://github.com/notermd/app/commits/main/

Este făcut manual ca să fie cât mai mic, clar și simplu posibil.

"Use this template" este mai frumos pentru că butonul este verde, dar comprimă tot istoricul într-un singur commit, deci devine puțin mai greu pentru AI să îl înțeleagă.

</details>

## 3: Conectează Cloudflare Pages la GitHub

Cloudflare Pages va publica automat aplicația ta ori de câte ori codul se schimbă pe GitHub.

Trebuie să faci asta o singură dată, iar după aceea vei putea crea câte aplicații vrei.

Dar este puțin complicat deoarece partea de Cloudflare are uneori probleme.

- [ ] Accesează _Cloudflare Pages_ din sidebar: "Compute > Workers & Pages"
- [ ] Apasă "Create Application"
- [ ] Apasă "Connect to GitHub" pentru `Install & Authorize Cloudflare Workers & Pages`

Nu este clar care este problema, dar foarte des Cloudflare nu observă că această conexiune există deja.

Încearcă să deschizi Cloudflare Pages de pe desktop în loc de mobil, de obicei ajută.

https://github.com/user-attachments/assets/d18ddb8e-7a5b-49bc-9b80-b8d00d6dd671

<details>
<summary>Probleme la conectarea Cloudflare Pages la GitHub</summary>

Cloudflare Workers & Pages are uneori probleme după instalare, poți aștepta puțin.
Poți merge și în GitHub "Settings > Applications > Authorized GitHub Apps" ca să elimini sau să revoci aplicațiile instalate, apoi să încerci din nou din Cloudflare.

Poți verifica toate aplicațiile GitHub instalate aici: https://github.com/settings/installations

</details>

## 4: Creează un proiect Convex și un CONVEX_DEPLOY_KEY

- [ ] Vizitează https://dashboard.convex.dev/
- [ ] Apasă "+ Create Project" și dă-i orice nume
- [ ] Apasă pill-ul de sus ca să vezi deployment-ul Production (poate trebuie să apeși de două ori)
- [ ] Apasă "+ Create Deploy Key", vei avea nevoie de el ca să conectezi Cloudflare, deci nu apăsa încă "Done"

Dacă apeși "Done", nu vei mai putea vedea deploy key-ul din nou, dar este în regulă, îl poți șterge și poți crea un deploy key nou.

<details>
<summary>Ce sunt valorile CONVEX_DEPLOY_KEY?</summary>

Sunt un fel de parolă folosită între servere.
În cazul nostru este folosită de Cloudflare ca să actualizeze baza de date la fiecare modificare.

</details>

<details>
<summary>Pasul 4: Video Android</summary>

https://github.com/user-attachments/assets/d37ceeed-32c6-47e5-8d66-1cfef2ac60c0

</details>

## 5: Creează un deploy Cloudflare Pages

- [ ] Accesează _Cloudflare Pages_ din sidebar: "Compute > Workers & Pages"
- [ ] Apasă "Create Application"
- [ ] **Asigură-te că apeși "Get Started" în partea de jos** ca să creezi "Pages" și nu "Workers"!
- [ ] Setează `Build Command` la `pnpm build:cloudflare`
- [ ] Setează `Build output directory` la `dist`
- [ ] Adaugă variabila de mediu `CONVEX_DEPLOY_KEY` și folosește deploy key-ul Production de la pasul anterior

<details>
<summary>Pasul 5: Video Android</summary>

https://github.com/user-attachments/assets/c57eb076-45c8-49f4-b232-eda605b3eace

</details>

---

🚀🚀 Felicitări, ai publicat prima ta aplicație 🚀🚀

Orice modificare pe care o faci în branch-ul `main` din repo-ul tău GitHub va fi publicată automat.

## 6: Schimbă aplicația cu Codex Cloud

Codex Cloud folosește aceeași conectare prin GitHub App ca Cloudflare. Este mai
clar decât să începi cu chei SSH, deoarece GitHub îți arată exact ce
repository-uri poate accesa aplicația și o poți revoca mai târziu din setările
GitHub.

- [ ] Deschide [Codex Cloud](https://chatgpt.com/codex)
- [ ] Conectează repository-ul GitHub copiat de tine
- [ ] Adaugă acest environment setup script ca să primească Vite+ înainte să ruleze comenzi în repo:

```bash
curl -fsSL https://vite.plus | bash
```

- [ ] Cere-i lui Codex o funcționalitate foarte mică, de exemplu:

```text
Add one small visible improvement to the home page. Keep it minimal, run the project checks, and open a pull request.
```

La început, preview-ul Cloudflare poate eșua deoarece branch-urile de preview nu
ar trebui să refolosească baza de date Convex de production. Repari asta o
singură dată:

- [ ] În Convex, creează un al doilea deploy key pentru Preview
- [ ] În Cloudflare Pages, adaugă `CONVEX_DEPLOY_KEY` pentru mediul Preview
- [ ] Repornește deploy-ul Cloudflare care a eșuat pentru pull request

După ce preview-ul PR-ului funcționează, fă merge. Apoi cere-i lui Codex să
șteargă din nou funcționalitatea mică și să deschidă alt PR. Asta dovedește
tot circuitul: creezi o schimbare, o previzualizezi, o publici și o elimini
curat.

## 7: Șterge aplicația pas cu pas

Totul în acest setup este de unică folosință. Ca să elimini complet o aplicație:

- [ ] Șterge proiectul Cloudflare Pages
- [ ] Șterge proiectul Convex
- [ ] Șterge sau arhivează repository-ul GitHub
- [ ] Revocă accesul GitHub App pentru Cloudflare sau Codex dacă nu mai vrei
      acele servicii conectate la contul tău GitHub

## 8: Fă asta mai repede cu noter.md

Fluxul manual de mai sus este util deoarece înveți ce se întâmplă. Scopul
`noter.md` este să conectezi GitHub, Cloudflare și Convex o singură dată, apoi
să creezi sau să ștergi o aplicație dintr-o singură acțiune.

Asta face aplicațiile de unică folosință: creezi un joc de weekend, îl trimiți
prietenilor, îl ștergi mai târziu sau îl păstrezi și îl transformi într-un
produs real. Lucrul din `~/dev/my/noter` merge spre a face deploy-ul,
preview-ul, agenții locali și cleanup-ul să pară un singur produs, nu mai multe
dashboard-uri.

## 9: Folosește aplicația local de pe mașina ta

Setup-ul local este cel mai bun când vrei ca un agent precum Codex, Conductor,
T3Code sau alt tool de coding să lucreze direct pe mașina ta. Începe prin a
întreba Codex:

```text
What is https://github.com/notermd/app? Is it safe for me to run locally? Explain what it needs, then help me install Vite+ and start it.
```

Notele detaliate pentru macOS, Windows, iPhone/iPad, Linux, GitHub CLI, Vite+ și
`vp run anon` sunt în [docs/local-setup.md](docs/local-setup.md).

## Note interesante

Numele organizației `notermd` a fost ales fără "-" deoarece tastatura Android
implicită face enervantă tastarea unei cratime.

Deoarece acest stack folosește deja Cloudflare, Cloudflare Tunnels poate
înlocui ngrok atunci când vrei să partajezi un server care rulează pe mașina
personală. Aplicația poate fi extinsă ca să expună un singur port deoarece Vite
poate proxya Convex, deci nu trebuie să expui separat portul de frontend și
portul de backend.

Istoricul git din acest template este intenționat mic și curat. "Use this
template" îți oferă cel mai simplu început, iar "Fork" păstrează istoricul
complet dacă vrei ca tool-urile AI să inspecteze evoluția aplicației.

## De ce este noter.md gratuit?

Am deja această funcționalitate și mult mai mult pentru propriile mele
aplicații, deci nu mă costă mult să împărtășesc versiunea de bază. Lucrurile mai
avansate, precum editarea fișierelor din mers, monitorizarea mai multor aplicații
sau lucrul pe mai multe branch-uri ale aceleiași aplicații, încep să coste mai
mult la operare, deci nu sunt lansate încă.

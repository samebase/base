# Lansează o aplicație web real-time, gata de producție, cu 0$/lună și fără cont

Limbă: [English](README.md) | Română

<details>
<summary>
## Pe scurt
</summary>

Aplicația web este publicată pe Cloudflare Pages și folosește Convex ca bază de date.
Stack: Vite+, Tanstack Router, Tailwind, ShadCN (BaseUI)

Pentru cel mai rapid startup în Codex Cloud, adaugă acest script de configurare a mediului:

```bash
curl -fsSL https://vite.plus | bash
```

Numele organizației "notermd" a fost ales fără "-" deoarece tastatura Android implicită face dificilă tastarea unui "-".

Avem nevoie doar de 1 `CONVEX_DEPLOY_KEY` pentru **Production** și unul pentru **Preview**,
în felul acesta fiecare PR are propriul link și propria bază de date, diferite de bazele de date Production/Dev.

Apoi folosim OpenAI Codex Cloud pentru a face modificări;
dar poți folosi orice vrei, există instrucțiuni pentru rulare locală și în git worktrees deoarece Codex suportă asta de la început.
Deoarece ai deja Cloudflare, poți folosi Cloudflare Tunnels în loc de grok ca să poți partaja chiar și un server care rulează pe mașina personală. Asta înseamnă că se poate extinde ușor ca să suporte un server extern care poate fi accesat prin expunerea unui singur port (putem expune Convex prin Vite, deci nu avem nevoie de 2 porturi).

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
<summary>### Ce sunt CONVEX_DEPLOY_KEY?</summary>

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

## 6: Conectează Codex la GitHub

OpenAI Codex folosește aceeași metodă de conectare ca Cloudflare, deci poți întâlni unele probleme, dar trebuie să faci asta o singură dată.

## 7: Obține un deployment separat pentru fiecare modificare

Vedeai erori în Pull Requests deoarece Cloudflare publică un preview și acesta nu se poate conecta la baza ta de date de production.
Ca să rezolvi asta, poți crea un "Preview Deploy Key" din Convex și să îl setezi în Cloudflare, în felul acesta fiecare Pull Request va avea propria bază de date.

- [ ]

## 8: Ștergerea aplicației

Ca să ștergi o aplicație publicată va trebui să

- [ ] Ștergi aplicația Cloudflare Pages
- [ ] Ștergi proiectul Convex
- [ ] Ștergi repository-ul GitHub

## 9: Creează o aplicație dintr-un singur pas folosind noter.md

noter.md se conectează o singură dată cu GitHub, Cloudflare și Convex,
apoi îți permite să creezi o aplicație cu o singură apăsare de buton.
Îți permite și să o ștergi complet la fel de ușor.

Astfel aplicațiile devin de unică folosință, poți crea o aplicație și apoi crea un joc pe care să îl folosești într-o ieșire de seară cu prietenii

- SAU -

poți decide să continui să o menții și să îți bazezi afacerea pe ea deoarece este

### De ce este noter.md gratuit?

Am deja această funcționalitate și mult mai mult pentru propriile mele aplicații, nu mă costă mult să o împărtășesc cu toată lumea.
Dacă vrei mai multe lucruri, cum ar fi editarea fișierelor din mers, monitorizarea mai multor aplicații sau a mai multor branch-uri ale aceleiași aplicații, atunci
începe să mă coste mai mult, deci asta nu este lansat încă.

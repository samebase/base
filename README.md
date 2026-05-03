# Deploy a production-ready, real-time web-app for 0$/month & no account

<details>
<summary>TLDR</summary>

The web app is deployed on Cloudflare Pages and uses Convex as its database.
Stack: Vite+, TanStack Router, Tailwind, ShadCN (BaseUI)

For the fastest Codex Cloud startup, add this environment setup script:

```bash
curl -fsSL https://vite.plus | bash
```

"notermd" organization name was chosen without "-" because the default Android keyboard makes it hard to type a "-".

We need one `CONVEX_DEPLOY_KEY` for **Production** and one for **Preview**.
That way each PR has its own link and database, separate from the Production and Dev databases.

Then we use OpenAI Codex Cloud to make some changes.
But you can use anything you want; there are also instructions for running it locally and in git worktrees since Codex supports that from the start.
Since you already have Cloudflare you can use Cloudflare Tunnels instead of ngrok so you can share even a server running on a personal machine. This implies that it's easily extendable to support an external server that can be accessed by exposing a single port (we can expose Convex through Vite so no need for 2 ports).

</details>

## 1: Create GitHub, Convex, Cloudflare & OpenAI accounts

Start with **a Google or an Apple** account on a **phone or desktop**

- [ ] **1: Create GitHub using Google/Apple :** https://github.com/<br>
      <img src="./docs/logos/github.svg" alt="GitHub" height="32"><br>
      GitHub by Microsoft is the place where engineers store their code.
- [ ] **2: Create Convex using GitHub :** https://www.convex.dev/<br>
      <img src="./docs/logos/convex.svg" alt="Convex" height="32"><br>
      Convex is the best database I have personally used. The simplicity of my stack proves how good it is. It also has its own Node server.
- [ ] **3: Create Cloudflare using GitHub :** https://www.cloudflare.com/<br>
      <img src="./docs/logos/cloudflare.jpg" alt="Cloudflare" height="32"><br>
      Your frontend code is deployed as static files.
      Ensures the safety of your app and users
- [ ] **4: Create an OpenAI account using Google/Apple :** https://openai.com/<br>
      <img src="./docs/logos/openai.svg" alt="OpenAI" height="32"><br>
      We'll rely on Codex Cloud to make changes to the code.
      But i usually use Codex locally (there are later instructions for that)

It's fine if you signed up differently, as long as you have these 4 accounts you can deploy an app.

<details>
      <summary>Step 1: Android Video recording</summary>

https://github.com/user-attachments/assets/5a50a24f-d50d-4f6f-9c89-0a64995adc90

</details>

## 2: Copy the app code to your GitHub account

Visit https://github.com/notermd/app

- [ ] click big green "Use this template"
- [ ] make it private or leave it public

<details>
<summary>Phone recording of using the template</summary>

https://github.com/user-attachments/assets/2bf41c78-c6b8-4850-a6ab-1a3dbfbbbf05

</details>

<details>
<summary>"Fork" if you want to preserve the git history</summary>

Check the full Git History here: https://github.com/notermd/app/commits/main/

It is manually made so it's as small, clear and simple as possible.

"Use this template" is nicer because the button is green but it squashes the whole history inside a single commit, so it makes it a bit harder for AI to understand it.

</details>

## 3: Connect Cloudflare Pages to GitHub

Cloudflare Pages will automatically deploy your app whenever the code changes on GitHub.

You need to do this only once and afterwards you'll be able to create as many apps as you want.

But it's a bit tricky since the Cloudflare side sometimes has issues.

- [ ] Access _Cloudflare Pages_ from the sidebar "Compute > Workers & Pages"
- [ ] Click "Create Application"
- [ ] Click "Connect to GitHub" to `Install & Authorize Cloudflare Workers & Pages`

It's not clear what the issue is, but very often, Cloudflare doesn't notice that the connection already exists.

Try opening Cloudflare Pages from a Desktop instead of Mobile, this usually helps.

https://github.com/user-attachments/assets/d18ddb8e-7a5b-49bc-9b80-b8d00d6dd671

<details>
<summary>Connecting Cloudflare Pages to GitHub issues</summary>

Cloudflare Workers & Pages sometimes has issues after installing, you can wait a bit.
You can also go to github "Settings > Applications > Authorized GitHub Apps" to remove or revoke the installed apps, and try doing it again from Cloudflare.

You can check all your installed GitHub apps here: https://github.com/settings/installations

</details>

## 4: Create a Convex project and a CONVEX_DEPLOY_KEY

- [ ] Visit https://dashboard.convex.dev/
- [ ] Click "+ Create Project" and give whatever name
- [ ] Click the pill on the top to view your Production deployment (you may need to click twice)
- [ ] Click "+ Create Deploy Key", you'll need it to connect to Cloudflare, so don't press "Done" yet

If you press "Done" you won't be able to see the deploy key again, but it's fine, you can delete it and create a new deploy key.

<details>
<summary>What are CONVEX_DEPLOY_KEY values?</summary>

They are a sort of password used between servers.
In our case it is used by Cloudflare to update the database on each change.

</details>

<details>
<summary>Step 4: Video Android</summary>
      
https://github.com/user-attachments/assets/d37ceeed-32c6-47e5-8d66-1cfef2ac60c0

</details>

## 5: Create a Cloudflare Pages Deploy

- [ ] Access _Cloudflare Pages_ from the sidebar "Compute > Workers & Pages"
- [ ] Click "Create Application"
- [ ] **Make sure you click "Get Started" at the bottom** so you create "Pages" and not "Workers"!
- [ ] Set `Build Command` to `pnpm build:cloudflare`
- [ ] Set `Build output directory` to `dist`
- [ ] Add Environment Variable `CONVEX_DEPLOY_KEY` and use the Production deploy key from the previous step

<details>
<summary>Step 5: Video Android</summary>
      
https://github.com/user-attachments/assets/c57eb076-45c8-49f4-b232-eda605b3eace

</details>

---

🚀🚀 Congrats, you shipped your first app 🚀🚀

Any change that you make to the `main` branch in your github repo, will be deployed automatically.

## 6: Change the app with Codex Cloud

Codex Cloud uses the same GitHub App connection style as Cloudflare. That is
nicer than starting with SSH keys because GitHub can show you exactly which
repositories the app can access, and you can revoke it later from GitHub
settings.

- [ ] Open [Codex Cloud](https://chatgpt.com/codex)
- [ ] Connect your copied GitHub repository
- [ ] Add this environment setup script so Codex gets Vite+ before it runs repo commands:

```bash
curl -fsSL https://vite.plus | bash
```

- [ ] Ask Codex for a tiny feature, for example:

```text
Add one small visible improvement to the home page. Keep it minimal, run the project checks, and open a pull request.
```

At first, the Cloudflare preview may fail because preview branches should not
reuse the production Convex database. Fix that once:

- [ ] In Convex, create a second deploy key for Preview
- [ ] In Cloudflare Pages, add `CONVEX_DEPLOY_KEY` for the Preview environment
- [ ] Re-run the failed Cloudflare deploy for the pull request

After the PR preview works, merge it. Then ask Codex to remove the tiny feature
again and open another PR. That proves the full loop: create a change, preview
it, merge it, and remove it cleanly.

## 7: Delete the app step by step

Everything in this setup is disposable. To remove an app completely:

- [ ] Delete the Cloudflare Pages project
- [ ] Delete the Convex project
- [ ] Delete or archive the GitHub repository
- [ ] Revoke GitHub App access for Cloudflare or Codex if you no longer want
      those services connected to your GitHub account

## 8: Do it faster with noter.md

The manual flow above is useful because you learn what is happening. The
`noter.md` goal is to connect GitHub, Cloudflare, and Convex once, then create
or remove an app with a single action.

That makes apps disposable: create a weekend game, share it with friends, delete
it later, or keep it and turn it into a real product. Work in `~/dev/my/noter`
is moving toward making these deploy, preview, local-agent, and cleanup flows
feel like one product instead of several dashboards.

## 9: Use the app locally from your machine

Local setup is best when you want Codex, Conductor, T3Code, or another coding
agent to work directly on your own machine. Start by asking Codex:

```text
What is https://github.com/notermd/app? Is it safe for me to run locally? Explain what it needs, then help me install Vite+ and start it.
```

Detailed macOS, Windows, iPhone/iPad, Linux, GitHub CLI, Vite+, and
`vp run anon` notes live in [docs/local-setup.md](docs/local-setup.md).

## Why is noter.md free?

I already have this functionality and much more for my own apps, so it doesn't
cost me much to share the basic version. More advanced things, like editing
files on the go, monitoring multiple apps, or working across multiple branches
of the same app, start costing more to operate, so those are not released yet.

# Production-grade full-stack web app for 0$/month

1. Make sure you have a Github, Cloudflare and Convex accounts
2. Goto https://github.com/noter-md/convex-cloudflare-pages-stack and click the green "Use this template" in top right
3. Github will store your sorce code, give your repo a name
4. Goto https://dashboard.convex.dev/ and click "+ Create Project" button
5. You can use the same name as you did in GitHub
<!-- Get prod CONVEX_DEPLOY_KEY -->
6. Click the "Development (Cloud)" button at the top and switch to "Production"
7. Click the setting (gear) button on the left sidebar
8. Click the blue "+ Create Deploy Key" and give it a name like "for_cloudflare_pages"
9. Do NOT press "Done" yet, just copy this code, you'll need it later

10. Login to https://dash.cloudflare.com/
11. Click the "Compute" dropdown on the left sidebar and click "Workers & Pages"
12. Click "Create Application"
13. Click the small _Looking to deploy Pages? [Get started]_ link at the bottom
14. Inside "Import an existing Git repository" click "Get Started"
15. Select the repo you created in GitHub and click "Begin setup"
16. Set "Build command" to **`pnpm build:cloudflare`**
17. Set "Build command directory" to **`dist`**
18. **IMPORTANT** Click "Environment variables (advanced)" dropdown
19. Add variable "CONVEX_DEPLOY_KEY" and set the value you copied from step 9
20. Add variable "VITE_CONVEX_URL" and set it to the "Cloud URL" from Convex
21. Click "Save & Deploy" and wait for the build to finish
22. At the end click the link at the top and you have your app, you can share this link with your family and friends

## Make your first change using Codex in your browser

1. Goto https://dashboard.convex.dev/ and select your project
2. Click on the Gear button on the sidebar and then "Project Settings"
3. Scroll down to "Preview Deploy Keys" and click "+ Create Deploy Key"

4. Goto https://dash.cloudflare.com/ then "Compute > Workers & Pages"
5. Select your project and click on "Settings"
6. Near the top, switch "Choose Environment" to "Preview"
7. Scroll to "Variables and Secrets" and click "Edit"
8. The current variables was automatically set to the production value, you need to set it to the preview value

9. Goto https://chatgpt.com/codex/ and login
10. Click to select repository and select the one you create in GitHub
11. Write something like "Make all colors more vibrant and allow reordering todos."
12. You'll have to wait a bit since it has to startup a full computer in the cloud
13. When it finishes, click "Create PR" then click to view it
14. You'll see a comment from "cloudflare-workers-and-pages" which after a bit of time will contain a preview of what your app will look like after you merge this pr.
15. If it looks good, click "Merge pull request" and the changes will be applied to your production deploy

<!-- TODO: make this more clear and actually test it using the vp setup on windows -->

## On your own computer

1. Install Codex on your computer (Windows/macOS/Linux) and login
2. Install the Github app on your computer // Check if
3. In any chat write

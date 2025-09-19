# Zidwell Next.js Project
## Description

**Zidwell** is a modern web application built with Next.js, designed to provide a seamless platform for managing podcasts, digital signatures, and user authentication. The app integrates with third-party services such as Paybeta and Supabase to offer secure wallet management, password resets, and real-time data handling. Users can sign up, manage their profiles, reset wallet PINs, and access a dashboard for podcasts and platform services—all within a responsive and user-friendly interface.


## Project Structure
```
.
├── .env
├── .gitignore
├── components.json
├── logo.txt
├── netlify.toml
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
├── .next/
├── app/
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   │   ├── reset-password/
│   │   │   └── route.ts
│   │   ├── reset-password-code/
│   │   │   └── route.ts
│   │   └── ...other API routes
│   ├── auth/
│   │   └── signup/
│   │       └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...other UI components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Form.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── dashboard/
│   │   └── index.tsx
│   ├── hook/
│   │   └── useLegacy.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts
│   │   └── usePodcast.ts
│   ├── platform-services/
│   │   ├── paybeta.ts
│   │   └── supabase.ts
│   ├── podcasts/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   ├── create/
│   │   │   └── page.tsx
│   │   └── edit/
│   │       └── [id]/
│   │           └── page.tsx

│   ├── sign/
│   │   └── sign-document/
│   │       └── page.tsx
│   ├── signee-page/
│   │   └── signee-dashboard/
│   │       └── page.tsx
│   └── supabase/
│       ├── client.ts
│       └── auth.ts
├── lib/
│   ├── middleware.ts
│   ├── utils.ts
│   └── constants.ts
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   └── ...other images
│   └── robots.txt
```

## Key Configuration

- **TypeScript:** Strict mode enabled, paths aliasing (see `tsconfig.json`).
- **UI Library:** [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS.
- **API Routes:** Located in `app/api/`, using Next.js Route Handlers.
- **Environment Variables:** Managed in `.env` (e.g., `PAYBETA_API_KEY`).
- **Deployment:** Configured for Netlify via `netlify.toml`.

## Scripts

Run the development server:

```sh
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```



## Project Structure Explained

### Root Files

- **.env**  
  Stores environment variables (API keys, secrets, etc.) used throughout the app.

- **.gitignore**  
  Specifies files and folders Git should ignore (e.g., `node_modules`, build output).

- **components.json**  
  Configuration for UI components and path aliases (used by shadcn/ui).

- **logo.txt**  
  ASCII or text logo for the project (optional, for branding or fun).

- **netlify.toml**  
  Configuration for deploying the app on Netlify (build settings, redirects, etc.).

- **next-env.d.ts**  
  TypeScript definitions required by Next.js.

- **next.config.ts**  
  Next.js configuration file (custom settings, plugins, etc.).

- **package.json**  
  Lists dependencies, scripts, and project metadata.

- **postcss.config.mjs**  
  Configuration for PostCSS (used with Tailwind CSS).

- **README.md**  
  Project documentation (what you’re reading now).

- **tsconfig.json**  
  TypeScript configuration (compiler options, path aliases).

- **middleware.ts**  
  Custom middleware for request handling, authentication, or logging.


---

### Folders

#### app/

Main source folder for your Next.js application.

- **favicon.ico**  
  App icon shown in browser tabs.

- **globals.css**  
  Global CSS styles for the entire app.

- **layout.tsx**  
  Root layout component (wraps all pages, sets up providers, etc.).

- **page.tsx**  
  Main landing page of the application.

- **api/**  
  Contains API route handlers (serverless functions).  
  - **reset-password/route.ts**: Handles wallet PIN reset requests.  
  - **reset-password-code/route.ts**: Handles reset code verification.  
  - *(other API routes as needed)*

- **auth/**  
  Authentication-related pages.  
  - **signup/page.tsx**: Signup form and logic.

- **components/**  
  Reusable React components (buttons, forms, modals, etc.).

- **context/**  
  React context providers for global state management (e.g., authentication, theme).

- **dashboard/**  
  Dashboard pages for logged-in users (analytics, user info, etc.).

- **hook/**  
  (Legacy) Custom React hooks. Consider merging with `hooks/`.

- **hooks/**  
  Custom React hooks for shared logic (API calls, state, etc.).

- **platform-services/**  
  Integrations with external or internal platform services.

- **podcasts/**  
  Pages and components related to podcast management.

- **sign/**  
  Pages for digital signature features.

- **signee-page/**  
  Pages for users who are signees (e.g., signing documents).

- **supabase/**  
  Integration with Supabase (database, authentication, etc.).

---


---

#### public/

- Static assets (images, fonts, etc.) served directly by Next.js.

---

### Aliases

- `@/components` → `app/components`
- `@/lib` → `lib`
- `@/hooks` → `app/hooks`
- `@/app/components/ui` → UI components


Defined in [`components.json`](components.json) and `tsconfig.json`:

---

## How to Use

- **Add new pages:** Create a new folder or file in `app/`.
- **Add new API routes:** Create a new folder in `app/api/` with a `route.ts` file.
- **Add shared logic:** Place reusable hooks in `app/hooks/`.
- **Add UI components:** Place them in `app/components/`.


#### app/components/

- **ui/**  
  Contains UI primitives and components (buttons, inputs, modals) often imported from or styled with shadcn/ui.
- **Navbar.tsx, Footer.tsx, Sidebar.tsx**  
  Common layout/navigation components used across pages.
- **Form.tsx**  
  Reusable form component for handling user input.

#### app/context/

- **UserData.tsx**  
  Provides authentication fucnction to be reuse and states.


#### app/platform-services/


#### app/podcasts/

- **[id]/page.tsx**  
  Dynamic route for viewing a specific podcast.
- **create/page.tsx**  
  Page for creating a new podcast.
- **edit/[id]/page.tsx**  
  Page for editing an existing podcast.

#### app/sign/ and app/signee-page/

- **sign-document/page.tsx**  
  Page for signing documents.
- **signee-dashboard/page.tsx**  
  Dashboard for signees to view and manage documents.

#### app/supabase/

- **supabase.ts**  
  Functions for interacting with Supabase (database, auth).


#### lib/

- **utils.ts**  
  Utility functions used across the app (formatting, validation, etc.).
- **constants.ts**  
  Shared constants (API endpoints, config values).

#### public/

- **images/**  
  Stores static images (logos, banners, avatars).
- **robots.txt**  
  SEO file for search engine crawling rules.

---

### Development & Contribution

- **Install dependencies:**  
  ```sh
  npm install
  ```
- **Run the development server:**  
  ```sh
  npm run dev
  ```
- **Build for production:**  
  ```sh
  npm run build
  ```
- **Run tests:**  
  ```sh
  npm test
  ```

---

### Best Practices

- **Component Reusability:**  
  Place shared UI elements in `app/components/` for easy reuse.
- **Separation of Concerns:**  
  Keep API logic in `app/api/`, UI in `app/components/`, and business logic in hooks or services.
- **Environment Variables:**  
  Store sensitive keys in `.env` and never commit them to version control.
- **Type Safety:**  
  Use TypeScript interfaces and types for props, API responses, and context values.

---

### Getting Help

- **Code comments:**  
  Most files include comments explaining their purpose and usage.
- **Ask teammates:**  
  If something is unclear, reach out to the team or check the documentation in this README.

---

This documentation should help any developer quickly understand the structure and purpose of each part of the codebase.
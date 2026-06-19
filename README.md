# Recipe Book

A modern, minimalist recipe manager and meal planner built for families and couples. Originally designed to replace a Notion-based recipe store, this app focuses on a clean cooking experience, smart scaling, and effortless recipe importing using AI.

---

## ✨ Key Features

### 🚀 Existing Functionalities
- **AI-Powered Recipe Import**: Paste free-text recipes from blogs, OCR results, or notes. The app uses LLMs to structure them into title, ingredients, and steps automatically.
- **Dynamic Portion Scaling**: Instantly scale ingredient amounts based on your desired serving size. The UI handles the math and rounds amounts for better readability.
- **Cook Mode**: Interactive "check-off" lists for both ingredients and direction steps to help you keep track while cooking.
- **Markdown Support**: Use rich formatting in recipe notes and directions for better organization.
- **Responsive Design**: Optimized for desktop planning and one-handed mobile browsing in the kitchen.
- **Smart Tagging**: Organize recipes with a flexible tagging system and a color-coded UI.
- **Recipe Search & Filter**: Quickly find what you need by title, tags, or sort by recently added/cooked.
- **Image Uploads**: Direct integration with Vercel Blob for hosting your own food photos.
- **Weekly Meal Planner**: A Monday–Sunday calendar (days × meal categories) for assigning a recipe to each day's meals. Navigate freely between weeks — past weeks double as your meal history, since assigning a meal *is* the record.
- **Smart Meal Suggestions**: When filling a slot, get ranked recipe suggestions that prioritize meals you haven't eaten recently while boosting your frequently-cooked favorites. Never-tried recipes surface too, and the picker filters to the slot's category with a "show all" toggle.

### 🗺️ Roadmap (Upcoming)
- **Grocery List Builder**: Aggregate ingredients from multiple recipes into a categorized shopping list.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, TypeScript)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Neon](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Credentials Provider)
- **LLM Engine**: [DeepSeek API](https://platform.deepseek.com)

---

## 🏠 Self-Hosting Guide

Hosting your own instance of Recipe Book is straightforward, especially with Vercel and Neon.

### 1. Prerequisites
- A **GitHub** account.
- A **Vercel** account (Free tier is sufficient).
- A **Neon** account (for the Postgres database).
- An **DeepSeek API Key** (for recipe parsing).

### 2. Preparation
1.  **Fork this repository** to your own GitHub account.
2.  Generate a `NEXTAUTH_SECRET` (you can use `openssl rand -base64 32`).
3.  Prepare bcrypt hashes for your two user accounts (use an online generator or a local script).

### 3. Deploy to Vercel
1.  Create a **New Project** in Vercel and import your forked repository.
2.  **Provision a Database**:
    - Go to the **Storage** tab in your Vercel project.
    - Select **Connect Database** -> **Neon**.
    - This will automatically inject the `DATABASE_URL` into your environment variables.
3.  **Configure Environment Variables**:
    Add the following in the Vercel project settings:
    - `DEEPSEEK_API_KEY`: Your DeepSeek API key.
    - `APP_NAME`: Custom name of your recipe app.
    - `CATEGORIES`: A comma-separated list of tags to be prioritized as categories (e.g., `Breakfast,Dinner,Dessert`). These will always appear first in filters and suggestions.
    - `NEXTAUTH_SECRET`: The secret you generated.
    - `NEXTAUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`).
    - `AUTH_USER_1_EMAIL`: Email for the first user.
    - `AUTH_USER_1_PASSWORD_HASH`: Bcrypt hash for the first user.
    - `AUTH_USER_2_EMAIL`: Email for the second user.
    - `AUTH_USER_2_PASSWORD_HASH`: Bcrypt hash for the second user.

### 4. Initialize the Database
Once the project is deployed, you need to push the schema to your database:
```bash
# Run this locally after setting your DATABASE_URL in .env.local
npx drizzle-kit push
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

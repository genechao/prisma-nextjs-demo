# Prisma in Next.js Demo

A simple demo showing how to integrate and use Prisma (an ORM for database access) into a React project using Prisma (v6) in Next.js (v15). Next.js is used to simplify hosting frontend and backend within a single project. The Next.js Pages Router (instead of the default App Router) is used as its API structure is similar to Express. It demonstrates common database operations (CRUD) and relations.

This demo is designed to work with a PostgreSQL database server. You will need a valid connection string (for `DATABASE_URL`) to connect to your PostgreSQL instance.

## Getting Started

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up your database and environment variables:**
    1.  Copy the example environment variables:
        ```bash
        cp .env.example .env
        cp .env.local.example .env.local
        ```
    2.  Update the `DATABASE_URL` in your `.env` file and `NEXT_PUBLIC_DEMO_AUTH_TOKEN` in your `.env.local` file to point to your database and desired token.
    3.  Apply Prisma migrations to create the database schema:
        ```bash
        npx prisma migrate dev --name "init"
        ```

3.  **Seed your database (optional):**
    This will populate your database with example data.  
    **WARNING:** Running the seed script will clear all existing data from your database.
    ```bash
    npx prisma db seed
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000)

## Project Structure

-   `prisma/schema.prisma`: Defines the database schema and Prisma models.
-   `src/lib/prisma.ts`: Prisma Client instance.
-   `src/lib/types.ts`: Shared TypeScript type definitions.
-   `src/pages/api/actions.ts`: Backend API routes for Prisma database operations (CRUD).
-   `src/pages/index.tsx`: Main application component.
-   `src/styles/globals.css`: Global styles, including Tailwind CSS imports and base styles.

## Learn More

-   [Prisma Documentation](https://www.prisma.io/docs) - learn about Prisma features and API.
-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js (Pages Router)](https://nextjs.org/learn/pages-router) - an interactive Next.js tutorial.


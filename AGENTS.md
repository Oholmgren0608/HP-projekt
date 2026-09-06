# AGENTS.md - Repository Guidelines

You are an expert full-stack engineer working on this repository. This project is divided into two distinct domains. You must strictly adhere to the domain-specific guidelines based on the directory you are currently modifying.

---

## 🎨 Role: Frontend Specialist
**Trigger:** Apply these rules when reading, editing, or testing files inside `/frontend`.

*   **Stack:** Next.js (App Router), TypeScript, and Tailwind CSS.
*   **Components:** Use React functional components exclusively. Never use class components.
*   **Styling:** Use Tailwind utility classes. Do not create new `.css` files or use inline `style={{}}` attributes unless dynamically calculating dimensions.
*   **Data Fetching:** Use React Query for API calls. Do not use raw `fetch` or `useEffect` for data fetching.
*   **Testing:** Run `npm run test` inside `/frontend` after modifying UI components. Use React Testing Library.

---

## ⚙️ Role: Backend Architect
**Trigger:** Apply these rules when reading, editing, or testing files inside `/backend`.

*   **Stack:** Node.js, Express, and PostgreSQL (via Prisma ORM).
*   **Architecture:** Strictly follow a Controller-Service-Route architecture. Do not put database logic directly inside route handlers.
*   **Error Handling:** Never swallow errors. Always pass errors to the global error-handling middleware using `next(error)`.
*   **Security:** Never log sensitive user data or tokens to the console.
*   **Testing:** Run `npm run test` inside `/backend`. Every new API route must have a corresponding integration test.

---

## 🤝 Cross-Domain Workflow (Multi-Agent Protocol)
When tasked with a full-stack feature (e.g., "Build a user profile page"), you must ensure both domains remain synchronized:

1.  **API First:** Always design and implement the `/backend` API route and database schema first.
2.  **Contract Updates:** If you change a backend JSON response shape, you MUST immediately find and update the corresponding TypeScript interface in `/frontend/types/api.ts`.
3.  **Port Configuration:** Assume the frontend runs on `localhost:3000` and the backend runs on `localhost:8080`.
4.  **Verification:** Never mark a full-stack task as complete until you have successfully started both servers and verified they communicate without CORS or type errors.

<div align="center">
  <img src="public/starshop-logos/StarShop-Logo.svg" height="200">
</div>

# 🌟 StarShop Backend

StarShop's backend supports the innovative features of the platform, providing a robust and scalable API layer that integrates blockchain technology, database management, and service logic for a seamless marketplace experience.

## 📋 Backend Rules

### 1️⃣ Introduction

This document outlines the rules and guidelines for contributing to the backend of the StarShop project. By following these rules, contributors ensure consistent development practices and smooth collaboration across the team.

---

### 📂 2️⃣ Code Structure

The backend project follows a clear and modular folder structure:

| **Folder/File** | **Description**                                |
| --------------- | ---------------------------------------------- |
| `src/config`    | Configuration files (e.g., database settings). |
| `src/entities`  | Entity models for database interactions.       |
| `src/services`  | Business logic and services.                   |
| `src/utils`     | Helper utilities and common functions.         |
| `src/tests`     | Unit and integration tests.                    |
| `src/index.ts`  | Application entry point.                       |

---

### 📏 3️⃣ Coding Standards

- **Language:** TypeScript is the default language.
- **Linting:** Use ESLint for code quality.
- **Formatting:** Use Prettier for consistent formatting.
- **Naming Conventions:**
  - Use **camelCase** for variables and functions.
  - Use **PascalCase** for classes, interfaces, and types.
  - Use **UPPER_SNAKE_CASE** for constants.

To ensure adherence, run the following commands before committing:

- `npm run lint` - Check for linting issues.
- `npm run format` - Apply code formatting.

---

### 🔄 4️⃣ Pull Request Guidelines

1. Create a new branch for each feature or bugfix.
2. Ensure the branch is up-to-date with the main branch.
3. Add appropriate tests for your changes.
4. Submit a detailed pull request with:
   - A descriptive title.
   - Clear summary of changes.
5. Await at least one code review approval before merging.

---

### 🌿 5️⃣ Branching Strategy

| **Branch**               | **Description**                       |
| ------------------------ | ------------------------------------- |
| `main`                   | Production-ready code.                |
| `develop`                | Staging branch for upcoming releases. |
| `feature/<feature-name>` | New features under development.       |
| `bugfix/<bug-name>`      | Bug fixes.                            |

---

### 📝 6️⃣ Commit Message Guidelines

Use the following format for commits:

`[Type] [Scope]: [Short Description]`

Examples:

- `feat: Add authentication middleware.`
- `fix: Resolve database connection issue.`

---

### ⚙ 7️⃣ Environment Setup

1. Clone the repository:  
   `npm clone https://github.com/StarShopCr/StarShop-Backend.git`

2. Navigate to the directory:  
   `cd StarShop-Backend`

3. Install dependencies:  
   `npm install`

4. Copy and configure environment variables:  
   `cp .env.example .env`

5. Start the development server:  
   `npm run dev`

---

### API Documentation

We use OpenAPI 3.0 with Swagger UI for API documentation.

To access the docs:

1. Start the server: `npm start`
2. Visit `http://localhost:3000/docs`

### Updating Documentation

1. Edit the `openapi.yaml` file
2. Add/update endpoint documentation following OpenAPI spec
3. Consulta `docs/api-guidelines.md` para mantener la nomenclatura consistente
4. Restart the server to see changes
5. Validate schema: `npm run docs:validate`

### Generating Static Docs

Install Redoc CLI globally:

```bash
npm install -g redoc-cli
```

Generate static HTML:

```bash
npm run docs:build
```

---

### 🧪 8️⃣ Testing

We use Jest for unit and integration testing. Ensure all new features include test coverage.

- `npm run test` - Run all tests.
- `npm run test:watch` - Run tests in watch mode during development.

**Unit Test Example:**  
Tests are located under the `src/tests` folder.  
Each service, utility, or feature should have a corresponding `*.spec.ts` file.

---

### ⭐ Contribute to StarShop

We welcome contributions to StarShop! Follow these guidelines and refer to our [Contributor's Guide](https://github.com/StarShopCr/contributors-guide) to get started.

---

### 📌 Important Notes

- Always update documentation when making changes.
- Ensure your code passes all tests before submitting a pull request.
- Stick to the project coding standards for better collaboration.

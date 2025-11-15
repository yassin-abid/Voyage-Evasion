# GEMINI Project Context: Voyage Évasion

This document provides a comprehensive overview of the "Voyage Évasion" project to be used as instructional context for future interactions.

## Project Overview

**Voyage Évasion** is a full-stack travel website designed to showcase destinations and allow users to curate a list of their favorite locations.

*   **Frontend:** The frontend is built with vanilla JavaScript, HTML, and CSS. It features a dynamic UI that interacts with the backend API to display destinations, handle user authentication, and manage favorites. The project has recently been reorganized to have a clear page structure with a dedicated "Accueil" (Home) page, a "Destinations" page, and a "Contact" page.
*   **Backend:** The backend is a Node.js application using the Express framework. It exposes a RESTful API to manage destinations, user authentication, and favorites.
*   **Database:** The project uses MongoDB as its database with Mongoose as the ODM (Object Data Modeling) library.
*   **Authentication:** User authentication is handled using JSON Web Tokens (JWT). Passwords are securely hashed using `bcryptjs`. The application also features an email confirmation flow for new user registrations.

## Building and Running

### Prerequisites

*   Node.js and npm installed.
*   A running MongoDB instance.
*   A `.env` file in the root of the `voyage-evasion` directory with the following variables:
    *   `MONGO_URI`: The connection string for your MongoDB database.
    *   `JWT_SECRET`: A secret key for signing JWTs.
    *   `EMAIL_USER`: The username for your SMTP server (for sending confirmation emails).
    *   `EMAIL_PASS`: The password for your SMTP server.
    *   `BASE_URL`: The base URL of the application (e.g., `http://localhost:3000`).

### Installation

1.  Navigate to the `voyage-evasion` directory.
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Running the Application

1.  Start the server:
    ```bash
    npm start
    ```
    The server will start on port 3000.

### Seeding the Database

To populate the database with initial destination data, run the following command:

```bash
npm run seed
```

## Development Conventions

*   **Coding Style:** The project uses modern JavaScript (ES modules, `async/await`). The code is generally well-formatted and readable.
*   **Testing:** There is currently no test suite for this project. The `test` script in `package.json` is a placeholder.
*   **File Structure:**
    *   `public/`: Contains all the frontend files (HTML, CSS, JS, images).
        *   `html/`: Contains the HTML pages (`destinations.html`, `contact.html`, etc.).
        *   `css/`: Contains the CSS files.
        *   `js/`: Contains the frontend JavaScript files.
        *   `img/`: Contains the images.
    *   `server/`: Contains all the backend files.
        *   `models/`: Contains the Mongoose models.
        *   `routes/`: Contains the Express routes.
        *   `utils/`: Contains utility functions (e.g., `mailer.js`).
        *   `scripts/`: Contains scripts for development (e.g., `seedDestinations.js`).
*   **API Routes:**
    *   `/api/auth`: Handles user authentication (signup, login, email confirmation).
    *   `/api/destinations`: Handles CRUD operations for destinations.
    *   `/api/favorites`: Handles adding, removing, and fetching user favorites.

# Trading Diary Application

A comprehensive trading journal application to track your trades, strategies, and performance.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Ensure MongoDB service is running locally or have a remote connection URI)

## Project Structure

- `backend`: Express/Node.js server with MongoDB.
- `frontend`: React app with Vite, TanStack Query, and BaseWeb UI.

## Getting Started

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Environment Configuration:
    - The server defaults to port `5000`.
    - It connects to `mongodb://localhost:27017/tradingdiary` by default.
    - To override, create a `.env` file in the `backend` folder:
      ```env
      PORT=5000
      MONGO_URI=mongodb://localhost:27017/your_db_name
      ```

4.  Start the Development Server:
    ```bash
    npm run dev
    ```
    The server should be running at `http://localhost:5000`.

### 2. Frontend Setup

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the Development Server:
    ```bash
    npm run dev
    ```
    The application will typically be accessible at `http://localhost:5173`.

### 3. Docker Setup (Recommended)

The easiest way to run the entire stack (Frontend, Backend, and MongoDB) is using Docker. This setup automatically handles MongoDB installation and data persistence.

1.  **Start the Application**:
    From the root directory, run:
    ```bash
    npm run docker:up
    ```
    This will build the images and start the containers in the background.

2.  **View Logs**:
    To see the logs from all services:
    ```bash
    npm run docker:logs
    ```

3.  **Stop the Application**:
    To stop and remove the containers:
    ```bash
    npm run docker:down
    ```

4.  **Access the application**:
    - **Frontend**: [http://localhost:5173](http://localhost:5173)
    - **Backend**: [http://localhost:5000](http://localhost:5000)
    - **MongoDB**: `localhost:27017` (Data is persisted in the `mongo-data` volume)

## Features

- **Dashboard**: View recent trades, add new trades via modal or paste (Ctrl+V) image shortcut.
- **Visualizations**: Monthly P&L Calendar view.
- **Management**: Edit and delete trades directly from the table.
- **Responsive Layout**: Sidebar navigation and responsive design.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TanStack Query, TanStack Table, BaseWeb, TailwindCSS.
- **Backend**: Node.js, Express, MongoDB, Mongoose.

# Study Room Booking System
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/dhanarajrk/Study-Room-Booking)

This is a full-stack MERN application for booking study tables in a library. It features real-time table availability, online payment integration, PDF invoice generation, and a comprehensive admin dashboard with live metrics. The system uses WebSockets to ensure all users have a synchronized view of table statuses.

## Features

- **User Authentication**: Secure registration and login with OTP email verification and JWT-based sessions.
- **Real-time Table Grid**: A visual grid of all tables, with their availability (Available, Reserved, Occupied) updated in real-time for all connected users via Socket.IO.
- **Dynamic Booking Panel**: Select a table, choose a date, and pick available time slots with a dynamic duration and price calculation.
- **Online Payments**: Integrated with Cashfree Payment Gateway for secure online payments.
- **Manual Booking (Admin)**: Admins can book slots on behalf of users paying with cash.
- **PDF Invoice Generation**: Automatically generates a PDF invoice upon successful booking, uploads it, and emails the link to the user.
- **My Bookings Page**: Users can view their upcoming and past bookings, and cancel upcoming ones.
- **Booking Cancellation & Refunds**: Users can cancel bookings, with partial refunds processed automatically through the payment gateway.
- **Admin Dashboard**:
    - **Live Metrics**: View real-time data on revenue, booking counts, and performance comparisons.
    - **Booking Management**: Admins can view, edit, cancel, or permanently delete any booking.
    - **User-friendly Interface**: The dashboard provides a complete overview and control over the booking system.
- **Theme Toggle**: Switch between a light and dark theme, with the preference saved locally.

## Tech Stack

| Area      | Technology                                                                                                    |
| :-------- | :------------------------------------------------------------------------------------------------------------ |
| **Frontend**  | React, Vite, Zustand, Tailwind CSS, Socket.IO Client, Axios, Recharts, React Hot Toast                       |
| **Backend**   | Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JSON Web Token (JWT), Bcrypt.js, Nodemailer              |
| **Payments**  | Cashfree Payment Gateway                                                                                      |
| **Services**  | GoFile (for temporary invoice hosting)                                                                        |
| **Deployment**| Render                                                                |

## System Architecture

The application is built with a decoupled client-server architecture.

-   **Client (React)**: The frontend, built with Vite and React, handles the user interface. It uses Zustand for global state management (authentication, bookings, theme). API communication is handled by Axios, while real-time updates are managed with the Socket.IO client.
-   **Server (Express)**: The backend provides a RESTful API for all core functionalities. It uses Mongoose to interact with the MongoDB database.
-   **WebSockets (Socket.IO)**: A key component for real-time functionality. The server emits events for booking creation, updates, and cancellations. All connected clients listen for these events and update their state accordingly, ensuring a synchronized experience without needing to refresh the page.
-   **Payment Flow**:
    1.  The client sends booking details to the backend.
    2.  The backend creates a payment order with Cashfree and returns a `payment_session_id`.
    3.  The client uses the Cashfree JS SDK to initiate the checkout process.
    4.  Upon successful payment, the client informs the backend, which verifies the payment status.
    5.  The backend finalizes the booking, generates an invoice, and sends a confirmation.
-   **Refund & Webhook Flow**:
    1.  When a user cancels a booking, the backend sends a refund request to Cashfree.
    2.  The application uses a webhook endpoint to receive real-time updates on the refund status from Cashfree, ensuring the database is always accurate.

## Getting Started

### Prerequisites

-   Node.js (v18.0.0 or higher)
-   npm or yarn
-   MongoDB (local instance or a cloud service like MongoDB Atlas)

### Backend Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dhanarajrk/Study-Room-Booking.git
    cd Study-Room-Booking/server
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the `server` directory and add the following environment variables:
    ```env
    # MongoDB Connection
    MONGODB_URI=your_mongodb_connection_string

    # JWT Authentication
    JWT_SECRET=your_jwt_secret

    # Email Service (Gmail)
    EMAIL_USER=your_gmail_address
    EMAIL_PASS=your_gmail_app_password

    # Cashfree Payment Gateway
    CASHFREE_CLIENT_ID=your_cashfree_client_id
    CASHFREE_CLIENT_SECRET=your_cashfree_client_secret

    # GoFile API for Invoice Hosting
    GOFILE_API_TOKEN=your_gofile_api_token

    # Application URLs
    CLIENT_URL=http://localhost:5173
    FRONTEND_URL=your_production_frontend_url # For deployment
    ```

4.  **Seed the database with tables** (optional, but recommended):
    ```bash
    node seedTables.js
    ```
    This script will create 30 sample tables in your database.

5.  **Run the server:**
    ```bash
    npm run dev
    ```
    The backend server will start on `http://localhost:5000`.

### Frontend Setup

1.  **Navigate to the client directory in a new terminal:**
    ```bash
    cd ../client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the client:**
    ```bash
    npm run dev
    ```
    The frontend will be available at `http://localhost:5173`. The `vite.config.js` is already configured to proxy API requests to the backend.

### Admin Access

To create an admin user, register a new account and manually change the `role` field for that user from `"customer"` to `"admin"` in your MongoDB database.

# Study Room Booking System

This is a full-stack MERN application for booking study tables in a library. It features real-time table availability, online payment integration, PDF invoice generation, and a comprehensive admin dashboard with live metrics. The system uses WebSockets to ensure all users have a synchronized view of table statuses.

---

## 🚀 Features

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

---

## 📸 Screenshot Showcase

Here are some screenshots of the system in action:

### 🖥️ User Interface

![Home Page](screenshots/homepage.png)  
*homepage.png*

![Table Grid View](screenshots/table-grid.png)  
*table-grid.png*

![Booking Panel](screenshots/booking-panel.png)  
*booking-panel.png*

![My Bookings Page](screenshots/my-bookings.png)  
*my-bookings.png*

### 🔑 Admin Dashboard

![Admin Dashboard](screenshots/admin-dashboard.png)  
*admin-dashboard.png*

![Admin Booking Management](screenshots/admin-bookings.png)  
*admin-bookings.png*

---

## 🛠 Tech Stack

| Area         | Technology                                                                                                    |
| :----------- | :------------------------------------------------------------------------------------------------------------ |
| **Frontend** | React, Vite, Zustand, Tailwind CSS, Socket.IO Client, Axios, Recharts, React Hot Toast                        |
| **Backend**  | Node.js, Express.js, MongoDB, Mongoose, Socket.IO, JSON Web Token (JWT), Bcrypt.js, Nodemailer                 |
| **Payments** | Cashfree Payment Gateway                                                                                      |
| **Services** | GoFile (for temporary invoice hosting)                                                                        |
| **Deployment**| Render                                                                                                        |

---

## System Architecture

The application is built with a decoupled client-server architecture.

- **Client (React)**: Handles the user interface. Uses Zustand for global state management (authentication, bookings, theme). Axios manages API communication, and Socket.IO handles real-time updates.
- **Server (Express)**: Provides RESTful APIs using Mongoose to interact with MongoDB.
- **WebSockets (Socket.IO)**: Ensures all clients are synchronized without requiring page refreshes.
- **Payment Flow**:
  1. Client sends booking details to the backend.
  2. Backend creates a payment order with Cashfree and returns a `payment_session_id`.
  3. Client uses the Cashfree JS SDK to initiate checkout.
  4. Backend verifies payment status and finalizes the booking.
  5. PDF invoice is generated and sent to the user.
- **Refund & Webhook Flow**:
  1. Upon booking cancellation, backend requests a refund from Cashfree.
  2. Refund status updates are received via webhook and synced to the database.

---

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm or yarn
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. **Clone the repository:**
    ```bash
    git clone https://github.com/dhanarajrk/Study-Room-Booking.git
    cd Study-Room-Booking/server
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Create a `.env` file** in the `server` directory:
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
    FRONTEND_URL=your_production_frontend_url
    ```

4. **Seed the database:** (must run manually atleast once - Creates 30 sample tables)
    ```bash
    node seedTables.js
    ```

5. **Run the server:**
    ```bash
    npm run dev
    ```
    Server runs at `http://localhost:5000`.

### Frontend Setup

1. **Navigate to client directory:**
    ```bash
    cd ../client
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Run the client:**
    ```bash
    npm run dev
    ```
    Frontend runs at `http://localhost:5173`.

---

### 🔑 Admin Access

To create an admin user:  
Register a new account → change `role` from `"customer"` to `"admin"` in MongoDB.

---

## License

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)** License.

You are free to:
- ✅ Use, modify, and test the code for personal or educational purposes.
- ✅ Showcase your modifications publicly with proper attribution.
- ❌ Not allowed to use the code or its derivatives for commercial purposes.

Read the full license here: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

---

# VentureLink

VentureLink is a platform designed to connect Small and Medium Enterprises (SMEs) with potential investors, facilitating funding campaigns and providing investment tracking tools.

## Prerequisites

Before starting the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Project Setup

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

## Backend Services & Configuration

This project relies on Firebase for its backend services (Authentication, Firestore, Storage). 

### Firebase Configuration

You need to set up a Firebase project and add the necessary configuration. Note that for security reasons, the `serviceAccount.json` is **not** included in the repository.

1. **Create a Firebase Project**: Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Enable Services**:
   - Enable **Authentication** (Email/Password).
   - Enable **Firestore Database**.
   - Enable **Storage**.

### Generating `serviceAccount.json`

To interact with Firebase services (especially if running a local Node.js backend), you must generate a new private key block:

1. Go to your Firebase Project Settings in the console.
2. Navigate to the **Service accounts** tab.
3. Click on **Generate new private key**.
4. This will download a JSON file containing your service account credentials.

**IMPORTANT:**
Rename the downloaded file to `serviceAccount.json` and place it in the `backend/` directory of this project (`backend/serviceAccount.json`). 

**Never commit this file to version control.** It should be added to the `.gitignore` file (or is already ignored).

### Environment Variables

You must also configure your frontend environment variables. Create a `.env` file in the root of the project (where `package.json` is located) and add your Firebase client configuration details. You may need to reference a `.env.example` if it exists.

## Running the Application

### 1. Start the Frontend (Vite)

To run the development server for the React application:

```bash
npm run dev
```

This will run the Vite development server. Open your browser and navigate to the local URL provided in the terminal (usually `http://localhost:5173`).

### 2. Start the Backend API (Node.js/Express)

If this project includes a separate Node.js backend API (as indicated by previous migrations), you need to start it separately.

1. Open a new terminal window.
2. Navigate to the backend directory (`cd backend`).
3. Install backend dependencies (if you haven't already): `npm install`.
4. Ensure your `serviceAccount.json` is correctly placed in this directory (`backend/serviceAccount.json`).
5. Start the backend server:
   ```bash
   node index.js
   ```

## What happens in this website?

VentureLink functions as a bridge between businesses seeking funding and individuals or entities looking to invest.

### Key Features:

#### 1. Funding Campaigns
SMEs can showcase their businesses create "Campaigns" to outline their funding needs, business models, and goals. These campaigns are displayed on the platform for potential investors to browse.

#### 2. Investor Exploration
Investors can explore active campaigns. Each campaign page provides detailed information about the business, including financial targets, equity offered, and business descriptions.

#### 3. Investment Commitments
Once an investor finds a campaign they are interested in, they can make direct financial commitments through the platform. The platform records these commitments and tracks the progress of campaigns towards their funding goals.

#### 4. Investor Dashboard
Investors have a dedicated dashboard where they can manage their portfolio, review their active commitments, browse available opportunities, and finalize their investments. The platform provides tools like investment readiness checklists and status tracking.

---
*Note: The SME Dashboard and Admin Dashboard functionalities are handled independently and are not detailed in this guide.*

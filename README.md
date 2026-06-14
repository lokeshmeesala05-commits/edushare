# EduShare 🎓
**A Regional-Language Educational Resource Sharing Platform**

![EduShare Banner](https://img.shields.io/badge/Status-Live-success) ![React](https://img.shields.io/badge/Frontend-React-blue) ![Supabase](https://img.shields.io/badge/Backend-Supabase-green) ![Vite PWA](https://img.shields.io/badge/PWA-Enabled-purple)

🔗 **Live Demo:** [https://edushare-mu.vercel.app/](https://edushare-mu.vercel.app/)

EduShare is a full-stack Progressive Web Application (PWA) built specifically to bridge the digital divide for government school students in Andhra Pradesh and Telangana. It serves as a free digital library providing organized study materials (PDFs, notes, past papers) in regional languages (Telugu and English).

---

## 🌟 Key Features

* **Bilingual Voice Search:** Powered by the Web Speech API, students can search for notes using their voice in both Telugu (`te-IN`) and English (`en-IN`).
* **Automated Demand Predictor (Smart Gap Alerts):** A unique algorithm that tracks failed user searches to detect curriculum deficits. Topics searched by multiple students automatically generate High Priority Gap Alerts on the Admin Dashboard.
* **Progressive Web App (PWA):** Installs directly onto mobile devices and features offline caching, allowing students to access previously viewed notes without an active internet connection.
* **Role-Based Access Control:** 
  * **Students:** Can upload notes, download PDFs, and delete their own uploads.
  * **Admins:** Can approve pending notes, view analytics, and manage the entire database.
* **Admin Analytics Dashboard:** Visualizes subject popularity, top-downloaded notes, and urgent curriculum requests.
* **Drag-and-Drop Uploads:** Secure PDF upload system directly integrated with Supabase Storage.

## 🛠️ Technology Stack

* **Frontend:** React.js (v18), TypeScript, Vite
* **Styling:** Tailwind CSS (Vanilla CSS integration)
* **Backend & Database:** Supabase (PostgreSQL)
* **Authentication:** Supabase Auth (JWT with Role metadata)
* **Storage:** Supabase Object Storage
* **Deployment:** Vercel

## 🚀 How to Run Locally

### Prerequisites
* Node.js (v18 or higher)
* A Supabase Account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/lokeshmeesala05-commits/edushare.git
   cd edushare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```

5. **Build for Production:**
   ```bash
   npm run build
   ```

## 📝 Community Service Project (CSP) Context
This application was developed as a Community Service Project (CSP) for **Vignan's Institute of Information Technology (A), Visakhapatnam**. The project directly targets UN Sustainable Development Goals:
* **SDG 4 (Quality Education):** By providing free access to quality study materials.
* **SDG 10 (Reduced Inequalities):** By optimizing the platform for low-resource environments (PWA offline mode, regional language support).

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
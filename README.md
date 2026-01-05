# Student Attendance Application (Android)

## About The Project

This application is a digital solution designed to modernize school attendance systems. Built with **React Native**, it allows teachers to mark daily attendance directly from their Android smartphones, eliminating the need for paper registers.

The system utilizes a **Serverless Architecture** where **Google Sheets** acts as the database. This approach ensures that school management can access real-time attendance reports in a familiar Excel format without needing complex database software. The system automatically organizes data by creating new tabs for every month, making record-keeping effortless.

### Key Features

* **Teacher Authentication:** Secure login system allowing specific teachers to access only their assigned classes (e.g., Grade 10-A).
* **Smart Attendance Marking:** Interface includes Present (P), Absent (A), and Leave (L) options.
* **Visual Status Indicators:** Buttons change color (Green for Present, Red for Absent, Yellow for Leave) to provide immediate visual confirmation.
* **Time-Lock Security:** The application automatically locks attendance marking after **12:00 PM** daily to ensure data integrity and prevent retroactive changes.
* **Cloud Synchronization:** Data is instantly pushed to a central Google Sheet via Google Apps Script.
* **Automated Organization:** The backend script automatically generates new files for classes and new tabs for upcoming months.

---

## Application Interface

*(Please upload screenshots of the App and the Google Sheet to your repository and link them here)*

**1. Login Screen**

> [Link to Login Screen Image]

**2. Attendance Marking Screen**

> [Link to Attendance Screen Image]

**3. Google Sheets Output**

> [Link to Google Sheets Data Image]

---

## Technical Stack

* **Frontend:** React Native (Expo Framework)
* **Language:** JavaScript (ES6)
* **Navigation:** React Navigation (Stack)
* **Backend / Database:** Google Sheets API (via Google Apps Script)
* **Networking:** Fetch API

---

## How to Run Locally

Follow these instructions to set up and run the project on your local machine.

**1. Clone the Repository**

```bash
git clone https://github.com/ShaheerJamalChishti90/Class-Attendance-Application.git
cd SchoolAttendance
```

**2. Install Dependencies**

```bash
npm install
```

**3. Start the Server**

```bash
npx expo start
```

Once the server starts, you can scan the QR code using the **Expo Go** app on your Android device or press 'a' to run it on an Android Emulator.

---

## Backend Setup (Google Sheets)

This application communicates with Google Sheets using a custom Google Apps Script Webhook. To connect this app to your own Google Drive:

1. Create a new **Google Sheet**.
2. Navigate to **Extensions > Apps Script** in the top menu.
3. Paste the code provided in the `backend_script.js` file (located in this repository).
4. **Important:** Locate the `FOLDER_ID` variable in the script and replace it with the ID of the Google Drive folder where you wish to store the attendance files.
5. Click **Deploy > New Deployment**.
6. Select type: **Web App**.
7. Set **Who has access** to: **Anyone**.
8. Click **Deploy** and copy the generated **Web App URL**.
9. Open `src/screens/AttendanceScreen.js` in your code editor and replace the API URL:

```javascript
const API_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec";
```

---

## Project Structure

* **assets/**: Contains static assets like images and logos.
* **src/components/**: Reusable UI components used throughout the app.
* **src/data/**: Contains hardcoded data files, including `students.js` (student lists) and `users.js` (teacher credentials).
* **src/screens/**: Contains the main application screens (`LoginScreen.js` and `AttendanceScreen.js`).
* **App.js**: The main entry point handling navigation configuration.
* **app.json**: Expo configuration file.

---

## Login Credentials (For Testing)

The application currently uses a hardcoded user base for demonstration purposes. You may use the following credentials to test the functionality:

| Teacher Name | Password | Class Access |
| --- | --- | --- |
| **Ms. Sadia** | Password123 | Grade 5-A |
| **Mr. Kamran** | Password123 | Grade 6-A |
| **Mr. Ahmed** | Password123 | Grade 9-A |
| **Ms. Hina** | Password123 | Grade 9-B |
| **Mr. Rizwan** | Password123 | Grade 10-A |

---

## Contribution

Contributions are welcome. Please follow these steps:

1. Fork the Project.
2. Create your Feature Branch.
3. Commit your Changes.
4. Push to the Branch.
5. Open a Pull Request.

---

## Contact

For any inquiries regarding this project, please contact:

**Muhamnmad Shaheer Jamal Chishti**

* **Linktree:** [click me](linktr.ee/msjc.09)
* **Email:** [click me](shaheerjamal369@gmail.com)

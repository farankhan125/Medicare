# Medicare

Medicare is a web-based medication management application built as a final year university project. The idea came from a very real and common problem, people forget to take their medicines. Whether it is one tablet a day or multiple medications at different times, keeping track is harder than it sounds, and missing doses can have serious health consequences.

Medicare was built to solve this by bringing everything together in one place, medication scheduling, automated reminders, dose history tracking, an AI health assistant, and emergency medical information access.

---

## What It Does

- Users can register and build a complete health profile including medical conditions, allergies, blood type, weight, height, and emergency contact details
- Medications can be added with flexible scheduling — daily, weekly, specific days, every N days, or monthly
- Automated email reminders are sent five minutes before each scheduled dose
- If a dose is not acknowledged, a smart follow-up reminder is sent automatically
- A dose history page tracks all past doses and calculates an adherence rate
- A personalised AI assistant powered by Google Gemini answers health and medication questions using the user's own profile data
- An Emergency SOS modal gives instant access to critical medical information from anywhere in the app
- All data is protected with Row Level Security — users can only ever access their own data

---

## Tech Stack

- **Frontend** — React, React Router, Tailwind CSS
- **Backend & Database** — Supabase (PostgreSQL)
- **Authentication** — Supabase Auth
- **Automation & Workflows** — n8n
- **AI Assistant** — Google Gemini via n8n
- **Project Management** — Trello

---

## Repository Structure

- Medicare React Code/        — All React frontend source code
- Medicare Supabase Database/ — Database schema, functions, triggers and policies
- Medicare n8n Workflows/     — Exported n8n workflow JSON files

---

## Setup Notes

This repository contains the source code for academic submission purposes. If you want to run this project locally:

1. Clone the repository
2. Navigate to the `Medicare React Code` folder
3. Run `npm install` to install dependencies
4. Create a `.env` file with your own Supabase project URL and anon key
5. Run `npm run dev` to start the development server

For the n8n workflows, import the JSON files into your own n8n instance and replace the placeholder values with your own Supabase credentials.

---

## Important Notes

- The n8n workflow files have API keys replaced with placeholders for security. You will need to add your own credentials when importing
- The AI assistant requires a Google Gemini API key configured in n8n
- This project was developed as a final year BSc Computer Science project at the University of Hertfordshire

---

## Disclaimer

Medicare is an informational tool and does not provide medical advice, diagnoses, or prescriptions. Always consult a qualified healthcare professional before making any medical decisions.

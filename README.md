# 🛋️ Furniture Visualiser Web Application

**University of Plymouth – PUSL3122: HCI, Computer Graphics, and Visualisation**

## 📜 Project Overview

A web-based furniture visualisation app for store designers to create, view, and manage custom room designs in 2D and 3D based on size, shape, and colour schemes. Built to help designers showcase realistic layouts to customers in-store.

✅ 1. Recommended Full Stack (Modern + Coursework-Ready)

Layer	Tech Stack
Frontend	React.js, Tailwind CSS, React Router, Three.js, Konva.js
Backend	Node.js, Express.js
Database	MongoDB with Mongoose
Auth	JWT (JSON Web Tokens) – for designer login
Tools	GitHub (repo & commits), Figma (UI), Postman (API test), Vercel/Render
✅ 2. Must-Include Coursework Concepts

Coursework Requirement	Tech / Concept Used
Designer Login	JWT Auth with MongoDB
Save/Edit/Delete Designs	REST APIs with MongoDB
Visualise Room in 2D	Konva.js (Canvas)
Visualise Room in 3D	Three.js (WebGL 3D view)
Color/Shade Change	React State + Canvas/3D Material Edits

## 💻 Technologies Used

### Frontend:
- React.js
- Tailwind CSS
- React Router
- Konva.js (2D Canvas)
- Three.js (3D WebGL Viewer)

### Backend:
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication

### Other Tools:
- Git + GitHub (Version Control)
- Figma (Low/High Fidelity Prototyping)
- Postman (API Testing)
- Vercel + Render (Deployment)

---

## 👤 Designer Login (JWT)

- Secure login for designers
- Only authenticated users can create/edit designs

## 🎨 Room Design Features

- Choose room size, shape, colour
- Drag and drop furniture in 2D (Konva)
- Live 3D Preview (Three.js)
- Apply shading, resize, recolour furniture
- Save/Edit/Delete designs to/from MongoDB

## 🔄 CRUD Operations

- Create a design
- Retrieve saved designs
- Update existing layouts
- Delete unwanted designs

---

## 🧪 User Testing

- **Formative Testing:** on low-fi prototypes
- **Summative Testing:** on final app
- At least 2 users per test
- Feedback incorporated into final version
- [Attach consent forms and screenshots]

---

## 📸 Screenshots

- Login Page  
- Dashboard with Saved Designs  
- 2D Editor  
- 3D Viewer  
- Save / Edit / Delete Features  

---

## 🔗 GitHub Link

🔗 [https://github.com/yourgroup/furniture-visualiser](https://github.com/yourgroup/furniture-visualiser)

✅ Make sure it's **public** and contains:
- `/client` (React)
- `/server` (Node.js)
- `README.md` (this file)
- Commit history (weekly commits by group)

---

## 📁 Project Setup Instructions

```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd client
npm install
npm run dev

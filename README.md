
# ✂️ SalonX

> A premium, modern salon management and booking platform built with React, Node.js, Express, and MongoDB.

SalonX is a full-stack salon platform designed to provide a smooth customer booking experience while giving salon administrators complete control over staff, services, offers, bookings, customers, and salon content.

---

## ✨ Features

### 👤 Customer Experience

- Premium responsive salon website
- User registration and login
- JWT-based authentication
- Customer profile management
- Profile avatar
- Date of birth and preferences
- Saved/favourite services
- Appointment management
- Booking history
- Offers and promotions
- Notification preferences
- Password management

### 🛠️ Admin Management

- Protected admin dashboard
- Dashboard overview
- Staff management
- Service management
- Offer management
- Announcement management
- Booking management
- Customer management
- Gallery management
- Review management
- Salon settings
- Activate/deactivate records
- Search and filtering
- Role-based authorization

### 📅 Booking System

- Service selection
- Staff selection
- Date and time selection
- Booking creation
- Booking status management
- Staff assignment
- Appointment updates
- Cancellation handling

Supported booking statuses:

```text
Pending
Confirmed
Completed
Cancelled
No-show
````

### 💇 Staff Management

Administrators can manage:

* Staff name
* Profile image
* Role
* Specialization
* Experience
* Phone
* Email
* Services
* Working days
* Working hours
* Active/inactive status

### 💈 Service Management

Services can contain:

* Service name
* Description
* Category
* Price
* Duration
* Image
* Assigned staff
* Featured status
* Display order
* Active/inactive status

Changes made from the admin dashboard are stored in MongoDB and reflected through the API.

### 🎁 Offers & Announcements

Manage:

* Promotional offers
* Discount types
* Discount values
* Promo codes
* Start/end dates
* Featured offers
* Announcement messages
* Announcement locations
* Active/inactive campaigns

### 🖼️ Gallery

* Salon image gallery
* Image management
* Gallery item activation
* Admin-controlled content

---

# 🎨 Design & Experience

SalonX focuses on a premium cinematic salon experience.

### Visual direction

* Dark luxury aesthetic
* Neutral and ivory tones
* Champagne/gold accents
* Glassmorphism
* Smooth transitions
* Responsive layouts
* Premium typography
* Micro-interactions

### Animations

The frontend uses modern animation technologies including:

* GSAP
* ScrollTrigger
* Framer Motion
* Three.js / React Three Fiber
* Smooth scrolling
* Interactive UI elements
* Scroll-based animations
* 3D hero interactions

The goal is to create a polished experience rather than a traditional static salon website.

---

# 🧱 Tech Stack

## Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* Framer Motion
* GSAP
* Three.js
* React Three Fiber
* React Router
* Axios
* Lucide React

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* bcryptjs

## Security

* JWT authentication
* Role-based authorization
* Password hashing
* Helmet
* CORS
* Express rate limiting
* MongoDB sanitization
* Environment variables

---

# 📁 Project Structure

```text
Salon/
│
├── public/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── context/
│   └── ...
│
├── server/
│   ├── scripts/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── index.js
│   │
│   ├── uploads/
│   └── package.json
│
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
```

## 2. Navigate into the project

```bash
cd Salon
```

## 3. Install frontend dependencies

```bash
npm install
```

## 4. Install backend dependencies

```bash
cd server
npm install
cd ..
```

---

# 🔐 Environment Variables

Create the required environment files locally.

### Root `.env`

```env
VITE_API_URL=http://localhost:5000
```

### Server `.env`

```env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
```

> Never commit `.env` files or database credentials to GitHub.

---

# ▶️ Running the Project

From the project root:

```bash
npm run dev
```

This starts both:

### Frontend

```text
http://localhost:5173
```

### Backend

```text
http://localhost:5000
```

---

# 🗄️ Database

SalonX uses MongoDB Atlas for persistent data storage.

Main entities include:

```text
User
Staff
Service
Booking
Offer
Announcement
Gallery
Review
```

The backend handles database communication through Mongoose.

---

# 🔑 Authentication

SalonX uses JWT-based authentication.

Users are separated using roles such as:

```text
CUSTOMER
ADMIN
```

Protected backend routes verify authentication and authorization before allowing access to administrative functionality.

Frontend route protection is used for the user experience, while backend authorization remains the actual security boundary.

---

# 🔄 Data Flow

The application follows a full-stack data flow:

```text
Admin Dashboard
       │
       ▼
React Frontend
       │
       ▼
REST API
       │
       ▼
Express.js
       │
       ▼
Mongoose
       │
       ▼
MongoDB Atlas
       │
       ▼
Public Website / Customer Dashboard
```

For example:

```text
Admin creates service
        ↓
API receives request
        ↓
MongoDB stores service
        ↓
Public API fetches service
        ↓
Customer sees updated service
```

---

# 📱 Responsive Design

SalonX is designed to work across:

* Desktop
* Laptop
* Tablet
* Mobile

The interface adapts navigation, layouts, cards, forms, and booking interfaces for different screen sizes.

---

# 🧪 Development

Useful commands:

### Start development server

```bash
npm run dev
```

### Build frontend

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

### Run backend separately

```bash
cd server
npm run dev
```

---

# 🛡️ Security Notes

The following should never be committed:

```text
.env
.env.example
node_modules/
uploads/
dist/
.claude/
```

Make sure MongoDB credentials, JWT secrets, API keys, and other private credentials remain local.

---

# 🚀 Future Improvements

Potential future additions include:

* Online payment integration
* Email notifications
* SMS notifications
* WhatsApp booking notifications
* Advanced appointment calendar
* Staff availability management
* Customer loyalty system
* Membership plans
* Gift cards
* Advanced analytics
* Revenue reports
* Inventory management
* Product management
* Multi-branch salon support

---

# 👨‍💻 Development

SalonX is developed as a full-stack web application with a focus on:

* Modern UI/UX
* Scalable backend architecture
* Secure authentication
* Database-driven content
* Responsive design
* Smooth animations
* Maintainable code

---

# 📄 License

This project is intended for educational and development purposes.

Add your preferred license here if the project is released publicly.

---

## ✂️ SalonX

**Modern salon experience. Powerful management.**

Built with ❤️ using React, Node.js, Express and MongoDB.

````

Save this as:

```text
README.md
````

in your **root `Salon` folder**, alongside `package.json`.

Then:

```cmd
git add README.md
git commit -m "Add project README"
git push origin main
```

**One correction to your current `.gitignore` choice:** since you decided to ignore `.env.example` too, the README above does **not** require committing any `.env.example` file.

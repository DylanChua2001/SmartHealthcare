# SmartHealthcare - SATA Collateral Generator

An AI-powered tool that helps you create healthcare campaign materials (posters, social media posts, etc.) automatically. This guide will walk you through everything step-by-step, even if you've never used programming tools before!

---

## 📋 What You'll Need Before Starting

Before we begin, you'll need to install some software on your computer. Think of these as the "tools" needed to run the application:

### For Windows Users:

1. **Git** (for downloading the code)
   - Go to: https://git-scm.com/download/win
   - Download and install (click "Next" through all the steps)
   - This lets you download code from the internet

2. **Python 3.11 or newer** (runs the backend/brain of the app)
   - Go to: https://www.python.org/downloads/
   - Click the yellow "Download Python" button
   - **IMPORTANT**: When installing, check the box "Add Python to PATH" at the bottom
   - This is the programming language that powers the backend

3. **Node.js** (runs the frontend/website part)
   - Go to: https://nodejs.org/
   - Download the "LTS" version (recommended)
   - Install it (click "Next" through all steps)
   - This helps run the website interface

4. **Docker Desktop** (optional but recommended - makes setup easier)
   - Go to: https://www.docker.com/products/docker-desktop
   - Download and install
   - Create a free Docker account when prompted
   - This creates a "container" that runs everything automatically

5. **A Text Editor** (to edit configuration files)
   - We recommend **Notepad++**: https://notepad-plus-plus.org/downloads/
   - Or use Windows Notepad (already on your computer)

---

## 🚀 Step-by-Step Setup Guide

### Step 1: Download the Code

1. Open **Command Prompt** (press Windows key, type "cmd", press Enter)
2. Navigate to where you want to save the project (e.g., your Desktop):
   ```bash
   cd Desktop
   ```
3. Download the code by typing:
   ```bash
   git clone https://github.com/DylanChua2001/SmartHealthcare.git
   ```
4. Move into the project folder:
   ```bash
   cd SmartHealthcare
   ```

**What just happened?** You copied all the code files from the internet to your computer!

---

### Step 2: Get Your AI API Key

The app uses Google's AI to generate content. You need a special "key" (like a password) to use it:

1. Go to: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Click **"Create API key in new project"**
5. Copy the long code that appears (it looks like: `AIzaSyD...`)
6. **Save this somewhere safe** - you'll need it in the next step!

**What is this?** Think of it as a ticket that lets you use Google's AI brain. It's free for basic use!

---

### Step 3: Set Up the Backend (The Brain)

The backend is the "brain" that processes your requests and talks to the AI.

#### Easy Method (Using Docker):

1. Make sure Docker Desktop is running (you should see a whale icon in your taskbar)
2. In Command Prompt, type:
   ```bash
   cd backend
   ```
3. Create a file called `.env` (this stores your secret key):
   - Right-click in the `backend` folder
   - Select "New" → "Text Document"
   - Name it `.env` (delete the `.txt` part)
   - If Windows asks "Are you sure?", click "Yes"
4. Open `.env` with Notepad and add these two lines:
   ```
   GOOGLE_GENAI_API_KEY=paste_your_api_key_here
   ALLOWED_ORIGINS=http://localhost:3000
   ```
   - Replace `paste_your_api_key_here` with the key you copied earlier
   - Save and close the file
5. Back in Command Prompt, type:
   ```bash
   docker-compose up --build
   ```
6. Wait 2-5 minutes while it sets everything up
7. You should see "Application startup complete"

**What just happened?** Docker created a mini-computer inside your computer that runs the backend automatically!

#### Alternative Method (Without Docker):

If Docker doesn't work, follow these steps:

1. In Command Prompt, navigate to backend:
   ```bash
   cd backend
   ```
2. Create the `.env` file (same as step 3-4 above)
3. Create a virtual environment (a safe space for Python):
   ```bash
   python -m venv .venv
   ```
4. Activate it:
   ```bash
   .venv\Scripts\activate
   ```
   - Your command prompt should now show `(.venv)` at the start
5. Install required packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
   - This might take 3-5 minutes
6. Start the backend:
   ```bash
   uvicorn main:app --reload
   ```

**Leave this Command Prompt window open!** The backend needs to keep running.

---

### Step 4: Set Up the Frontend (The Website)

The frontend is the website you'll actually see and interact with.

1. Open a **NEW** Command Prompt window (press Windows key, type "cmd", press Enter)
2. Navigate to the frontend folder:
   ```bash
   cd Desktop\SmartHealthcare\frontend\sata
   ```
   - Adjust the path if you saved the project somewhere else
3. Create a `.env.local` file:
   - Right-click in the `frontend\sata` folder
   - Select "New" → "Text Document"
   - Name it `.env.local` (delete the `.txt` part)
4. Open `.env.local` with Notepad and add:
   ```
   BACKEND_URL=http://localhost:8000
   ```
   - Save and close
5. Install the website components:
   ```bash
   npm install
   ```
   - This takes 2-5 minutes and installs all the website pieces
6. Start the website:
   ```bash
   npm run dev
   ```
7. Wait until you see "Ready in X seconds"

**What just happened?** You set up the website interface that you'll use to create campaign materials!

---

## ✅ Using the Application

1. Open your web browser (Chrome, Edge, Firefox, etc.)
2. Go to: **http://localhost:3000**
3. You should see the SmartHealthcare app!
4. Fill in the form:
   - **Core Idea**: What's your campaign about? (e.g., "Promote diabetes screening")
   - **Target Audience**: Who is this for? (e.g., "Adults 40-60 years old")
   - **Writing Style**: How should it sound? (e.g., "Friendly and encouraging")
   - **Reference Image** (optional): Upload an image for inspiration
5. Click **"Generate Collateral"**
6. Wait 30-60 seconds for the AI to create your content
7. View your results and click **"Edit"** to customize further!

**Troubleshooting:**
- If the page doesn't load, make sure both Command Prompt windows are still running
- If you get an error, check that your API key is correct in the `.env` file

---

## � Hosting on the Internet (Using Render)

Want others to access your app online? You can host it for free on Render! This makes your app accessible from anywhere, not just your computer.

### What is Render?
Render is like a computer in the cloud that runs your application 24/7. Think of it as renting space on the internet.

### Prerequisites:
1. A GitHub account (create one free at https://github.com)
2. A Render account (create one free at https://render.com)

---

### Part 1: Upload Your Code to GitHub

1. Go to https://github.com and sign in
2. Click the **"+"** in the top right → **"New repository"**
3. Name it "SmartHealthcare"
4. Click **"Create repository"**
5. Follow the instructions to upload your code:
   - Open Command Prompt in your SmartHealthcare folder
   - Type these commands one by one:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/YourUsername/SmartHealthcare.git
     git push -u origin main
     ```
   - Replace `YourUsername` with your actual GitHub username

**What just happened?** You uploaded your code to GitHub so Render can access it!

---

### Part 2: Deploy the Backend (The Brain)

1. Go to https://render.com and sign in
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect account"** and choose GitHub
4. Find your "SmartHealthcare" repository and click **"Connect"**
5. Fill in these settings:
   - **Name**: `smarthealthcare-backend` (or any name you like)
   - **Root Directory**: Type `backend`
   - **Environment**: Choose **"Docker"**
   - **Region**: Choose the one closest to you
   - **Branch**: `main`
   - **Plan**: Choose **"Free"** (it's enough for testing!)
6. Click **"Advanced"** and add environment variables:
   - Click **"Add Environment Variable"**
   - **Key**: `GOOGLE_GENAI_API_KEY`
   - **Value**: Paste your Google AI key
   - Click **"Add Environment Variable"** again
   - **Key**: `ALLOWED_ORIGINS`
   - **Value**: `*` (this allows any website to connect - we'll update this later)
7. Click **"Create Web Service"**
8. Wait 5-10 minutes for it to deploy
9. Once done, you'll see a URL like: `https://smarthealthcare-backend.onrender.com`
10. **COPY THIS URL** - you'll need it for the frontend!

**What just happened?** Your backend is now running on the internet 24/7!

---

### Part 3: Deploy the Frontend (The Website)

1. Still on Render, click **"New +"** → **"Web Service"**
2. Select your "SmartHealthcare" repository again
3. Fill in these settings:
   - **Name**: `smarthealthcare-frontend`
   - **Root Directory**: Type `frontend/sata`
   - **Environment**: Choose **"Node"**
   - **Build Command**: Type `npm install && npm run build`
   - **Start Command**: Type `npm start`
   - **Plan**: Choose **"Free"**
4. Click **"Advanced"** and add an environment variable:
   - Click **"Add Environment Variable"**
   - **Key**: `BACKEND_URL`
   - **Value**: Paste the backend URL from Part 2 (e.g., `https://smarthealthcare-backend.onrender.com`)
5. Click **"Create Web Service"**
6. Wait 5-10 minutes for it to deploy
7. Once done, you'll see a URL like: `https://smarthealthcare-frontend.onrender.com`

**What just happened?** Your website is now live on the internet!

---

### Part 4: Update Backend Security

Now that we know the frontend URL, let's update the backend security:

1. Go back to your backend service on Render
2. Click **"Environment"** in the left sidebar
3. Find `ALLOWED_ORIGINS` and click **"Edit"**
4. Change the value to your frontend URL: `https://smarthealthcare-frontend.onrender.com`
5. Click **"Save Changes"**
6. The backend will automatically restart (wait 2-3 minutes)

**What just happened?** You told the backend to only accept requests from your official website, making it more secure!

---

### 🎉 You're Done!

Visit your frontend URL (e.g., `https://smarthealthcare-frontend.onrender.com`) and your app should work!

**Important Notes:**
- Free Render services "sleep" after 15 minutes of inactivity
- The first visit after sleeping takes 30-60 seconds to wake up
- Both services will restart themselves, just be patient!
- If you see errors, wait a few minutes and refresh

---

## ❓ Common Problems and Solutions

### "Cannot connect to backend"
- Check that both Command Prompt windows are running (for local setup)
- Make sure you entered the correct API key in the `.env` file
- Try restarting both the backend and frontend

### "API key is invalid"
- Go back to https://aistudio.google.com/apikey
- Delete your old key and create a new one
- Update the `.env` file with the new key
- Restart the backend

### "Port 3000 is already in use"
- Something else is using port 3000
- Close other programs or restart your computer
- Try running the frontend again

### "npm command not found"
- Node.js wasn't installed correctly
- Reinstall Node.js and make sure to click through all installation steps
- Restart Command Prompt

### "python command not found"
- Python wasn't installed correctly
- Reinstall Python and CHECK the box "Add Python to PATH"
- Restart Command Prompt

### "docker-compose not found"
- Docker Desktop isn't running
- Look for the whale icon in your taskbar
- Click it and make sure Docker is running
- Try the command again

### Website loads but nothing happens when I click "Generate"
- Check that the backend is running (look at the Command Prompt window)
- Verify your API key is correct
- Check your internet connection (the AI needs internet to work)

---

## 💡 Tips for Using the App

1. **Be Specific**: The more detail you give, the better the results
   - Instead of "diabetes campaign", try "diabetes screening campaign for working adults aged 40-60"
   
2. **Try Different Styles**: Experiment with writing styles
   - "Professional and informative"
   - "Warm and encouraging"
   - "Urgent and action-oriented"
   
3. **Use Reference Images**: Upload a logo or style reference to guide the AI

4. **Refine Results**: Don't like something? Use the "Refine" feature to improve it

5. **Edit Manually**: Use the editor to adjust colors, text, and layout exactly how you want

---

## 🛑 Stopping the Application

When you're done using the app:

1. Go to each Command Prompt window
2. Press `Ctrl + C` on your keyboard
3. Type `Y` if asked to confirm
4. Close the Command Prompt windows

**For Docker users:**
- Press `Ctrl + C` in the Command Prompt
- Or open Docker Desktop and stop the container manually

---

## � Understanding the Project Structure

Here's what each folder contains (you don't need to understand this to use the app, but it's helpful if you're curious!):

```
SmartHealthcare/
├── backend/                    # The "brain" of the app
│   ├── .env                    # Your secret API key (YOU CREATE THIS)
│   ├── Dockerfile              # Instructions for Docker
│   ├── docker-compose.yml      # Docker setup file
│   ├── main.py                 # Main backend code
│   └── requirements.txt        # List of Python packages needed
│
└── frontend/                   # The website you see
    └── sata/
        ├── .env.local          # Backend connection info (YOU CREATE THIS)
        ├── app/                # Website pages
        ├── components/         # Website building blocks
        ├── package.json        # List of website packages needed
        └── next.config.ts      # Website settings
```

**Simple explanation:**
- `backend/` = The smart part that talks to AI
- `frontend/` = The pretty part you click and type into
- `.env` files = Secret settings (like passwords)
- Other files = Instructions for the computer

---

## � Quick Reference: Important Files You'll Create

| File | Location | What to Put Inside | Why It's Needed |
|------|----------|-------------------|-----------------|
| `.env` | `backend/` folder | Your Google AI key + `ALLOWED_ORIGINS` | Lets the backend use AI |
| `.env.local` | `frontend/sata/` folder | Backend URL | Connects website to brain |

**Example of `backend/.env`:**
```
GOOGLE_GENAI_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXX
ALLOWED_ORIGINS=http://localhost:3000
```

**Example of `frontend/sata/.env.local`:**
```
BACKEND_URL=http://localhost:8000
```

---

## 🎓 Learning Resources

Want to understand what's happening behind the scenes?

- **What is Python?** - The language that powers the backend
  - Free course: https://www.codecademy.com/learn/learn-python-3
  
- **What is JavaScript/Node.js?** - The language for websites
  - Free course: https://www.codecademy.com/learn/introduction-to-javascript
  
- **What is Docker?** - Container technology
  - Beginner guide: https://docker-curriculum.com/
  
- **What is an API?** - How the frontend and backend talk
  - Simple explanation: https://www.freecodecamp.org/news/what-is-an-api-in-english-please/

---

## 🆘 Need More Help?

### Option 1: Watch Video Tutorials
Search YouTube for:
- "How to install Python on Windows"
- "How to install Node.js"
- "How to use Command Prompt"
- "Git for beginners"

### Option 2: Ask for Technical Help
If you're stuck, take a screenshot of:
1. The error message you're seeing
2. The Command Prompt window
3. Your folder structure

Then ask someone technical for help, or open an issue on GitHub: https://github.com/DylanChua2001/SmartHealthcare/issues

### Option 3: Start with Docker (Easiest)
If all else fails, Docker is the easiest method:
1. Install Docker Desktop
2. Create the `backend/.env` file with your API key
3. Run `docker-compose up --build` in the backend folder
4. That's it for the backend!

---

## 📝 License & Information

This project was created for **SATA CommHealth Singapore** as part of a Smart Healthcare initiative.

**What you can do:**
- Use this app to create campaign materials
- Share it with your team
- Learn from the code

**What you need permission for:**
- Selling this app
- Removing SATA branding
- Using it for commercial purposes outside SATA

---

## 🎉 Congratulations!

If you made it this far and got the app running, you've just:
- ✅ Downloaded code from the internet
- ✅ Set up a development environment
- ✅ Configured environment variables
- ✅ Run a full-stack application
- ✅ Maybe even deployed to the cloud!

That's impressive, especially if this was your first time! You've learned skills that many people take weeks to master.

**Next steps:**
- Try creating some campaign materials
- Experiment with different prompts
- Share this with your team
- Give feedback on what could be improved

**Questions?** Open an issue: https://github.com/DylanChua2001/SmartHealthcare/issues

---

## � Quick Contact

- **GitHub Repository**: https://github.com/DylanChua2001/SmartHealthcare
- **Report Issues**: https://github.com/DylanChua2001/SmartHealthcare/issues
- **SATA CommHealth**: For official support regarding the project

---

*Last updated: November 11, 2025*

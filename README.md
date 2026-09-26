# Job Application Tracker

A simple three-tier **Job Application Tracker** built to demonstrate a practical application architecture and provide a foundation for DevOps work.

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Nginx
    
- **Backend:** Node.js, Express
    
- **Database:** MySQL 8
    
- **Containerization:** Docker
    
- **Networking:** Docker bridge network
    
- **Deployment:** Manual Docker containers
    
- **Orchestration:** Docker Compose is intentionally not used
    

## Features

The application allows users to:

- Add job applications
    
- View applications
    
- Delete applications
    
- Track application status
    
- Store company, position, location, application date, and notes
    

---

# Architecture

```text
                         Browser
                            |
                            | http://localhost:8080
                            v
                    +---------------+
                    |   Frontend    |
                    |     Nginx     |
                    |      :80      |
                    +-------+-------+
                            |
                            | HTTP API
                            v
                    +---------------+
                    |    Backend    |
                    | Node + Express|
                    |     :5000     |
                    +-------+-------+
                            |
                            | MySQL
                            | db:3306
                            v
                    +---------------+
                    |   Database    |
                    |    MySQL 8    |
                    |     :3306     |
                    +---------------+

                    Docker Network:
                      job-app-net
```

The three tiers are:

1. **Presentation Tier** — Frontend served by Nginx
    
2. **Application Tier** — Node.js + Express REST API
    
3. **Data Tier** — MySQL database
    

---

# Project Structure

```text
job-application-tracker/
│
├── .gitignore
├── README.md
│
├── backend/
│   ├── .dockerignore
│   ├── .env
│   ├── .env.example
│   ├── Dockerfile
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── database/
│   ├── Dockerfile
│   └── schema.sql
│
└── frontend/
    ├── .dockerignore
    ├── Dockerfile
    ├── app.js
    ├── index.html
    └── style.css
```

> **Important:** `backend/.env` contains database credentials and should not be committed to Git.

---

# Prerequisites

## Local Execution

Install:

- Node.js 18+
    
- npm
    
- MySQL 8+
    

Check the versions:

```bash
node --version
npm --version
mysql --version
```

## Docker Execution

Install:

- Docker Engine
    
- Docker CLI
    

Verify Docker:

```bash
docker --version
```

```bash
docker info
```

---

# Part 1 — Run Locally Without Docker

It is recommended to verify that the application works locally before introducing Docker.

This separates **application problems** from **container/networking problems**.

---

## 1. Start MySQL

Make sure MySQL is running.

On Ubuntu:

```bash
sudo systemctl status mysql
```

If it is not running:

```bash
sudo systemctl start mysql
```

Login to MySQL:

```bash
mysql -u root -p
```

Create the database:

```sql
CREATE DATABASE IF NOT EXISTS job_tracker;
```

Create the application user:

```sql
CREATE USER IF NOT EXISTS 'jobapp'@'localhost'
IDENTIFIED BY 'jobapp123';
```

Grant permissions:

```sql
GRANT ALL PRIVILEGES ON job_tracker.* TO 'jobapp'@'localhost';

FLUSH PRIVILEGES;
```

Select the database:

```sql
USE job_tracker;
```

Create the applications table:

```sql
CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Applied',
    application_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

# 2. Configure the Backend

Move into the backend directory:

```bash
cd backend
```

Create the `.env` file:

```bash
nano .env
```

Add:

```env
PORT=5000

DB_HOST=localhost
DB_USER=jobapp
DB_PASSWORD=jobapp123
DB_NAME=job_tracker
DB_PORT=3306
```

### Important: `DB_HOST`

For local execution:

```env
DB_HOST=localhost
```

For Docker execution:

```env
DB_HOST=db (Container name for mysql comes later on)
```

These values are different because they represent different networking environments.

---

# 3. Install Backend Dependencies

From the `backend` directory:

```bash
npm install
```

Start the backend:

```bash
npm start
```

Expected output:

```text
Backend server running on http://localhost:5000
```

---

# 4. Test the Backend

Open another terminal.

Test the health endpoint:

```bash
curl http://localhost:5000/health
```

Expected:

```json
{
    "status": "OK",
    "database": "Connected"
}
```

Test the applications endpoint:

```bash
curl http://localhost:5000/api/applications
```

A fresh database should return:

```json
[]
```

---

# 5. Run the Frontend Locally

The frontend consists of static HTML, CSS, and JavaScript.

Move into the frontend directory:

```bash
cd frontend
```

You can use Python's built-in HTTP server:

```bash
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

The frontend communicates with the backend through:

```text
http://localhost:5000/api/applications
```

Therefore, the Node.js backend must be running on port `5000`.

---

# Part 2 — Run With Docker

## Recommendation: If you are familiar with Docker already(easy and fast setup), go to the  bottom for (Quick Start) Section.


The Docker deployment should consist of three containers:

```text
frontend
backend
db
```

All three containers communicate through the Docker bridge network:

```text
job-app-net
```

Docker Compose is intentionally not required.

---

# 1. Create the Docker Network

Create the application network:

```bash
docker network create job-app-net
```

Verify:

```bash
docker network ls
```

You should see:

```text
job-app-net
```

---

# 2. Build the Database Image

From the project root:

```bash
docker build -t job-app-db ./database
```

Verify:

```bash
docker images | grep job-app-db
```

---

# 3. Create a MySQL Volume

Create a named Docker volume for persistent database storage:

```bash
docker volume create job-app-db-data
```

The volume allows MySQL data to survive container removal.

---

# 4. Start the Database Container

Run:

```bash
docker run -d \
  --name db \
  --network job-app-net \
  --mount source=job-app-db-data,target=/var/lib/mysql \
  job-app-db
```

Check the container:

```bash
docker ps
```

Wait until the database becomes healthy:

```text
db ... (healthy)
```

The MySQL container has a health check, so initialization may take a short amount of time.

---

# 5. Verify the Database

Before starting the backend, verify that MySQL was initialized correctly.

Enter MySQL:

```bash
docker exec -it db mysql -u root -p
```

Enter the configured MySQL root password.

Check the users:

```sql
SELECT user, host FROM mysql.user;
```

You should have:

```text
jobapp    %
```

Check permissions:

```sql
SHOW GRANTS FOR 'jobapp'@'%';
```

You should see privileges for:

```text
job_tracker.*
```

Check the database:

```sql
USE job_tracker;
```

Check the tables:

```sql
SHOW TABLES;
```

Check the table structure:

```sql
DESCRIBE applications;
```

The table should contain:

```text
id
company
position
location
status
application_date
notes
created_at
```

Do not continue until these checks work.

---

# 6. Build the Backend Image

From the project root:

```bash
docker build -t job-app-backend ./backend
```

---

# 7. Start the Backend Container

Run:

```bash
docker run -d \
  --name backend \
  --network job-app-net \
  --env-file ./backend/.env \
  -p 5000:5000 \
  job-app-backend
```

For Docker execution, `backend/.env` should contain:

```env
PORT=5000

DB_HOST=db
DB_USER=jobapp
DB_PASSWORD=jobapp123
DB_NAME=job_tracker
DB_PORT=3306
```

## Why `DB_HOST=db`?

Inside the backend container:

```text
localhost
```

means:

```text
the backend container itself
```

It does **not** mean the MySQL container.

The MySQL container is named:

```text
db
```

Both containers are connected to:

```text
job-app-net
```

Docker's internal DNS allows the backend to resolve:

```text
db
```

to the MySQL container.

Therefore:

```env
DB_HOST=db
```

is required for the Docker deployment.

---

# 8. Test Backend → Database Connectivity

Test the backend health endpoint:

```bash
curl http://localhost:5000/health
```

Expected:

```json
{
    "status": "OK",
    "database": "Connected"
}
```

If the database is disconnected, check the backend logs:

```bash
docker logs backend
```

Check that the backend can resolve the database container:

```bash
docker exec backend getent hosts db
```

You should receive an IP address similar to:

```text
172.x.x.x db
```

Test whether MySQL port `3306` is reachable:

```bash
docker exec backend node -e "
const net=require('net');
const s=net.createConnection(3306,'db',()=>{
  console.log('MYSQL PORT REACHABLE');
  s.end()
});
s.on('error',e=>console.error(e.message))
"
```

Expected:

```text
MYSQL PORT REACHABLE
```

---

# 9. Test the Backend API

Get applications:

```bash
curl http://localhost:5000/api/applications
```


The newly created application should now appear, if empty [].

---

# 10. Build the Frontend Image

From the project root:

```bash
docker build -t job-app-frontend ./frontend
```

---

# 11. Start the Frontend Container

Run:

```bash
docker run -d \
  --name frontend \
  --network job-app-net \
  -p 8080:80 \
  job-app-frontend
```

Check all containers:

```bash
docker ps
```

You should have:

```text
frontend
backend
db
```

Example port mappings:

```text
frontend   0.0.0.0:8080->80/tcp
backend    0.0.0.0:5000->5000/tcp
db         3306/tcp
```

Notice that MySQL does **not** need to be exposed to the host.

The backend communicates with MySQL internally through:

```text
db:3306
```

---

# 12. Open the Application

Open:

```text
http://localhost:8080
```

Test the application:

- Load applications
    
- Add an application
    
- Refresh the page
    
- Delete an application
    
- Verify that data persists
    

---

# Final Docker Architecture

```text
                         Docker Host
                              |
                +-------------+-------------+
                |                           |
             :8080                         :5000
                |                           |
                v                           v
        +---------------+           +---------------+
        |   frontend    |           |    backend    |
        |     Nginx     |           | Node/Express  |
        |      :80      |           |     :5000     |
        +---------------+           +-------+-------+
                                            |
                                            | db:3306
                                            v
                                    +---------------+
                                    |      db       |
                                    |    MySQL 8    |
                                    |     :3306     |
                                    +---------------+

                         job-app-net
```

---


# Useful Docker Commands

### List running containers

```bash
docker ps
```

### List all containers

```bash
docker ps -a
```

### View logs

```bash
docker logs backend
```

```bash
docker logs db
```

```bash
docker logs frontend
```

### Follow logs

```bash
docker logs -f backend
```

### Enter a container

```bash
docker exec -it db bash
```

### Enter MySQL

```bash
docker exec -it db mysql -u root -p
```

### Check environment variables

```bash
docker exec backend printenv
```

### Inspect the Docker network

```bash
docker network inspect job-app-net
```

### Stop all application containers

```bash
docker stop frontend backend db
```

### Remove all application containers

```bash
docker rm frontend backend db
```
---

# Quick Start 

For a fresh Docker deployment:

```bash
docker network create job-app-net
```

```bash
docker build -t job-app-db ./database
```

```bash
docker volume create job-app-db-data
```

```bash
docker run -d \
  --name db \
  --network job-app-net \
  --mount source=job-app-db-data,target=/var/lib/mysql \
  job-app-db
```

Wait for MySQL to become healthy:

```bash
docker ps
```

Build the backend:

```bash
docker build -t job-app-backend ./backend
```

Start the backend:

```bash
docker run -d \
  --name backend \
  --network job-app-net \
  --env-file ./backend/.env \
  -p 5000:5000 \
  job-app-backend
```

Test:

```bash
curl http://localhost:5000/health
```

Expected:

```json
{"status":"OK","database":"Connected"}
```

Build the frontend:

```bash
docker build -t job-app-frontend ./frontend
```

Start the frontend:

```bash
docker run -d \
  --name frontend \
  --network job-app-net \
  -p 8080:80 \
  job-app-frontend
```

Open:

```text
http://localhost:8080
```

---

## Docker Compose (Recommended)
The most efficient way to orchestrate all services with a single command.

1. Ensure you are in the root directory:
   ```bash
   docker compose up --build -d
   ```

2. To stop everything:
   ```bash
   docker compose down
   ```

---

## 🔗 Access Ports & Health
| Service | URL | Note |
| :--- | :--- | :--- |
| **Frontend** | [http://localhost:8080](http://localhost:8080) | Web Interface |
| **Backend** | [http://localhost:5000](http://localhost:5000) | JSON API |


---

# Conclusion

This project demonstrates a three-tier architecture without Docker Compose:

```text
Frontend
   |
   v
Backend
   |
   v
Database
```

The containers communicate through:

```text
job-app-net
```

The frontend is exposed on:

```text
8080
```

The backend is exposed on:

```text
5000
```

The database remains internal to the Docker network:

```text
db:3306
```


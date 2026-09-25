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

## Recommendation: For fast setup with cmd only, go to the  bottom for (Quick Start)


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

Create an application:

```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "company": "Google",
    "position": "DevOps Engineer",
    "location": "Bangalore",
    "status": "Applied",
    "application_date": "2026-09-26",
    "notes": "Docker project"
  }'
```

Check the applications again:

```bash
curl http://localhost:5000/api/applications
```

The newly created application should now appear.

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

# AWS Deployment

If the containers are running on an AWS EC2 instance, you can access the application using either:

1. AWS Security Group + browser access
    
2. SSH local port forwarding
    

---

## Option A — AWS Security Group

Add an inbound rule to the EC2 Security Group:

```text
Type: Custom TCP
Port: 8080
Source: Your IP
```

Then access:

```text
http://<EC2-PUBLIC-IP>:8080
```

For learning purposes, restrict the source to your own IP whenever possible instead of exposing the port to everyone.

### Do not expose MySQL

Do not expose:

```text
3306
```

publicly.

The intended architecture is:

```text
Internet
   |
   v
EC2 :8080
   |
   v
frontend
   |
   v
backend
   |
   v
db:3306
```

MySQL remains internal to the Docker network.

---

# Option B — SSH Local Port Forwarding

If you do not want to expose port `8080` publicly, use SSH local port forwarding.

From Windows PowerShell:

```powershell
ssh -p <SSH_PORT> -L 8080:localhost:8080 <USER>@<SERVER>
```

Example:

```powershell
ssh -p 2250 -L 8080:localhost:8080 user-abhi@localhost
```

Keep the SSH terminal open.

Then open:

```text
http://localhost:8080
```

The traffic path becomes:

```text
Windows Browser
      |
      | localhost:8080
      v
SSH Tunnel
      |
      v
Remote Server localhost:8080
      |
      v
Docker Frontend :8080
```

The SSH username must be your actual Linux username.

For example:

```text
user-abhi@devops
```

means the username is:

```text
user-abhi
```

---

# Troubleshooting

## Backend reports database disconnected

Check:

```bash
docker exec backend printenv | grep '^DB_'
```

You need:

```text
DB_HOST=db
DB_USER=jobapp
DB_PASSWORD=jobapp123
DB_NAME=job_tracker
DB_PORT=3306
```

Then check:

```bash
docker logs backend
```

---

## `jobapp` access denied

Enter MySQL:

```bash
docker exec -it db mysql -u root -p
```

Check:

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

If necessary:

```sql
CREATE USER 'jobapp'@'%' IDENTIFIED BY 'jobapp123';

GRANT ALL PRIVILEGES
ON job_tracker.*
TO 'jobapp'@'%';

FLUSH PRIVILEGES;
```

---

## `schema.sql` changes are not being applied

MySQL initialization scripts are executed when the MySQL data directory is initialized.

If an existing Docker volume already contains database data, changing `schema.sql` does not automatically recreate the database.

Check:

```bash
docker volume ls
```

For a development environment where you intentionally want a completely fresh database:

```bash
docker stop db
```

```bash
docker rm db
```

```bash
docker volume rm job-app-db-data
```

Then recreate the volume and database container.

> **Warning:** Removing the volume deletes the database data stored in it.

---

## Backend cannot resolve `db`

Check:

```bash
docker exec backend getent hosts db
```

Check the network:

```bash
docker network inspect job-app-net
```

Both `backend` and `db` should be connected to:

```text
job-app-net
```

You can also check individually:

```bash
docker inspect backend | grep -iA 4 network
```

```

---

## Backend can resolve `db` but cannot connect

Test:

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

If this fails, check:

```bash
docker logs db
```

and:

```bash
docker ps
```

---

## Frontend loads but applications do not appear

Test the backend directly:

```bash
curl http://localhost:5000/api/applications
```

If the API works, inspect the browser developer console.

The frontend currently communicates with:

```javascript
const API_URL = "http://localhost:5000/api/applications";
```

Therefore, the browser must be able to reach port `5000`.

For an AWS deployment, either expose the backend appropriately or introduce an Nginx reverse proxy/API routing configuration.

---

## Frontend works locally but not through AWS

Check:

```bash
docker ps
```

You should have:

```text
0.0.0.0:8080->80/tcp
```

Then check the AWS Security Group.

For direct browser access:

```text
EC2 Security Group
        |
        v
     TCP 8080
        |
        v
       EC2
        |
        v
Docker frontend
```

If using SSH port forwarding, you do not need to publicly expose port `8080`.

---

## Port already in use

If Docker reports:

```text
Bind for 0.0.0.0:8080 failed: port is already allocated
```

Check:

```bash
sudo lsof -i :8080
```

or:

```bash
docker ps
```

You can use another host port:

```bash
docker run -d \
  --name frontend \
  --network job-app-net \
  -p 8081:80 \
  job-app-frontend
```

Then access:

```text
http://localhost:8081
```

---

## Container exits immediately

Check:

```bash
docker ps -a
```

Then inspect its logs:

```bash
docker logs <container-name>
```

For example:

```bash
docker logs backend
```

```bash
docker logs db
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

# Debugging Workflow

When something doesn't work, troubleshoot each layer instead of immediately rebuilding everything.

```text
1. Is the container running?
        |
        v
   docker ps
        |
        v
2. What does the log say?
        |
        v
   docker logs <container>
        |
        v
3. Is it on the correct network?
        |
        v
   docker network inspect job-app-net
        |
        v
4. Can containers resolve each other?
        |
        v
   getent hosts db
        |
        v
5. Is the required port reachable?
        |
        v
   connection test
        |
        v
6. Are environment variables correct?
        |
        v
   docker exec <container> printenv
        |
        v
7. Test the application endpoint
        |
        v
   curl localhost:5000/health
```

This gives you a systematic troubleshooting process instead of randomly deleting and rebuilding containers.

---

# Quick Start — Docker

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

For remote access, the application can be accessed through either:

1. AWS Security Group + browser access
    
2. SSH local port forwarding
    

The project is intentionally built with **manual Docker commands** so that container networking, volumes, environment variables, health checks, image building, and container communication can be understood individually before introducing Docker Compose or Kubernetes.
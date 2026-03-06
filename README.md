# RAG Deadlock Detection

A web-based visualization tool to demonstrate **Deadlock Detection using Resource Allocation Graphs (RAG)**.  
This project allows users to create processes and resources, visualize their relationships, and detect deadlocks by identifying circular wait conditions.

The project is designed as an **educational tool** for understanding operating system concepts such as **deadlock, resource allocation graphs, and cycle detection**.

---

## Features

- Interactive **Resource Allocation Graph visualization**
- Add **Processes and Resources**
- Create **Request and Allocation edges**
- Automatic **Deadlock Detection**
- Highlights **circular waits in the graph**
- Simple and intuitive **web interface**
- Demonstrates **Operating System deadlock concepts**

---

## Technologies Used

- HTML  
- CSS  
- JavaScript  
- D3.js (for graph visualization)

---

## Project Demo

Live Demo:  
(https://nitesh4456.github.io/RAG-Deadlock_detection/)

---

## How Deadlock Detection Works

The system models processes and resources using a **Resource Allocation Graph (RAG)**.

### Nodes
- Process nodes (P)
- Resource nodes (R)

### Edges
- **Request edge:** Process → Resource  
- **Allocation edge:** Resource → Process  

A **deadlock occurs when a cycle exists in the graph**, meaning processes are waiting on each other in a circular chain.

Example:

P1 → R1 → P2 → R2 → P1

This circular dependency indicates a **deadlock state**.

---

## Project Structure

RAG-Deadlock_detection
│
├── index.html  
├── style.css  
├── script.js  
├── images/  
└── README.md  

---

## Installation

Clone the repository:

git clone https://github.com/nitesh4456/RAG-Deadlock_detection.git

Open the project folder and run:

index.html

in your browser.

No additional setup is required.

---

## Usage

1. Open the application in a browser  
2. Add **process nodes** and **resource nodes**  
3. Create **request or allocation edges**  
4. The system automatically detects **deadlock cycles**  
5. Deadlock edges are highlighted in the graph

---

## Educational Purpose

This project helps students understand:

- Deadlock conditions  
- Resource Allocation Graphs  
- Circular wait detection  
- Operating system resource management  

---

## Author

**Nitesh Verma** & **Jayesh Raj Neti**  

---

## License
This project is licensed under the MIT License.

# Inventory & Order Management System

A production-ready, fully containerized full-stack application to manage
products, customers, orders, and inventory.

- **Frontend:** React (Vite, JavaScript) + React Router + Axios
- **Backend:** Python + FastAPI + SQLAlchemy
- **Database:** PostgreSQL
- **Containerization:** Docker + Docker Compose

---

## Features

- **Products** — create, list, view, update, delete (unique SKU, non-negative stock/price)
- **Customers** — create, list, view, delete (unique email)
- **Orders** — multi-item orders with automatic stock deduction, server-computed totals, and stock restoration on cancellation
- **Dashboard** — totals for products/customers/orders and a low-stock report
- Responsive UI, client + server side validation, clear success/error toasts

---

## Architecture

```
React (nginx)  ->  FastAPI (uvicorn)  ->  PostgreSQL
   frontend           backend                 db
```

---

## Quick start (Docker Compose)

Prerequisites: Docker + Docker Compose.

```bash
# 1. Create your env file from the template
cp .env.example .env   # adjust credentials if you like

# 2. Build and start everything
docker compose up --build
```

Then open:

| Service        | URL                          |
|----------------|------------------------------|
| Frontend       | http://localhost:3000        |
| Backend API    | http://localhost:8000        |
| API docs       | http://localhost:8000/docs   |
| Health check   | http://localhost:8000/health |

Sample products and customers are seeded automatically on first run.

To stop and remove containers (data persists in the `pgdata` named volume):

```bash
docker compose down
```

To also wipe the database volume:

```bash
docker compose down -v
```

---

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # point DATABASE_URL at a local Postgres
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

---

## API reference

Base URL: `http://localhost:8000`

### Products
| Method | Path             | Description            |
|--------|------------------|------------------------|
| POST   | `/products`      | Create a product       |
| GET    | `/products`      | List products          |
| GET    | `/products/{id}` | Get a product          |
| PUT    | `/products/{id}` | Update a product       |
| DELETE | `/products/{id}` | Delete a product       |

### Customers
| Method | Path              | Description       |
|--------|-------------------|-------------------|
| POST   | `/customers`      | Create a customer |
| GET    | `/customers`      | List customers    |
| GET    | `/customers/{id}` | Get a customer    |
| DELETE | `/customers/{id}` | Delete a customer |

### Orders
| Method | Path           | Description                  |
|--------|----------------|------------------------------|
| POST   | `/orders`      | Create an order              |
| GET    | `/orders`      | List orders                  |
| GET    | `/orders/{id}` | Get an order with line items |
| DELETE | `/orders/{id}` | Cancel/delete an order       |

### Dashboard
| Method | Path                 | Description       |
|--------|----------------------|-------------------|
| GET    | `/dashboard/summary` | Aggregate summary |

#### Example: create an order

```bash
curl -X POST http://localhost:8000/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_id": 1, "items": [{"product_id": 1, "quantity": 2}]}'
```

---

## Business rules

- Product SKU and customer email are unique (HTTP 409 on conflict).
- Product quantity and price cannot be negative (validation + DB CHECK constraints).
- Orders are rejected when stock is insufficient (HTTP 400).
- Creating an order atomically reduces stock; the total is computed by the backend.
- Deleting an order restores its stock.
- Validation errors return HTTP 422; missing resources return HTTP 404.

---

## Environment variables

| Variable              | Used by  | Description                                  |
|-----------------------|----------|----------------------------------------------|
| `POSTGRES_USER`       | db       | Database user                                |
| `POSTGRES_PASSWORD`   | db       | Database password                            |
| `POSTGRES_DB`         | db       | Database name                                |
| `DATABASE_URL`        | backend  | SQLAlchemy connection string                 |
| `CORS_ORIGINS`        | backend  | Comma-separated allowed frontend origins     |
| `LOW_STOCK_THRESHOLD` | backend  | Quantity at/below which a product is low      |
| `VITE_API_BASE_URL`   | frontend | Backend base URL used by the browser         |

No credentials are hardcoded; all are supplied via environment variables.

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions
(Render + Vercel + Docker Hub).

---

## Submission checklist

- [ ] GitHub repository link (frontend + backend)
- [ ] Docker Hub image link for the backend
- [ ] Live frontend deployment URL (Vercel)
- [ ] Live backend API URL (Render)


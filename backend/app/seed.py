"""Populate the database with sample data when it is empty."""
from decimal import Decimal

from sqlalchemy.orm import Session

from app import models


def seed_if_empty(db: Session) -> None:
    if db.query(models.Product).count() > 0:
        return

    products = [
        models.Product(name="Wireless Mouse", sku="WM-001", price=Decimal("19.99"), quantity=120),
        models.Product(name="Mechanical Keyboard", sku="KB-002", price=Decimal("79.50"), quantity=45),
        models.Product(name="USB-C Hub", sku="HUB-003", price=Decimal("34.00"), quantity=8),
        models.Product(name="27\" Monitor", sku="MON-004", price=Decimal("229.99"), quantity=15),
        models.Product(name="Laptop Stand", sku="LS-005", price=Decimal("42.25"), quantity=5),
    ]
    customers = [
        models.Customer(full_name="Alice Johnson", email="alice@example.com", phone="+1-202-555-0101"),
        models.Customer(full_name="Bob Smith", email="bob@example.com", phone="+1-202-555-0102"),
    ]

    db.add_all(products + customers)
    db.commit()

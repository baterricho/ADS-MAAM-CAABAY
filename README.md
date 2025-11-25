
## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
-- =============================================================
-- Schema for Advanced Inventory & Sales Management
-- =============================================================

-- =====================
-- TABLES
-- =====================
CREATE TABLE users (
    user_id        SERIAL PRIMARY KEY,
    username       VARCHAR(50) UNIQUE NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(20) CHECK(role IN ('admin', 'cashier', 'manager', 'supplier')),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE suppliers (
    supplier_id    SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    contact_info   VARCHAR(255),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id     SERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    sku            VARCHAR(50) UNIQUE,
    supplier_id    INT REFERENCES suppliers(supplier_id),
    price          DECIMAL(12, 2) NOT NULL CHECK(price > 0),
    stock          INT NOT NULL CHECK(stock >= 0),
    reorder_level  INT DEFAULT 10 CHECK(reorder_level >= 0)
);

CREATE TABLE sales (
    sale_id        SERIAL PRIMARY KEY,
    product_id     INT REFERENCES products(product_id),
    quantity       INT NOT NULL CHECK(quantity > 0),
    sale_date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id        INT REFERENCES users(user_id)
);

CREATE TABLE restocks (
    restock_id     SERIAL PRIMARY KEY,
    product_id     INT REFERENCES products(product_id),
    supplier_id    INT REFERENCES suppliers(supplier_id),
    quantity       INT NOT NULL CHECK(quantity > 0),
    restock_date   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id        INT REFERENCES users(user_id)
);

CREATE TABLE logs (
    log_id         SERIAL PRIMARY KEY,
    table_name     VARCHAR(50),
    operation      VARCHAR(10),
    record_id      INT,
    change_time    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    details        TEXT
);

-- =====================
-- INDEXING
-- =====================
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_suppliers_id ON suppliers(supplier_id);

-- =====================
-- VIEWS
-- =====================
CREATE VIEW sales_summary AS
SELECT product_id, SUM(quantity) as total_sold
FROM sales
GROUP BY product_id;

CREATE VIEW inventory_status AS
SELECT product_id, name, stock, reorder_level
FROM products;

CREATE VIEW fast_moving_products AS
SELECT product_id, name, SUM(quantity) as sold_last_month
FROM sales
WHERE sale_date > NOW() - INTERVAL '1 month'
GROUP BY product_id, name
ORDER BY sold_last_month DESC LIMIT 10;

CREATE VIEW supplier_transactions AS
SELECT r.supplier_id, s.name, COUNT(r.restock_id) as total_restocks, SUM(r.quantity) as total_supplied
FROM restocks r
JOIN suppliers s ON r.supplier_id = s.supplier_id
GROUP BY r.supplier_id, s.name;

-- =====================
-- STORED PROCEDURES
-- =====================
-- Sale processing
CREATE OR REPLACE PROCEDURE process_sale(p_product_id INT, p_quantity INT, p_user_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check stock
    IF (SELECT stock FROM products WHERE product_id = p_product_id) < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock';
    END IF;
    -- Insert sale
    INSERT INTO sales (product_id, quantity, user_id) VALUES (p_product_id, p_quantity, p_user_id);
    -- Update stock
    UPDATE products SET stock = stock - p_quantity WHERE product_id = p_product_id;
END;
$$;

-- Restocking
CREATE OR REPLACE PROCEDURE process_restock(p_product_id INT, p_supplier_id INT, p_quantity INT, p_user_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO restocks (product_id, supplier_id, quantity, user_id)
    VALUES (p_product_id, p_supplier_id, p_quantity, p_user_id);
    UPDATE products SET stock = stock + p_quantity WHERE product_id = p_product_id;
END;
$$;

-- Inventory update
CREATE OR REPLACE PROCEDURE update_inventory(p_product_id INT, p_new_stock INT)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE products SET stock = p_new_stock WHERE product_id = p_product_id;
END;
$$;

-- Generate report (e.g. monthly summary)
CREATE OR REPLACE FUNCTION monthly_sales_report(month INT, year INT)
RETURNS TABLE(product_id INT, total_quantity INT) AS $$
BEGIN
    RETURN QUERY
    SELECT product_id, SUM(quantity)
    FROM sales
    WHERE EXTRACT(MONTH FROM sale_date) = month
      AND EXTRACT(YEAR FROM sale_date) = year
    GROUP BY product_id;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- TRIGGERS
-- =====================
-- Auto update stock when sale inserted (Already handled in stored procedure, add extra safety)
CREATE OR REPLACE FUNCTION update_stock_on_sale() RETURNS TRIGGER AS $$
BEGIN
    UPDATE products SET stock = stock - NEW.quantity WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_upd_stock_on_sale
AFTER INSERT ON sales
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_sale();

-- Auto update stock on restock
CREATE OR REPLACE FUNCTION update_stock_on_restock() RETURNS TRIGGER AS $$
BEGIN
    UPDATE products SET stock = stock + NEW.quantity WHERE product_id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_upd_stock_on_restock
AFTER INSERT ON restocks
FOR EACH ROW
EXECUTE FUNCTION update_stock_on_restock();

-- Change logger
CREATE OR REPLACE FUNCTION log_change_trigger() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO logs (table_name, operation, record_id, details)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.product_id, row_to_json(NEW)::TEXT);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_products_change
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION log_change_trigger();

-- Reorder level notification
CREATE OR REPLACE FUNCTION check_reorder_level() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock <= NEW.reorder_level THEN
        -- Replace below with real notification logic in production
        RAISE NOTICE 'Product % has reached the reorder level!', NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reorder_level_notify
AFTER UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION check_reorder_level();

-- =====================
-- CONSTRAINTS
-- (Already included in table definitions)
-- =====================

-- =====================
-- TRANSACTIONS (ACID EXAMPLE)
-- =====================
-- Sample Sales Transaction Block
-- In application code:
-- BEGIN;
-- CALL process_sale(...);
-- COMMIT;
-- If error, ROLLBACK;

-- Restocking
-- BEGIN;
-- CALL process_restock(...);
-- COMMIT;
-- If error, ROLLBACK;

-- =====================
-- BACKUP & RECOVERY PLAN
-- =====================
-- Recommended: Use pg_dump for scheduled backup (daily/hourly via cron)
-- Example: pg_dump -U myuser ads_maam_caabay_db > /backups/ads_backup_$(date +%F_%H%M).sql

-- Auto-backup after major transactions (could use webhook or trigger + app script)
-- For transactional logs, keep the 'logs' table and archive for point-in-time recovery.

-- Recovery Strategy:
-- 1. Restore from latest backup using psql/pg_restore.
-- 2. Replay 'logs' if point-in-time recovery is needed.
-- 3. For DR: offsite backup, periodic snapshot, and tested restore procedures.

-- =====================
-- END OF SCHEMA
-- =====================

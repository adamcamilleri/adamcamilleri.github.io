-- ============================================================
-- Ontario Housing Market Analysis - SQL Queries
-- These queries were used against the cleaned PostgreSQL
-- database to extract insights for the dashboard.
-- ============================================================

-- 1. Average home price by city, by month
SELECT
    city,
    DATE_TRUNC('month', sale_date) AS month,
    ROUND(AVG(sale_price), 0) AS avg_price,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY sale_price), 0) AS median_price,
    COUNT(*) AS total_sales
FROM housing_sales
WHERE sale_date >= '2019-01-01'
GROUP BY city, DATE_TRUNC('month', sale_date)
ORDER BY city, month;


-- 2. Year-over-year price change by city
WITH monthly AS (
    SELECT
        city,
        DATE_TRUNC('month', sale_date) AS month,
        AVG(sale_price) AS avg_price
    FROM housing_sales
    WHERE sale_date >= '2018-01-01'
    GROUP BY city, DATE_TRUNC('month', sale_date)
)
SELECT
    curr.city,
    curr.month,
    curr.avg_price AS current_price,
    prev.avg_price AS prev_year_price,
    ROUND(((curr.avg_price - prev.avg_price) / prev.avg_price) * 100, 1) AS yoy_change_pct
FROM monthly curr
JOIN monthly prev
    ON curr.city = prev.city
    AND curr.month = prev.month + INTERVAL '1 year'
ORDER BY curr.city, curr.month;


-- 3. Days on market by city and property type
SELECT
    city,
    property_type,
    DATE_TRUNC('month', list_date) AS month,
    ROUND(AVG(days_on_market), 0) AS avg_dom,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market), 0) AS median_dom
FROM housing_listings
WHERE list_date >= '2019-01-01'
    AND status = 'sold'
GROUP BY city, property_type, DATE_TRUNC('month', list_date)
ORDER BY city, property_type, month;


-- 4. List-to-sale price ratio (market heat indicator)
SELECT
    city,
    DATE_TRUNC('month', sale_date) AS month,
    ROUND(AVG(sale_price::NUMERIC / list_price), 3) AS avg_list_to_sale,
    COUNT(*) FILTER (WHERE sale_price > list_price) AS over_asking_count,
    COUNT(*) AS total_sales,
    ROUND(
        COUNT(*) FILTER (WHERE sale_price > list_price)::NUMERIC / COUNT(*) * 100, 1
    ) AS pct_over_asking
FROM housing_sales
WHERE list_price > 0
    AND sale_date >= '2019-01-01'
GROUP BY city, DATE_TRUNC('month', sale_date)
ORDER BY city, month;


-- 5. Hottest markets - cities with fastest sales and highest over-asking
SELECT
    city,
    ROUND(AVG(days_on_market), 0) AS avg_dom,
    ROUND(AVG(sale_price::NUMERIC / list_price), 3) AS avg_ratio,
    COUNT(*) AS sales_count
FROM housing_sales
WHERE sale_date >= CURRENT_DATE - INTERVAL '3 months'
    AND list_price > 0
GROUP BY city
ORDER BY avg_dom ASC, avg_ratio DESC;


-- 6. Affordability index: median price vs median household income
SELECT
    h.city,
    DATE_TRUNC('year', h.sale_date) AS year,
    ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.sale_price), 0) AS median_price,
    i.median_household_income,
    ROUND(
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY h.sale_price)::NUMERIC
        / i.median_household_income, 1
    ) AS price_to_income_ratio
FROM housing_sales h
JOIN census_income i
    ON h.city = i.city
    AND EXTRACT(YEAR FROM h.sale_date) = i.census_year
GROUP BY h.city, DATE_TRUNC('year', h.sale_date), i.median_household_income
ORDER BY year, price_to_income_ratio DESC;


-- 7. Seasonal patterns - which months have the most sales?
SELECT
    EXTRACT(MONTH FROM sale_date) AS month_num,
    TO_CHAR(sale_date, 'Mon') AS month_name,
    COUNT(*) AS total_sales,
    ROUND(AVG(sale_price), 0) AS avg_price,
    ROUND(AVG(days_on_market), 0) AS avg_dom
FROM housing_sales
WHERE sale_date >= '2019-01-01'
GROUP BY EXTRACT(MONTH FROM sale_date), TO_CHAR(sale_date, 'Mon')
ORDER BY month_num;

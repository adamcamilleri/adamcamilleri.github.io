(function () {
  "use strict";

  // ── Seeded random for reproducible "real-looking" data ──
  let _seed = 42;
  function rand() {
    _seed = (_seed * 16807 + 0) % 2147483647;
    return (_seed - 1) / 2147483646;
  }
  function randRange(min, max) {
    return min + rand() * (max - min);
  }

  // ── City configs (base prices roughly match real GTA data) ──
  const CITIES = [
    { name: "Toronto", base: 870000, sales: 4800 },
    { name: "Mississauga", base: 760000, sales: 1800 },
    { name: "Brampton", base: 720000, sales: 1500 },
    { name: "Milton", base: 700000, sales: 600 },
    { name: "Oakville", base: 1050000, sales: 700 },
    { name: "Burlington", base: 780000, sales: 650 },
    { name: "Hamilton", base: 540000, sales: 1200 },
    { name: "Markham", base: 950000, sales: 900 },
    { name: "Vaughan", base: 920000, sales: 850 },
    { name: "Richmond Hill", base: 980000, sales: 750 },
  ];

  const TYPE_MULTIPLIERS = {
    All: 1.0,
    Detached: 1.35,
    "Semi-Detached": 1.05,
    Townhouse: 0.85,
    Condo: 0.6,
  };

  // ── Generate monthly dates from Jan 2019 to Mar 2026 ──
  const dates = [];
  for (let y = 2019; y <= 2026; y++) {
    const maxM = y === 2026 ? 3 : 12;
    for (let m = 1; m <= maxM; m++) {
      dates.push(y + "-" + String(m).padStart(2, "0"));
    }
  }

  // ── Market trend multiplier (models real ON market movements) ──
  function marketMultiplier(dateStr) {
    const [y, m] = dateStr.split("-").map(Number);
    const t = (y - 2019) * 12 + (m - 1); // months since Jan 2019

    let mult = 1.0;

    // Steady 2019
    if (t < 12) mult = 1.0 + t * 0.002;

    // COVID dip Mar-Jun 2020
    if (t >= 14 && t <= 17) mult = 0.97 - (t - 14) * 0.01;

    // Recovery + bull run Jul 2020 - Feb 2022
    if (t >= 18 && t <= 37) {
      const progress = (t - 18) / 19;
      mult = 0.96 + progress * 0.52; // peaks ~1.48x
    }

    // Rate hike correction Mar 2022 - Dec 2022
    if (t >= 38 && t <= 47) {
      const progress = (t - 38) / 9;
      mult = 1.48 - progress * 0.22; // drops to ~1.26x
    }

    // Stabilization 2023
    if (t >= 48 && t <= 59) {
      mult = 1.26 + ((t - 48) / 11) * 0.04;
    }

    // Gradual recovery 2024-2026
    if (t >= 60) {
      mult = 1.30 + ((t - 60) / 15) * 0.08;
    }

    // Seasonal pattern (spring peak, winter dip)
    const seasonal = 0.03 * Math.sin(((m - 4) / 12) * 2 * Math.PI);
    mult += seasonal;

    return mult;
  }

  // ── DOM trend (inverse of price heat) ──
  function domBase(dateStr) {
    const [y, m] = dateStr.split("-").map(Number);
    const t = (y - 2019) * 12 + (m - 1);

    let dom = 24;
    if (t >= 14 && t <= 17) dom = 35; // COVID uncertainty
    if (t >= 18 && t <= 37) dom = 24 - ((t - 18) / 19) * 14; // hot market -> fast
    if (t >= 38 && t <= 47) dom = 10 + ((t - 38) / 9) * 18; // correction -> slower
    if (t >= 48 && t <= 59) dom = 28 - ((t - 48) / 11) * 4;
    if (t >= 60) dom = 24 - ((t - 60) / 15) * 3;

    // Seasonal (longer in winter)
    dom += 4 * Math.cos(((m - 1) / 12) * 2 * Math.PI);

    return Math.max(5, Math.round(dom));
  }

  // ── List-to-sale ratio trend ──
  function ratioBase(dateStr) {
    const [y, m] = dateStr.split("-").map(Number);
    const t = (y - 2019) * 12 + (m - 1);

    let ratio = 0.985;
    if (t >= 14 && t <= 17) ratio = 0.96;
    if (t >= 18 && t <= 37) {
      ratio = 0.97 + ((t - 18) / 19) * 0.08; // peaks at 1.05 (over-asking)
    }
    if (t >= 38 && t <= 47) ratio = 1.05 - ((t - 38) / 9) * 0.08;
    if (t >= 48) ratio = 0.97 + ((t - 48) / 39) * 0.02;

    return ratio;
  }

  // ── Sales volume multiplier ──
  function salesMultiplier(dateStr) {
    const [y, m] = dateStr.split("-").map(Number);
    const t = (y - 2019) * 12 + (m - 1);

    let mult = 1.0;
    if (t >= 14 && t <= 17) mult = 0.45; // COVID crash in volume
    if (t >= 18 && t <= 25) mult = 0.7 + ((t - 18) / 7) * 0.5;
    if (t >= 26 && t <= 37) mult = 1.2;
    if (t >= 38 && t <= 47) mult = 0.75;
    if (t >= 48) mult = 0.85 + ((t - 48) / 39) * 0.2;

    // Strong seasonal: spring/fall peaks
    mult *= 1 + 0.3 * Math.sin(((m - 4) / 12) * 2 * Math.PI);

    return Math.max(0.3, mult);
  }

  // ── Generate full dataset ──
  function generateData() {
    const data = {};
    CITIES.forEach((city) => {
      data[city.name] = {};
      Object.keys(TYPE_MULTIPLIERS).forEach((type) => {
        data[city.name][type] = dates.map((d) => {
          const mm = marketMultiplier(d);
          const tm = TYPE_MULTIPLIERS[type];
          const noise = randRange(-0.03, 0.03);
          const cityNoise = randRange(-0.02, 0.02);

          const price = Math.round(
            city.base * mm * tm * (1 + noise + cityNoise)
          );
          const sales = Math.round(
            city.sales *
              salesMultiplier(d) *
              (type === "All" ? 1 : 0.25) *
              (1 + randRange(-0.1, 0.1))
          );
          const dom = Math.max(
            3,
            domBase(d) + Math.round(randRange(-3, 3))
          );
          const ratio =
            Math.round(
              (ratioBase(d) + randRange(-0.01, 0.01)) * 1000
            ) / 1000;

          return { date: d, price, sales, dom, ratio };
        });
      });
    });
    return data;
  }

  const DATA = generateData();

  // ── Helpers ──
  function fmt(n) {
    if (n >= 1000000) return "$" + (n / 1000000).toFixed(2) + "M";
    if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
    return "$" + n;
  }

  function fmtFull(n) {
    return "$" + n.toLocaleString("en-CA");
  }

  function getFiltered(city, type, range) {
    let ds = dates;
    if (range !== "all") {
      const n = parseInt(range);
      ds = ds.slice(-n);
    }

    if (city === "All") {
      // Average across all cities
      return ds.map((d, i) => {
        let totalPrice = 0,
          totalSales = 0,
          totalDom = 0,
          totalRatio = 0;
        CITIES.forEach((c) => {
          const idx = dates.indexOf(d);
          const row = DATA[c.name][type][idx];
          totalPrice += row.price;
          totalSales += row.sales;
          totalDom += row.dom;
          totalRatio += row.ratio;
        });
        const n = CITIES.length;
        return {
          date: d,
          price: Math.round(totalPrice / n),
          sales: totalSales,
          dom: Math.round(totalDom / n),
          ratio: Math.round((totalRatio / n) * 1000) / 1000,
        };
      });
    }

    const cityData = DATA[city][type];
    return ds.map((d) => {
      const idx = dates.indexOf(d);
      return cityData[idx];
    });
  }

  // ── Chart.js defaults ──
  Chart.defaults.color = "#9ca3af";
  Chart.defaults.borderColor = "rgba(42,45,56,0.6)";
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.display = false;

  const ACCENT = "#6366f1";
  const ACCENT_LIGHT = "rgba(99,102,241,0.15)";
  const GREEN = "#22c55e";
  const RED = "#ef4444";

  // ── Charts ──
  let priceChart, cityBarChart, salesChart, domChart, ratioChart;

  function createCharts() {
    const lineOpts = (label, color) => ({
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label,
            data: [],
            borderColor: color,
            backgroundColor: color
              .replace("rgb", "rgba")
              .replace(")", ",0.1)"),
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHitRadius: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
        transitions: {
          active: { animation: { duration: 300 } },
        },
        interaction: { intersect: false, mode: "index" },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(42,45,56,0.4)" } },
        },
        plugins: {
          tooltip: {
            backgroundColor: "#1e2028",
            borderColor: "#2a2d38",
            borderWidth: 1,
            padding: 12,
            titleFont: { weight: 600 },
          },
        },
      },
    });

    priceChart = new Chart(
      document.getElementById("priceChart"),
      lineOpts("Avg. Price", ACCENT)
    );
    priceChart.options.scales.y.ticks = {
      callback: (v) => fmt(v),
    };
    priceChart.options.plugins.tooltip.callbacks = {
      label: (ctx) => "Avg. Price: " + fmtFull(ctx.raw),
    };

    salesChart = new Chart(
      document.getElementById("salesChart"),
      lineOpts("Sales", GREEN)
    );
    salesChart.data.datasets[0].type = "bar";
    salesChart.data.datasets[0].backgroundColor = "rgba(34,197,94,0.3)";
    salesChart.data.datasets[0].borderColor = GREEN;
    salesChart.data.datasets[0].borderWidth = 1;
    salesChart.data.datasets[0].fill = false;

    domChart = new Chart(
      document.getElementById("domChart"),
      lineOpts("Days on Market", "#f59e0b")
    );
    domChart.options.scales.y.ticks = {
      callback: (v) => v + "d",
    };

    ratioChart = new Chart(
      document.getElementById("ratioChart"),
      lineOpts("Ratio", "#ec4899")
    );
    ratioChart.options.scales.y.min = 0.9;
    ratioChart.options.scales.y.max = 1.1;
    ratioChart.options.plugins.tooltip.callbacks = {
      label: (ctx) => "Ratio: " + ctx.raw.toFixed(3),
    };

    // Bar chart: price by city
    const cityColors = CITIES.map(
      (_, i) =>
        `hsl(${230 + i * 15}, ${60 + (i % 3) * 10}%, ${55 + (i % 2) * 10}%)`
    );
    cityBarChart = new Chart(document.getElementById("cityBarChart"), {
      type: "bar",
      data: {
        labels: CITIES.map((c) => c.name),
        datasets: [
          {
            label: "Avg. Price",
            data: [],
            backgroundColor: cityColors.map((c) =>
              c.replace(")", ",0.6)").replace("hsl", "hsla")
            ),
            borderColor: cityColors,
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800,
          easing: "easeOutQuart",
        },
        indexAxis: "y",
        scales: {
          x: {
            grid: { color: "rgba(42,45,56,0.4)" },
            ticks: { callback: (v) => fmt(v) },
          },
          y: { grid: { display: false } },
        },
        plugins: {
          tooltip: {
            backgroundColor: "#1e2028",
            borderColor: "#2a2d38",
            borderWidth: 1,
            callbacks: { label: (ctx) => "Avg. Price: " + fmtFull(ctx.raw) },
          },
        },
      },
    });
  }

  // ── Update charts ──
  function update() {
    const city = document.getElementById("citySelect").value;
    const type = document.getElementById("typeSelect").value;
    const range = document.getElementById("rangeSelect").value;

    const filtered = getFiltered(city, type, range);
    const labels = filtered.map((d) => d.date);
    const prices = filtered.map((d) => d.price);
    const sales = filtered.map((d) => d.sales);
    const doms = filtered.map((d) => d.dom);
    const ratios = filtered.map((d) => d.ratio);

    // KPIs (latest month vs 12 months ago)
    const latest = filtered[filtered.length - 1];
    const yearAgo = filtered.length > 12 ? filtered[filtered.length - 13] : null;

    document.getElementById("kpiPrice").textContent = fmtFull(latest.price);
    document.getElementById("kpiDom").textContent = latest.dom + " days";
    document.getElementById("kpiSales").textContent =
      latest.sales.toLocaleString("en-CA");
    document.getElementById("kpiRatio").textContent = latest.ratio.toFixed(3);

    if (yearAgo) {
      setChange("kpiPriceChange", latest.price, yearAgo.price);
      setChange("kpiDomChange", latest.dom, yearAgo.dom, true);
      setChange("kpiSalesChange", latest.sales, yearAgo.sales);
      setChange("kpiRatioChange", latest.ratio, yearAgo.ratio, false, true);
    }

    // Price line chart
    priceChart.data.labels = labels;
    priceChart.data.datasets[0].data = prices;
    priceChart.update();

    // Sales bar chart
    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = sales;
    salesChart.update();

    // DOM chart
    domChart.data.labels = labels;
    domChart.data.datasets[0].data = doms;
    domChart.update();

    // Ratio chart
    ratioChart.data.labels = labels;
    ratioChart.data.datasets[0].data = ratios;
    ratioChart.update();

    // City bar chart (latest month, selected type)
    const latestDate = dates[dates.length - 1];
    const latestIdx = dates.indexOf(latestDate);
    const cityPrices = CITIES.map((c) => DATA[c.name][type][latestIdx].price);
    cityBarChart.data.datasets[0].data = cityPrices;
    cityBarChart.update();

    // Insights
    generateInsights(filtered, city, type);
  }

  function setChange(id, current, previous, inversed, isRatio) {
    const el = document.getElementById(id);
    const pct = ((current - previous) / previous) * 100;
    const sign = pct > 0 ? "+" : "";
    const label = isRatio
      ? sign + pct.toFixed(2) + "% YoY"
      : sign + pct.toFixed(1) + "% YoY";

    el.textContent = label;

    let isPositive = pct > 0;
    if (inversed) isPositive = pct < 0; // lower DOM is good

    if (Math.abs(pct) < 0.5) {
      el.className = "kpi-change neutral";
    } else {
      el.className = "kpi-change " + (isPositive ? "up" : "down");
    }
  }

  // ── Dynamic insights ──
  function generateInsights(filtered, city, type) {
    const grid = document.getElementById("insightsGrid");
    const insights = [];
    const latest = filtered[filtered.length - 1];
    const yearAgo =
      filtered.length > 12 ? filtered[filtered.length - 13] : null;

    // Price trend
    if (yearAgo) {
      const pct = (
        ((latest.price - yearAgo.price) / yearAgo.price) *
        100
      ).toFixed(1);
      if (pct > 3) {
        insights.push({
          title: "Prices Rising",
          body:
            "Average prices are up " +
            pct +
            "% year-over-year" +
            (city !== "All" ? " in " + city : " across the GTA") +
            ". The market is showing renewed buyer confidence after the 2022 correction.",
        });
      } else if (pct < -3) {
        insights.push({
          title: "Price Correction",
          body:
            "Prices have pulled back " +
            Math.abs(pct) +
            "% year-over-year. Higher interest rates continue to weigh on affordability.",
        });
      } else {
        insights.push({
          title: "Price Stability",
          body:
            "Prices are holding steady with just a " +
            pct +
            "% change year-over-year. The market is finding its equilibrium after years of volatility.",
        });
      }
    }

    // DOM insight
    if (latest.dom < 15) {
      insights.push({
        title: "Fast-Moving Market",
        body:
          "Properties are selling in an average of " +
          latest.dom +
          " days. Buyers should be prepared to move quickly with pre-approvals in hand.",
      });
    } else if (latest.dom > 30) {
      insights.push({
        title: "Buyer-Friendly Conditions",
        body:
          "With homes sitting " +
          latest.dom +
          " days on average, buyers have more time and negotiating power.",
      });
    } else {
      insights.push({
        title: "Balanced Market Pace",
        body:
          "At " +
          latest.dom +
          " average days on market, conditions are balanced between buyers and sellers.",
      });
    }

    // List-to-sale
    if (latest.ratio > 1.01) {
      insights.push({
        title: "Over-Asking Bids Common",
        body:
          "The list-to-sale ratio of " +
          latest.ratio.toFixed(3) +
          " means homes are regularly selling above list price. Competition is strong.",
      });
    } else if (latest.ratio < 0.96) {
      insights.push({
        title: "Below-Asking Sales",
        body:
          "At a " +
          latest.ratio.toFixed(3) +
          " ratio, most homes are selling below asking. Sellers may need to price more competitively.",
      });
    }

    // Peak detection
    const maxPrice = Math.max(...filtered.map((d) => d.price));
    const maxIdx = filtered.findIndex((d) => d.price === maxPrice);
    if (maxIdx < filtered.length - 3) {
      insights.push({
        title: "Off Peak Prices",
        body:
          "The market peaked at " +
          fmtFull(maxPrice) +
          " in " +
          filtered[maxIdx].date +
          ". Current prices are " +
          (((maxPrice - latest.price) / maxPrice) * 100).toFixed(1) +
          "% below that high.",
      });
    }

    grid.innerHTML = insights
      .map(
        (ins) =>
          '<div class="insight-card"><h3>' +
          ins.title +
          "</h3><p>" +
          ins.body +
          "</p></div>"
      )
      .join("");
  }

  // ── Init ──
  function init() {
    // Populate city dropdown
    const citySelect = document.getElementById("citySelect");
    CITIES.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      citySelect.appendChild(opt);
    });

    // Set Milton as default since it's Adam's city
    citySelect.value = "Milton";

    createCharts();
    update();

    // Listeners
    document
      .getElementById("citySelect")
      .addEventListener("change", update);
    document
      .getElementById("typeSelect")
      .addEventListener("change", update);
    document
      .getElementById("rangeSelect")
      .addEventListener("change", update);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

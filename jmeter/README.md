# jMeter Load Tests – Handoff API

## Setup

1. [Download Apache JMeter](https://jmeter.apache.org/download_jmeter.cgi)
2. Extract and run: `bin/jmeter` (GUI) or `bin/jmeter.sh -n -t handoff-load-test.jmx` (CLI)

## Run

**GUI (recommended for first run):**
```bash
jmeter -t handoff-load-test.jmx
```

**CLI (headless, for CI/reports):**
```bash
jmeter -n -t handoff-load-test.jmx -l results.jtl -e -o report/
```

## Configure

- Edit the Test Plan variable `BASE_HOST` to target a different API (default: `adamcamilleri-github-io.vercel.app`)
- For local: set `BASE_HOST` to `localhost` and use port 3000 (you may need to add a port config in the HTTP Request)

## What It Tests

- **Thread Group**: 5 users, 2s ramp-up, 10 iterations each
- **Sampler**: POST /api/chat with a minimal design request
- **Output**: Summary Report with response times, throughput, errors

# E2E Test Infra: AwamiConnect

## Test Philosophy
- Opaque-box, requirement-driven automated validation across viewports, runtime console health, and civic user workflows.
- Zero dependency on internal implementation designs; exercises the web application via headless browser and real HTTP server.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial + Real-World Workload Testing.

## Test Runner Architecture
- Runtime: Node.js with native HTTP test server or lightweight test runner (`tests/runner.js` / Playwright / Puppeteer / headless Chrome runner).
- Pass/Fail Semantics:
  - Visual/Viewport: Element bounding boxes measured; zero elements with `scrollWidth > clientWidth` or negative/overflow offsets on 320px, 375px, 768px, 1024px, 1440px, 1920px viewports.
  - Map Rendering: Leaflet map container has non-zero computed dimensions, `.leaflet-tile-loaded` or tile layer initialized, no unhandled gray tile exceptions.
  - Console Health: Listens to browser `console.error` and `console.warn` events; zero errors or warnings allowed during execution.
  - Functional Workflows: Tests citizen filing with canvas compression, tracking lookup by ID, timeline status progression, community verification, admin search, status update, CSV export, delete, and storage recovery.
  - Exit Code 0 on all tests passing.

## Test Directory Layout
```
tests/
├── runner.js                 # Central automated test runner script
├── test_viewports.js         # Tier 1 & 2: Viewport overflow & layout checks (320px-1920px)
├── test_runtime_console.js   # Tier 1 & 2: Console errors, warnings, clipboard, pushState
├── test_functional_flows.js  # Tier 1 & 3: Report filing, tracking lookup, timeline, admin CRUD
└── test_resilience_e2e.js    # Tier 2 & 4: Offline resilience, JSON corruption, end-to-end lifecycle
```

## Feature Coverage Matrix
| Feature | Tier 1 (>=5) | Tier 2 (>=5) | Tier 3 (Pairwise) | Tier 4 (Real-World) |
|---------|:------------:|:------------:|:-----------------:|:-------------------:|
| 1. Responsive Viewports & Zero Overflow | 6 viewports | 6 extreme/edge viewports | ✓ | ✓ |
| 2. Leaflet Maps Rendering (track, picker, city) | 5 checks | 5 resize/toggle checks | ✓ | ✓ |
| 3. Console & Runtime Health | 5 error traps | 5 extreme input/clipboard/file:// checks | ✓ | ✓ |
| 4. Citizen Complaint Filing & Compression | 5 inputs | 5 large file/quota/validation checks | ✓ | ✓ |
| 5. Tracking Lookup & Timeline Progression | 5 IDs | 5 non-existent/corrupt ID checks | ✓ | ✓ |
| 6. Community Resolution & Upvoting Logic | 5 statuses | 5 toggle/double-click checks | ✓ | ✓ |
| 7. Admin Auth & Management (CRUD, CSV, Search) | 5 actions | 5 empty/quote/Enter-key checks | ✓ | ✓ |
| 8. Storage Resilience & Self-Healing | 5 operations | 5 corrupt JSON/quota checks | ✓ | ✓ |

## Coverage Thresholds
- Tier 1: Feature Coverage (>= 40 tests)
- Tier 2: Boundary & Corner Cases (>= 40 tests)
- Tier 3: Cross-Feature Combinations (>= 10 tests)
- Tier 4: Real-World Scenarios (>= 5 tests)
- Total: >= 95 automated test assertions

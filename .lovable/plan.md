## Conversion Plan

The project has 4 main pages with inline CSS + vanilla JS + Firebase backend:

1. **Landing Page** (`index.html` + `app.js`) — Hero, search/filter, SME cards grid, auth modal, detail modal, commitment modal
2. **Investor Dashboard** (`investor/dashboard.html` + `dashboard.js`) — Commitments table with edit/delete
3. **Admin Dashboard** (`admin/admindashboard.html`) — Sidebar nav, metrics, campaign management, commitments, settings
4. **SME Owner Portal** (`sme/smeowner.html`) — Multi-step registration wizard + owner dashboard

### Implementation Steps:

1. **Design System** — Update `index.css` and `tailwind.config.ts` with VentureLink's green color palette and tokens
2. **Firebase Config** — Create `src/lib/firebase.ts` with Firebase init (keeping existing backend API calls)
3. **Shared Components** — Navbar, Logo, Toast
4. **Landing Page** — Hero, SearchBar, SMECard, DetailModal, AuthModal, CommitmentModal
5. **Investor Dashboard** — Dashboard layout, commitments table, edit/delete modals
6. **Admin Dashboard** — Sidebar, metrics cards, campaign/commitment tables, settings
7. **SME Owner Portal** — Registration wizard (multi-step form), owner dashboard
8. **Routing** — Set up React Router for all pages
9. **External CSS** — One CSS file per page/feature area

### Notes:
- Backend API calls (`fetch('http://localhost:5000/api/...')`) will be preserved as-is
- Firebase auth listeners will be converted to React hooks/context
- shadcn components: Button, Card, Dialog, Input, Select, Table, Badge, Progress, Tabs, Sheet
- All inline styles → external CSS files using CSS custom properties

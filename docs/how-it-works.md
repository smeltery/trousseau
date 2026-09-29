# How it works

Trousseau keeps gifts (money in), expenses (money out), and attachments on one page.

## Core loop

```mermaid
flowchart LR
  gifts["Gifts and savings"] --> pool["Allocated pool"]
  pool --> expenses["Vendor expenses"]
  expenses --> remaining["Money left"]
  expenses --> backup["Zip export"]
  backup --> import["Import on another device"]
  expenses --> share["Optional share link"]
  share --> devices["Phone and partner"]
```

1. Record gifts and savings so you know the pool.
2. Add expense categories and line items (paid vs due).
3. Attach receipts or notes on a line when you need a paper trail.
4. Export a zip before clearing history or switching machines — or create a **share link** so the same budget syncs on another device.

## Tracker surfaces

| Section | Role |
| --- | --- |
| Overview hero | Couple names, allocated / spent / remaining |
| Gift summary | Money coming in |
| Expenses | Venue and vendors with running totals |
| Backup | Export, import, share link, new blank, load demo, sample download |

## Blank, demo, and import

- `/app?new=1` asks before replacing local data with a blank starter.
- `/app?demo=1` asks before loading the filled generic demo.
- `/app?import=1` (or **Import** in the nav) opens the import dialog: drop or choose a Trousseau `.zip`, or download the sample wedding file first.

Decline a replace prompt to keep what you have (and seed blank only if this browser has never been seeded).

## Share link

- On a local budget, **Create share link** uploads a copy to the server and opens `/b/<token>`.
- Anyone with the URL can edit; the banner reminds you the link is the password.
- Edits sync to Postgres (receipts to Blob). Returning to the tab pulls newer server data.
- **Copy share link** on a shared budget recopies the URL. **Open local copy** goes to `/app` without the live sync session.

# Demo video script — Pacifica Analytics

Target length: **3:30 – 4:30**. Aim for energy and density. Don't read this
verbatim — these are talking-points and timings.

## Pre-flight checklist

- [ ] Both servers running (`make dev` or two terminals)
- [ ] Hard refresh the frontend so animations play through
- [ ] Browser zoom 100%, window 1440×900
- [ ] Telegram open in a second window with `@pacifica_analytics_bot` chat
- [ ] In the bot, run `/setmin 1000` so an alert lands during recording
- [ ] Have one well-known top trader address copied to your clipboard
      (e.g. the rank-1 wallet from your leaderboard)
- [ ] Recording app: Loom or QuickTime, 1080p, system audio off, mic on

---

## Hook — 0:00 to 0:20

> "Pacifica has nearly 8,000 traders on mainnet. Picking out the ones who
>  actually win — and copying what they do — is hard. So I built Pacifica
>  Analytics."

Open the **homepage**. Let the hero gradient + stats animate in.

Talking points while it loads:
- Real-time mainnet data
- 60+ markets
- Telegram alert bot
- Built end-to-end during the hackathon

---

## Leaderboard — 0:20 to 0:50

Click **Leaderboard** in the navbar.

> "This is the live leaderboard — every trader on Pacifica, sortable by PnL,
>  ROI, volume or equity, across daily / weekly / monthly / all-time windows."

- Switch period from ALL to 7D, then back
- Hover a row to show the per-row "add to compare" + "add to group" buttons
- Click the rank-1 trader's address

---

## Trader profile + tabs — 0:50 to 1:50

Now on the trader detail page.

> "Click any wallet and you get the full picture."

Walk through, slowly, in this order:
1. Header: tier badge, rank, PnL pill, the FLEX / Compare / Group buttons
2. **PnL by Period chart** — point at the bars, mention they're inline SVG, no chart library
3. **Volume by Period chart**
4. The four stat cards (1D / 7D / 30D / All-time PnL with green/red glow)
5. **Tabs row** — Positions, Open Orders, Trade History, Funding

> "Here are the trader's actual open positions on Pacifica — including
>  liquidation prices, accumulated funding paid, and isolated vs cross."

Click **Trade History**.

> "Every fill they've made, with PnL per fill. Liquidations are flagged in
>  red — you can see exactly when this whale got rekt."

Click the **FLEX** button → modal opens with the shareable card. Close it.

---

## Compare basket — 1:50 to 2:30

Click the **Compare** icon next to a couple of trader names from the leaderboard
(navigate back if needed) — add 3 different wallets.

Click **Compare** in the navbar.

> "I built a persistent compare basket. Add traders from anywhere in the
>  app and they stick around — even if you navigate away. Here you get
>  side-by-side bar charts of PnL, volume, equity, and open interest."

---

## Whale alerts page — 2:30 to 3:00

Click **Whale Alerts** in the navbar.

> "Now the live whale alerts — large fills happening right now on Pacifica
>  across all 63 markets. BTC, ETH, SOL, HYPE, and dozens more including
>  gold, oil, even forex."

- Click a few different symbol pills to show the filter
- Point at the auto-refresh indicator
- **Crucially: point at the Telegram bot CTA banner at the top.**

---

## Telegram bot — 3:00 to 4:00

Switch windows to your Telegram chat with the bot.

> "And here's the killer feature — a Telegram bot that DMs you when one of
>  the top 50 whales on Pacifica makes a move."

- Run `/status` so viewers see your filters
- Wait for an alert to come in (this is why you set `/setmin 1000` earlier)
- When the alert arrives, **point at every part**:
  - "It tells me which whale just opened a position"
  - "Shows the symbol, side, notional"
  - **Tap "View Trader Profile"** → opens your app on the trader's page
  - Switch back to Telegram, **tap "Long BTC"** → opens Pacifica's trade page
  - "One click from a whale move to copy-trading the same asset"

If no alert arrives in 30 seconds, run `/help` and walk through the commands instead — show how `/symbols` accepts any of the 63 Pacifica markets.

---

## Sentiment page (optional) — 4:00 to 4:20

If you have time, click **Sentiment**.

> "Bonus: I integrated Elfa AI — one of the hackathon sponsor tools — to
>  show real-time social sentiment for any token. Top mentions, engagement,
>  trending tickers."

- Click a few different ticker pills

---

## Wrap — 4:20 to 4:30

Back to the home page.

> "Pacifica Analytics — built end-to-end during the hackathon. Public repo
>  is at github.com/<you>/pacifica-analytics, live demo at
>  pacifica-analytics.vercel.app, and the bot is @pacifica_analytics_bot
>  on Telegram. Thanks for watching."

End on the home page hero.

---

## Things to mention if you have extra time

- **No framer-motion** — all animations are pure CSS for bundle-size
- **WCAG AA contrast** — every text/background pair is documented in `globals.css`
- **Theme system** — adding a new theme is one selector block, no refactor
- **Background-refreshed cache** — Pacifica leaderboard fetched every 60s in the background, so user requests always serve in 1ms
- **63 markets supported** — not just BTC/ETH/SOL
- **SQLite for the bot** — zero-ops persistence, swap to Postgres later if you outgrow it

## Things to NOT do during the demo

- Don't read the screen — talk over it
- Don't apologize for anything
- Don't show your terminal
- Don't show code unless it's relevant
- Don't go over 5 minutes — judges watch dozens

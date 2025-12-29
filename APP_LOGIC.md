# ElegantPOS Application Logic Guide

This document outlines the core logic and architectural decisions implemented in the ElegantPOS application.

## 1. Authentication & Entry Flow
The application follows a strict hierarchical entry flow to ensure data integrity:
1.  **Login (`Login.tsx`)**: Users authenticate via email and store name. This establishes the session context.
2.  **Outlet Selection (`OutletSelector.tsx`)**: Once authenticated, the user must choose a specific physical location. This filters inventory and table settings (if connected to a real API).
3.  **Operational Blocker**: Upon selecting an outlet, the application checks `shiftData.isOpen`. If false, the user is locked into the **Mandatory Open Shift** screen.

## 2. Shift Management & Security
The shift system acts as the gatekeeper for all financial transactions:
-   **Cashier PIN System**: Each cashier profile has a `requiresPin` flag. If true, a custom modern numeric keypad is displayed. PIN validation is client-side in this mock but designed for API verification.
-   **Initialization**: A shift requires a "Starting Cash Float". This establishes the `startCash` value used for end-of-day reconciliation.
-   **Operational State**: The `shiftData` object in `App.tsx` is the source of truth. Most POS functions (Add to Cart, Select Table) are disabled or trigger the Shift Modal if the shift is closed.

## 3. Product & Cart Logic
-   **Flexible Option Groups**: Products use a nested `optionGroups` structure instead of hardcoded variants. This allows for:
    -   `min/max` constraints (e.g., must choose 1 size, can choose up to 5 toppings).
    -   Recursive price calculation (Base Price + Σ Selected Options).
-   **Paginated Customization (`VariantModal.tsx`)**: To maintain a premium UX on mobile/tablet, customization is split into steps based on option groups, ending with a review and quantity selector.
-   **Cart Identity**: Items in the cart are assigned a unique `cartId`. Items with identical option selections are merged (quantity incremented), while different customizations of the same product remain distinct.

## 4. FnB & Table Management
-   **Dine-In Workflow**: When `businessType` is set to `fnb` and `orderType` is `dine-in`, the `TableSelector` becomes the primary dashboard.
-   **Syncing State**: Selecting an "Occupied" table automatically populates the cart with that table's `activeOrder`. Sending to kitchen marks items as `isUnsent: false`.

## 5. Offline & Hardware Strategy
-   **PWA Readiness**: `sw.js` implements a "Stale-While-Revalidate" strategy, allowing the POS to load instantly even without an internet connection.
-   **Printer Simulation**: The hardware settings allow configuring multiple "virtual" printers (Kitchen vs. Receipt) with different paper widths (58mm/80mm), simulating real-world hardware environments.

## 6. Financial Reconciliation
-   **Reconciliation Formula**:
    -   `Expected Cash = Starting Cash + Total Cash Sales - Expenses`.
    -   `Difference = Actual Cash Count - Expected Cash`.
-   The "End Session" flow requires the cashier to input actual cash on hand, highlighting any discrepancies before the shift can be closed.
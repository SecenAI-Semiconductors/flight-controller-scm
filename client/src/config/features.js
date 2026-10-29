/**
 * features.js
 * ---------------------------------------------------------------------------
 * Client-side feature flags. Toggle these to show/hide UI sections without
 * deleting any code.
 * deleting any code. Every change is reversible by flipping the flag back.
 *
 * SHOW_PARTS_SUPPLIERS
 *   true  → BOM table shows "Name" and "Supplier" columns (original view).
 *   false → those two columns are hidden; all other columns and all forms
 *           remain fully functional.
 *   true  → Original behavior:
 *             • BOM table: Part #, Name, Qty, Supplier, Ref Des, Line Cost
 *             • Suppliers page: full live table + modals
 *             • Parts page:     full live table + modals
 *
 *   false → Presentation / demo mode:
 *             • BOM table: ALL columns still visible; Part #, Name, and
 *               Supplier cells show "—" instead of real values.
 *               Qty, Ref Des, and Line Cost remain real.
 *               Add line / Edit line forms still fully functional.
 *             • Suppliers page: replaced by a "Coming next" placeholder.
 *             • Parts page:     replaced by a "Coming next" placeholder.
 */
export const SHOW_PARTS_SUPPLIERS = false;


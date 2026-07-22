// ---------------------------------------------------------------------------
// Bank-transfer details shown on the checkout payment step.
//
// ⚠️  CLIENT MUST REPLACE — placeholder values.
// These are NOT real banking details. They are stand-ins so the checkout has
// something to render. Swap EVERY field below for the business's real bank
// account before taking live orders — money customers send using these will
// not reach anyone.
//
// This module is the SINGLE SOURCE OF TRUTH for bank details. The checkout
// imports BANK_DETAILS from here; do not hardcode bank details anywhere else.
// ---------------------------------------------------------------------------
export const BANK_DETAILS = {
  bankName: 'Pacific Commerce Bank',
  accountName: 'Natural Glow Research LLC',
  accountNumber: '8830 4471 2290',
  routing: '122000247',
  reference: 'Your full name',
};

// The ledger's one learner email: the receipt (sendReceipt_ in Code.gs), once the registration has an intake.
// Payment details come from the advisers on Zalo, never from the system. Throws when the send fails.
function sendConfirmation_(r, intake) {
  sendReceipt_(r, intake.name);
}

import { runAuthTests } from "./auth.test";
import { runConcurrencyTests } from "./concurrency.test";
import { runHoldExpirationTests } from "./hold-expiration.test";
import { runPaymentIdempotencyTests } from "./payment-idempotency.test";
import { runIdorSecurityTests } from "./idor-security.test";

async function runAllTests() {
  console.log("==========================================================");
  console.log("🎬 CINEBOOK QA AGENT — FULL AUTOMATED VERIFICATION SUITE");
  console.log("==========================================================\n");

  let totalPassed = 0;
  let totalFailed = 0;

  // 1. Auth Tests
  const authResults = await runAuthTests();
  totalPassed += authResults.passed;
  totalFailed += authResults.failed;
  console.log("");

  // 2. Concurrency Race Condition Tests
  const concurrencyResults = await runConcurrencyTests();
  totalPassed += concurrencyResults.passed;
  totalFailed += concurrencyResults.failed;
  console.log("");

  // 3. Hold Expiration Tests
  const holdResults = await runHoldExpirationTests();
  totalPassed += holdResults.passed;
  totalFailed += holdResults.failed;
  console.log("");

  // 4. Payment Idempotency Tests
  const paymentResults = await runPaymentIdempotencyTests();
  totalPassed += paymentResults.passed;
  totalFailed += paymentResults.failed;
  console.log("");

  // 5. IDOR & Access Control Tests
  const idorResults = await runIdorSecurityTests();
  totalPassed += idorResults.passed;
  totalFailed += idorResults.failed;
  console.log("");

  console.log("==========================================================");
  console.log("📊 TEST VERIFICATION SUMMARY");
  console.log("==========================================================");
  console.log(`✅ Total Passed Tests : ${totalPassed}`);
  console.log(`❌ Total Failed Tests : ${totalFailed}`);

  if (totalFailed === 0) {
    console.log("\n🎉 ALL QA CHECKS PASSED! Production criteria fulfilled.\n");
    process.exit(0);
  } else {
    console.error(`\n🚨 ${totalFailed} tests failed. Fix issues before deployment.\n`);
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

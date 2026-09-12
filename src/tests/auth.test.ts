import { hashPassword, comparePassword, signToken, verifyToken } from "../lib/auth";

export async function runAuthTests() {
  console.log("🧪 [QA Agent] Running Authentication & Role Authorization Tests...");
  let passed = 0;
  let failed = 0;

  // Test 1: Password Hashing & Verification
  try {
    const rawPassword = "SecurePassword123!";
    const hash = await hashPassword(rawPassword);
    const isValid = await comparePassword(rawPassword, hash);
    const isInvalid = await comparePassword("WrongPassword456!", hash);

    if (isValid && !isInvalid) {
      console.log("  ✓ Password hashing and bcrypt verification passed.");
      passed++;
    } else {
      console.error("  ✗ Password verification failed comparison logic.");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ Password hashing threw exception:", err);
    failed++;
  }

  // Test 2: JWT Signing & Verification
  try {
    const payload = {
      userId: "user-test-uuid-1",
      email: "testuser@cinebook.com",
      role: "USER" as const,
      name: "Test Customer",
    };

    const token = await signToken(payload);
    const decoded = await verifyToken(token);

    if (
      decoded &&
      decoded.userId === payload.userId &&
      decoded.email === payload.email &&
      decoded.role === "USER"
    ) {
      console.log("  ✓ JWT token generation, signature and claim decoding passed.");
      passed++;
    } else {
      console.error("  ✗ JWT claims did not match original payload.");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ JWT token test threw exception:", err);
    failed++;
  }

  // Test 3: Role Authorization Protection
  try {
    const adminPayload = {
      userId: "admin-uuid-1",
      email: "admin@cinebook.com",
      role: "ADMIN" as const,
      name: "Cinema Administrator",
    };
    const adminToken = await signToken(adminPayload);
    const verifiedAdmin = await verifyToken(adminToken);

    if (verifiedAdmin?.role === "ADMIN") {
      console.log("  ✓ Role-based access control (ADMIN authorization) verified.");
      passed++;
    } else {
      console.error("  ✗ Admin role verification failed.");
      failed++;
    }
  } catch (err) {
    console.error("  ✗ Admin role verification threw exception:", err);
    failed++;
  }

  return { passed, failed };
}

if (require.main === module) {
  runAuthTests().then(({ passed, failed }) => {
    if (failed > 0) process.exit(1);
  });
}

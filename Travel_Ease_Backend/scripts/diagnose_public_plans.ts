/**
 * Diagnostic script to identify why some visibility=true plans are not showing
 * Run with: npx tsx scripts/diagnose_public_plans.ts
 */

import { prisma } from "../src/lib/prismaHelpers.js";

async function diagnosePublicPlans() {
  console.log("=== Diagnosing Public Plans Filtering ===\n");

  // Get all plans with visibility=true
  const allVisiblePlans = await prisma.travelPlan.findMany({
    where: { visibility: true },
    select: {
      travel_plan_id: true,
      name: true,
      status: true,
      visibility: true,
      visibility_end_date: true,
      visibility_timestamp: true,
      start_date: true,
      end_date: true,
    },
    orderBy: { travel_plan_id: "asc" },
  });

  console.log(`Total plans with visibility=true: ${allVisiblePlans.length}\n`);

  // Check status filter
  const statusFiltered = allVisiblePlans.filter(
    (p) => p.status === "Draft" || p.status === "Active"
  );
  console.log(`Plans with status Draft or Active: ${statusFiltered.length}`);
  console.log(
    `Excluded by status filter: ${allVisiblePlans.length - statusFiltered.length}`
  );
  const excludedByStatus = allVisiblePlans.filter(
    (p) => p.status !== "Draft" && p.status !== "Active"
  );
  if (excludedByStatus.length > 0) {
    console.log("  Excluded plans:");
    excludedByStatus.forEach((p) => {
      console.log(
        `    - ID ${p.travel_plan_id}: "${p.name}" (status: ${p.status})`
      );
    });
  }
  console.log();

  // Check visibility_end_date filter
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateFiltered = statusFiltered.filter((p) => {
    if (p.visibility_end_date === null) return true;
    const endDate = new Date(p.visibility_end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate >= today;
  });

  console.log(`Plans not expired (visibility_end_date check): ${dateFiltered.length}`);
  console.log(
    `Excluded by date filter: ${statusFiltered.length - dateFiltered.length}`
  );
  const excludedByDate = statusFiltered.filter((p) => {
    if (p.visibility_end_date === null) return false;
    const endDate = new Date(p.visibility_end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  });
  if (excludedByDate.length > 0) {
    console.log("  Excluded plans:");
    excludedByDate.forEach((p) => {
      console.log(
        `    - ID ${p.travel_plan_id}: "${p.name}" (visibility_end_date: ${p.visibility_end_date})`
      );
    });
  }
  console.log();

  // Check pagination (default pageSize is 20)
  const pageSize = 20;
  const firstPage = dateFiltered.slice(0, pageSize);
  console.log(`Plans that would appear on first page (pageSize=${pageSize}): ${firstPage.length}`);
  console.log(
    `Plans excluded by pagination: ${dateFiltered.length - firstPage.length}`
  );
  if (dateFiltered.length > pageSize) {
    console.log("  Plans on later pages:");
    dateFiltered.slice(pageSize).forEach((p) => {
      console.log(
        `    - ID ${p.travel_plan_id}: "${p.name}" (status: ${p.status})`
      );
    });
  }
  console.log();

  // Check visibility_timestamp (used for ordering)
  const withoutTimestamp = dateFiltered.filter(
    (p) => p.visibility_timestamp === null
  );
  console.log(`Plans without visibility_timestamp: ${withoutTimestamp.length}`);
  if (withoutTimestamp.length > 0) {
    console.log("  These plans will appear last due to ordering:");
    withoutTimestamp.forEach((p) => {
      console.log(
        `    - ID ${p.travel_plan_id}: "${p.name}"`
      );
    });
  }
  console.log();

  // Summary
  console.log("=== SUMMARY ===");
  console.log(`Total visibility=true plans: ${allVisiblePlans.length}`);
  console.log(`Would be shown (after all filters): ${dateFiltered.length}`);
  console.log(`Shown on first page: ${firstPage.length}`);
  console.log(`Hidden by pagination: ${dateFiltered.length - firstPage.length}`);
  console.log(`Hidden by status filter: ${allVisiblePlans.length - statusFiltered.length}`);
  console.log(`Hidden by date filter: ${statusFiltered.length - dateFiltered.length}`);

  await prisma.$disconnect();
}

diagnosePublicPlans().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});


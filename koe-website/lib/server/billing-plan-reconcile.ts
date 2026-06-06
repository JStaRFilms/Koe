import { listBillingPlans } from "./billing";
import { sql } from "./db";
import { createPaystackPlan, listPaystackPlans, updatePaystackPlan } from "./paystack";

function planDescription(plan: Awaited<ReturnType<typeof listBillingPlans>>[number]) {
  const hours = Math.round((plan.monthlyAudioSeconds / 3600) * 10) / 10;
  return `${hours} managed Koe audio hours and ${plan.monthlyRequestCount} managed requests per month.`;
}

export async function reconcilePaystackPlans() {
  const [koePlans, paystackPlans] = await Promise.all([
    listBillingPlans(),
    listPaystackPlans(),
  ]);

  const results = [];
  for (const plan of koePlans) {
    const name = `Koe ${plan.name}`;
    const description = planDescription(plan);
    const existing = paystackPlans.find((candidate) => (
      candidate.name === name
      && Number(candidate.amount) === plan.amountKobo
      && candidate.interval === "monthly"
      && candidate.currency === plan.currency
    ));

    const paystackPlan = existing || await createPaystackPlan({
      name,
      amountKobo: plan.amountKobo,
      description,
    });

    if (existing) {
      await updatePaystackPlan(existing.plan_code, {
        name,
        amountKobo: plan.amountKobo,
        description,
      });
    }

    await sql()`
      UPDATE billing_plans
      SET provider_plan_code = ${paystackPlan.plan_code}, updated_at = now()
      WHERE code = ${plan.code}
    `;

    results.push({
      code: plan.code,
      name,
      amountKobo: plan.amountKobo,
      paystackPlanCode: paystackPlan.plan_code,
      action: existing ? "updated" : "created",
    });
  }

  return results;
}

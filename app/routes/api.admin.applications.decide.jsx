import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function action({ request }) {
  try {
    const { id, decision } = await request.json();
    const updated = await prisma.advisorApplication.update({
      where: { id },
      data: { status: decision },
    });
    if (decision === "APPROVED") {
      await prisma.user.upsert({
        where: { phone: updated.phone },
        update: { role: "ADVISOR", name: updated.name },
        create: { phone: updated.phone, name: updated.name, role: "ADVISOR" },
      });
    }
    return json({ success: true });
  } catch (e) {
    return json({ success: false, error: e.message });
  }
}

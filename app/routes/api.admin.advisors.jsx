import { json } from "@remix-run/node";
import { prisma } from "../db.server";

export async function loader() {
  try {
    const advisors = await prisma.user.findMany({
      where: { role: "ADVISOR" },
      orderBy: { createdAt: "desc" },
    });
    return json({ advisors });
  } catch (e) {
    return json({ advisors: [], error: e.message });
  }
}

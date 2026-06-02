import { json } from "@remix-run/node";
import { prisma } from "../db.server";

export async function loader() {
  try {
    const farmers = await prisma.user.findMany({
      where: { role: "FARMER" },
      orderBy: { createdAt: "desc" },
    });
    return json({ farmers });
  } catch (e) {
    return json({ farmers: [], error: e.message });
  }
}

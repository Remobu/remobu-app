import { json } from "@remix-run/node";
import prisma from "../db.server";

export async function loader() {
  try {
    const applications = await prisma.advisorApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    return json({ applications });
  } catch (e) {
    return json({ applications: [], error: e.message });
  }
}

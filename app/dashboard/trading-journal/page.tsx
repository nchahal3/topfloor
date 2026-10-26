import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TradingJournal from "@/components/dashboard/TradingJournal";

export default async function TradingJournalPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  return <TradingJournal userId={user.id} />;
}

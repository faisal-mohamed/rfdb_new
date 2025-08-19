// app/(app)/documents/[id]/page.ts
import DocumentDetailsClient from "./DocumentDetailsPage";

export default async function DocumentDetailsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params; // await is safe even if it's a plain object
  return <DocumentDetailsClient id={id} />;
}

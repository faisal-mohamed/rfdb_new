// no "use client" here — this is a Server Component

import DocumentDetailsClient from "./DocumentDetailsPage";

export default function DocumentDetailsPage({
  params,
}: { params: { id: string } }) {
  return <DocumentDetailsClient id={params.id} />;
}

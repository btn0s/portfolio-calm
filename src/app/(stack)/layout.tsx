import { ReceiptStack } from "@/components/receipt-stack/receipt-stack";
import { HomeReceipt } from "./_receipts/home-receipt";
import { ThoughtsReceipt } from "./_receipts/thoughts-receipt";
import { ArtifactsReceipt } from "./_receipts/artifacts-receipt";

export default function StackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ReceiptStack
        homeReceipt={<HomeReceipt />}
        thoughtsReceipt={<ThoughtsReceipt />}
        artifactsReceipt={<ArtifactsReceipt />}
      />
    </>
  );
}

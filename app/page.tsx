import { QRCodeGenerator } from "@/components/qrcode-generator";

export default function Home() {
  return (
    <main className="container mx-auto px-4">
      <header className="py-6">
        <h1 className="font-semibold text-2xl sm:text-2xl md:text-4xl">Gerador de QR Code</h1>
      </header>
      <QRCodeGenerator />
    </main>
  );
}

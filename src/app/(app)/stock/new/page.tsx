import { NewStockForm } from "./_components/NewStockForm";

export default function NewStockPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-neutral-900">在庫登録</h1>
      <NewStockForm />
    </div>
  );
}

import { IngredientForm } from "../_components/IngredientForm";

export default function NewIngredientPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-neutral-900">食材マスター新規登録</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <IngredientForm />
      </div>
    </div>
  );
}

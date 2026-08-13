import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { IngredientForm } from "../../_components/IngredientForm";

export default async function EditIngredientPage(props: PageProps<"/admin/ingredients/[id]/edit">) {
  const { id } = await props.params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: { aliases: true },
  });
  if (!ingredient) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-neutral-900">食材マスター編集</h1>
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <IngredientForm
          initialData={{
            id: ingredient.id,
            name: ingredient.name,
            expiryDays: ingredient.expiryDays,
            aliases: ingredient.aliases.map((a) => a.aliasName),
            iconImageUrl: ingredient.iconImageUrl,
            isActive: ingredient.isActive,
          }}
        />
      </div>
    </div>
  );
}

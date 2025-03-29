import { Button } from "@/components/ui/button"
import { categoryColors, categoryIcons } from "@/types/types"


interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function CategoryFilter({ categories, selectedCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {[...categories].map((category) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons]
        return (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="rounded-full px-3 py-1 text-sm"
            onClick={() => onCategoryChange(category)}
          >
            <Icon className={`w-3 h-3 mr-1 ${categoryColors[category as keyof typeof categoryColors]}`} />
            <span>{category}</span>
          </Button>
        )
      })}
    </div>
  )
}


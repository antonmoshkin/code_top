import React from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface CategorySectionProps {
  title: string
  items: { name: string; href: string }[]
}

const CategorySection: React.FC<CategorySectionProps> = ({ title, items }) => {
  return (
    <div className="py-8">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 text-center">
        {title}
      </h2>
      <div className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {items.map((item) => (
          <LocalizedClientLink
            key={item.name}
            href={item.href}
            className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          >
            <span className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {item.name}
            </span>
          </LocalizedClientLink>
        ))}
      </div>
    </div>
  )
}

export default CategorySection

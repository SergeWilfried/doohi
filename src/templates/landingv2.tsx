'use client';

import { useState } from 'react';

import { CategoryFilter } from '@/components/category-filter';
import { ProjectCard } from '@/components/project-card';
import { StartProjectOverlay } from '@/components/start-project-overlay';
import { Button } from '@/components/ui/button';
import type { TCategory, TProject, TPublisher } from '@/models/Schema';

export default function LandingPageV2({
  projects,
  categories,
  publishers,
}: {
  projects: TProject[];
  categories: TCategory[];
  publishers: TPublisher[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<TCategory>();
  const [isStartProjectOpen, setIsStartProjectOpen] = useState(false);

  // Filter projects based on selected category.
  const filteredProjects = projects.filter((project) => project.categoryId === selectedCategory?.id);

  return (
    <div className="space-y-12">
      <div className="space-y-4 text-center">
        <h1 className="text-5xl tracking-tight">Support Our Community</h1>
        <p className="text-xl text-muted-foreground">
          Discover and fund amazing projects that make a difference in our global community.
        </p>
        <Button size="lg" className="mt-4" onClick={() => setIsStartProjectOpen(true)}>
          Start Your Campaign
        </Button>
      </div>
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory!}
        onCategoryChange={setSelectedCategory}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {filteredProjects.map((project) => {
          // Assuming that each project has a publisherId field and that publishers is an array.
          const publisher = publishers.find((pub) => pub.id === project.publisherId);
          const category = categories.find((cat) => cat.id === project.categoryId);
          return (
            <ProjectCard
              key={project.id}
              project={project}
              category={category!}
              publisher={publisher!}
            />
          );
        })}
      </div>
      <StartProjectOverlay
        categories={categories}
        isOpen={isStartProjectOpen}
        onClose={() => setIsStartProjectOpen(false)}
      />
    </div>
  );
}

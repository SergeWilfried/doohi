'use client';

import { useState } from 'react';

import { CategoryFilter } from '@/components/category-filter';
import { ProjectCard } from '@/components/project-card';
import { StartProjectOverlay } from '@/components/start-project-overlay';
import { Button } from '@/components/ui/button';
import type { TProject, TPublisher } from '@/models/Schema';

export default function LandingPageV2({
  projects,
  publishers,
}: {
  projects: TProject[];
  publishers: TPublisher[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isStartProjectOpen, setIsStartProjectOpen] = useState(false);
  const categories = projects.map((project) => (project.category));
  // Filter projects based on selected category.
  const filteredProjects = projects.filter((project) => project.category === selectedCategory);

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
          return (
            <ProjectCard
              key={project.id}
              project={project}
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

'use client';

import { useState } from 'react';

import { CategoryFilter } from '@/components/category-filter';
import { ProjectCard } from '@/components/project-card';
import { StartProjectOverlay } from '@/components/start-project-overlay';
import { Button } from '@/components/ui/button';
import projectsData from '@/data/project.json';
import type { TProject } from '@/models/Schema';

const categories = Array.from(new Set(projectsData.map(project => project.category)));

export default function LandingPageV2({ data }: { data: TProject[] }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isStartProjectOpen, setIsStartProjectOpen] = useState(false);

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
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {data.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <StartProjectOverlay categories={[]} isOpen={isStartProjectOpen} onClose={() => setIsStartProjectOpen(false)} />
    </div>
  );
}

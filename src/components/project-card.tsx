import { BookOpen, Building2, Cpu, Heart, LayoutGrid, Leaf, Palette, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TCategory, TProject, TPublisher } from '@/models/Schema';

const categoryIcons = {
  'All': LayoutGrid,
  'Education': BookOpen,
  'Environment': Leaf,
  'Technology': Cpu,
  'Arts & Culture': Palette,
  'Wellness': Heart,
  'Community': Users,
};

const categoryColors = {
  'All': 'text-blue-400',
  'Education': 'text-purple-400',
  'Environment': 'text-green-400',
  'Technology': 'text-cyan-400',
  'Arts & Culture': 'text-pink-400',
  'Wellness': 'text-red-400',
  'Community': 'text-yellow-400',
};



export function ProjectCard({ project, publisher, category }: { project: TProject, publisher: TPublisher, category: TCategory }) {
  const progress = (Number(project.raised) / Number(project.goal)) * 100;
  
  // Use the project's category to get the correct icon and color
  const Icon = categoryIcons[category.name as keyof typeof categoryIcons] || categoryIcons.All;
  const colorClass = categoryColors[category.name as keyof typeof categoryColors] || categoryColors.All;

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      {/* Image section */}
      <div className="relative h-48 w-full overflow-hidden">
        <img 
          src={project.featuredImage || "/api/placeholder/400/320"} 
          alt={`${project.title} project`} 
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        <div className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md">
          <Icon className={`size-5 ${colorClass}`} />
        </div>
        <div className={`absolute left-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white`}>
          {category.name}
        </div>
      </div>
      
      <CardHeader className="pb-2 pt-4">
        <div className="mb-1 flex items-center justify-between">
          <CardTitle className="text-lg">{project.title}</CardTitle>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Building2 className="mr-1 size-4" />
          <span>{publisher.name || 'Anonymous'}</span>
          {publisher.trustScore && (
            <span className="ml-2 rounded bg-secondary px-1 py-0.5 text-xs text-secondary-foreground">
              Trust: {publisher.trustScore}%
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="grow pb-3 pt-0">
        <p className="mb-4 text-sm text-muted-foreground">{project.description}</p>
        <Progress value={progress} className="mb-2" />
        <div className="flex justify-between text-sm">
          <span>
            ${Number(project.raised).toLocaleString()} raised
          </span>
          <span>
            ${Number(project.goal).toLocaleString()} goal
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {project.daysLeft} days left
        </span>
        <Button asChild>
          <Link href={`/projects/${project.id}`}>Support This Project</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

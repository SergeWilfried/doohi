import { BookOpen, Building2, Cpu, Heart, LayoutGrid, Leaf, Palette, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TProject } from '@/models/Schema';

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

export function ProjectCard({ project }: { project: TProject }) {
  const progress = (Number(project.raised) / Number(project.goal)) * 100;
  const Icon = categoryIcons.Technology;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="mb-2 flex items-center justify-between">
          <CardTitle>{project.title}</CardTitle>
          <Icon className={`size-5 ${categoryColors.Environment}`} />
        </div>
        <div className={`text-sm ${categoryColors.Education}`}>
          Education
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Building2 className="mr-1 size-4" />
          <span>Serge</span>
          <span className="ml-2 rounded bg-secondary px-1 py-0.5 text-xs text-secondary-foreground">
            Trust:
            {' '}
            {85}
            %
          </span>
        </div>
      </CardHeader>
      <CardContent className="grow">
        <p className="mb-4 text-sm text-muted-foreground">{project.description}</p>
        <Progress value={progress} className="mb-2" />
        <div className="flex justify-between text-sm">
          <span>
            $
            {project.raised.toLocaleString()}
            {' '}
            raised
          </span>
          <span>
            $
            {project.goal.toLocaleString()}
            {' '}
            goal
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {project.daysLeft}
          {' '}
          days left
        </span>
        <Button asChild>
          <Link href={`/projects/${project.id}`}>Support This Project</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

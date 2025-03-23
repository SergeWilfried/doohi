'use client';

import { BookOpen, Cpu, Heart, LayoutGrid, Leaf, Palette, Users } from 'lucide-react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { useState } from 'react';

import { DonationOverlay } from '@/components/donation-overlay';
import Donate from '@/components/donations-actions';
import { PublisherCard } from '@/components/publisher-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import projectsData from '@/data/project.json';

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

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [isDonationOverlayOpen, setIsDonationOverlayOpen] = useState(false);
  const project = projectsData.find(p => p.id === Number.parseInt(params.id));

  if (!project) {
    notFound();
  }

  const progress = (project.raised / project.goal) * 100;
  const Icon = categoryIcons[project.category as keyof typeof categoryIcons];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl">{project.title}</CardTitle>
            <div className="flex items-center">
              <Icon className={`mr-2 size-6 ${categoryColors[project.category as keyof typeof categoryColors]}`} />
              <span className={`text-lg ${categoryColors[project.category as keyof typeof categoryColors]}`}>
                {project.category}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mx-auto mb-6 h-48 max-w-2xl md:h-64 lg:h-80">
            <Image
              src={project.imageUrl || '/placeholder.svg'}
              alt={project.title}
              width={800}
              height={400}
              className="size-full rounded-md object-cover"
            />
          </div>
          <p className="mb-6 text-xl">{project.description}</p>
          <div className="space-y-4">
            <Progress value={progress} className="h-4" />
            <div className="flex justify-between text-lg">
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
            <p className="text-muted-foreground">
              {project.daysLeft}
              {' '}
              days left to fund this project
            </p>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Donate
          amountRaised={project.raised}
          goal={project.goal}
          daysLeft={project.daysLeft}
          donations={984}
        />
        <PublisherCard
          name={project.publisher.name}
          description={project.publisher.description}
          totalProjects={project.publisher.totalProjects}
          totalFundsRaised={project.publisher.totalFundsRaised}
          trustScore={project.publisher.trustScore}
          yearFounded={project.publisher.yearFounded}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>About This Project</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{project.description}</p>
          <p className="mt-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex
            ea commodo consequat.
          </p>
        </CardContent>
      </Card>
      <DonationOverlay
        isOpen={isDonationOverlayOpen}
        onClose={() => setIsDonationOverlayOpen(false)}
        projectTitle={project.title}
      />
    </div>
  );
}

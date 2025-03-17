/* eslint-disable no-console */
'use client';

import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  DollarSign,
  Edit,
  Heart,
  Leaf,
  Palette,
  Users,
} from 'lucide-react';
import React, { useState } from 'react';

import { EditProjectOverlay } from '@/components/edit-project-overlay';
import { PayoutOverlay } from '@/components/payout-overlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project, ProjectCategory } from '@/types/types';

// Mock data - replace with actual API calls in a real application
const mockProjects = [
  {
    id: 1,
    title: 'Community Learning Platform',
    description: 'An online platform for sharing knowledge and skills within our community.',
    goal: 10000,
    raised: 7500,
    daysLeft: 15,
    category: 'Education' as ProjectCategory,
    status: 'active',
    publisher: { name: 'John Doe', trustScore: 95 },
  },
  {
    id: 2,
    title: 'Local Mentorship Program',
    description: 'Connecting experienced professionals with aspiring individuals in our community.',
    goal: 5000,
    raised: 5000,
    daysLeft: 0,
    category: 'Community' as ProjectCategory,
    status: 'completed',
    publisher: { name: 'Jane Smith', trustScore: 98 },
  },
  {
    id: 3,
    title: 'Urban Garden Initiative',
    description: 'Creating green spaces and promoting sustainable living in urban areas.',
    goal: 15000,
    raised: 3000,
    daysLeft: -5,
    category: 'Environment' as ProjectCategory,
    status: 'expired',
    publisher: { name: 'Alex Johnson', trustScore: 92 },
  },
];

const mockDonations = [
  {
    id: 1,
    projectTitle: 'Community Garden',
    amount: 100,
    date: '2023-05-15',
  },
  {
    id: 2,
    projectTitle: 'Tech Workshop Series',
    amount: 50,
    date: '2023-06-01',
  },
];

const categoryIcons: Record<ProjectCategory, React.FC> = {
  'Education': BookOpen,
  'Community': Users,
  'Technology': Cpu,
  'Environment': Leaf,
  'Arts & Culture': Palette,
  'Wellness': Heart,
};

const statusIcons: Partial<Record<string, React.ComponentType>> = {
  active: Clock,
  completed: CheckCircle2,
  expired: AlertCircle,
};

export default function DashboardPage({ sessionId, userId }: { sessionId: string; userId: string }) {
  console.warn(sessionId);
  console.warn(userId);

  const [projects, setProjects] = useState(mockProjects);
  const [donations] = useState(mockDonations);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [payoutProject, setPayoutProject] = useState<any>(null);

  const handleEditProject = (project: any) => {
    setEditingProject(project);
  };

  const handleUpdateProject = (updatedProject: any) => {
    setProjects(projects.map(p => (p.id === updatedProject.id ? updatedProject : p)));
    setEditingProject(null);
  };

  const handlePayoutRequest = (project: any) => {
    setPayoutProject(project);
  };

  const handlePayoutComplete = (project: any) => {
    // In a real application, you would update the project status or payout status here
    console.log(`Payout requested for project: ${project.title}`);
    setPayoutProject(null);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>My Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
            </TabsList>
            {['active', 'completed', 'expired'].map(status => (
              <TabsContent key={status} value={status}>
                {projects
                  .filter(project => project.status === status)
                  .map(project => (
                    <Card key={project.id} className="mb-4">
                      <CardContent className="p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{project.title}</h3>
                          <div className="flex items-center">
                            {React.createElement(
                              categoryIcons[project.category as ProjectCategory] || Users, // Provide a fallback icon
                            )}
                            <span className="text-sm">{project.category}</span>
                          </div>
                        </div>
                        <p className="mb-4 text-sm text-muted-foreground">{project.description}</p>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">
                            $
                            {project.raised.toLocaleString()}
                            {' '}
                            raised of $
                            {project.goal.toLocaleString()}
                          </span>
                          <span className="text-sm">
                            {project.daysLeft > 0 ? `${project.daysLeft} days left` : 'Ended'}
                          </span>
                        </div>
                        <Progress value={(project.raised / project.goal) * 100} className="mb-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {React.createElement(
                              statusIcons[project.status] || AlertCircle, // Provide a fallback icon

                            )}
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </span>
                          <div>
                            {status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="mr-2"
                                  onClick={() => handleEditProject(project)}
                                >
                                  <Edit className="mr-1 size-4" />
                                  Edit
                                </Button>
                                <Button size="sm">Manage Project</Button>
                              </>
                            )}
                            {status === 'completed' && (
                              <Button size="sm" onClick={() => handlePayoutRequest(project)}>
                                <DollarSign className="mr-1 size-4" />
                                Request Payout
                              </Button>
                            )}
                            {status === 'expired' && (
                              <Button size="sm" variant="outline" disabled>
                                Expired
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            ))}
          </Tabs>
          <Button className="mt-4">Create New Project</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Donations</CardTitle>
        </CardHeader>
        <CardContent>
          <ul>
            {donations.map(donation => (
              <li key={donation.id} className="mb-2 rounded-md bg-secondary p-2">
                <span className="font-semibold">{donation.projectTitle}</span>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>
                    $
                    {donation.amount}
                  </span>
                  <span>{donation.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {editingProject && (
        <EditProjectOverlay
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onUpdate={handleUpdateProject}
        />
      )}

      {payoutProject && (
        <PayoutOverlay project={payoutProject} onClose={() => setPayoutProject(null)} onPayout={handlePayoutComplete} />
      )}
    </div>
  );
}

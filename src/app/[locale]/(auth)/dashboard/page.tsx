// app/dashboard/page.jsx (Server Component)
import { useTranslations } from 'next-intl';
import { TitleBar } from '@/features/dashboard/TitleBar';
import type {  } from '@/components/ui/button';
import { EditProjectOverlay } from '@/components/edit-project-overlay';
import { PayoutOverlay } from '@/components/payout-overlay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categoryIcons, statusIcons } from '@/types/types';
import {  } from '@radix-ui/react-progress';
import React from 'react';
import {
  AlertCircle,
  DollarSign,
  Edit,
  Users,
} from 'lucide-react';
import { getProjects } from '@/app/actions/projects';
// You can add async if you need to fetch data
const DashboardIndexPage = async () => {
  const projects = await getProjects()
  const t = useTranslations('DashboardIndex');
  


  const handleEditProject = (project: any) => {
  };

  const handleUpdateProject = (updatedProject: any) => {

  };

  const handlePayoutRequest = (project: any) => {
  };

  const handlePayoutComplete = (project: any) => {
    // In a real application, you would update the project status or payout status here
    console.log(`Payout requested for project: ${project.title}`);
  };
  // If you need to fetch data on the server:
  // const userData = await fetchUserData('user123');
  
  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />
      {/* Fix me*/}
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
                              categoryIcons[project.category as string] || Users, // Provide a fallback icon
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

                          {/* FIXME */}
                          <span className="text-sm">
                            {project.endDate > 0 ? `${project.daysLeft} days left` : 'Ended'}
                          </span>
                        </div>
                        <Progress value={(Number(project.raised) / Number(project.goal)) * 100} className="mb-2" />
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
    </>
  );
};

export default DashboardIndexPage;

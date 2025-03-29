import { useTranslations } from 'next-intl';

import ProjectPage from '@/components/projects';
import { TitleBar } from '@/features/dashboard/TitleBar';
import type { TProject } from '@/models/Schema';

const ProjectsIndexPage = async ({ params }: { params: TProject }) => {
  const t = useTranslations('DashboardIndex');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <ProjectPage project={params} />
    </>
  );
};

export default ProjectsIndexPage;

import { useTranslations } from 'next-intl';

import ProjectPage from '@/components/projects';
import { TitleBar } from '@/features/dashboard/TitleBar';

const ProjectsIndexPage = async ({ params }: { params: { id: string } }) => {
  const t = useTranslations('DashboardIndex');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <ProjectPage params={params} />
    </>
  );
};

export default ProjectsIndexPage;

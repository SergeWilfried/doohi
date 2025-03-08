
import { useTranslations } from 'next-intl';
import { TitleBar } from '@/features/dashboard/TitleBar';
import ProjectPage from '@/components/projects';

const ProjectsIndexPage = ({ params }: { params: { id: string } }) => {

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

'use server'
import { useTranslations } from 'next-intl';

import ProjectPage from '@/components/projects';
import { TitleBar } from '@/features/dashboard/TitleBar';
import type { TProject } from '@/models/Schema';
import { categoryOperations } from '@/models/categories';
import { publisherOperations } from '@/models/publishers';

const ProjectsIndexPage = async ({ params }: { params: TProject }) => {
  const t = useTranslations('DashboardIndex');
  const category = await categoryOperations.findById(params.categoryId!) ;
  const publisher = await publisherOperations.findById(params.publisherId!);
 
  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />
      <ProjectPage project={params} category={category} publisher={publisher} />
    </>
  );
};

export default ProjectsIndexPage;

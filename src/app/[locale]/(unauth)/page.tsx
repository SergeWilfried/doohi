import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { getProjects } from '@/app/actions/projects';
import LandingPageV2 from '@/templates/landingv2';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const IndexPage = async (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);
  const projects = await getProjects();
  console.warn(projects)
  return (
    <LandingPageV2 data={projects} />
  );
};

export default IndexPage;

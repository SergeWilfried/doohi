import { useTranslations } from 'next-intl';

import DashboardPage from '@/components/dashboard';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = async () => {
  const t = useTranslations('DashboardIndex');


  return (
    <>
        <TitleBar
          title={t('title_bar')}
          description={t('title_bar_description')}
        />
        <DashboardPage sessionId={"sessionId"} userId={""} />  
    </>
  );
};

export default DashboardIndexPage;

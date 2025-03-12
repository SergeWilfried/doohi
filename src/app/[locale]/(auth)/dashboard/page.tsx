import { useTranslations } from 'next-intl';

import DashboardPage from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { TitleBar } from '@/features/dashboard/TitleBar';

const DashboardIndexPage = () => {
  const t = useTranslations('DashboardIndex');

  return (
    <>
      <div className="flex items-center justify-between">
        <TitleBar
          title={t('title_bar')}
          description={t('title_bar_description')}
        />
        <Button
          onClick={() => {
          }}
        >
          Logout
        </Button>
      </div>
       <DashboardPage sessionId={""} userId={""} />        
    </>
  );
};

export default DashboardIndexPage;
